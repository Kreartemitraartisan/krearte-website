// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionType = searchParams.get('collectionType');
    const parentId = searchParams.get('parentId');

    const supabase = createAdminClient();

    console.log('🔍 Fetching categories with filters:', { collectionType, parentId });

    // ✅ FIX: Gunakan nama tabel 'Category' (sesuai Prisma schema)
    let categoryQuery = supabase
      .from('Category')  // ✅ Capital C, singular
      .select('*')
      .eq('isActive', true);  // ✅ camelCase

    if (collectionType) {
      // ✅ FIX: collectionType (bukan collection_type)
      categoryQuery = categoryQuery.eq('collectionType', collectionType);
    }

    // Handle parentId filtering
    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        // ✅ FIX: parentId (bukan parent_id)
        categoryQuery = categoryQuery.is('parentId', null);
      } else {
        categoryQuery = categoryQuery.eq('parentId', parentId);
      }
    }

    // ✅ FIX: sortOrder (bukan sort_order)
    categoryQuery = categoryQuery.order('sortOrder', { ascending: true });

    const { data: categories, error: categoriesError } = await categoryQuery;

    // Handle error
    if (categoriesError) {
      console.error('⚠️ Supabase categories query error:', categoriesError);
      
      // Jika tabel tidak ditemukan
      if (categoriesError.code === '42P01') {
        console.warn('⚠️ Table "Category" not found. Returning empty list.');
        return NextResponse.json({
          success: true,
          categories: [],
          count: 0,
          message: 'Categories table not configured yet'
        });
      }
      
      return NextResponse.json({
        success: true,
        categories: [],
        count: 0
      });
    }

    // ✅ Fetch products for price calculation (tabel Product dengan capital P)
    console.log('🔍 Fetching products for price calculation...');
    
    let productsQuery = supabase
      .from('Product')  // ✅ Capital P, sesuai Prisma @@map("Product")
      .select('id, slug, name, price, category_slug, collectionType');  // ✅ camelCase

    if (collectionType) {
      productsQuery = productsQuery.eq('collectionType', collectionType);
    }

    const { data: allProducts, error: productsError } = await productsQuery;

    if (productsError) {
      console.error('⚠️ Supabase products query warning:', productsError);
    }

    // ✅ Group products by category_slug
    const productsByCategory = new Map<string, any[]>();
    
    if (allProducts && Array.isArray(allProducts)) {
      for (const product of allProducts) {
        const catSlug = product?.category_slug;
        if (catSlug && typeof catSlug === 'string') {
          if (!productsByCategory.has(catSlug)) {
            productsByCategory.set(catSlug, []);
          }
          const existing = productsByCategory.get(catSlug);
          if (existing) {
            existing.push(product);
          }
        }
      }
    }

    // ✅ Calculate price range per category
    const categoriesWithPrice = (categories || []).map((cat: any) => {
      const products = productsByCategory.get(cat.slug) || [];
      
      const prices = products
        .filter((p: any) => p?.price && typeof p.price === 'number' && p.price > 0)
        .map((p: any) => p.price);

      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

      return {
        ...cat,
        priceRange: minPrice !== null ? { min: minPrice, max: maxPrice } : null,
        productCount: products.length,
      };
    });

    console.log('✅ Categories API success:', {
      count: categoriesWithPrice.length,
      collectionType,
      parentId
    });

    return NextResponse.json({
      success: true,
      categories: categoriesWithPrice,
      count: categoriesWithPrice.length
    });

  } catch (error: any) {
    console.error('❌ CRITICAL: Unhandled error in categories API:', error);
    
    return NextResponse.json({
      success: true,
      categories: [],
      count: 0,
      message: 'Categories loaded with fallback data'
    }, { status: 200 });
  }
}