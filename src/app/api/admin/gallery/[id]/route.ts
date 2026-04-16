import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params karena bertipe Promise di Next.js versi terbaru
    const { id } = await params;

    const galleryItem = await prisma.gallery.findUnique({
      where: { id },
    });

    if (!galleryItem) {
      return NextResponse.json(
        { success: false, error: "Gallery item not found" },
        { status: 404 }
      );
    }

    // Hapus file dari filesystem
    try {
      // Menghindari duplikasi folder "public"
      const imagePath = galleryItem.imageUrl.startsWith("/")
        ? galleryItem.imageUrl.slice(1)
        : galleryItem.imageUrl;

      const filepath = join(process.cwd(), "public", imagePath);
      await unlink(filepath);
    } catch (err) {
      console.log("File not found, skipping deletion");
    }

    // Hapus data dari database
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