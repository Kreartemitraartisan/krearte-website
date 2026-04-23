// src/app/api/admin/gallery/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

// ✅ WAJIB: Cegah Next.js nge-build route ini secara statis
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only images allowed" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;
    const uploadDir = join(process.cwd(), "public", "gallery");
    const filepath = join(uploadDir, filename);

    // Create directory if not exists
    await mkdir(uploadDir, { recursive: true });

    // Save file
    await writeFile(filepath, buffer);

    // Save to database
    const galleryItem = await prisma.gallery.create({
      data: {
        title,
        imageUrl: `/gallery/${filename}`,
        category,
        // ✅ Tambahkan description jika field ini ada di schema Prisma kamu
        // description: description || "",
      },
    });

    return NextResponse.json({
      success: true,
      galleryItem,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}