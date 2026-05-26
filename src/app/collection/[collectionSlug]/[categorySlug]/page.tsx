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
  collectionType: string;
  availableMaterialIds: string[];
  priceRange?: { min: number; max: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collectionType: string;
  isActive: boolean;
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
        console.log('🔍 Fetching data for:', { collectionSlug, categorySlug });

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
          console.log('✅ Products with prices calculated:', productsWithPrices.length);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setLoading(false);
        console.log('🏁 Loading finished');
      }
    }

    if (collectionSlug && categorySlug) {
      fetchData();
    }
  }, [collectionSlug, categorySlug]);

  // Auto-rotate carousel setiap 5 detik
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  // Helper: Get display price
  const getProductPrice = (product: Product) => {
    if (product.priceRange && product.priceRange.min > 0) {
      return product.priceRange;
    }
    return null;
  };

  // Helper: Cari video atau gambar utama
  const getMainMedia = (product: Product) => {
    const images = product.images || [];
    if (!Array.isArray(images) || images.length === 0) return null;
    
    const video = images.find((img: string) => 
      img.endsWith('.mp4') || img.endsWith('.webm')
    );
    
    const image = images.find((img: string) => 
      !img.endsWith('.mp4') && !img.endsWith('.webm')
    ) || images[0];

    return video || image;
  };

  // Helper: Cari JPG untuk grid
  const getJpgImage = (product: Product) => {
    const images = product.images || [];
    if (!Array.isArray(images) || images.length === 0) return null;
    
    return images.find((img: string) => 
      !img.endsWith('.mp4') && !img.endsWith('.webm')
    ) || images[0];
  };

  // ✅ Debug log sebelum render
  console.log('🎨 Rendering:', { loading, category: !!category, productsCount: products.length });

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
      {/* Breadcrumb */}
      <div className="container mx-auto px-6 md:px-12 py-6">
        <nav className="text-sm text-krearte-gray-600">
          <Link href="/" className="hover:text-krearte-black">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/collection/${collectionSlug}`} className="hover:text-krearte-black capitalize">
            {collectionSlug.replace('-', ' ')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-krearte-black font-medium">{category.name}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="container mx-auto px-6 md:px-12 py-4 md:py-6">
        <h1 className="font-sans text-3xl md:text-4xl font-light mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-krearte-gray-600 font-light text-base md:text-lg max-w-3xl">{category.description}</p>
        )}
      </div>

      {/* Carousel Section */}
      {products.length > 0 && (
        <div className="container mx-auto px-6 md:px-12 mb-12">
          <div 
            className="relative aspect-[16/9] bg-krearte-gray-100 rounded-lg overflow-hidden group"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {products.map((product, index) => {
              const media = getMainMedia(product);
              const isVideo = media?.endsWith('.mp4') || media?.endsWith('.webm');
              const priceRange = getProductPrice(product);
              
              return (
                <div
                  key={product.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <Link href={`/product/${product.slug}`} className="block w-full h-full">
                    {isVideo && media ? (
                      <video
                        src={media}
                        autoPlay={index === currentSlide}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : media ? (
                      <img
                        src={media}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-krearte-gray-200">
                        <span className="text-9xl font-light text-krearte-gray-400">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                      <h2 className="text-2xl md:text-3xl font-normal text-white mb-2">
                        {product.name}
                      </h2>
                      {priceRange ? (
                        <p className="text-white/90 font-light">
                          Start from {formatCurrency(priceRange.min)}
                          {priceRange.max !== priceRange.min && (
                            <span> - {formatCurrency(priceRange.max)}</span>
                          )}
                          <span className="text-sm">/m²</span>
                        </p>
                      ) : (
                        <p className="text-white/70 font-light text-sm">
                          Contact for pricing
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Navigation Arrows */}
            {products.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + products.length) % products.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-6 h-6 text-krearte-black" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % products.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-6 h-6 text-krearte-black" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {products.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="container mx-auto px-6 md:px-12 pb-20">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-krearte-gray-500 font-light text-lg mb-4">
              No products in this category yet.
            </p>
            <Link 
              href={`/collection/${collectionSlug}`} 
              className="text-krearte-black font-medium underline hover:text-krearte-gray-600"
            >
              ← Back to {collectionSlug} collection
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl md:text-2xl font-light text-krearte-black mb-8">
              All Products ({products.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {products.map((product) => {
                const jpgImage = getJpgImage(product);
                const priceRange = getProductPrice(product);

                return (
                  <Link 
                    key={product.id} 
                    href={`/product/${product.slug}`} 
                    className="group block"
                  >
                    <div className="aspect-square bg-krearte-gray-100 rounded-lg overflow-hidden mb-4">
                      {jpgImage ? (
                        <img 
                          src={jpgImage} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-krearte-gray-100 to-krearte-gray-200">
                          <span className="text-6xl font-light text-krearte-gray-400">
                            {product.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-sans text-lg md:text-xl font-normal text-krearte-black mb-2 group-hover:underline decoration-krearte-gray-300 underline-offset-4 transition-all">
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-sm text-krearte-gray-500 font-light line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    )}
                    
                    {priceRange ? (
                      <p className="text-krearte-black font-normal">
                        Start from {formatCurrency(priceRange.min)}
                        {priceRange.max !== priceRange.min && (
                          <span> - {formatCurrency(priceRange.max)}</span>
                        )}
                        <span className="text-sm text-krearte-gray-500 font-light">/m²</span>
                      </p>
                    ) : (
                      <p className="text-krearte-gray-400 text-sm">
                        Contact for pricing
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}