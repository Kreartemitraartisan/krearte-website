// src/app/api/admin/users/role/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function PATCH(request: NextRequest) {
  try {
    // ✅ Lazy import (ANTI BUILD ERROR)
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import(
      "@/app/api/auth/[...nextauth]/route"
    );

    const session = await getServerSession(authOptions);

    // 🔐 Authorization check
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    // ✅ Validation
    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validRoles = ["customer", "designer", "reseller", "admin"];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // ✅ Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error("❌ Error updating user role:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update user role" },
      { status: 500 }
    );
  }
}