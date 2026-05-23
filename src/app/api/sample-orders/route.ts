import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create sample order inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        phone: body.phone,
        projectType: "sample-order",
        message: `Sample Order Request\n\nProduct: ${body.productName}\nAddress: ${body.address}\nCity: ${body.city}\nPostal Code: ${body.postalCode}\nNotes: ${body.notes || "N/A"}`,
        status: "pending",
      },
    });

    // TODO: Send webhook to n8n for processing
    // TODO: Send confirmation email

    return NextResponse.json({ success: true, inquiry }, { status: 201 });
  } catch (error) {
    console.error("Error creating sample order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sample order" },
      { status: 500 }
    );
  }
}