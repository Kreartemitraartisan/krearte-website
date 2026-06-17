// app/api/admin/designers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

// GET - Fetch all designers
export async function GET() {
  try {
    const designers = await prisma.designer.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      designers,
      count: designers.length,
    });
  } catch (error: any) {
    console.error("❌ [Designers API] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch designers" },
      { status: 500 }
    );
  }
}

// POST - Create new designer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, bio, photo, instagram, website, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const designer = await prisma.designer.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        bio: bio?.trim() || null,
        photo: photo || null,
        instagram: instagram?.trim() || null,
        website: website?.trim() || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, designer }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [Designers API] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create designer" },
      { status: 500 }
    );
  }
}