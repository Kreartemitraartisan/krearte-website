// /app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ HELPER: Check if material is physical
// =========================
function isPhysicalMaterial(material: any): boolean {
  const category = (material.category || "").toLowerCase();
  const name = (material.name || "").toLowerCase();
  
  const price = Number(material.pricePerM2) || 0;

  const excludedKeywords = [
    "service", "add-on", "addon", "jasa", 
    "print", "design", "redesign", "sample",
    "custom", "fee", "biaya"
  ];

  const hasExcludedKeyword = excludedKeywords.some(keyword => 
    category.includes(keyword) || name.includes(keyword)
  );

  const MIN_MATERIAL_PRICE = 50000;
  
  return price >= MIN_MATERIAL_PRICE && !hasExcludedKeyword;
}

// =========================
// ✅ GET - Fetch all products WITH price range
// =========================
export async function GET() {
  try {
    console.log('🚀 [Products API] Starting fetch...');
    
    await prisma.$connect();
    console.log('✅ Database connected');

    console.log('📦 Fetching products...');
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { sizes: true },
    });

    console.log(`✅ Found ${products.length} products`);

    const productsWithPriceRange = await Promise.all(
      products.map(async (product) => {
        try {
          const materialIds = product.availableMaterialIds || [];

          console.log(`\n[Product: ${product.name}]`);
          console.log(`  - Material IDs count: ${materialIds.length}`);

          if (!materialIds || materialIds.length === 0) {
            console.log(`  - ⚠️ No materials linked`);
            return {
              ...product,
              priceRange: { min: product.price || 0, max: product.price || 0 },
              physicalMaterialCount: 0,
            };
          }

          console.log(`  - Fetching materials from DB...`);
          const materials = await prisma.material.findMany({
            where: { id: { in: materialIds } },
            select: { 
              id: true, 
              name: true, 
              category: true, 
              pricePerM2: true, 
              waste: true 
            },
          });

          console.log(`  - Materials found: ${materials.length}`);

          const physicalMaterials = materials.filter(isPhysicalMaterial);
          console.log(`  - Physical materials: ${physicalMaterials.length}`);

          const materialsToUse = physicalMaterials.length > 0 ? physicalMaterials : materials;

          if (materialsToUse.length === 0) {
            console.log(`  - ⚠️ No valid materials, using base price`);
            return {
              ...product,
              priceRange: { min: product.price || 0, max: product.price || 0 },
              physicalMaterialCount: 0,
            };
          }

          materialsToUse.forEach(m => {
            console.log(`    • ${m.name}: Rp ${m.pricePerM2}`);
          });

          const prices = materialsToUse.map((m) => {
            const basePrice = Number(m.pricePerM2) || 0;
            return basePrice;
          });

          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          console.log(`  - ✅ Price Range: Rp ${minPrice} - Rp ${maxPrice}`);

          return {
            ...product,
            priceRange: {
              min: Math.round(minPrice),
              max: Math.round(maxPrice),
            },
            physicalMaterialCount: physicalMaterials.length,
            totalMaterialCount: materials.length,
          };
        } catch (err) {
          console.error(`[Product: ${product.id}] Error:`, err);
          return {
            ...product,
            priceRange: { min: product.price || 0, max: product.price || 0 },
            physicalMaterialCount: 0,
          };
        }
      })
    );

    console.log(`\n✅ [Products API] Success: ${productsWithPriceRange.length} products`);

    return NextResponse.json({
      success: true,
      products: productsWithPriceRange,
      count: productsWithPriceRange.length,
    });

  } catch (error: any) {
    console.error("❌ [Products API] ERROR:", error);
    console.error("❌ Error name:", error?.name);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error code:", error?.code);
    console.error("❌ Error stack:", error?.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to fetch products",
        code: error?.code,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// =========================
// ✅ POST - Create product (ADMIN ONLY)
// =========================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, slug" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        slug: body.slug.trim(),
        category: body.category || "wallcovering",
        category_slug: body.category_slug || null,
        price: Number(body.price) || 0,
        stock: Number(body.stock) || 0,
        description: body.description?.trim() || null,
        images: Array.isArray(body.images) ? body.images.filter((img: string) => img?.trim()) : [],
        collectionType: body.collectionType || "wallcovering",
        is25DEligible: Boolean(body.is25DEligible),
        availableMaterialIds: Array.isArray(body.availableMaterialIds) ? body.availableMaterialIds : [],
        recommendedMaterialIds: Array.isArray(body.recommendedMaterialIds) ? body.recommendedMaterialIds : [],
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [Products API] POST ERROR:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}