import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ HELPER: Check admin auth
// =========================
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return { authenticated: false, error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== "admin") {
    return { authenticated: false, error: "Forbidden", status: 403 };
  }

  return { authenticated: true, userEmail: session.user.email };
}

// =========================
// ✅ GET - Fetch single product
// =========================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        sizes: true,
        // Tambahkan include lain jika diperlukan
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("❌ GET PRODUCT ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
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
    const auth = await checkAdminAuth();
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();

    // ✅ Validasi required fields
    if (!body.name?.trim() || !body.slug?.trim() || body.price === undefined || body.price === null) {
      return NextResponse.json({ success: false, error: "Missing required fields: name, slug, price" }, { status: 400 });
    }

    // ✅ Build update data
    const updateData: any = {
      name: body.name.trim(),
      slug: body.slug.trim(),
      category: body.category || "wallcovering",
      category_slug: body.category_slug || null,
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      description: body.description?.trim() || null,
      collectionType: body.collectionType || "wallcovering",
      is25DEligible: Boolean(body.is25DEligible),
      images: Array.isArray(body.images) ? body.images.filter((img: string) => img?.trim()) : [],
      availableMaterialIds: Array.isArray(body.availableMaterialIds) ? body.availableMaterialIds : [],
      recommendedMaterialIds: Array.isArray(body.recommendedMaterialIds) ? body.recommendedMaterialIds : [],
    };

    // ✅ Handle nested sizes update (delete all + create new)
    if (Array.isArray(body.sizes)) {
      updateData.sizes = {
        deleteMany: {},
        create: body.sizes.map((size: any) => ({
          label: size.label?.trim() || "",
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

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("❌ UPDATE PRODUCT ERROR:", error);

    // Handle duplicate slug
    if (error?.code === "P2002") {
      return NextResponse.json({ success: false, error: "Product with this slug already exists" }, { status: 409 });
    }

    // Handle record not found
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

// =========================
// ✅ DELETE - Delete product (Safe with relations check)
// =========================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // ✅ 1. Cek apakah product ada + include relations yang valid
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        orderItems: true,  // ✅ Valid di schema
        sizes: true,       // ✅ Valid di schema
        wishlists: true,   // ✅ Valid di schema
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // ✅ 2. Jangan hapus kalau sudah ada yang order
    if (product.orderItems && product.orderItems.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete: Product has existing orders. Archive instead." },
        { status: 400 }
      );
    }

    // ✅ 3. Manual cascade delete untuk safety (meski schema sudah Cascade)
    if (product.sizes?.length) {
      await prisma.productSize.deleteMany({ where: { productId: id } });
    }
    if (product.wishlists?.length) {
      await prisma.wishlist.deleteMany({ where: { productId: id } });
    }

    // ✅ 4. Hapus product utama
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("❌ DELETE PRODUCT ERROR:", error);

    // Handle Prisma error codes
    if (error?.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "Cannot delete: Product is referenced by other data" },
        { status: 400 }
      );
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ success: false, error: "Database constraint error" }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}