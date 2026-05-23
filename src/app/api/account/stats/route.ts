import { NextResponse } from "next/server";
const { getServerSession } = await import("next-auth");
const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
const { prisma } = await import("@/lib/prisma");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Fetch stats untuk user yang login
    const [totalOrders, totalSpent, wishlistCount] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: { userId: session.user.id },
      }),
      
      // Total spent (sum of order totals)
      prisma.order.aggregate({
        where: { 
          userId: session.user.id,
          status: { in: ['completed', 'delivered'] } // hanya order yang selesai
        },
        _sum: {
          total: true,
        },
      }),
      
      // Wishlist items count
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
    console.error("Error fetching account stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}