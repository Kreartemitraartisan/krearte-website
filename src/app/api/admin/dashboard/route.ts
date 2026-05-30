// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ✅ HELPER: Check if material is physical (sama seperti di /api/admin/products)
function isPhysicalMaterial(material: any): boolean {
  const category = (material.category || "").toLowerCase();
  const name = (material.name || "").toLowerCase();
  const price = Number(material.pricePerM2) || 0;

  const excludedKeywords = [
    "service", "add-on", "addon", "jasa", 
    "print", "design", "redesign", "sample",
    "custom", "fee", "biaya"
  ];

  const hasExcludedKeyword = excludedKeywords.some(keyword => 
    category.includes(keyword) || name.includes(keyword)
  );

  const MIN_MATERIAL_PRICE = 100000;
  
  return price >= MIN_MATERIAL_PRICE && !hasExcludedKeyword;
}

// ✅ HELPER: Calculate price range for a product
async function calculateProductPriceRange(product: any) {
  try {
    const materialIds = product.availableMaterialIds || [];

    if (!materialIds || materialIds.length === 0) {
      return { min: product.price || 0, max: product.price || 0 };
    }

    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true, category: true, pricePerM2: true, waste: true },
    });

    const physicalMaterials = materials.filter(isPhysicalMaterial);

    if (physicalMaterials.length === 0) {
      return { min: product.price || 0, max: product.price || 0 };
    }

    const prices = physicalMaterials.map((m) => {
      const basePrice = Number(m.pricePerM2) || 0;
      const wasteCost = Number(m.waste) || 0;
      return basePrice + wasteCost;
    });

    return {
      min: Math.round(Math.min(...prices)),
      max: Math.round(Math.max(...prices)),
    };
  } catch (err) {
    console.error(`[Dashboard] Error calculating price for ${product.id}:`, err);
    return { min: product.price || 0, max: product.price || 0 };
  }
}

export async function GET() {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Fetch basic stats in parallel
    const [totalProducts, totalOrders, totalRevenue, totalCustomers] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "paid" } }),
      prisma.user.count({ where: { role: "customer" } }),
    ]);

    // ✅ Fetch recent products WITH priceRange calculation
    const recentProductsRaw = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        images: true,
        createdAt: true,
        availableMaterialIds: true, // ✅ Needed for price calculation
      },
    });

    // ✅ Calculate priceRange for each recent product
    const recentProducts = await Promise.all(
      recentProductsRaw.map(async (product) => {
        const priceRange = await calculateProductPriceRange(product);
        return {
          ...product,
          priceRange,
          displayPrice: priceRange.min > 0 ? priceRange.min : product.price,
        };
      })
    );

    // Fetch recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: { take: 2, select: { name: true, quantity: true, price: true } },
        user: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalCustomers,
      },
      recentProducts, // ✅ Now includes priceRange
      recentOrders,
    });

  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}