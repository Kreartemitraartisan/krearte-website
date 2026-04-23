// src/app/api/admin/gallery/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// ✅ Gunakan prisma singleton (JANGAN new PrismaClient()!)
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

// ✅ WAJIB: Cegah Next.js nge-build route ini secara statis
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ✅ Konfigurasi upload
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "gallery");
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // 🔐 Check admin auth
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔐 Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 📦 Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    // ✅ Validasi file
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: JPG, PNG, WEBP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    // 🗂️ Pastikan folder upload ada
    await mkdir(UPLOAD_DIR, { recursive: true });

    // 📝 Generate unique filename
    const fileExt = extname(file.name);
    const filename = `${randomUUID()}${fileExt}`;
    const filepath = join(UPLOAD_DIR, filename);

    // 💾 Simpan file ke filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 🗄️ Simpan metadata ke database
    const galleryItem = await prisma.gallery.create({
      data: {
        title: title || "",
        description: description || "",
        imageUrl: `/uploads/gallery/${filename}`,
        uploadedBy: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Gallery item uploaded successfully",
        item: {
          id: galleryItem.id,
          title: galleryItem.title,
          description: galleryItem.description,
          imageUrl: galleryItem.imageUrl,
          createdAt: galleryItem.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload gallery item" },
      { status: 500 }
    );
  }
}