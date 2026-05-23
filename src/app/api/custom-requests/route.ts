import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create custom request inquiry
    const inquiry = await prisma.inquiry.create({
       {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        phone: body.phone,
        projectType: "custom-size",
        dimensions: `${body.width} ${body.unit} × ${body.height} ${body.unit}`,
        timeline: body.timeline,
        budget: body.quantity,
        message: `Custom Size Request\n\nProduct: ${body.productName}\nDimensions: ${body.width} × ${body.height} ${body.unit}\nQuantity: ${body.quantity} panels\nProject Type: ${body.projectType}\nTimeline: ${body.timeline}\nNotes: ${body.notes || "N/A"}`,
        status: "pending",
      },
    });

    // TODO: Send webhook to n8n for processing
    // TODO: Send confirmation email

    return NextResponse.json({ success: true, inquiry }, { status: 201 });
  } catch (error) {
    console.error("Error creating custom request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create custom request" },
      { status: 500 }
    );
  }
}