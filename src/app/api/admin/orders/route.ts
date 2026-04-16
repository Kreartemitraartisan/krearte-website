import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Fetch all orders (admin only)
export async function GET() {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch orders from database
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ✅ Calculate subtotal from items (price × quantity)
    const subtotal = body.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // ✅ Shipping cost (default 0 if not provided)
    const shipping = body.shipping || 0;

    // ✅ Total = subtotal + shipping
    const total = subtotal + shipping;

    // Create order with correct field names
    const order = await prisma.order.create({
      data: {
        // ✅ Order number (optional but recommended)
        orderNumber: body.orderNumber || `ORD-${Date.now()}`,
        
        // ✅ Customer info
        userId: body.userId || null,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        
        // ✅ Shipping address
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country || "Indonesia",
        
        // ✅ Pricing fields (sesuai schema)
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        
        // ✅ Order status
        status: body.status || "pending",
        paymentStatus: body.paymentStatus || "pending",
        paymentMethod: body.paymentMethod || "manual",
        
        // ✅ Order items
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
        },
        
        // ✅ Additional notes
        notes: body.notes || null,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create order" 
      },
      { status: 500 }
    );
  }
}

// PUT - Update order status (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const orderId = params.id;

    // Update order
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: body.status,
        paymentStatus: body.paymentStatus,
        notes: body.notes,
        // Add more fields as needed
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete order (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Soft delete: update status to "cancelled" instead of hard delete
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "cancelled",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}