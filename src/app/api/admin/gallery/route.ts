import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

// ✅ GET: Fetch all gallery items
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gallery = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, gallery });
  } catch (error: any) {
    console.error("❌ [Gallery API] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Delete gallery item by ID (via query param)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Gallery item ID is required" }, { status: 400 });
    }

    await prisma.gallery.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: any) {
    console.error("❌ [Gallery API] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete" },
      { status: 500 }
    );
  }
}