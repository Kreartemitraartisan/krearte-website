// /app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ GET - Fetch all products (PUBLIC - NO AUTH)
// =========================
export async function GET() {
  try {
    console.log('🚀 [Products API] Fetching products...');

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { sizes: true },
    });

    console.log(`[Products API] Found ${products.length} products`);

    const productsWithPriceRange = await Promise.all(
      products.map(async (product) => {
        const materialIds = product.availableMaterialIds || [];

        console.log(`\n[Product: ${product.name}]`);
        console.log(`  - Material IDs: ${materialIds.length} materials`);

        if (!materialIds || materialIds.length === 0) {
          console.log(`  - ⚠️ No materials linked, using base price`);
          return {
            ...product,
            priceRange: { min: product.price || 0, max: product.price || 0 },
          };
        }

        // Fetch materials
        const materials = await prisma.material.findMany({
          where: { id: { in: materialIds } },
          select: { 
            id: true, 
            name: true, 
            pricePerM2: true,
          },
        });

        console.log(`  - Materials found: ${materials.length}`);

        if (materials.length === 0) {
          console.log(`  - ⚠️ No materials found in DB`);
          return {
            ...product,
            priceRange: { min: product.price || 0, max: product.price || 0 },
          };
        }

        // Log material prices
        materials.forEach(m => {
          console.log(`    • ${m.name}: Rp ${m.pricePerM2}`);
        });

        // ✅ Calculate price range: LANGSUNG dari pricePerM2 (tanpa waste)
        const prices = materials.map((m) => Number(m.pricePerM2) || 0);

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        console.log(`  - ✅ Price Range: Rp ${minPrice} - Rp ${maxPrice}`);

        return {
          ...product,
          priceRange: {
            min: Math.round(minPrice),
            max: Math.round(maxPrice),
          },
        };
      })
    );

    console.log(`\n[Products API] ✅ Processed ${productsWithPriceRange.length} products`);

    return NextResponse.json({
      success: true,
      products: productsWithPriceRange,
      count: productsWithPriceRange.length,
    });

  } catch (error: any) {
    console.error("❌ [Products API] GET ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST - Create product (ADMIN ONLY)
// =========================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

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
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}