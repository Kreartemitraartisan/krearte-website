import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

// ✅ 1. Import authOptions dari file terpisah (tanpa special chars)
// Pindahkan authOptions ke: lib/auth.ts atau lib/next-auth.ts
import { authOptions } from "@/lib/auth";

// ✅ 2. Singleton pattern untuk PrismaClient (mencegah multiple connections)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // ✅ 3. Check user.id (bukan email) untuk konsistensi
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
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

    // ✅ 4. Pastikan session.user.id ada sebelum compare
    if (!session.user.id || order.userId !== session.user.id) {
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
        items: order.items.map((item) => ({
          ...item,
          productName: item.product?.name || "Unknown Product",
          productImage: item.product?.images?.[0] || "",
        })),
      },
    });
    
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order detail" },
      { status: 500 }
    );
  }
  // ✅ 5. Hapus prisma.$disconnect() - tidak diperlukan di API routes Next.js
}