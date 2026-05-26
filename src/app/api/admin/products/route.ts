// /app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ HELPER: Check if material is physical (with debug logs)
// =========================
function isPhysicalMaterial(material: any): boolean {
  const category = (material.category || "").toLowerCase();
  const name = (material.name || "").toLowerCase();
  const price = material.pricePerM2 || 0;

  // ❌ Daftar kata yang HARUS di-exclude
  const excludedKeywords = [
    "service", "add-on", "addon", "jasa", 
    "print", "design", "redesign", "sample",
    "custom", "fee", "biaya", "ongkir"
  ];

  // Check jika ada keyword yang di-exclude
  const hasExcludedKeyword = excludedKeywords.some(keyword => 
    category.includes(keyword) || name.includes(keyword)
  );

  // Minimum price threshold (material termurah Rp 300.000)
  const MIN_MATERIAL_PRICE = 300000;
  const hasValidPrice = price >= MIN_MATERIAL_PRICE;

  // ✅ LOG untuk debugging
  console.log(` Material Check: "${material.name}"`);
  console.log(`   - Category: "${category}"`);
  console.log(`   - Price: Rp ${price.toLocaleString('id-ID')}`);
  console.log(`   - Has excluded keyword: ${hasExcludedKeyword}`);
  console.log(`   - Has valid price (>= Rp 300.000): ${hasValidPrice}`);
  console.log(`   - Result: ${hasValidPrice && !hasExcludedKeyword ? '✅ INCLUDE' : '❌ EXCLUDE'}`);
  console.log('---');

  return hasValidPrice && !hasExcludedKeyword;
}

// =========================
// ✅ GET - Fetch all products WITH detailed logging
// =========================
export async function GET() {
  try {
    console.log('🚀 FETCHING ALL PRODUCTS...');
    
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { sizes: true },
    });

    console.log(`📦 Found ${products.length} products`);
    console.log('===========================================');

    const productsWithPriceRange = await Promise.all(
      products.map(async (product) => {
        try {
          console.log(`\n🔍 Processing product: "${product.name}"`);
          console.log(`   - ID: ${product.id}`);
          console.log(`   - Base Price: Rp ${product.price?.toLocaleString('id-ID')}`);
          
          const materialIds = product.availableMaterialIds || [];

          if (!materialIds || materialIds.length === 0) {
            console.log(`   ⚠️ No materials found, using base price`);
            return {
              ...product,
              priceRange: { min: product.price || 0, max: product.price || 0 },
              physicalMaterialCount: 0,
            };
          }

          console.log(`   📦 Material IDs: ${materialIds.length} materials`);

          // Fetch materials
          const materials = await prisma.material.findMany({
            where: { id: { in: materialIds } },
            select: { 
              id: true, 
              name: true, 
              category: true, 
              pricePerM2: true, 
              waste: true 
            },
          });

          console.log(`   ✅ Fetched ${materials.length} materials from database`);
          console.log('   Materials list:');
          materials.forEach(m => {
            console.log(`     • ${m.name} (Rp ${(m.pricePerM2 || 0).toLocaleString('id-ID')})`);
          });

          // Filter physical materials
          console.log('\n   🔍 Filtering physical materials...');
          const physicalMaterials = materials.filter(isPhysicalMaterial);

          console.log(`\n   📊 Summary for "${product.name}":`);
          console.log(`      Total materials: ${materials.length}`);
          console.log(`      Physical materials: ${physicalMaterials.length}`);
          console.log(`      Excluded (services/add-ons): ${materials.length - physicalMaterials.length}`);

          if (physicalMaterials.length === 0) {
            console.log(`   ⚠️ No physical materials found, using base price`);
            return {
              ...product,
              priceRange: { min: product.price || 0, max: product.price || 0 },
              physicalMaterialCount: 0,
            };
          }

          // Calculate price range
          const prices = physicalMaterials.map((m) => {
            const basePrice = m.pricePerM2 || 0;
            const wasteCost = m.waste || 0;
            const total = basePrice + wasteCost;
            console.log(`   💰 ${m.name}: Rp ${basePrice.toLocaleString()} + Rp ${wasteCost.toLocaleString()} (waste) = Rp ${total.toLocaleString()}`);
            return total;
          });

          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          console.log(`\n   ✅ FINAL PRICE RANGE: Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`);
          console.log('===========================================\n');

          return {
            ...product,
            priceRange: {
              min: Math.round(minPrice),
              max: Math.round(maxPrice),
            },
            physicalMaterialCount: physicalMaterials.length,
            totalMaterialCount: materials.length,
          };
        } catch (err) {
          console.error(`❌ Error calculating price for product ${product.id}:`, err);
          return {
            ...product,
            priceRange: { min: product.price || 0, max: product.price || 0 },
          };
        }
      })
    );

    console.log(`\n🎉 Products API Response:`);
    console.log(`   - Total products: ${productsWithPriceRange.length}`);
    console.log(`   - Sample price ranges:`);
    productsWithPriceRange.slice(0, 3).forEach(p => {
      console.log(`     • ${p.name}: Rp ${p.priceRange?.min?.toLocaleString()} - Rp ${p.priceRange?.max?.toLocaleString()}`);
    });

    return NextResponse.json({
      success: true,
      products: productsWithPriceRange,
      count: productsWithPriceRange.length,
    });
  } catch (error) {
    console.error("❌ GET PRODUCTS ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST - Create product
// =========================
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new product...');
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('❌ Unauthorized access');
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      console.log('❌ Forbidden - not admin');
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    if (!body.name?.trim() || !body.slug?.trim() || body.price === undefined || body.price === null) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, slug, price" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        slug: body.slug.trim(),
        category: body.category || "wallcovering",
        category_slug: body.category_slug || null,
        price: Number(body.price) || 0,
        stock: Number(body.stock) || 0,
        description: body.description?.trim() || null,
        images: Array.isArray(body.images) ? body.images.filter((img: string) => img?.trim()) : [],
        collectionType: body.collectionType || "wallcovering",
        is25DEligible: Boolean(body.is25DEligible),
        availableMaterialIds: Array.isArray(body.availableMaterialIds) ? body.availableMaterialIds : [],
        recommendedMaterialIds: Array.isArray(body.recommendedMaterialIds) ? body.recommendedMaterialIds : [],
      },
    });

    console.log(`✅ Product created successfully: ${product.id}`);

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("❌ CREATE PRODUCT ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}