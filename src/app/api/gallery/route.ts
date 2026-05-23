import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}