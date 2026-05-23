import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      select: {
        total: true,
        id: true,
      },
    });

    // Get wishlist count (if you have wishlist model)
    const wishlistCount = 0; // Replace with actual query if you have wishlist

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      wishlistItems: wishlistCount,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}