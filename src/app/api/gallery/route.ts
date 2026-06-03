// src/app/api/gallery/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gallery = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      success: true, 
      gallery,
      count: gallery.length 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, gallery: [] },
      { status: 500 }
    );
  }
}