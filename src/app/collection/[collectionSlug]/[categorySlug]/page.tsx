// src/app/collection/[collectionSlug]/[categorySlug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[] | null;
  category_slug: string | null;
  collectionType: string; // ✅ Tambahkan field ini
  availableMaterialIds: string[];
  priceRange?: { min: number; max: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collectionType: string; // ✅ camelCase
  isActive: boolean; // ✅ camelCase
}

interface MaterialPrice {
  id: string;
  name: string;
  pricePerM2: number;
}

export default function CategoryPage() {
  const params = useParams();
  const collectionSlug = params.collectionSlug as string;
  const categorySlug = params.categorySlug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔍 Fetching category:', { collectionSlug, categorySlug });

        // ✅ Fetch category - gunakan nama tabel & kolom yang benar (camelCase)
        const { data: categoryData, error: catError } = await supabase
          .from('Category')  // ✅ Capital C, singular (sesuai Prisma)
          .select('*')
          .eq('slug', categorySlug)
          .eq('collectionType', collectionSlug)  // ✅ camelCase
          .eq('isActive', true)  // ✅ camelCase
          .single();

        if (catError) {
          console.error('❌ Category fetch error:', catError);
        }

        if (categoryData) {
          console.log('✅ Category found:', categoryData.name);
          setCategory(categoryData);
        } else {
          console.warn('⚠️ Category not found in database');
        }

        // ✅ Fetch products - filter BOTH collectionType AND category_slug
        console.log('🔍 Fetching products for:', { collectionType: collectionSlug, category_slug: categorySlug });
        
        const { data: productsData, error: prodError } = await supabase
          .from('Product')  // ✅ Capital P (sesuai Prisma @@map("Product"))
          .select('id, name, slug, description, price, images, category_slug, collectionType, availableMaterialIds')
          .eq('collectionType', collectionSlug)  // ✅ Filter collectionType
          .eq('category_slug', categorySlug)     // ✅ Exact match (bukan ilike)
          .order('createdAt', { ascending: false });

        if (prodError) {
          console.error('❌ Products fetch error:', prodError);
        }

        console.log('📦 Products found:', productsData?.length || 0);

        if (productsData && productsData.length > 0) {
          // ✅ Fetch materials untuk price range
          const productsWithPrices = await Promise.all(
            productsData.map(async (product) => {
              const materialIds = product.availableMaterialIds || [];
              
              if (materialIds.length > 0) {
                // ✅ Fetch materials dengan nama tabel & kolom yang benar
                const { data: materialsData } = await supabase
                  .from('Material')  // ✅ Capital M, singular
                  .select('id, name, pricePerM2')  // ✅ camelCase
                  .in('id', materialIds);

                if (materialsData && materialsData.length > 0) {
                  const prices = materialsData
                    .map(m => m.pricePerM2)
                    .filter((p): p is number => typeof p === 'number' && p > 0);

                  if (prices.length > 0) {
                    return {
                      ...product,
                      priceRange: {
                        min: Math.min(...prices),
                        max: Math.max(...prices)
                      }
                    };
                  }
                }
              }
              return product;
            })
          );

          setProducts(productsWithPrices);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (collectionSlug && categorySlug) {
      fetchData();
    }
  }, [collectionSlug, categorySlug]);

  // ... (sisanya: carousel, grid, dll tetap sama) ...

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-krearte-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-krearte-cream flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-light mb-2">Category Not Found</h2>
        <p className="text-krearte-gray-500 mb-6">
          The category "{categorySlug}" doesn't exist in our {collectionSlug} collection.
        </p>
        <Link 
          href={`/collection/${collectionSlug}`} 
          className="px-6 py-2 bg-krearte-black text-white rounded hover:bg-krearte-charcoal transition"
        >
          ← Back to {collectionSlug}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* ... (UI carousel & grid tetap sama) ... */}
      {/* Pastikan di dalam mapping products, gunakan priceRange yang sudah dihitung */}
    </div>
  );
}