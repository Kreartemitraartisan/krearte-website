// /app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ HELPER: Check if material is physical (not service/add-on)
// =========================
function isPhysicalMaterial(material: any): boolean {
  const category = (material.category || "").toLowerCase();
  const name = (material.name || "").toLowerCase();

  // ❌ Exclude services & add-ons
  const excludedCategories = ["service", "add-on", "addon", "jasa", "print", "design", "redesign"];
  
  if (excludedCategories.some(ex => category.includes(ex) || name.includes(ex))) {
    return false;
  }

  // ✅ Include if has valid price and not excluded
  return material.pricePerM2 > 0;
}

// =========================
// ✅ GET - Fetch all products WITH price range calculation
// =========================
export async function GET() {
  try {
    // Fetch all products with their material relations
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        sizes: true,
        // Include materials for price calculation
      },
    });

    // ✅ Calculate price range for each product (only physical materials)
    const productsWithPriceRange = await Promise.all(
      products.map(async (product) => {
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
              physicalMaterialCount: 0,
            };
          }

          // ✅ Fetch materials for this product
          const materials = await prisma.material.findMany({
            where: {
              id: { in: materialIds },
            },
            select: {
              id: true,
              name: true,
              category: true,
              pricePerM2: true,
              waste: true,
              width: true,
            },
          });

          // ✅ FILTER: Only physical materials (exclude services/add-ons)
          const physicalMaterials = materials.filter(isPhysicalMaterial);

          // If no physical materials found, fallback to base price
          if (physicalMaterials.length === 0) {
            return {
              ...product,
              priceRange: {
                min: product.price || 0,
                max: product.price || 0,
              },
              physicalMaterialCount: 0,
              warning: "No physical materials found",
            };
          }

          // ✅ Calculate price range from physical materials only
          // Price = pricePerM2 + waste cost (if any)
          const prices = physicalMaterials.map((m) => {
            const basePrice = m.pricePerM2 || 0;
            const wasteCost = m.waste || 0;
            return basePrice + wasteCost;
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
          console.error(`Error calculating price for product ${product.id}:`, err);
          // Fallback to base price on error
          return {
            ...product,
            priceRange: {
              min: product.price || 0,
              max: product.price || 0,
            },
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      products: productsWithPriceRange,
      count: productsWithPriceRange.length,
    });
  } catch (error) {
    console.error("❌ GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // ✅ Validasi required fields
    if (
      !body.name?.trim() || 
      !body.slug?.trim() || 
      body.price === undefined || 
      body.price === null
    ) {
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
        category_slug: body.category_slug || null, // ✅ Support collection category
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

    return NextResponse.json({
      success: true,
      product,
    }, { status: 201 });

  } catch (error) {
    console.error("❌ CREATE PRODUCT ERROR:", error);

    // Handle duplicate slug error
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Product with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ PUT - Update product
// =========================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // ✅ Validasi required fields
    if (
      !body.name?.trim() || 
      !body.slug?.trim() || 
      body.price === undefined || 
      body.price === null
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, slug, price" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
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

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {
    console.error("❌ UPDATE PRODUCT ERROR:", error);

    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Product with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ DELETE - Delete product
// =========================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ✅ Check if product has orders (don't delete if has orders)
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Soft delete: don't actually delete, just mark as inactive or update stock to 0
    // Or if you really want to delete, make sure no order items reference it
    if (existingProduct.orderItems.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete product with existing orders" },
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
    console.error("❌ DELETE PRODUCT ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}