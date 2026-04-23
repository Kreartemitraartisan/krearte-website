import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "image" or "video"
    const slug = formData.get("slug") as string; // ✅ Get slug from request

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
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

    // Check file size
    const maxSize = type === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Max ${type === "video" ? 50 : 10}MB` },
        { status: 400 }
      );
    }

    // ✅ Generate filename from slug (if provided) or timestamp
    const fileExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    
    let fileName: string;
    if (slug) {
      // ✅ Use slug: blush-bunny-meadow.jpg or blush-bunny-meadow.mp4
      fileName = `${slug}.${fileExtension}`;
    } else {
      // Fallback: timestamp-random.ext
      const randomString = Math.random().toString(36).substring(2, 8);
      fileName = `${timestamp}-${randomString}.${fileExtension}`;
    }

    // Determine upload directory
    const uploadDir = type === "video" 
      ? join(process.cwd(), "public", "videos", "uploads")
      : join(process.cwd(), "public", "images", "uploads");

    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = type === "video"
      ? `/videos/uploads/${fileName}`
      : `/images/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}