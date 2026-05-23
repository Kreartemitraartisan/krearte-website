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
    const { id } = context.params;

    // ✅ Lazy imports (WAJIB)
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
    const { id } = context.params;

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

    const body = await request.json();

    const updateData: any = {
      name: body.name,
      slug: body.slug,
      category: body.category,
      price: Number(body.price),
      stock: Number(body.stock),
      description: body.description || null,
      collectionType: body.collectionType || "wallcovering",
    };

    // images
    if (Array.isArray(body.images)) {
      updateData.images = body.images;
    }

    // optional fields
    if (body.is25DEligible !== undefined) {
      updateData.is25DEligible = body.is25DEligible;
    }

    if (Array.isArray(body.availableMaterialIds)) {
      updateData.availableMaterialIds = body.availableMaterialIds;
    }

    if (Array.isArray(body.recommendedMaterialIds)) {
      updateData.recommendedMaterialIds = body.recommendedMaterialIds;
    }

    // sizes
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
// ✅ DELETE - Delete product
// =========================
export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;

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

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted",
    });

  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}