import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    // ✅ Lazy load semua dependency
    const [{ prisma }, { getServerSession }, { authOptions }] =
      await Promise.all([
        import("@/lib/prisma"),
        import("next-auth"),
        import("@/lib/auth"),
      ]);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: user
        ? {
            ...user,
            createdAt: user.createdAt.toISOString(),
          }
        : null,
    });

  } catch (error) {
    console.error("PROFILE API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}