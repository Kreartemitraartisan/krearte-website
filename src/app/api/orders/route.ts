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
// ✅ POST: Create new order (FIXED for Sample Orders)
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
      // ✅ NEW: Payment & Sample fields
      paymentMethod = "WHATSAPP",
      paymentStatus = "pending_verification",
      isSampleOrder = false, // ✅ Flag untuk sample order
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

    // ✅ Prepare items for database
    // ✅ Handle nullable productId for sample orders
    const orderItems = items.map((item: any) => {
      // Base required fields
      const orderItem: any = {
        name: item.name,
        size: item.size || `${item.widthCm || 100}cm × ${item.heightCm || 100}cm`,
        price: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
      };

      // ✅ ONLY add productId if it's a valid UUID AND not a sample
      // Sample orders don't need to reference actual products
      if (!isSampleOrder && item.productId && isValidUuid(item.productId)) {
        orderItem.productId = item.productId;
      }

      // ✅ Add wallpaper-specific fields only if they exist
      if (item.materialId) orderItem.materialId = item.materialId;
      if (item.materialName) orderItem.materialName = item.materialName;
      if (item.material) orderItem.materialName = item.material; // fallback
      if (item.width) orderItem.width = parseFloat(item.width);
      if (item.height) orderItem.height = parseFloat(item.height);
      if (item.widthCm) orderItem.widthCm = parseInt(item.widthCm);
      if (item.heightCm) orderItem.heightCm = parseInt(item.heightCm);
      if (item.areaM2) orderItem.areaM2 = parseFloat(item.areaM2);
      if (item.pricePerM2) orderItem.pricePerM2 = parseFloat(item.pricePerM2);
      if (item.wasteCost) orderItem.wasteCost = parseFloat(item.wasteCost);
      if (item.is25DAddOn) orderItem.is25DAddOn = item.is25DAddOn;
      
      // ✅ Add sample-specific fields
      if (isSampleOrder) {
        orderItem.isSample = true;
        orderItem.notes = item.notes || "Sample order";
      }

      return orderItem;
    });

    // ✅ Create order in database
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
        status: "pending",
        
        // ✅ Flag for sample orders
        notes: isSampleOrder ? "Sample Order - A3 Swatch" : undefined,
        
        // ✅ Create order items
        items: {
          create: orderItems,
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
          event: isSampleOrder ? "sample.created" : "order.created",
          orderId: order.id,
          orderNumber: order.orderNumber,
          isSampleOrder,
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
      }).catch(err => console.warn("⚠️ n8n webhook failed:", err));
    }

    console.log(`✅ ${isSampleOrder ? 'Sample' : 'Order'} created: ${orderNumber} (Total: Rp ${order.total.toLocaleString('id-ID')})`);

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
      return NextResponse.json(
        { success: false, error: "Order number conflict. Please try again." },
        { status: 409 }
      );
    }

    if (error?.code === "P2003") {
      // Foreign key constraint (invalid product/user ID)
      // ✅ More helpful error message
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reference in order items. Please check product IDs or try submitting as sample order." 
        },
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
        details: process.env.NODE_ENV === "development" ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}

// ✅ Helper: Check if string is valid UUID
function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}