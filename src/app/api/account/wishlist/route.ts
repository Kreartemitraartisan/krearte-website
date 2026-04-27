import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // ✅ Lazy import (WAJIB di dalam function)
    const [{ getServerSession }, { authOptions }, { prisma }] =
      await Promise.all([
        import("next-auth"),
        import("@/app/api/auth/[...nextauth]/route"),
        import("@/lib/prisma"),
      ]);

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔍 Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Fetch wishlist
    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: true,
      },
    });

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
    console.error("WISHLIST API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}