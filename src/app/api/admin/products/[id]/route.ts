// /app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ GET - Fetch single product
// =========================
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");

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

    // ✅ FIX: Await params untuk Next.js 15+
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { sizes: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ PUT - Update product
// =========================
export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");

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

    // ✅ FIX: Await params untuk Next.js 15+
    const { id } = await context.params;

    const body = await request.json();

    const updateData: any = {
      name: body.name,
      slug: body.slug,
      category: body.category,
      price: Number(body.price),
      stock: Number(body.stock),
      description: body.description || null,
      collectionType: body.collectionType || "wallcovering",
      category_slug: body.category_slug || null,
    };

    if (Array.isArray(body.images)) {
      updateData.images = body.images;
    }

    if (body.is25DEligible !== undefined) {
      updateData.is25DEligible = body.is25DEligible;
    }

    if (Array.isArray(body.availableMaterialIds)) {
      updateData.availableMaterialIds = body.availableMaterialIds;
    }

    if (Array.isArray(body.recommendedMaterialIds)) {
      updateData.recommendedMaterialIds = body.recommendedMaterialIds;
    }

    if (Array.isArray(body.sizes)) {
      updateData.sizes = {
        deleteMany: {},
        create: body.sizes.map((size: any) => ({
          label: size.label,
          price: Number(size.price) || 0,
          stock: Number(size.stock) || 0,
        })),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { sizes: true },
    });

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ DELETE - Delete product (FIXED WITH CASCADE)
// =========================
export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");

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

    // ✅ FIX: Await params untuk Next.js 15+
    const { id } = await context.params;

    // ✅ 1. Cek apakah product ada
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        orderItems: true,
        // Include related tables untuk cascade delete manual jika perlu
        productImages: true,
        productMaterials: true,
        recommendedMaterials: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // ✅ 2. Kalau ada order items, tolak delete (produk sudah pernah dibeli)
    if (product.orderItems && product.orderItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete product that has been ordered. Please archive it instead." 
        },
        { status: 400 }
      );
    }

    // ✅ 3. CASCADE DELETE: Hapus data terkait dulu sebelum hapus produk
    // (Ini mencegah error "Foreign key constraint")
    
    // Hapus semua gambar produk
    if (product.productImages && product.productImages.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: id }
      });
    }
    
    // Hapus relasi available materials
    if (product.productMaterials && product.productMaterials.length > 0) {
      await prisma.productMaterial.deleteMany({
        where: { productId: id }
      });
    }
    
    // Hapus relasi recommended materials
    if (product.recommendedMaterials && product.recommendedMaterials.length > 0) {
      await prisma.productRecommendedMaterial.deleteMany({
        where: { productId: id }
      });
    }

    // ✅ 4. BARU hapus produk utamanya
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);

    // ✅ Handle Prisma error codes
    if (error?.code === "P2003") {
      // Foreign key constraint - ada data lain yang masih nyambung
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete: Product is still referenced by other data (orders, quotes, etc.)" 
        },
        { status: 400 }
      );
    }

    if (error?.code === "P2025") {
      // Record not found
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (error?.code === "P2002") {
      // Unique constraint failed
      return NextResponse.json(
        { success: false, error: "Database constraint error" },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { success: false, error: "Failed to delete product: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}