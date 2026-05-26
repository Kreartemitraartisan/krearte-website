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
// ✅ GET - Fetch single product (with debug logs)
// =========================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log(`[GET Product] Request received for ID: ${await params.then(p => p.id)}`);
    
    const auth = await checkAdminAuth();
    if (!auth.authenticated) {
      console.log(`[GET Product] Auth failed: ${auth.error}`);
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    console.log(`[GET Product] Fetching product with ID: ${id}`);

    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        sizes: true,
      },
    });

    if (!product) {
      console.log(`[GET Product] Product not found: ${id}`);
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    console.log(`[GET Product] Success: ${product.name}`);
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("❌ [GET Product] ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}

// =========================
// ✅ PUT - Update product (with detailed logging)
// =========================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log(`[PUT Product] Update request received`);
    
    const auth = await checkAdminAuth();
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();

    console.log(`[PUT Product] Updating ID: ${id}`);
    console.log(`[PUT Product] Request body keys:`, Object.keys(body));
    console.log(`[PUT Product] category_slug value:`, body.category_slug);

    // ✅ Validasi required fields
    if (!body.name?.trim() || !body.slug?.trim() || body.price === undefined || body.price === null) {
      console.log(`[PUT Product] Validation failed: missing required fields`);
      return NextResponse.json({ success: false, error: "Missing required fields: name, slug, price" }, { status: 400 });
    }

    // ✅ Build update data
    const updateData: any = {
      name: body.name.trim(),
      slug: body.slug.trim(),
      category: body.category || "wallcovering",
      // ✅ PENTING: Pastikan category_slug tersimpan (bisa null)
      category_slug: body.category_slug !== undefined ? body.category_slug : null,
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      description: body.description?.trim() || null,
      collectionType: body.collectionType || "wallcovering",
      is25DEligible: Boolean(body.is25DEligible),
      images: Array.isArray(body.images) ? body.images.filter((img: string) => img?.trim()) : [],
      availableMaterialIds: Array.isArray(body.availableMaterialIds) ? body.availableMaterialIds : [],
      recommendedMaterialIds: Array.isArray(body.recommendedMaterialIds) ? body.recommendedMaterialIds : [],
    };

    console.log(`[PUT Product] Update data prepared:`, {
      name: updateData.name,
      slug: updateData.slug,
      category: updateData.category,
      category_slug: updateData.category_slug, // Log ini penting untuk debug
      collectionType: updateData.collectionType,
    });

    // ✅ Handle nested sizes update (delete all + create new)
    if (Array.isArray(body.sizes)) {
      console.log(`[PUT Product] Updating ${body.sizes.length} sizes`);
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

    console.log(`[PUT Product] ✅ Success: ${product.name}, category_slug: ${product.category_slug}`);
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("❌ [PUT Product] ERROR:", error);
    console.error(`[PUT Product] Error details:`, {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });

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
    console.log(`[DELETE Product] Delete request received`);
    
    const auth = await checkAdminAuth();
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    console.log(`[DELETE Product] Deleting ID: ${id}`);

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
      console.log(`[DELETE Product] Product not found: ${id}`);
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // ✅ 2. Jangan hapus kalau sudah ada yang order
    if (product.orderItems && product.orderItems.length > 0) {
      console.log(`[DELETE Product] Blocked: Product has ${product.orderItems.length} order items`);
      return NextResponse.json(
        { success: false, error: "Cannot delete: Product has existing orders. Archive instead." },
        { status: 400 }
      );
    }

    // ✅ 3. Manual cascade delete untuk safety (meski schema sudah Cascade)
    if (product.sizes?.length) {
      console.log(`[DELETE Product] Deleting ${product.sizes.length} related sizes`);
      await prisma.productSize.deleteMany({ where: { productId: id } });
    }
    if (product.wishlists?.length) {
      console.log(`[DELETE Product] Deleting ${product.wishlists.length} related wishlists`);
      await prisma.wishlist.deleteMany({ where: { productId: id } });
    }

    // ✅ 4. Hapus product utama
    await prisma.product.delete({ where: { id } });
    console.log(`[DELETE Product] ✅ Successfully deleted: ${product.name}`);

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("❌ [DELETE Product] ERROR:", error);
    console.error(`[DELETE Product] Error details:`, {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });

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