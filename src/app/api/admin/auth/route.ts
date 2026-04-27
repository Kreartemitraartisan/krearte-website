import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // ✅ Lazy import (INI KUNCI UTAMA)
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to verify admin" },
      { status: 500 }
    );
  }
}