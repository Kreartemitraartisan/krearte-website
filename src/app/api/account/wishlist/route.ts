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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get wishlist (assuming you have Wishlist model)
    // Atau dari user.wishlistIds jika pakai field array
    const wishlistItems = await prisma.product.findMany({
      where: {
        id: {
          in: user.wishlistIds || [], // Adjust sesuai schema kamu
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        category: true,
        images: true,
      },
    });

    const items = wishlistItems.map((product) => ({
      id: product.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images?.[0] || "",
      price: product.price,
      category: product.category,
    }));

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}