import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionType = searchParams.get('collectionType');
    const parentId = searchParams.get('parentId');

    const supabase = createAdminClient();

    // ✅ STEP 1: Fetch categories
    let categoryQuery = supabase
      .from('categories')
      .select('*')
      .eq('is_active', true); // ✅ categories table punya is_active

    if (collectionType) {
      categoryQuery = categoryQuery.eq('collection_type', collectionType);
    }

    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        categoryQuery = categoryQuery.is('parent_id', null);
      } else {
        categoryQuery = categoryQuery.eq('parent_id', parentId);
      }
    }

    categoryQuery = categoryQuery.order('sort_order', { ascending: true });

    const { data: categories, error: categoriesError } = await categoryQuery;

    if (categoriesError) {
      console.error('Supabase categories error:', categoriesError);
      throw categoriesError;
    }

    // ✅ STEP 2: Fetch all products (TANPA filter is_active)
    let productsQuery = supabase
      .from('Product')
      .select('id, slug, name, price, category_slug, collectionType');

    // Filter by collectionType jika ada
    if (collectionType) {
      productsQuery = productsQuery.eq('collectionType', collectionType);
    }

    const { data: allProducts, error: productsError } = await productsQuery;

    if (productsError) {
      console.error('Supabase products error:', productsError);
    }

    // ✅ STEP 3: Group products by category_slug
    const productsByCategory = new Map<string, any[]>();
    
    if (allProducts) {
      for (const product of allProducts) {
        const catSlug = product.category_slug;
        if (catSlug) {
          if (!productsByCategory.has(catSlug)) {
            productsByCategory.set(catSlug, []);
          }
          productsByCategory.get(catSlug)!.push(product);
        }
      }
    }

    // ✅ STEP 4: Calculate price range per category
    const categoriesWithPrice = categories?.map((cat: any) => {
      const products = productsByCategory.get(cat.slug) || [];
      
      const prices = products
        .filter((p: any) => p.price > 0)
        .map((p: any) => p.price);

      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

      return {
        ...cat,
        priceRange: minPrice !== null ? { min: minPrice, max: maxPrice } : null,
        productCount: products.length,
      };
    });

    console.log('✅ Categories fetched:', categoriesWithPrice?.length || 0);

    return NextResponse.json({
      success: true,
      categories: categoriesWithPrice || [],
      count: categoriesWithPrice?.length || 0
    });
  } catch (error) {
    console.error('❌ Error in categories API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}