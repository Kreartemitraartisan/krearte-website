import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - Fetch products (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get("limit");
    const category = searchParams.get("category"); // Legacy: filter by category string
    const categorySlug = searchParams.get("categorySlug"); // New: filter by category slug
    const collectionType = searchParams.get("collectionType");
    const slug = searchParams.get("slug");

    const limit = limitParam ? parseInt(limitParam) : undefined;

    // ✅ SAFE where clause
    const where: any = {};

    // Legacy category filter (exact match on category string)
    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    // New category_slug filter (for new category system)
    if (categorySlug) {
      where.category_slug = {
        equals: categorySlug,
        mode: "insensitive",
      };
    }

    if (collectionType) {
      where.collectionType = {
        equals: collectionType.toLowerCase(),
        mode: "insensitive",
      };
    }

    if (slug) {
      where.slug = slug;
    }

    // ✅ FETCH PRODUCTS (safe even if DB empty)
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

    // 🟢 IF NO PRODUCTS → RETURN EMPTY SAFE RESPONSE
    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        count: 0,
      });
    }

    // ✅ SAFE MATERIAL PROCESSING
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        try {
          const materialIds = product.availableMaterialIds || [];

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

          const materials = await prisma.material.findMany({
            where: {
              id: { in: materialIds },
            },
            select: {
              pricePerM2: true,
              category: true,
              name: true,
              waste: true,
            },
          });

          // 🟡 SAFE FILTER (no crash if null)
          const actualMaterials = (materials || []).filter((m) => {
            const cat = (m.category || "").toLowerCase();
            const name = (m.name || "").toLowerCase();

            if (cat === "service") return false;
            if (name.includes("jasa")) return false;
            if (name.includes("design/re-draw")) return false;
            if (name.startsWith("jasa print")) return false;
            if (name.includes("print -")) return false;

            return true;
          });

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

          const prices = actualMaterials.map(
            (m) => (m.pricePerM2 || 0) + (m.waste || 0)
          );

          const min = Math.min(...prices);
          const max = Math.max(...prices);

          return {
            ...product,
            price: min,
            priceRange: { min, max },
            hasMaterialPrices: true,
          };
        } catch (err) {
          // 🟢 per-product fallback (IMPORTANT supaya tidak 500 global)
          return {
            ...product,
            priceRange: {
              min: product.price || 0,
              max: product.price || 0,
            },
            hasMaterialPrices: false,
          };
        }
      })
    );

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
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// POST - Create product (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category,
        price: body.price || 0,
        description: body.description || "",
        images: body.images || [],
        availableMaterialIds: body.availableMaterialIds || [],
        recommendedMaterialIds: body.recommendedMaterialIds || [],
        collectionType: body.collectionType || "wallcovering",
        is25DEligible: body.is25DEligible || false,
        stock: body.stock || 0,
        // ✅ NEW: Support category_slug for new category system
        category_slug: body.category_slug || null,
        sizes: {
          create:
            body.sizes?.map((size: any) => ({
              label: size.label,
              price: size.price || 0,
              stock: size.stock || 0,
            })) || [],
        },
      },
      include: { sizes: true },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 }
    );
  }
}

// PUT - Update product (Admin only)
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
        price: body.price,
        description: body.description,
        images: body.images,
        availableMaterialIds: body.availableMaterialIds,
        recommendedMaterialIds: body.recommendedMaterialIds,
        collectionType: body.collectionType,
        is25DEligible: body.is25DEligible,
        stock: body.stock,
        // ✅ NEW: Update category_slug
        category_slug: body.category_slug,
        sizes: body.sizes
          ? {
              deleteMany: {},
              create: body.sizes.map((size: any) => ({
                label: size.label,
                price: size.price,
                stock: size.stock,
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
  } catch (error) {
    console.error("❌ Error updating product:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update product",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (Admin only)
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

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting product:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete product",
      },
      { status: 500 }
    );
  }
}