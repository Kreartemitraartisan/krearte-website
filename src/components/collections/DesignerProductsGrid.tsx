"use client";  // ✅ Client Component untuk animasi

import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, Ruler, Sparkles, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  is25DEligible: boolean;
  recommendedMaterialIds: string[];
}

interface Material {
  id: string;
  name: string;
  category: string;
  width: string | null;
  pricePerM2: number;
}

interface DesignerProductsGridProps {
  products: Product[];
  materials: Material[];
}

export default function DesignerProductsGrid({ products, materials }: DesignerProductsGridProps) {
  // Helper: Get recommended material for product
  const getPrimaryMaterial = (product: Product): Material | undefined => {
    return materials.find(m => product.recommendedMaterialIds.includes(m.id));
  };

  // Helper: Determine badge type
  const getMaterialType = (material: Material): "metallic" | "premium" | "standard" => {
    if (material.category === 'Metallic Collection') {
      return material.pricePerM2 >= 750000 ? 'premium' : 'metallic';
    }
    return 'standard';
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-lg font-light text-krearte-gray-600 mb-6">No designer collections available yet.</p>
        <Link href="/collection/wallcovering" className="text-krearte-black font-medium border-b border-krearte-black pb-0.5">
          Explore Wallcovering Collection
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {products.map((product, index) => {
          const primaryMaterial = getPrimaryMaterial(product);
          const materialType = primaryMaterial ? getMaterialType(primaryMaterial) : 'standard';

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link href={`/product/${product.slug}`} className="block">
                {/* Product Image */}
                <div className="aspect-[4/3] bg-krearte-gray-100 mb-6 overflow-hidden relative rounded-lg">
                  {product.images && product.images.length > 0 ? (
                    product.images[0].endsWith('.mp4') || product.images[0].endsWith('.webm') ? (
                      // ✅ Render Video untuk Collection Page
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        <source src={product.images[0]} type="video/mp4" />
                      </video>
                    ) : (
                      // ✅ Render Image
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                      <span className="text-8xl font-light">{product.name.charAt(0)}</span>
                    </div>
                  )}
                  
                  {/* Material Type Badge */}
                  <div className="absolute top-4 left-4">
                    {materialType === "premium" && (
                      <span className="px-3 py-1 bg-krearte-black text-krearte-white text-xs font-medium rounded-full">Premium</span>
                    )}
                    {materialType === "metallic" && (
                      <span className="px-3 py-1 bg-krearte-gray-800 text-krearte-white text-xs font-medium rounded-full">Metallic</span>
                    )}
                  </div>

                  {/* 2.5D Badge */}
                  {product.is25DEligible && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-krearte-white/90 text-krearte-black text-xs font-medium rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        2.5D Available
                      </span>
                    </div>
                  )}
                  
                  {/* Quick View Button */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-full py-3 bg-krearte-black text-krearte-white text-sm font-medium rounded">
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="font-sans text-lg font-normal mb-2 text-krearte-black group-hover:underline decoration-krearte-gray-300 underline-offset-4">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm font-light text-krearte-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  )}
                  
                  {/* Material Info */}
                  {primaryMaterial && (
                    <div className="flex items-center gap-4 mb-3 text-xs font-light text-krearte-gray-500">
                      {primaryMaterial.width && (
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          {primaryMaterial.width}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {primaryMaterial.name}
                      </span>
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <p className="text-base font-normal text-krearte-black">
                      {formatCurrency(product.price)}
                      <span className="text-sm font-light text-krearte-gray-500">/m²</span>
                    </p>
                    <button className="flex items-center gap-2 text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="text-center mt-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-3xl font-light mb-6 text-krearte-black">Need Custom Sizes or Materials?</h2>
          <p className="text-lg font-light text-krearte-gray-600 mb-8 leading-relaxed">
            All our designer collections can be customized to your exact specifications.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/custom" className="inline-flex items-center justify-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors">
              Start Custom Project
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/materials" className="inline-flex items-center justify-center px-8 py-4 border border-krearte-black text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-colors">
              View All Materials
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}