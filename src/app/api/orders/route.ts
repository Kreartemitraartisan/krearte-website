// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// =========================
// ✅ GET: Fetch orders
// =========================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    const orders = await prisma.order.findMany({
      where: {
        userId: userId || undefined,
        status: status || undefined,
      },
      include: { 
        items: true, 
        user: { select: { name: true, email: true } } 
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json({ 
      success: true, 
      orders,
      count: orders.length 
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST: Create new order (FIXED)
// =========================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ✅ Extract & validate required fields
    const {
      email,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      phone,
      items,
      subtotal,
      shipping,
      total,
      userId,
      // ✅ NEW: Payment fields for WhatsApp orders
      paymentMethod = "WHATSAPP", // Default: WhatsApp manual payment
      paymentStatus = "pending_verification", // Default status for WA orders
    } = body;

    // ✅ Validation
    if (!email || !firstName || !address || !city || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing required customer fields" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // ✅ Generate unique order number
    const orderNumber = generateOrderNumber();

    // ✅ Create order in database with ALL wallpaper-specific fields
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        email,
        firstName,
        lastName,
        address,
        city,
        postalCode,
        phone,
        subtotal: parseFloat(subtotal) || 0,
        shipping: parseFloat(shipping) || 0,
        total: parseFloat(total) || 0,
        
        // ✅ NEW: Payment info
        paymentMethod,
        paymentStatus,
        status: "pending", // Default order status
        
        // ✅ Create order items with complete wallpaper data
        items: {
          create: items.map((item: any) => ({
            // Required fields
            productId: item.productId,
            name: item.name,
            size: item.size || `${item.widthCm || 100}cm × ${item.heightCm || 100}cm`,
            price: parseFloat(item.price) || 0,
            quantity: item.quantity || 1,
            
            // ✅ Wallpaper-specific fields (save for production tracking)
            materialId: item.materialId || null,
            materialName: item.materialName || item.material || null,
            width: item.width ? parseFloat(item.width) : null,
            height: item.height ? parseFloat(item.height) : null,
            widthCm: item.widthCm ? parseInt(item.widthCm) : null,
            heightCm: item.heightCm ? parseInt(item.heightCm) : null,
            areaM2: item.areaM2 ? parseFloat(item.areaM2) : null,
            pricePerM2: item.pricePerM2 ? parseFloat(item.pricePerM2) : null,
            wasteCost: item.wasteCost ? parseFloat(item.wasteCost) : null,
            is25DAddOn: item.is25DAddOn || false,
          })),
        },
      },
      include: { 
        items: true,
        user: { select: { name: true, email: true } }
      },
    });

    // ✅ Send webhook to n8n for Accurate integration (non-blocking)
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "order.created",
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: {
            name: `${order.firstName} ${order.lastName}`,
            email: order.email,
            phone: order.phone,
            address: `${order.address}, ${order.city} ${order.postalCode}`,
          },
          items: order.items,
          total: order.total,
          paymentMethod: (order as any).paymentMethod,
          paymentStatus: (order as any).paymentStatus,
          timestamp: new Date().toISOString(),
        }),
        // Timeout 5 seconds agar tidak nge-hang kalau n8n lambat
      }).catch(err => console.warn("⚠️ n8n webhook failed:", err));
    }

    console.log(`✅ Order created: ${orderNumber} (Total: Rp ${order.total.toLocaleString('id-ID')})`);

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      orderNumber: order.orderNumber,
      order 
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Error creating order:", error);

    // ✅ Handle Prisma specific errors
    if (error?.code === "P2002") {
      // Unique constraint failed (order number duplicate - very rare)
      return NextResponse.json(
        { success: false, error: "Order number conflict. Please try again." },
        { status: 409 }
      );
    }

    if (error?.code === "P2003") {
      // Foreign key constraint (invalid product/user ID)
      return NextResponse.json(
        { success: false, error: "Invalid product or user reference" },
        { status: 400 }
      );
    }

    if (error?.name === "PrismaClientValidationError") {
      return NextResponse.json(
        { success: false, error: "Invalid order data format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to create order",
        // Hanya tampilkan detail error di development
        details: process.env.NODE_ENV === "development" ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}