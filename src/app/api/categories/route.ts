// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionType = searchParams.get('collectionType');
    const parentId = searchParams.get('parentId');

    const supabase = createAdminClient();

    // ✅ STEP 1: Fetch categories dengan error handling yang robust
    console.log('🔍 Fetching categories with filters:', { collectionType, parentId });

    let categoryQuery = supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (collectionType) {
      categoryQuery = categoryQuery.eq('collection_type', collectionType);
    }

    // Handle parentId filtering (null, empty string, or valid ID)
    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        categoryQuery = categoryQuery.is('parent_id', null);
      } else {
        categoryQuery = categoryQuery.eq('parent_id', parentId);
      }
    }

    categoryQuery = categoryQuery.order('sort_order', { ascending: true });

    const { data: categories, error: categoriesError } = await categoryQuery;

    // ✅ Handle error: Jika tabel tidak ada atau query gagal, return empty array (bukan 500)
    if (categoriesError) {
      console.error('⚠️ Supabase categories query error (non-critical):', categoriesError);
      
      // Jika error karena tabel tidak ditemukan, return empty agar frontend tidak crash
      if (categoriesError.code === '42P01') { // PostgreSQL: relation does not exist
        console.warn('⚠️ Table "categories" not found. Returning empty list.');
        return NextResponse.json({
          success: true,
          categories: [],
          count: 0,
          message: 'Categories table not configured yet'
        });
      }
      
      // Untuk error lain, tetap return empty tapi log detailnya
      return NextResponse.json({
        success: true,
        categories: [],
        count: 0
      });
    }

    // ✅ STEP 2: Fetch products (TANPA filter is_active)
    console.log('🔍 Fetching products for price calculation...');
    
    let productsQuery = supabase
      .from('Product')
      .select('id, slug, name, price, category_slug, "collectionType"');

    if (collectionType) {
      productsQuery = productsQuery.eq('collectionType', collectionType);
    }

    const { data: allProducts, error: productsError } = await productsQuery;

    if (productsError) {
      console.error('⚠️ Supabase products query warning:', productsError);
      // Lanjutkan saja dengan products kosong, kategori tetap bisa tampil
    }

    // ✅ STEP 3: Group products by category_slug
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

    // ✅ STEP 4: Calculate price range per category
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
    // ✅ FINAL SAFETY NET: Catch semua error tak terduga
    console.error('❌ CRITICAL: Unhandled error in categories API:', error);
    
    // Return success: true dengan data kosong agar frontend TETAP BISA RENDER
    // Jangan return 500 kecuali benar-benar critical
    return NextResponse.json({
      success: true, // ✅ Ubah ke true supaya frontend tidak menampilkan error UI
      categories: [],
      count: 0,
      message: 'Categories loaded with fallback data'
    }, { status: 200 }); // ✅ Status 200, bukan 500
  }
}