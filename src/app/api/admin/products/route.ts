// /app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ HELPER: Check if material is physical
// =========================
function isPhysicalMaterial(material: any): boolean {
  const category = (material.category || "").toLowerCase();
  const name = (material.name || "").toLowerCase();
  const price = material.pricePerM2 || 0;

  // Exclude services & add-ons
  const excludedKeywords = [
    "service", "add-on", "addon", "jasa", 
    "print", "design", "redesign", "sample",
    "custom", "fee", "biaya"
  ];

  const hasExcludedKeyword = excludedKeywords.some(keyword => 
    category.includes(keyword) || name.includes(keyword)
  );

  // Minimum price threshold (Rp 300.000)
  const MIN_MATERIAL_PRICE = 300000;
  
  return price >= MIN_MATERIAL_PRICE && !hasExcludedKeyword;
}

// =========================
// ✅ GET - Fetch all products
// =========================
export async function GET() {
  try {
    console.log('🚀 [Products API] Fetching products...');

    // Fetch all products
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { sizes: true },
    });

    console.log(`[Products API] Found ${products.length} products`);

    // Process each product to calculate price range
    const productsWithPriceRange = await Promise.all(
      products.map(async (product) => {
        try {
          const materialIds = product.availableMaterialIds || [];

          if (!materialIds || materialIds.length === 0) {
            return {
              ...product,
              priceRange: { min: product.price || 0, max: product.price || 0 },
              physicalMaterialCount: 0,
            };
          }

          // Fetch materials for this product
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

          // Filter only physical materials
          const physicalMaterials = materials.filter(isPhysicalMaterial);

          if (physicalMaterials.length === 0) {
            return {
              ...product,
              priceRange: { min: product.price || 0, max: product.price || 0 },
              physicalMaterialCount: 0,
            };
          }

          // Calculate price range (pricePerM2 + waste)
          const prices = physicalMaterials.map((m) => {
            return (m.pricePerM2 || 0) + (m.waste || 0);
          });

          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

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
          console.error(`[Products API] Error processing product ${product.id}:`, err);
          // Return product with base price on error
          return {
            ...product,
            priceRange: { min: product.price || 0, max: product.price || 0 },
          };
        }
      })
    );

    console.log(`[Products API] Successfully processed ${productsWithPriceRange.length} products`);

    return NextResponse.json({
      success: true,
      products: productsWithPriceRange,
      count: productsWithPriceRange.length,
    });

  } catch (error: any) {
    console.error("❌ [Products API] GET ERROR:", error);
    console.error("[Products API] Error details:", error?.message);
    console.error("[Products API] Stack:", error?.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch products",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST - Create product
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

    if (!body.name?.trim() || !body.slug?.trim() || body.price === undefined || body.price === null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, slug, price" },
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