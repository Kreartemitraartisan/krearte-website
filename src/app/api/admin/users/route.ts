// src/app/api/admin/users/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // ✅ Lazy import (ANTI BUILD ERROR VERCEL)
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import(
      "@/app/api/auth/[...nextauth]/route"
    );

    const session = await getServerSession(authOptions);

    console.log("📦 Session in API:", session);

    // 🔐 Authorization check
    if (!session || session.user?.role !== "admin") {
      console.log("❌ Unauthorized - Role:", session?.user?.role);

      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // ✅ Fetch users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        city: true,
        createdAt: true,
        orders: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Format response
    const usersWithOrders = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      city: user.city,
      createdAt: user.createdAt.toISOString(),
      orders: user.orders?.length || 0,
    }));

    console.log(`✅ Fetched ${usersWithOrders.length} users`);

    return NextResponse.json({
      success: true,
      users: usersWithOrders,
    });

  } catch (error) {
    console.error("❌ Error fetching users:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}