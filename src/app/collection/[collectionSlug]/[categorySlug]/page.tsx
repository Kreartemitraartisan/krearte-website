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
  availableMaterialIds: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collection_type: string;
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
        // Fetch category
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', categorySlug)
          .eq('collection_type', collectionSlug)
          .eq('is_active', true)
          .single();

        if (categoryData) {
          setCategory(categoryData);
        }

        // Fetch products WITH availableMaterialIds
        const { data: productsData } = await supabase
          .from('Product')
          .select('id, name, slug, description, price, images, category_slug, availableMaterialIds')
          .ilike('category_slug', categorySlug)
          .order('createdAt', { ascending: false });

        if (productsData && productsData.length > 0) {
          // ✅ Fetch materials untuk setiap product
          const productsWithPrices = await Promise.all(
            productsData.map(async (product) => {
              const materialIds = product.availableMaterialIds || [];
              
              if (materialIds.length > 0) {
                let materials: MaterialPrice[] = [];
                
                // Try 1: Material table with pricePerM2 (camelCase)
                let result = await supabase
                  .from('Material')
                  .select('id, name, pricePerM2')
                  .in('id', materialIds);
                
                if (result.data && result.data.length > 0) {
                  materials = result.data as MaterialPrice[];
                } else {
                  // Try 2: Materials table (plural) with pricePerM2
                  result = await supabase
                    .from('Materials')
                    .select('id, name, pricePerM2')
                    .in('id', materialIds);
                  
                  if (result.data && result.data.length > 0) {
                    materials = result.data as MaterialPrice[];
                  } else {
                    // Try 3: Material table with price_per_m2 (snake_case)
                    const snakeCaseResult = await supabase
                      .from('Material')
                      .select('id, name, price_per_m2')
                      .in('id', materialIds);
                    
                    if (snakeCaseResult.data && snakeCaseResult.data.length > 0) {
                      // Normalize snake_case to camelCase
                      materials = snakeCaseResult.data.map((m: any) => ({
                        id: m.id,
                        name: m.name,
                        pricePerM2: m.price_per_m2
                      }));
                    }
                  }
                }

                // Hitung price range dari materials
                const prices = materials
                  .map(m => m.pricePerM2)
                  .filter((p): p is number => typeof p === 'number' && p > 0);

                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                return {
                  ...product,
                  priceRange: prices.length > 0 ? { min: minPrice, max: maxPrice } : undefined
                };
              }

              return product;
            })
          );

          setProducts(productsWithPrices);
        }
      } catch (error) {
        console.error("❌ Error fetching ", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-krearte-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <p className="text-krearte-gray-500">Category not found</p>
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
          <Link href={`/collection/${collectionSlug}`} className="hover:text-krearte-black">
            {collectionSlug === 'wallcovering' ? 'Wallcovering' : collectionSlug}
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
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
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
            <p className="text-krearte-gray-500 font-light text-lg mb-4">No products in this category yet.</p>
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
                    className="group"
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