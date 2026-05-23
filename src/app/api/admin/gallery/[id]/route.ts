import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    // ✅ Ambil params (AMAN untuk semua versi)
    const { id } = context.params;

    // ✅ Lazy import semua dependency
    const [{ prisma }, fs, path] = await Promise.all([
      import("@/lib/prisma"),
      import("fs/promises"),
      import("path"),
    ]);

    const { unlink } = fs;
    const { join } = path;

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

    // 🗑️ Hapus dari DB
    await prisma.gallery.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE GALLERY ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}