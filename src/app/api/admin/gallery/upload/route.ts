import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    // Validation
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only images allowed" }, { status: 400 });
    }

    // ✅ Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Generate safe filename
    const ext = file.name.split(".").pop();
    const safeName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const filename = `${Date.now()}-${safeName}.${ext}`;

    // ✅ Define upload path - use public/gallery folder
    const uploadDir = join(process.cwd(), "public", "gallery");
    const filepath = join(uploadDir, filename);

    // ✅ Create folder if not exists (with better error handling)
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (mkdirError: any) {
      // If mkdir fails, log but continue (folder might already exist)
      console.warn("⚠️ Folder creation warning:", mkdirError.message);
    }

    // ✅ Write file to disk
    await writeFile(filepath, buffer);

    // ✅ Save to database with correct public URL
    const imageUrl = `/gallery/${filename}`;
    
    const galleryItem = await prisma.gallery.create({
      data: {
        title: title?.trim() || "Untitled",
        imageUrl,
        category: category?.trim() || "general",
        description: description?.trim() || null,
        isFeatured: false,
        order: 0,
      },
    });

    console.log(`✅ Gallery item uploaded: ${imageUrl}`);

    return NextResponse.json({
      success: true,
      galleryItem,
      message: "Upload successful",
    });

  } catch (error: any) {
    console.error("❌ UPLOAD ERROR:", error);
    
    // More specific error messages
    if (error?.code === "EACCES") {
      return NextResponse.json(
        { success: false, error: "Permission denied. Check folder permissions." },
        { status: 500 }
      );
    }
    if (error?.code === "ENOENT") {
      return NextResponse.json(
        { success: false, error: "Directory not found. Please create public/gallery folder." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}