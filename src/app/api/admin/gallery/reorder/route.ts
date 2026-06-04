// src/app/api/admin/gallery/reorder/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Update semua item sekaligus
    await Promise.all(
      items.map((item) =>
        prisma.gallery.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}