import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch products (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const category = searchParams.get('category');
    const collectionType = searchParams.get('collectionType');
    const slug = searchParams.get('slug');

    // ✅ Build where clause dengan case-insensitive
    const where: any = {};
    
    if (category) {
      where.category = {
        equals: category.toLowerCase(),
        mode: 'insensitive'
      };
    }
    
    if (collectionType) {
      where.collectionType = {
        equals: collectionType.toLowerCase(),
        mode: 'insensitive'
      };
    }
    
    if (slug) {
      where.slug = slug;
    }

    // ✅ Fetch products from database
    const products = await prisma.product.findMany({
      where,
      include: {
        sizes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    // ✅ Calculate price range from materials (EXCLUDE services/jasa)
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        if (product.availableMaterialIds && product.availableMaterialIds.length > 0) {
          // ✅ Fetch materials with category & name untuk filter services
          const materials = await prisma.material.findMany({
            where: {
              id: { in: product.availableMaterialIds },
            },
            select: { 
              pricePerM2: true,
              category: true,  // ✅ Tambah category untuk filter
              name: true,      // ✅ Tambah name untuk filter
              waste: true,     // ✅ Tambah waste untuk accurate price
            },
          });

          // ✅ Filter: Exclude services/add-ons from price calculation
          const actualMaterials = materials.filter(m => {
            const cat = (m.category || '').toLowerCase();
            const name = (m.name || '').toLowerCase();
            
            // Exclude based on category
            if (cat === 'service') return false;
            
            // Exclude based on name keywords
            if (name.includes('jasa')) return false;
            if (name.includes('design/re-draw')) return false;
            if (name.startsWith('jasa print')) return false;
            if (name.includes('print -')) return false;
            
            return true;
          });

          // ✅ Calculate price range from actual materials only (exclude services)
          if (actualMaterials.length > 0) {
            const prices = actualMaterials.map(m => m.pricePerM2 + (m.waste || 0));
            return {
              ...product,
              price: Math.min(...prices),  // Base price = min material price
              priceRange: {
                min: Math.min(...prices),
                max: Math.max(...prices),
              },
              hasMaterialPrices: true,
            };
          }
        }
        
        // Fallback for products without materials or no actual materials found
        return {
          ...product,
          priceRange: { min: product.price || 0, max: product.price || 0 },
          hasMaterialPrices: false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      products: productsWithPrices,
      count: productsWithPrices.length,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch products" 
      },
      { status: 500 }
    );
  }
}

// POST - Create new product (Admin only)
export async function POST(request: Request) {
  try {
    // ⚠️ TODO: Add admin authentication check here
    
    const body = await request.json();
    
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category,
        price: body.price,
        description: body.description,
        images: body.images || [],
        availableMaterialIds: body.availableMaterialIds || [],
        recommendedMaterialIds: body.recommendedMaterialIds || [],
        collectionType: body.collectionType,
        is25DEligible: body.is25DEligible,
        sizes: {
          create: body.sizes?.map((size: any) => ({
            label: size.label,
            price: size.price,
            stock: size.stock || 0,
          })) || [],
        },
      },
      include: { sizes: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}