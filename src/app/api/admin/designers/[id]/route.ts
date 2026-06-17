// app/api/admin/designers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

// PUT - Update designer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, bio, photo, instagram, website, sortOrder } = body;

    const designer = await prisma.designer.update({
      where: { id: params.id },
      data: {
        name: name?.trim(),
        slug: slug?.trim().toLowerCase(),
        bio: bio?.trim() || null,
        photo: photo || null,
        instagram: instagram?.trim() || null,
        website: website?.trim() || null,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, designer });
  } catch (error: any) {
    console.error("❌ [Designers API] PUT Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update designer" },
      { status: 500 }
    );
  }
}

// DELETE - Delete designer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.designer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Designer deleted" });
  } catch (error: any) {
    console.error("❌ [Designers API] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete designer" },
      { status: 500 }
    );
  }
}