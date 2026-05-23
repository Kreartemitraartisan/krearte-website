import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Get all materials (exclude Custom Print for regular products)
    const allMaterials = await prisma.material.findMany({
      where: {
        category: {
          not: "Custom Print",
        },
      },
      orderBy: [
        { category: "asc" },
        { pricePerM2: "asc" },
      ],
    });

    // Filter materials yang available untuk product ini
    const availableMaterials = allMaterials.filter((material) =>
      product.availableMaterialIds?.includes(material.id)
    );

    // Tandai materials yang recommended
    const materialsWithRecommendation = availableMaterials.map((material) => ({
      ...material,
      isRecommended: product.recommendedMaterialIds?.includes(material.id) || false,
    }));

    // ✅ FIX: Filter yang lebih strict untuk exclude services
    // Price range hanya menghitung material wallpaper, bukan add-on services
    const actualMaterials = availableMaterials.filter(m => {
      const cat = (m.category || '').toLowerCase();
      const name = (m.name || '').toLowerCase();
      
      // ✅ Exclude services/add-ons berdasarkan category
      if (cat === 'service') return false;
      
      // ✅ Exclude berdasarkan nama yang mengandung kata kunci jasa
      if (name.includes('jasa')) return false;
      if (name.includes('design/re-draw')) return false;
      if (name.startsWith('jasa print')) return false;
      if (name.includes('print -')) return false;
      
      // ✅ Hanya include material yang bukan service
      return true;
    });

    console.log('📊 Price Range Calculation:', {
      totalMaterials: availableMaterials.length,
      actualMaterials: actualMaterials.length,
      excludedServices: availableMaterials.length - actualMaterials.length,
      materialPrices: actualMaterials.map(m => ({
        name: m.name,
        price: m.pricePerM2,
        category: m.category
      }))
    });

    // Calculate price range (price + waste) - only from actual materials
    const prices = actualMaterials.map((m) => m.pricePerM2 + (m.waste || 0));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return NextResponse.json({
      success: true,
      materials: materialsWithRecommendation,
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
    });
  } catch (error) {
    console.error("Error fetching product materials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product materials" },
      { status: 500 }
    );
  }
}