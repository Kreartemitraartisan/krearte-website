import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionType = searchParams.get('collectionType');
    const parentId = searchParams.get('parentId');

    console.log('📦 Fetching categories with params:', { 
      collectionType, 
      parentId 
    });

    const supabase = createAdminClient();

    let query = supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    // Filter by collection type if provided
    if (collectionType) {
      query = query.eq('collection_type', collectionType);
    }

    // Filter by parent_id (null untuk top-level categories)
    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }
    }

    // Order by sort_order
    query = query.order('sort_order', { ascending: true });

    const {  data: categories, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('✅ Categories fetched:', categories?.length || 0);

    return NextResponse.json({
      success: true,
      categories: categories || [],
      count: categories?.length || 0
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