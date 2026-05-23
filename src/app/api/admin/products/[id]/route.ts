import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ✅ GET - Fetch single product
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update product
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    console.log("\n========== 🔍 DEBUG PUT REQUEST ==========");

    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const updateData: any = {
      name: body.name,
      slug: body.slug,
      category: body.category,
      price: Number(body.price),
      stock: Number(body.stock),
      description: body.description,
      collectionType: body.collectionType,
    };

    // Handle images
    if (Array.isArray(body.images)) {
      updateData.images = body.images;
    }

    // Optional fields
    if (body.is25DEligible !== undefined) {
      updateData.is25DEligible = body.is25DEligible;
    }
    if (Array.isArray(body.availableMaterialIds)) {
      updateData.availableMaterialIds = body.availableMaterialIds;
    }
    if (Array.isArray(body.recommendedMaterialIds)) {
      updateData.recommendedMaterialIds = body.recommendedMaterialIds;
    }

    // Handle sizes
    if (body.sizes && Array.isArray(body.sizes)) {
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

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("❌ ERROR IN PUT:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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
    console.error("❌ DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}