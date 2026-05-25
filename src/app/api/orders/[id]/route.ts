// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ✅ Valid allowed status values
const VALID_ORDER_STATUS = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
const VALID_PAYMENT_STATUS = ["pending_verification", "paid", "refunded", "failed"] as const;

type OrderStatus = typeof VALID_ORDER_STATUS[number];
type PaymentStatus = typeof VALID_PAYMENT_STATUS[number];

// =========================
// ✅ GET: Fetch single order by ID
// =========================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ✅ Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        items: true, 
        user: { select: { name: true, email: true } } 
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ PATCH: Update order status (Admin only) - FIXED
// =========================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ✅ 1. Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // ✅ 2. Parse & validate request body
    const body = await request.json();
    const { status, paymentStatus, notes } = body;

    // Build update object dynamically - only update fields that are sent
    const updateData: any = {};
    
    if (status !== undefined) {
      if (!VALID_ORDER_STATUS.includes(status as OrderStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Allowed: ${VALID_ORDER_STATUS.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (paymentStatus !== undefined) {
      if (!VALID_PAYMENT_STATUS.includes(paymentStatus as PaymentStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid paymentStatus. Allowed: ${VALID_PAYMENT_STATUS.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // If nothing to update, return early
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // ✅ 3. Check if order exists first
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, paymentStatus: true }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // ✅ 5. Send webhook to n8n if status changed (non-blocking)
    if (process.env.N8N_WEBHOOK_URL && (status || paymentStatus)) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "order.updated",
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          previousStatus: existingOrder.status,
          newStatus: status || existingOrder.status,
          previousPaymentStatus: existingOrder.paymentStatus,
          newPaymentStatus: paymentStatus || existingOrder.paymentStatus,
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => console.warn("⚠️ n8n webhook failed:", err));
    }

    console.log(`✅ Order ${id} updated:`, updateData);

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: "Order status updated successfully"
    });

  } catch (error: any) {
    console.error("❌ Error updating order:", error);

    // Handle Prisma errors
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to update order",
        details: process.env.NODE_ENV === "development" ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}

// =========================
// ✅ DELETE: Cancel/Delete order (Admin only)
// =========================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ✅ Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // ✅ Check if order has items (don't delete orders with items)
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Soft delete: update status to cancelled instead of hard delete
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: "cancelled",
        paymentStatus: order.paymentStatus === "paid" ? "refunded" : order.paymentStatus
      },
    });

    // Send webhook for cancellation
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "order.cancelled",
          orderId: cancelledOrder.id,
          orderNumber: cancelledOrder.orderNumber,
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => console.warn("⚠️ n8n webhook failed:", err));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order cancelled successfully",
      order: cancelledOrder 
    });

  } catch (error: any) {
    console.error("❌ Error cancelling order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}