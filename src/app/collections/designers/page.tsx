"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Filter, ShoppingCart, Sparkles } from "lucide-react";
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
  description: string;
  category: string;
  price: number;
  images: string[];
  sizes: ProductSize[];
  collectionType?: string;
  availableMaterialIds?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  // ✅ TAMBAHKAN INI untuk badge 2.5D
  is25DEligible?: boolean;
}

export default function DesignerCollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchProducts() {
      try {
        // ✅ Fetch dengan collectionType DAN category untuk fallback
        const response = await fetch("/api/products?collectionType=designer&category=designer");
        const result = await response.json();
        
        if (result.success) {
          // ✅ Filter yang lebih flexible - support multiple category naming
          const designerProducts = (result.products || []).filter((p: Product) => {
            const category = p.category?.toLowerCase() || '';
            const collectionType = p.collectionType?.toLowerCase() || '';
            
            // Match: collectionType = 'designer' OR category contains 'designer'
            return collectionType === 'designer' || 
                   category === 'designer' || 
                   category === 'designer collection' ||
                   category.includes('designer');
          });
          
          setProducts(designerProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    if (filter === "all") return true;
    if (filter === "metallic") return product.name.toLowerCase().includes('metallic');
    if (filter === "premium") return product.price >= 500000;
    if (filter === "video") return product.images?.some(img => img?.endsWith('.mp4') || img?.endsWith('.webm'));
    return true;
  });

  // ✅ Helper function to get primary media (video priority)
  const getPrimaryMedia = (images: string[] | undefined) => {
    if (!images || images.length === 0) return { type: null, src: null };
    
    // ✅ Prioritize video over images
    const firstVideo = images.find(img => img?.endsWith('.mp4') || img?.endsWith('.webm'));
    const firstImage = images.find(img => img && !img.endsWith('.mp4') && !img.endsWith('.webm'));
    
    return {
      type: firstVideo ? 'video' : firstImage ? 'image' : null,
      src: firstVideo || firstImage || null
    };
  };

  // ✅ Format price display with priceRange support
  const formatPriceDisplay = (product: Product) => {
    if (product.priceRange && product.priceRange.min !== product.priceRange.max) {
      return `${formatCurrency(product.priceRange.min)} - ${formatCurrency(product.priceRange.max)}`;
    }
    return formatCurrency(product.price);
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
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-krearte-black" />
            <h1 className="font-sans text-4xl md:text-5xl font-light">
              Designer Collections
            </h1>
          </div>
          <p className="text-krearte-gray-600 font-light max-w-2xl">
            Explore our exclusive designer collections featuring premium metallic finishes, 
            special effects, and limited edition patterns for discerning tastes.
          </p>
        </div>
      </div>

      {/* Filter & Products */}
      <div className="container mx-auto px-6 md:px-12 py-12">
        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-krearte-gray-600 font-light">
            {filteredProducts.length} collections
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-krearte-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light bg-white"
              >
                <option value="all">All Collections</option>
                <option value="metallic">Metallic</option>
                <option value="premium">Premium (Rp 500k+)</option>
                <option value="video">With Video</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-krearte-gray-500 font-light">No collections found</p>
            <Link
              href="/collection/wallcovering"
              className="inline-block mt-4 text-krearte-black font-medium border-b border-krearte-black pb-0.5"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const media = getPrimaryMedia(product.images);
              const isPremium = product.price >= 500000 || (product.priceRange?.max || 0) >= 500000;
              
              return (
                <div
                  key={product.id}
                  className="group bg-krearte-white rounded-lg border border-krearte-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Product Media - Video/Image */}
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="aspect-[4/3] bg-krearte-gray-100 overflow-hidden relative">
                      {media?.type === 'video' && media.src ? (
                        <video
                          src={media.src}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : media?.type === 'image' && media.src ? (
                        <img
                          src={media.src}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                          <span className="text-6xl font-light">{product.name?.charAt(0) || 'P'}</span>
                        </div>
                      )}
                      
                      {/* ✅ Badges - 2.5D Available instead of Video */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {isPremium && (
                          <span className="px-2 py-1 bg-krearte-black text-krearte-white text-xs rounded">
                            Premium
                          </span>
                        )}
                        {/* ✅ Badge 2.5D Available (berdasarkan is25DEligible) */}
                        {product.is25DEligible && (
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-krearte-white text-xs rounded flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            2.5D Available
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Product Info */}
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
                      <p className="text-krearte-black font-normal">
                        {formatPriceDisplay(product)}
                        <span className="text-sm text-krearte-gray-500 font-light">/m²</span>
                      </p>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/product/${product.slug}`;
                        }}
                        className="flex items-center gap-2 text-sm text-krearte-black font-medium hover:text-krearte-gray-600 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        View
                      </button>
                    </div>

                    {/* Sizes Info */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-krearte-gray-100">
                        <p className="text-xs text-krearte-gray-500 mb-2">Available sizes:</p>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.slice(0, 3).map((size) => (
                            <span
                              key={size.id}
                              className="text-xs px-2 py-1 bg-krearte-gray-100 text-krearte-gray-600 rounded"
                            >
                              {size.label}
                            </span>
                          ))}
                          {product.sizes.length > 3 && (
                            <span className="text-xs text-krearte-gray-400">
                              +{product.sizes.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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