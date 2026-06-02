import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ✅ GET: Fetch all materials
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ✅ PUT: Update material
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updated = await prisma.material.update({
      where: { id },
      data: {
        ...data,
        pricePerM2: Number(data.pricePerM2),
        waste: Number(data.waste),
        samplePriceA3: Number(data.samplePriceA3),
        stock: Number(data.stock),
        effectiveWidth: data.effectiveWidth ? Number(data.effectiveWidth) : null,
      },
    });

    return NextResponse.json({ success: true, material: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}