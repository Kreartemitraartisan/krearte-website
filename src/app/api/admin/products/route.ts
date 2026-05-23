import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ✅ Helper: Calculate min price from materials
async function calculateMinPrice(materialIds: string[]): Promise<number> {
  if (!materialIds || materialIds.length === 0) return 0;

  const materials = await prisma.material.findMany({
    where: {
      id: { in: materialIds },
    },
    select: {
      pricePerM2: true,
      designerPricePerM2: true,
      resellerPricePerM2: true,
    },
  });

  // Collect all valid prices
  const allPrices = materials.flatMap(m => [
    m.pricePerM2,
    ...(m.designerPricePerM2 ? [m.designerPricePerM2] : []),
    ...(m.resellerPricePerM2 ? [m.resellerPricePerM2] : []),
  ]).filter((p): p is number => typeof p === 'number' && p > 0);

  return allPrices.length > 0 ? Math.min(...allPrices) : 0;
}

// GET - Fetch all products with price range
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sizes: true,
      },
    });

    // ✅ Fetch materials & calculate price range for each product
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        if (product.availableMaterialIds?.length > 0) {
          const materials = await prisma.material.findMany({
            where: {
              id: { in: product.availableMaterialIds },
            },
            select: {
              pricePerM2: true,
              designerPricePerM2: true,
              resellerPricePerM2: true,
            },
          });

          // Collect all prices
          const prices = materials.flatMap(m => [
            m.pricePerM2,
            ...(m.designerPricePerM2 ? [m.designerPricePerM2] : []),
            ...(m.resellerPricePerM2 ? [m.resellerPricePerM2] : []),
          ]).filter((p): p is number => typeof p === 'number' && p > 0);

          return {
            ...product,
            minPrice: prices.length > 0 ? Math.min(...prices) : product.price,
            maxPrice: prices.length > 0 ? Math.max(...prices) : product.price,
            hasMaterialPrices: prices.length > 0,
          };
        }

        return {
          ...product,
          minPrice: product.price,
          maxPrice: product.price,
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
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product with auto-set base price
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 Creating product:', body.name);

    // ✅ AUTO-SET base price from cheapest material
    let basePrice = Number(body.price) || 0;
    
    if (body.availableMaterialIds?.length > 0) {
      const minMaterialPrice = await calculateMinPrice(body.availableMaterialIds);
      if (minMaterialPrice > 0) {
        basePrice = minMaterialPrice;
        console.log(`💰 Auto-set base price to: Rp ${basePrice.toLocaleString('id-ID')} (from cheapest material)`);
      }
    }

    // Convert and validate fields
    const stock = Number(body.stock) || 0;

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category || "wallcovering",
        price: basePrice, // ✅ Auto-set from cheapest material
        stock: stock,
        description: body.description || null,
        
        // ✅ Array fields - langsung assign array
        images: Array.isArray(body.images) ? body.images : [],
        availableMaterialIds: Array.isArray(body.availableMaterialIds) ? body.availableMaterialIds : [],
        recommendedMaterialIds: Array.isArray(body.recommendedMaterialIds) ? body.recommendedMaterialIds : [],
        
        collectionType: body.collectionType || "wallcovering",
        is25DEligible: body.is25DEligible || false,
        
        // Handle sizes if provided
        ...(body.sizes && Array.isArray(body.sizes) && body.sizes.length > 0 ? {
          sizes: {
            create: body.sizes.map((size: any) => ({
              label: size.label,
              price: Number(size.price) || 0,
              stock: Number(size.stock) || 0,
            }))
          }
        } : {}),
      },
      include: {
        sizes: true,
      },
    });

    console.log('✅ Product created:', product.id);
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('❌ POST error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to create product", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update product with auto-set base price
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ Next.js 15+: params is a Promise
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 Updating product:', id);

    // ✅ AUTO-SET base price from cheapest material (if availableMaterialIds changed)
    let updateData: any = {
      name: body.name,
      slug: body.slug,
      category: body.category,
      stock: Number(body.stock),
      description: body.description,
      collectionType: body.collectionType,
      is25DEligible: body.is25DEligible,
    };

    // ✅ Only update array fields if they are provided AND are arrays
    if (Array.isArray(body.images)) {
      updateData.images = body.images;
    }
    if (Array.isArray(body.availableMaterialIds)) {
      updateData.availableMaterialIds = body.availableMaterialIds;
      
      // ✅ Auto-update price if materials changed
      const minMaterialPrice = await calculateMinPrice(body.availableMaterialIds);
      if (minMaterialPrice > 0) {
        updateData.price = minMaterialPrice;
        console.log(`💰 Auto-updated base price to: Rp ${minMaterialPrice.toLocaleString('id-ID')}`);
      }
    }
    if (Array.isArray(body.recommendedMaterialIds)) {
      updateData.recommendedMaterialIds = body.recommendedMaterialIds;
    }

    // Handle sizes update if provided
    if (body.sizes && Array.isArray(body.sizes)) {
      updateData.sizes = {
        deleteMany: {}, // Delete old sizes first
        create: body.sizes.map((size: any) => ({
          label: size.label,
          price: Number(size.price) || 0,
          stock: Number(size.stock) || 0,
        }))
      };
    }

    // ✅ Only update price if explicitly provided (and not auto-set from materials)
    if (body.price !== undefined && !updateData.price) {
      updateData.price = Number(body.price);
    }

    console.log('📦 Update data:', updateData);

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        sizes: true,
      },
    });

    console.log('✅ Product updated:', product.id);
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('❌ PUT error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to update product", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ Next.js 15+: params is a Promise
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('🗑️ Deleting product:', id);

    await prisma.product.delete({
      where: { id },
    });

    console.log('✅ Product deleted:', id);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error('❌ DELETE error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product", details: (error as Error).message },
      { status: 500 }
    );
  }
}