// src/app/api/admin/gallery/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

// ✅ WAJIB: Cegah Next.js nge-build route ini secara statis
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // ✅ Await params karena berbentuk Promise (Next.js 15+)
    const { id } = await context.params;

    const galleryItem = await prisma.gallery.findUnique({
      where: { id },
    });

    if (!galleryItem) {
      return NextResponse.json(
        { success: false, error: "Gallery item not found" },
        { status: 404 }
      );
    }

    // 🗑️ Hapus file dari filesystem
    try {
      if (galleryItem.imageUrl) {
        const imagePath = galleryItem.imageUrl.startsWith("/")
          ? galleryItem.imageUrl.slice(1)
          : galleryItem.imageUrl;

        const filepath = join(process.cwd(), "public", imagePath);
        await unlink(filepath);
      }
    } catch {
      console.log("File not found, skipping deletion");
    }

    // 🗑️ Hapus data dari database
    await prisma.gallery.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}