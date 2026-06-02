// src/app/api/admin/gallery/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Sesuaikan path auth kamu
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. ✅ Authentication Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. ✅ Parse FormData dari Frontend
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

    // 3. ✅ PROXY: Forward file ke VPS Upload Server
    // ⚠️ PENTING: Ganti dengan IP Publik atau Domain VPS Hostinger kamu
    const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL || "http://103.xx.xx.xx:4000/upload";

    const vpsFormData = new FormData();
    vpsFormData.append("file", file);

    const vpsResponse = await fetch(VPS_UPLOAD_URL, {
      method: "POST",
      headers: {
        "folder": "gallery", // ✅ Memberitahu VPS simpan di folder gallery/
      },
      body: vpsFormData,
      // ❌ JANGAN set Content-Type header manual, biar browser handle boundary
    });

    if (!vpsResponse.ok) {
      const errText = await vpsResponse.text();
      throw new Error(`VPS rejected upload: ${errText}`);
    }

    const vpsData = await vpsResponse.json();

    if (!vpsData.success || !vpsData.url) {
      throw new Error("Invalid response from VPS upload server");
    }

    // 4. ✅ Simpan Metadata ke Database Supabase (via Prisma)
    const galleryItem = await prisma.gallery.create({
      data: {
        title: title?.trim() || "Untitled",
        imageUrl: vpsData.url, // ✅ URL publik dari VPS
        category: category?.trim() || "general",
        description: description?.trim() || null,
        isFeatured: false,
        order: 0,
      },
    });

    console.log(`✅ Gallery saved to DB: ${galleryItem.title} | URL: ${vpsData.url}`);

    return NextResponse.json({ 
      success: true, 
      galleryItem,
      message: "Upload successful" 
    });

  } catch (error: any) {
    console.error("❌ Gallery Upload Error:", error);
    
    // Handle specific errors
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: "Please login as admin" }, { status: 401 });
    }
    if (error?.message?.includes("VPS rejected")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}