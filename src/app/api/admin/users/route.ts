import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // ✅ LAZY IMPORT (ANTI BUILD ERROR)
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");

    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
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
        orders: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      orders: u.orders.length,
    }));

    return NextResponse.json({
      success: true,
      users: formatted,
    });

  } catch (error) {
    console.error("❌ USERS ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}