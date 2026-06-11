// src/app/collection/designer/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Filter, ShoppingCart, Sparkles, Instagram, Globe } from "lucide-react";
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
  price: number;
  images: string[] | null;
  sizes: ProductSize[];
  collectionType?: string;
  category_slug?: string;
  availableMaterialIds?: string[];
  priceRange?: { min: number; max: number };
  is25DEligible?: boolean;
}

// ✅ Designer info (bisa di-update nanti dari database)
const DESIGNER_INFO: Record<string, {
  name: string;
  bio: string;
  photo?: string;
  instagram?: string;
  website?: string;
}> = {
  'krearte-botanical': {
    name: 'Krearte Botanical',
    bio: 'Nature-inspired designs that bring the outdoors inside. Featuring delicate florals, organic patterns, and serene landscapes.',
    photo: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
    instagram: 'https://instagram.com/krearte',
  },
  'krearte-metallic': {
    name: 'Krearte Metallic',
    bio: 'Luxurious metallic finishes that catch and reflect light. Premium gold, silver, and bronze effects for sophisticated spaces.',
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    instagram: 'https://instagram.com/krearte',
  },
  'krearte-textured': {
    name: 'Krearte Textured',
    bio: 'Tactile wallcoverings with rich textures and depth. From subtle linen weaves to bold 3D effects.',
    photo: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop',
    instagram: 'https://instagram.com/krearte',
  },
  'krearte-exclusive': {
    name: 'Krearte Exclusive',
    bio: 'Limited edition collaborations with renowned artists. Unique designs that make a statement.',
    photo: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=400&fit=crop',
    instagram: 'https://instagram.com/krearte',
  },
};

const DESIGNER_CATEGORY_SLUGS = Object.keys(DESIGNER_INFO);

export default function DesignerCollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/admin/products");
        const result = await response.json();
        
        if (result.success) {
          // ✅ Filter products: collectionType === 'designer' ATAU category_slug ada di DESIGNER_CATEGORY_SLUGS
          const designerProducts = (result.products || []).filter((p: Product) => {
            return p.collectionType?.toLowerCase() === 'designer' || 
                   DESIGNER_CATEGORY_SLUGS.includes(p.category_slug || '');
          });
          
          setProducts(designerProducts);
          console.log(`✅ Loaded ${designerProducts.length} designer products`);
        }
      } catch (error) {
        console.error("❌ Error fetching designer products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // ✅ Group products by category_slug (designer)
  const groupedByDesigner = products.reduce((acc, product) => {
    const designerSlug = product.category_slug || 'krearte-exclusive'; // fallback ke exclusive
    if (!acc[designerSlug]) {
      acc[designerSlug] = [];
    }
    acc[designerSlug].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // ✅ Filter products per designer
  const filteredGroupedByDesigner = Object.entries(groupedByDesigner).reduce((acc, [designerSlug, designerProducts]) => {
    const filtered = designerProducts.filter(product => {
      if (filter === "all") return true;
      if (filter === "metallic") return product.name.toLowerCase().includes('metallic') || designerSlug.includes('metallic');
      if (filter === "premium") return product.price >= 500000 || (product.priceRange?.max || 0) >= 500000;
      if (filter === "video") return product.images?.some(img => img?.endsWith('.mp4') || img?.endsWith('.webm'));
      return true;
    });
    
    if (filtered.length > 0) {
      acc[designerSlug] = filtered;
    }
    return acc;
  }, {} as Record<string, Product[]>);

  const getPrimaryMedia = (images: string[] | null | undefined) => {
    if (!images || images.length === 0) return { type: null, src: null };
    
    const firstVideo = images.find(img => img?.endsWith('.mp4') || img?.endsWith('.webm'));
    const firstImage = images.find(img => img && !img.endsWith('.mp4') && !img.endsWith('.webm'));
    
    return {
      type: firstVideo ? 'video' : firstImage ? 'image' : null,
      src: firstVideo || firstImage || null
    };
  };

  const formatPriceDisplay = (product: Product) => {
    if (product.priceRange && product.priceRange.min > 0 && product.priceRange.min !== product.priceRange.max) {
      return `${formatCurrency(product.priceRange.min)} - ${formatCurrency(product.priceRange.max)}`;
    }
    if (product.priceRange && product.priceRange.min > 0) {
      return formatCurrency(product.priceRange.min);
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

  const totalProducts = Object.values(filteredGroupedByDesigner).flat().length;

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

      {/* Filter Bar */}
      <div className="container mx-auto px-6 md:px-12 py-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-krearte-gray-600 font-light">
            {totalProducts} designs from {Object.keys(filteredGroupedByDesigner).length} designers
          </p>
          
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

        {/* Designers Sections */}
        {Object.keys(filteredGroupedByDesigner).length === 0 ? (
          <div className="text-center py-24">
            <p className="text-krearte-gray-500 font-light">No designer collections found</p>
            <Link
              href="/collection/wallcovering"
              className="inline-block mt-4 text-krearte-black font-medium border-b border-krearte-black pb-0.5"
            >
              Browse Wallcovering Products
            </Link>
          </div>
        ) : (
          <div className="space-y-24">
            {Object.entries(filteredGroupedByDesigner).map(([designerSlug, designerProducts]) => {
              const designerInfo = DESIGNER_INFO[designerSlug] || {
                name: designerSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                bio: 'Exclusive designer collection',
              };

              return (
                <section key={designerSlug} className="scroll-mt-20" id={designerSlug}>
                  {/* Designer Profile Header */}
                  <div className="flex flex-col md:flex-row items-start gap-8 mb-12 pb-8 border-b border-krearte-gray-200">
                    {/* Designer Photo */}
                    {designerInfo.photo && (
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden flex-shrink-0 bg-krearte-gray-200 shadow-lg">
                        <img
                          src={designerInfo.photo}
                          alt={`${designerInfo.name} profile`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Designer Info */}
                    <div className="flex-1">
                      <h2 className="font-sans text-3xl md:text-4xl font-light mb-4 text-krearte-black">
                        {designerInfo.name}
                      </h2>
                      
                      <p className="text-lg font-light text-krearte-gray-600 leading-relaxed mb-4 max-w-3xl">
                        {designerInfo.bio}
                      </p>
                      
                      {/* Social Links */}
                      <div className="flex items-center gap-4">
                        {designerInfo.instagram && (
                          <a
                            href={designerInfo.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black transition-colors"
                          >
                            <Instagram className="w-4 h-4" />
                            Instagram
                          </a>
                        )}
                        
                        {designerInfo.website && (
                          <a
                            href={designerInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Designer's Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {designerProducts.map((product) => {
                      const media = getPrimaryMedia(product.images);
                      const isPremium = product.is25DEligible || product.price >= 500000 || (product.priceRange?.max || 0) >= 500000;
                      
                      return (
                        <div
                          key={product.id}
                          className="group bg-krearte-white rounded-lg border border-krearte-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {/* Product Media */}
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
                              
                              {/* Badges */}
                              <div className="absolute top-3 left-3 flex gap-2">
                                {isPremium && (
                                  <span className="px-2 py-1 bg-krearte-black text-krearte-white text-xs rounded">
                                    Premium
                                  </span>
                                )}
                                {product.is25DEligible && (
                                  <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-krearte-white text-xs rounded flex items-center gap-1 shadow-sm">
                                    <Sparkles className="w-3 h-3" />
                                    2.5D
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
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}