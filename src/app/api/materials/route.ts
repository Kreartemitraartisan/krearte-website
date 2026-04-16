import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ✅ Ambil semua materials (termasuk services/jasa)
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        pricePerM2: true,
        designerPricePerM2: true,
        resellerPricePerM2: true,
        waste: true,
        width: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("📦 Total materials loaded:", materials.length);
    console.log("📋 Categories:", [...new Set(materials.map(m => m.category))]);

    return NextResponse.json({
      success: true,
      materials,
      debug: {
        total: materials.length,
      }
    });
  } catch (error) {
    console.error("❌ Error fetching materials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}