import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = await context.params;

    // ✅ Lazy load SEMUA dependency berat
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("ORDER API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}