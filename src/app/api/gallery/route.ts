// src/app/api/gallery/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    console.log("📸 Fetching gallery items...");
    
    // ✅ PENTING: Sort by order ASCENDING (0, 1, 2, ...)
    const gallery = await prisma.gallery.findMany({
      orderBy: { order: "asc" },
    });

    console.log(`✅ Found ${gallery.length} items`);

    return NextResponse.json({ 
      success: true, 
      gallery,
      count: gallery.length 
    });
  } catch (error: any) {
    console.error("❌ Gallery API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        gallery: [] 
      },
      { status: 500 }
    );
  }
}