// /app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3. Validate file type (images + videos)
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Videos
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: "File type not allowed", 
          allowed: "Images: JPG, PNG, GIF, WebP, SVG | Videos: MP4, WebM, MOV" 
        },
        { status: 400 }
      );
    }

    // 4. Validate file size
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 20 * 1024 * 1024 : 10 * 1024 * 1024; // 20MB for video, 10MB for image
    const maxSizeLabel = isVideo ? "20MB" : "10MB";

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum ${maxSizeLabel}` },
        { status: 400 }
      );
    }

    // 5. Initialize Supabase client (use service role for admin upload)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 6. Generate unique filename
    const ext = file.name.split(".").pop();
    const safeName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    // Folder structure: products/, videos/, or gallery/
    const folder = isVideo ? "videos" : "products";
    const filename = `${folder}/${timestamp}-${random}-${safeName}.${ext}`;

    // 7. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError);
      
      // Handle specific Supabase errors
      if (uploadError.message?.includes("Duplicate")) {
        return NextResponse.json(
          { error: "File with this name already exists" },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // 8. Get public URL
    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(filename);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to generate public URL" },
        { status: 500 }
      );
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: filename,
      type: file.type,
      size: file.size,
      folder: folder,
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    
    // Return specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// Reject non-POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}