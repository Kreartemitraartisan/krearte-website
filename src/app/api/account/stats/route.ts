import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // ✅ Lazy load DI DALAM function
    const [{ getServerSession }, { authOptions }, { prisma }] =
      await Promise.all([
        import("next-auth"),
        import("@/app/api/auth/[...nextauth]/route"),
        import("@/lib/prisma"),
      ]);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [totalOrders, totalSpent, wishlistCount] = await Promise.all([
      prisma.order.count({
        where: { userId: session.user.id },
      }),

      prisma.order.aggregate({
        where: {
          userId: session.user.id,
          status: { in: ["completed", "delivered"] },
        },
        _sum: { total: true },
      }),

      prisma.wishlist.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        totalSpent: totalSpent._sum.total || 0,
        wishlistItems: wishlistCount,
      },
    });

  } catch (error) {
    console.error("STATS API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}