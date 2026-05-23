import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: Request) {
  try {
    // ✅ Lazy import semua dependency berat
    const [{ prisma }, fs, path] = await Promise.all([
      import("@/lib/prisma"),
      import("fs/promises"),
      import("path"),
    ]);

    const { writeFile, mkdir } = fs;
    const { join } = path;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only images allowed" },
        { status: 400 }
      );
    }

    // ✅ Convert file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;
    const uploadDir = join(process.cwd(), "public", "gallery");
    const filepath = join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);

    const galleryItem = await prisma.gallery.create({
      data: {
        title,
        imageUrl: `/gallery/${filename}`,
        category,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      galleryItem,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}