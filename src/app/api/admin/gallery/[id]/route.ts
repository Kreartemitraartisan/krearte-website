import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const galleryItem = await prisma.gallery.findUnique({
      where: { id: params.id },
    });

    if (!galleryItem) {
      return NextResponse.json(
        { success: false, error: "Gallery item not found" },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), "public", galleryItem.imageUrl);
      await unlink(filepath);
    } catch (err) {
      console.log("File not found, skipping deletion");
    }

    // Delete from database
    await prisma.gallery.delete({
      where: { id: params.id },
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