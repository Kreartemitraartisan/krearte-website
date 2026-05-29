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
      paymentMethod = "WHATSAPP",
      paymentStatus = "pending_verification",
      isSampleOrder = false,
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

    const orderNumber = generateOrderNumber();

    // ✅ Prepare items - pastikan semua field ada value (null jika tidak ada)
    const orderItems = items.map((item: any) => {
      return {
        name: item.name || "Unknown Product",
        size: item.size || `${item.widthCm || 100}cm × ${item.heightCm || 100}cm`,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        
        // ✅ ONLY set productId if it's a valid UUID and NOT a sample
        productId: (!isSampleOrder && item.productId && isValidUuid(item.productId)) 
          ? item.productId 
          : null,
        
        // ✅ Material fields - set to null if not exists
        materialId: item.materialId || null,
        materialName: item.materialName || item.material || null,
        
        // ✅ Dimensions - parse to numbers or null
        width: item.width ? parseFloat(item.width) : null,
        height: item.height ? parseFloat(item.height) : null,
        widthCm: item.widthCm ? parseInt(item.widthCm) : null,
        heightCm: item.heightCm ? parseInt(item.heightCm) : null,
        areaM2: item.areaM2 ? parseFloat(item.areaM2) : null,
        pricePerM2: item.pricePerM2 ? parseFloat(item.pricePerM2) : null,
        wasteCost: item.wasteCost ? parseFloat(item.wasteCost) : null,
        
        // ✅ Boolean fields
        is25DAddOn: Boolean(item.is25DAddOn),
        isSample: Boolean(isSampleOrder),
      };
    });

    // ✅ Create order
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
        paymentMethod,
        paymentStatus,
        status: "pending",
        notes: isSampleOrder ? "Sample Order - A3 Swatch" : undefined,
        
        items: {
          create: orderItems,
        },
      },
      include: { 
        items: true,
        user: { select: { name: true, email: true } }
      },
    });

    // ✅ Webhook
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
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => console.warn("⚠️ n8n webhook failed:", err));
    }

    console.log(`✅ ${isSampleOrder ? 'Sample' : 'Order'} created: ${orderNumber}`);

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      orderNumber: order.orderNumber,
      order 
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Error creating order:", error);
    
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

// ✅ Helper: Validate UUID
function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}