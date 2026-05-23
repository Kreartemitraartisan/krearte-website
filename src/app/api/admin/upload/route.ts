// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  try {
    // ✅ Lazy import (ANTI BUILD ERROR)
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import(
      "@/app/api/auth/[...nextauth]/route"
    );

    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const slug = formData.get("slug") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!type || !["image", "video"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid type (image/video required)" },
        { status: 400 }
      );
    }

    // ✅ Validate MIME
    const mimeType = file.type;
    const isVideo = mimeType.startsWith("video/");
    const isImage = mimeType.startsWith("image/");

    if (type === "video" && !isVideo) {
      return NextResponse.json(
        { success: false, error: "Invalid video file" },
        { status: 400 }
      );
    }

    if (type === "image" && !isImage) {
      return NextResponse.json(
        { success: false, error: "Invalid image file" },
        { status: 400 }
      );
    }

    // ✅ Size limit
    const maxSize = type === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Max ${
            type === "video" ? "50MB" : "10MB"
          }`,
        },
        { status: 400 }
      );
    }

    // ✅ Generate filename
    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();

    let fileName: string;

    if (slug && slug.trim() !== "") {
      fileName = `${slug}.${ext}`;
    } else {
      const random = Math.random().toString(36).substring(2, 8);
      fileName = `${timestamp}-${random}.${ext}`;
    }

    // ✅ Directory
    const uploadDir =
      type === "video"
        ? join(process.cwd(), "public", "videos", "uploads")
        : join(process.cwd(), "public", "images", "uploads");

    await mkdir(uploadDir, { recursive: true });

    // ✅ Save file
    const filePath = join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    // ✅ Public URL
    const publicUrl =
      type === "video"
        ? `/videos/uploads/${fileName}`
        : `/images/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      originalName: file.name,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);

    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}