// src/app/api/account/wishlist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// ✅ Gunakan prisma singleton (JANGAN new PrismaClient() di level modul!)
import { prisma } from "@/lib/prisma";

// ✅ WAJIB: Cegah Next.js nge-build route ini secara statis
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔍 Get user by email (sesuai logic asli kamu)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ FIX: ambil dari tabel Wishlist (relation)
    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: true,
      },
    });

    // 🎯 Format response
    const items = wishlist.map((item) => ({
      id: item.id,
      productId: item.product?.id,
      productName: item.product?.name || "Unknown",
      productSlug: item.product?.slug || "",
      productImage: item.product?.images?.[0] || "",
      price: item.product?.price || 0,
      category: item.product?.category || "",
    }));

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}