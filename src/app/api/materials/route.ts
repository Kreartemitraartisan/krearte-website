import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ GET: Fetch all materials (PUBLIC - NO AUTH)
// =========================
export async function GET() {
  try {
    // ✅ HAPUS AUTH CHECK - API ini harus public untuk /materials page
    
    // Fetch all materials
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    console.error("❌ [Materials API] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ PUT: Update material (ADMIN ONLY)
// =========================
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    // Update material with type-safe parsing
    const updated = await prisma.material.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        category: data.category?.trim(),
        width: data.width || null,
        effectiveWidth: data.effectiveWidth ? Number(data.effectiveWidth) : null,
        pricePerM2: Number(data.pricePerM2) || 0,
        designerPricePerM2: data.designerPricePerM2 ? Number(data.designerPricePerM2) : null,
        resellerPricePerM2: data.resellerPricePerM2 ? Number(data.resellerPricePerM2) : null,
        samplePriceA3: Number(data.samplePriceA3) || 0,
        waste: Number(data.waste) || 0,
        stock: Number(data.stock) || 0,
        is25DEligible: Boolean(data.is25DEligible),
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, material: updated });
  } catch (error: any) {
    console.error("❌ [Materials API] PUT Error:", error);
    
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update material" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST: Create new material (ADMIN ONLY)
// =========================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim() || !body.category?.trim()) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const material = await prisma.material.create({
      data: {
        name: body.name.trim(),
        category: body.category.trim(),
        width: body.width || null,
        effectiveWidth: body.effectiveWidth ? Number(body.effectiveWidth) : null,
        pricePerM2: Number(body.pricePerM2) || 0,
        designerPricePerM2: body.designerPricePerM2 ? Number(body.designerPricePerM2) : null,
        resellerPricePerM2: body.resellerPricePerM2 ? Number(body.resellerPricePerM2) : null,
        samplePriceA3: Number(body.samplePriceA3) || 0,
        waste: Number(body.waste) || 0,
        stock: Number(body.stock) || 0,
        is25DEligible: Boolean(body.is25DEligible),
        description: body.description?.trim() || null,
        imageUrl: body.imageUrl || null,
      },
    });

    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [Materials API] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create material" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ DELETE: Delete material (ADMIN ONLY)
// =========================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Material deleted" });
  } catch (error: any) {
    console.error("❌ [Materials API] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete material" },
      { status: 500 }
    );
  }
}