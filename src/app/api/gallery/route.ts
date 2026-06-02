import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3. ✅ Forward ke VPS Upload Endpoint (sama seperti products)
    const vpsFormData = new FormData();
    vpsFormData.append("file", file);

    const vpsResponse = await fetch(`https://your-vps-domain.com/upload`, {
      method: "POST",
      headers: {
        "folder": "gallery", // ✅ Folder tujuan di VPS
      },
      body: vpsFormData,
    });

    if (!vpsResponse.ok) {
      const errText = await vpsResponse.text();
      throw new Error(`VPS upload failed: ${errText}`);
    }

    const vpsData = await vpsResponse.json();
    
    if (!vpsData.success || !vpsData.url) {
      throw new Error("Invalid response from VPS");
    }

    // 4. ✅ Simpan URL ke Database (via Prisma di Vercel)
    const galleryItem = await prisma.gallery.create({
      data: {
        title: title?.trim() || "Untitled",
        imageUrl: vpsData.url, // ✅ URL dari VPS
        category: category?.trim() || "general",
        description: description?.trim() || null,
        isFeatured: false,
        order: 0,
      },
    });

    return NextResponse.json({ success: true, galleryItem });

  } catch (error: any) {
    console.error("❌ Gallery Upload Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}