// /app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ GET - Fetch all products WITH price range (IMPROVED)
// =========================
export async function GET() {
  try {
    console.log('🚀 [Products API] Starting fetch...');
    
    await prisma.$connect();
    console.log('✅ Database connected');

    // ✅ Fetch products
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { sizes: true },
    });

    console.log(`📦 Found ${products.length} products`);

    // ✅ Fetch ALL materials once (lebih efisien, tidak query per product)
    const allMaterials = await prisma.material.findMany({
      select: { 
        id: true, 
        name: true, 
        category: true, 
        pricePerM2: true, 
        waste: true 
      },
    });

    console.log(`📦 Loaded ${allMaterials.length} materials from DB`);

    // ✅ Create material map for faster lookup
    const materialMap = new Map(allMaterials.map(m => [m.id, m]));

    const productsWithPriceRange = products.map((product) => {
      try {
        const materialIds = product.availableMaterialIds || [];
        const basePrice = Number(product.price) || 0;

        // ✅ LOGGING: Detail per product
        console.log(`\n[Product: ${product.name}]`);
        console.log(`  - Material IDs count: ${materialIds.length}`);
        console.log(`  - Base price: Rp ${basePrice.toLocaleString('id-ID')}`);

        // ❌ Kalau tidak ada material IDs, pakai base price
        if (!materialIds || materialIds.length === 0) {
          console.log(`  - ⚠️ No materials linked, using base price`);
          return {
            ...product,
            priceRange: { min: basePrice, max: basePrice },
            physicalMaterialCount: 0,
            totalMaterialCount: 0,
          };
        }

        // ✅ Filter materials yang ID-nya ada di availableMaterialIds DAN ada di database
        const linkedMaterials = materialIds
          .map(id => materialMap.get(id))
          .filter((m): m is NonNullable<typeof m> => m !== undefined);

        console.log(`  - Linked materials found in DB: ${linkedMaterials.length}/${materialIds.length}`);

        // ❌ Kalau tidak ada materials yang valid di DB, pakai base price
        if (linkedMaterials.length === 0) {
          console.log(`  - ⚠️ No linked materials found in DB, using base price`);
          return {
            ...product,
            priceRange: { min: basePrice, max: basePrice },
            physicalMaterialCount: 0,
            totalMaterialCount: materialIds.length,
          };
        }

        // ✅ Filter materials dengan harga > 0 (exclude materials dengan harga 0)
        const materialsWithPrice = linkedMaterials.filter(m => {
          const price = Number(m.pricePerM2) || 0;
          return price > 0;
        });

        console.log(`  - Materials with price > 0: ${materialsWithPrice.length}`);

        // Log prices untuk debug
        materialsWithPrice.forEach(m => {
          console.log(`    • ${m.name}: Rp ${Number(m.pricePerM2).toLocaleString('id-ID')}`);
        });

        // ❌ Kalau tidak ada materials dengan harga > 0, pakai base price
        if (materialsWithPrice.length === 0) {
          console.log(`  - ⚠️ No materials with price > 0, using base price`);
          return {
            ...product,
            priceRange: { min: basePrice, max: basePrice },
            physicalMaterialCount: 0,
            totalMaterialCount: linkedMaterials.length,
          };
        }

        // ✅ Filter physical materials (exclude services/add-ons)
        const excludedKeywords = [
          "service", "add-on", "addon", "jasa", 
          "print", "design", "redesign", "sample",
          "custom", "fee", "biaya"
        ];

        const physicalMaterials = materialsWithPrice.filter(m => {
          const category = (m.category || "").toLowerCase();
          const name = (m.name || "").toLowerCase();
          
          const hasExcludedKeyword = excludedKeywords.some(keyword => 
            category.includes(keyword) || name.includes(keyword)
          );
          
          return !hasExcludedKeyword;
        });

        console.log(`  - Physical materials: ${physicalMaterials.length}`);

        // ✅ Pilih materials yang akan dipakai untuk kalkulasi
        // Priority: physical materials > all materials with price
        const materialsToUse = physicalMaterials.length > 0 
          ? physicalMaterials 
          : materialsWithPrice;

        // ✅ Calculate price range
        const prices = materialsToUse.map((m) => Number(m.pricePerM2) || 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        console.log(`  - ✅ Price Range: Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`);

        return {
          ...product,
          priceRange: {
            min: Math.round(minPrice),
            max: Math.round(maxPrice),
          },
          physicalMaterialCount: physicalMaterials.length,
          totalMaterialCount: linkedMaterials.length,
        };
      } catch (err: any) {
        console.error(`[Product: ${product.id}] Error:`, err?.message);
        const basePrice = Number(product.price) || 0;
        return {
          ...product,
          priceRange: { min: basePrice, max: basePrice },
          physicalMaterialCount: 0,
          totalMaterialCount: 0,
        };
      }
    });

    console.log(`\n✅ [Products API] Success: ${productsWithPriceRange.length} products processed`);

    // ✅ Summary stats
    const withPriceRange = productsWithPriceRange.filter(p => p.priceRange.min > 0).length;
    const withBasePrice = productsWithPriceRange.filter(p => 
      p.priceRange.min === p.priceRange.max && p.priceRange.min === Number(p.price)
    ).length;
    const zeroPrice = productsWithPriceRange.filter(p => p.priceRange.min === 0).length;

    console.log(`📊 Stats:`);
    console.log(`  - With price range (from materials): ${withPriceRange}`);
    console.log(`  - Using base price: ${withBasePrice}`);
    console.log(`  - Zero price: ${zeroPrice}`);

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