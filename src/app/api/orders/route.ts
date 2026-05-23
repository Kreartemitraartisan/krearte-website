import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch orders (user's own orders or all for admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const orders = await prisma.order.findMany({
      where: {
        userId: userId || undefined,
        status: status || undefined,
      },
      include: { items: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true,  orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST: Create new order from checkout
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, address, city, postalCode, phone, items, subtotal, shipping, total, userId } = body;

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Create order in database
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
        subtotal,
        shipping,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // 🔄 Send webhook to n8n for Accurate integration
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "order.created",
            order,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log("Webhook sent to n8n for order:", orderNumber);
      } catch (webhookError) {
        console.error("Failed to send webhook to n8n:", webhookError);
        // Don't fail the order if webhook fails
      }
    }

    // 📧 TODO: Send confirmation email to customer (Resend/SendGrid)

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}