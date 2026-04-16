import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('📦 Session in API:', session);
    
    if (!session || session.user?.role !== "admin") {
      console.log('❌ Unauthorized - Role:', session?.user?.role);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        city: true,
        createdAt: true,
        orders: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const usersWithOrders = users.map(user => ({
      ...user,
      orders: user.orders?.length || 0,
    }));

    console.log(`✅ Fetched ${usersWithOrders.length} users`);
    return NextResponse.json({ success: true, users: usersWithOrders });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}