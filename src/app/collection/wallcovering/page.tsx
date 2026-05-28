// app/collection/wallcovering/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Filter, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductSize {
  id: string;
  label: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  category_slug?: string | null;
  price: number;
  images: string[] | null;
  sizes: ProductSize[];
  collectionType: string;
  // ✅ TAMBAHKAN: priceRange dari API admin
  priceRange?: { min: number; max: number } | null;
  // Legacy fields (untuk backward compatibility)
  minPrice?: number;
  maxPrice?: number;
  hasMaterialPrices?: boolean;
  availableMaterialIds?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collection_type: string;
}

const FALLBACK_CATEGORIES = [
  { id: "1", name: "Flower & Leaves", slug: "flower-leaves" },
  { id: "2", name: "Animals", slug: "animals" },
  { id: "3", name: "Chinoiserie", slug: "chinoiserie" },
  { id: "4", name: "Lotus", slug: "lotus" },
  { id: "5", name: "Jolly Wolly", slug: "jolly-wolly" },
  { id: "6", name: "Marble", slug: "marble" },
  { id: "7", name: "Abstract", slug: "abstract" },
  { id: "8", name: "Geometric", slug: "geometric" },
  { id: "9", name: "Scenery", slug: "scenery" },
  { id: "10", name: "Toile de Jouy", slug: "toile-de-jouy" },
  { id: "11", name: "Tropical", slug: "tropical" },
  { id: "12", name: "Zen", slug: "zen" },
  { id: "13", name: "Du Pavillon", slug: "du-pavillon" },
];

export default function WallcoveringCollectionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // ✅ Fetch products dari API ADMIN (yang sudah return priceRange)
  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('🔍 Fetching wallcovering products...');
        
        // ✅ Gunakan API admin yang sudah calculate priceRange
        const response = await fetch("/api/admin/products");
        const result = await response.json();
        
        console.log('📦 Products API response:', result);
        
        if (result.success) {
          // ✅ Filter hanya produk wallcovering
          const wallcoveringProducts = (result.products || []).filter((p: Product) => 
            p.collectionType?.toLowerCase() === 'wallcovering'
          );
          
          console.log(`✅ Loaded ${wallcoveringProducts.length} wallcovering products`);
          setProducts(wallcoveringProducts);
        }
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories?collectionType=wallcovering&parentId=null');
        const result = await response.json();
        
        if (result.success && result.categories && result.categories.length > 0) {
          setCategories(result.categories);
        } else {
          setCategories(FALLBACK_CATEGORIES as Category[]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(FALLBACK_CATEGORIES as Category[]);
      }
    }

    fetchCategories();
  }, []);

  // Helper to get product count per category
  const getProductCount = (categorySlug: string) => {
    return products.filter(p => 
      p.category_slug === categorySlug
    ).length;
  };

  const filteredProducts = products.filter(product => {
    if (filter === "all") return true;
    if (filter === "video") return product.images?.some(img => img?.endsWith('.mp4') || img?.endsWith('.webm'));
    if (filter === "image") return !product.images?.some(img => img?.endsWith('.mp4') || img?.endsWith('.webm'));
    // ✅ Filter by category_slug (bukan category)
    return product.category_slug === filter;
  });

  // ✅ ROBUST getPrimaryMedia function
  const getPrimaryMedia = (images: any) => {
    if (!images) return null;

    let imgArray: string[] = [];
    
    if (typeof images === 'string') {
      try {
        imgArray = JSON.parse(images);
      } catch {
        imgArray = [images];
      }
    } else if (Array.isArray(images)) {
      imgArray = images;
    } else {
      return null;
    }

    if (!imgArray || imgArray.length === 0) return null;

    const validImages = imgArray.filter(img => typeof img === 'string' && img.trim() !== '');
    if (validImages.length === 0) return null;

    const firstVideo = validImages.find(img => 
      img.endsWith('.mp4') || img.endsWith('.webm') || img.endsWith('.ogg')
    );
    
    const firstImage = validImages.find(img => 
      !img.endsWith('.mp4') && !img.endsWith('.webm') && !img.endsWith('.ogg')
    );

    return {
      type: firstVideo ? 'video' : 'image',
      src: firstVideo || firstImage || null
    };
  };

  // ✅ HELPER: Format price dengan priority: priceRange > minPrice > base price
  const formatProductPrice = (product: Product) => {
    // ✅ Priority 1: priceRange dari API admin
    if (product.priceRange && product.priceRange.min > 0) {
      const min = formatCurrency(product.priceRange.min);
      const max = product.priceRange.max !== product.priceRange.min 
        ? ` - ${formatCurrency(product.priceRange.max)}` 
        : '';
      return `${min}${max} <span class="text-sm text-krearte-gray-500 font-light">/m²</span>`;
    }
    
    // Priority 2: legacy minPrice/maxPrice
    if (product.hasMaterialPrices && product.minPrice !== undefined) {
      const min = formatCurrency(product.minPrice);
      const max = product.maxPrice !== undefined && product.maxPrice !== product.minPrice
        ? ` - ${formatCurrency(product.maxPrice)}`
        : '';
      return `${min}${max} <span class="text-sm text-krearte-gray-500 font-light">/m²</span>`;
    }
    
    // Fallback: base price
    return `${formatCurrency(product.price)} <span class="text-sm text-krearte-gray-500 font-light">/m²</span>`;
  };

  const handleFilterChange = (value: string) => {
    if (value !== "all" && value !== "video" && value !== "image") {
      window.location.href = `/collection/wallcovering/${value}`;
    } else {
      setFilter(value);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Header */}
      <div className="bg-krearte-white border-b border-krearte-gray-200">
        <div className="container mx-auto px-6 md:px-12 py-12">
          <h1 className="font-sans text-4xl md:text-5xl font-light mb-4">
            Wallcovering Collection
          </h1>
          <p className="text-krearte-gray-600 font-light max-w-2xl">
            Discover our curated selection of luxury wallpapers and wallcoverings, 
            crafted with premium materials and timeless designs.
          </p>
        </div>
      </div>

      {/* Filter & Products */}
      <div className="container mx-auto px-6 md:px-12 py-12">
        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-krearte-gray-600 font-light">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
          
          <div className="relative">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-krearte-gray-400" />
              
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 pr-10 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light bg-white appearance-none cursor-pointer hover:border-krearte-gray-300 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                }}
              >
                <option value="all">All Products</option>
                <option value="video">With Video</option>
                <option value="image">Image Only</option>
                
                {categories.length > 0 && (
                  <option disabled>──────────</option>
                )}
                
                {categories.map((category) => {
                  const count = getProductCount(category.slug);
                  return (
                    <option 
                      key={category.id} 
                      value={category.slug}
                    >
                      {category.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-krearte-gray-500 font-light">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const media = getPrimaryMedia(product.images);
              
              return (
                <div
                  key={product.id}
                  className="group bg-krearte-white rounded-lg border border-krearte-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="aspect-[4/3] bg-krearte-gray-100 overflow-hidden relative">
                      {media?.src && media?.type === 'video' ? (
                        <video
                          src={media.src}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : media?.src ? (
                        <img
                          src={media.src}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                          <span className="text-6xl font-light">{product.name?.charAt(0) || 'P'}</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-6">
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-sans text-lg font-normal mb-2 group-hover:underline decoration-krearte-gray-300 underline-offset-4">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {product.description && (
                      <p className="text-sm text-krearte-gray-500 font-light mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {/* ✅ PRICE DISPLAY - Pakai helper function */}
                      <p 
                        className="text-krearte-black font-normal"
                        dangerouslySetInnerHTML={{ __html: formatProductPrice(product) }}
                      />
                      
                      <Link
                        href={`/product/${product.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-krearte-black font-medium hover:text-krearte-gray-600 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}