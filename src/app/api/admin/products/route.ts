// /app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server"; // ← WAJIB ADA!

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ GET - Fetch all products
// =========================
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { sizes: true },
    });

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST - Create product (FIXED)
// =========================
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // ✅ FIX: Validasi yang benar (price: 0 tetap valid)
    if (
      !body.name?.trim() || 
      !body.slug?.trim() || 
      body.price === undefined || 
      body.price === null
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        slug: body.slug.trim(),
        category: body.category || "wallcovering",
        price: Number(body.price),
        stock: Number(body.stock) || 0,
        description: body.description?.trim() || null,
        images: Array.isArray(body.images) ? body.images : [],
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
    console.error("CREATE PRODUCT ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}