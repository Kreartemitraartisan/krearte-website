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
  description: string;
  category: string;
  price: number;
  images: string[];
  sizes: ProductSize[];
  collectionType: string;
  // ✅ TAMBAHKAN PROPERTIES INI untuk price range dari materials
  minPrice?: number;
  maxPrice?: number;
  hasMaterialPrices?: boolean;
  availableMaterialIds?: string[];
}

export default function WallcoveringCollectionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products?category=wallcovering");
        const result = await response.json();
        
        if (result.success) {
          setProducts(result.products || []);
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
    if (filter === "video") return product.images.some(img => img.endsWith('.mp4') || img.endsWith('.webm'));
    if (filter === "image") return !product.images.some(img => img.endsWith('.mp4') || img.endsWith('.webm'));
    return true;
  });

  // ✅ Helper function to get primary media (video priority)
  const getPrimaryMedia = (images: string[]) => {
    if (!images || images.length === 0) return null;
    
    // ✅ Prioritize video over images
    const firstVideo = images.find(img => img.endsWith('.mp4') || img.endsWith('.webm'));
    const firstImage = images.find(img => !img.endsWith('.mp4') && !img.endsWith('.webm'));
    
    return {
      type: firstVideo ? 'video' : 'image',
      src: firstVideo || firstImage || null
    };
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
            {filteredProducts.length} products
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-krearte-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light bg-white"
              >
                <option value="all">All Products</option>
                <option value="video">With Video</option>
                <option value="image">Image Only</option>
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
                  {/* Product Media - Video priority */}
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
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                          <span className="text-6xl font-light">{product.name.charAt(0)}</span>
                        </div>
                      )}
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
                      {/* ✅ Display price range from materials (exclude services) */}
                      <p className="text-krearte-black font-normal">
                        {product.hasMaterialPrices && product.minPrice !== undefined ? (
                          <>
                            {formatCurrency(product.minPrice)}
                            {product.maxPrice !== undefined && product.maxPrice !== product.minPrice && (
                              <span className="text-krearte-gray-500 font-light">
                                {' '}- {formatCurrency(product.maxPrice)}
                              </span>
                            )}
                            <span className="text-sm text-krearte-gray-500 font-light">/m²</span>
                          </>
                        ) : (
                          <>
                            {formatCurrency(product.price)}
                            <span className="text-sm text-krearte-gray-500 font-light">/m²</span>
                          </>
                        )}
                      </p>
                      
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