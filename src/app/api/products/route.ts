// app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// =========================
// ✅ GET - Fetch products (Public Endpoint)
// =========================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get("limit");
    const category = searchParams.get("category");
    const categorySlug = searchParams.get("categorySlug");
    const collectionType = searchParams.get("collectionType");
    const slug = searchParams.get("slug");

    const limit = limitParam ? parseInt(limitParam) : undefined;

    // ✅ Build WHERE clause safely
    const where: any = {};

    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (categorySlug) {
      where.category_slug = {
        equals: categorySlug,
        mode: "insensitive",
      };
    }

    if (collectionType) {
      // ✅ FIX: Jangan toLowerCase() di sini, biarkan Prisma handle case-insensitive
      where.collectionType = {
        equals: collectionType,
        mode: "insensitive",
      };
    }

    if (slug) {
      where.slug = slug;
    }

    // ✅ STEP 1: Fetch products dasar dulu
    const products = await prisma.product.findMany({
      where,
      include: {
        sizes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    });

    // 🟢 Return empty if no products
    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        count: 0,
      });
    }

    // ✅ STEP 2: Fetch ALL materials yang dibutuhkan SEKALIGUS (Anti N+1 Query)
    // Ambil semua unique materialIds dari semua produk
    const allMaterialIds = [
      ...new Set(
        products
          .flatMap((p) => p.availableMaterialIds || [])
          .filter((id): id is string => !!id)
      ),
    ];

    let materialsMap = new Map<string, any>();
    
    if (allMaterialIds.length > 0) {
      const allMaterials = await prisma.material.findMany({
        where: {
          id: { in: allMaterialIds },
        },
        select: {
          id: true,
          pricePerM2: true,
          category: true,
          name: true,
          waste: true,
        },
      });
      
      // Map materials by ID for fast lookup
      allMaterials.forEach((m) => {
        materialsMap.set(m.id, m);
      });
    }

    // ✅ STEP 3: Process products dengan material prices (dari Map, bukan query DB lagi)
    const productsWithPrices = products.map((product) => {
      try {
        const materialIds = product.availableMaterialIds || [];

        // If no materials, use base price
        if (!materialIds || materialIds.length === 0) {
          return {
            ...product,
            priceRange: {
              min: product.price || 0,
              max: product.price || 0,
            },
            hasMaterialPrices: false,
          };
        }

        // Get materials from Map (no DB query!)
        const materials = materialIds
          .map((id) => materialsMap.get(id))
          .filter((m): m is NonNullable<typeof m> => !!m);

        // Filter out service/jasa materials
        const actualMaterials = materials.filter((m) => {
          const cat = (m.category || "").toLowerCase();
          const name = (m.name || "").toLowerCase();

          if (cat === "service") return false;
          if (name.includes("jasa")) return false;
          if (name.includes("design/re-draw")) return false;
          if (name.startsWith("jasa print")) return false;
          if (name.includes("print -")) return false;

          return true;
        });

        // If no valid materials, fallback to base price
        if (actualMaterials.length === 0) {
          return {
            ...product,
            priceRange: {
              min: product.price || 0,
              max: product.price || 0,
            },
            hasMaterialPrices: false,
          };
        }

        // Calculate price range from materials
        const prices = actualMaterials.map(
          (m) => (m.pricePerM2 || 0) + (m.waste || 0)
        );

        const min = Math.min(...prices);
        const max = Math.max(...prices);

        return {
          ...product,
          price: min, // Use min as display price
          priceRange: { min, max },
          hasMaterialPrices: true,
        };
      } catch (err) {
        // Fallback per product if processing fails
        console.warn(`⚠️ Failed to process prices for product ${product.id}:`, err);
        return {
          ...product,
          priceRange: {
            min: product.price || 0,
            max: product.price || 0,
          },
          hasMaterialPrices: false,
        };
      }
    });

    return NextResponse.json({
      success: true,
      products: productsWithPrices,
      count: productsWithPrices.length,
    });

  } catch (error) {
    console.error("❌ Error fetching products:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST - Create product (Admin only)
// =========================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validasi input wajib
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category || "wallcovering",
        price: body.price || 0,
        description: body.description || "",
        images: body.images || [],
        availableMaterialIds: body.availableMaterialIds || [],
        recommendedMaterialIds: body.recommendedMaterialIds || [],
        collectionType: body.collectionType || "wallcovering",
        is25DEligible: body.is25DEligible || false,
        stock: body.stock || 0,
        category_slug: body.category_slug || null,
        sizes: {
          create:
            body.sizes?.map((size: any) => ({
              label: size.label,
              price: Number(size.price) || 0,
              stock: Number(size.stock) || 0,
            })) || [],
        },
      },
      include: { sizes: true },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("❌ Error creating product:", error);

    // Handle duplicate slug
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Slug already exists. Please use a unique slug." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 }
    );
  }
}

// =========================
// ✅ PUT - Update product (Admin only)
// =========================
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category,
        price: typeof body.price === 'number' ? body.price : 0,
        description: body.description,
        images: body.images,
        availableMaterialIds: body.availableMaterialIds,
        recommendedMaterialIds: body.recommendedMaterialIds,
        collectionType: body.collectionType,
        is25DEligible: body.is25DEligible,
        stock: typeof body.stock === 'number' ? body.stock : 0,
        category_slug: body.category_slug,
        sizes: body.sizes
          ? {
              deleteMany: {},
              create: body.sizes.map((size: any) => ({
                label: size.label,
                price: Number(size.price) || 0,
                stock: Number(size.stock) || 0,
              })),
            }
          : undefined,
      },
      include: { sizes: true },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("❌ Error updating product:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update product",
      },
      { status: 500 }
    );
  }
}

// =========================
// ✅ DELETE - Delete product (Admin only)
// =========================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Cek dulu apakah produk punya order items (jangan hapus kalau sudah ada yang beli)
    const orderCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete product that has been ordered. Please archive it instead." 
        },
        { status: 400 }
      );
    }

    // Hapus sizes terkait dulu (cascade manual)
    await prisma.productSize.deleteMany({
      where: { productId: id },
    });

    // Hapus product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting product:", error);

    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "Cannot delete: Product is still referenced by other data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete product",
      },
      { status: 500 }
    );
  }
}