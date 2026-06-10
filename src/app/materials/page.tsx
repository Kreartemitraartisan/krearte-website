"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Layers, Shield, Droplets, Sun } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

interface Material {
  id: string;
  name: string;
  category: string;
  pricePerM2: number;
  width: string;
  effectiveWidth?: number;
  waste: number;
  stock: number;
  description?: string;
  imageUrl?: string;
  is25DEligible?: boolean;
  samplePriceA3?: number;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const response = await fetch("/api/materials");
        const result = await response.json();
        
        if (result.success) {
          // ✅ FILTER: Hanya material fisik, exclude services/add-ons
          const physicalMaterials = (result.materials || []).filter((material: Material) => {
            const category = material.category?.toLowerCase() || '';
            const name = material.name?.toLowerCase() || '';
            
            // ❌ Exclude keywords untuk services/add-ons
            const excludedKeywords = [
              'service', 'add-on', 'addon', 'jasa',
              'print', 'design', 'custom', 'fee', 'biaya'
            ];
            
            const hasExcludedKeyword = excludedKeywords.some(keyword => 
              category.includes(keyword) || name.includes(keyword)
            );
            
            // ✅ Hanya material dengan price > 0 dan bukan service
            return material.pricePerM2 > 0 && !hasExcludedKeyword;
          });
          
          setMaterials(physicalMaterials);
          console.log(`✅ Loaded ${physicalMaterials.length} physical materials`);
        }
      } catch (error) {
        console.error("❌ Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
  }, []);

  // Group materials by category
  const groupedMaterials = materials.reduce((acc, material) => {
    const category = material.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("metallic") || cat.includes("special")) return Sparkles;
    if (cat.includes("fabric") || cat.includes("non-woven")) return Shield;
    if (cat.includes("service") || cat.includes("add-on")) return Sun;
    return Layers;
  };

  const getCategoryDescription = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("pvc") || cat.includes("wallcovering")) {
      return "Our signature collection. Durable, versatile, and available in unique textures. Perfect for high-traffic areas while maintaining elegance.";
    }
    if (cat.includes("metallic") || cat.includes("special")) {
      return "Where light meets texture. Our metallic finishes catch and reflect light, creating dynamic spaces that change throughout the day.";
    }
    if (cat.includes("fabric") || cat.includes("non-woven")) {
      return "Breathable, eco-conscious materials with superior durability. Perfect for those who value sustainability without compromising on style.";
    }
    if (cat.includes("service") || cat.includes("add-on")) {
      return "For the extraordinary. These finishes transform wallcoverings into immersive experiences.";
    }
    return "Premium quality materials for your wallcovering needs.";
  };

  const features = [
    {
      icon: Shield,
      title: "Durable & Long-Lasting",
      description: "Premium PVC coating ensures your wallcoverings maintain their beauty for years.",
    },
    {
      icon: Droplets,
      title: "Water Resistant",
      description: "Suitable for humid environments. Perfect for bathrooms and kitchens.",
    },
    {
      icon: Sun,
      title: "Fade Resistant",
      description: "Colors stay vibrant even in direct sunlight.",
    },
    {
      icon: Layers,
      title: "Easy Installation",
      description: "Professional installation recommended. Samples available before commitment.",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-krearte-white overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-4xl mx-auto text-center"
          >
            <p className="text-sm font-light text-krearte-gray-600 mb-6 tracking-widest uppercase">
              Craftsmanship & Quality
            </p>
            <h1 className="font-sans text-4xl md:text-6xl font-light mb-8 text-krearte-black leading-tight">
              Materials That
              <br />
              <span className="font-normal">Tell Your Story</span>
            </h1>
            <p className="text-lg md:text-xl font-light text-krearte-gray-600 leading-relaxed max-w-2xl mx-auto">
              Every space has a narrative. Our carefully curated materials are designed 
              to bring that story to life—with texture, depth, and enduring quality.
            </p>
          </motion.div>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-krearte-gray-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
      </section>

      {/* Material Categories */}
      <section className="py-24 md:py-32 bg-krearte-cream">
        <div className="container mx-auto px-6 md:px-12">
          <div className="space-y-32">
            {Object.entries(groupedMaterials).map(([category, categoryMaterials], categoryIndex) => {
              const Icon = getCategoryIcon(category);
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                >
                  {/* Category Header */}
                  <div className="flex items-start gap-6 mb-12">
                    <div className="w-16 h-16 bg-krearte-black rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-krearte-white" />
                    </div>
                    <div>
                      <h2 className="font-sans text-3xl md:text-4xl font-light mb-4 text-krearte-black">
                        {category}
                      </h2>
                      <p className="text-lg font-light text-krearte-gray-600 leading-relaxed max-w-3xl">
                        {getCategoryDescription(category)}
                      </p>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryMaterials.map((material, productIndex) => (
                      <motion.div
                        key={material.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: productIndex * 0.1 }}
                        className="bg-krearte-white rounded-lg border border-krearte-gray-200 overflow-hidden hover:border-krearte-black transition-colors group"
                      >
                        {/* ✅ REAL IMAGE FROM DATABASE */}
                        <div className="aspect-[4/3] bg-krearte-gray-100 overflow-hidden relative">
                          {material.imageUrl ? (
                            <img
                              src={material.imageUrl}
                              alt={`${material.name} material close-up detail`}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/800x600/e8e6e1/333333?text=Material+Closeup";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-krearte-gray-400 bg-krearte-gray-100">
                              <Layers className="w-12 h-12" />
                            </div>
                          )}
                          
                          {/* Width badge overlay on image */}
                          {material.width && (
                            <div className="absolute top-4 left-4 bg-krearte-black/80 backdrop-blur-sm text-krearte-white text-xs px-3 py-1 rounded-full">
                              {material.width}
                            </div>
                          )}

                          {/* 2.5D Badge */}
                          {material.is25DEligible && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-krearte-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              2.5D
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                          {/* Material Name */}
                          <h3 className="font-sans text-xl font-normal mb-2 text-krearte-black group-hover:underline decoration-krearte-gray-300 underline-offset-4">
                            {material.name}
                          </h3>

                          {/* Category */}
                          <p className="text-xs font-medium text-krearte-gray-500 mb-3">
                            {material.category}
                          </p>

                          {/* Description */}
                          {material.description && (
                            <p className="text-sm font-light text-krearte-gray-600 mb-4 leading-relaxed">
                              {material.description}
                            </p>
                          )}

                          {/* ✅ Material Specs: Effective Width & Sample Price */}
                          <div className="mb-4 space-y-2">
                            {/* Effective Width */}
                            {material.effectiveWidth && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-krearte-gray-500">Effective Width:</span>
                                <span className="font-medium text-krearte-black">{material.effectiveWidth}m</span>
                              </div>
                            )}
                            
                            {/* Sample Price */}
                            {material.samplePriceA3 && material.samplePriceA3 > 0 && (
                              <div className="pt-2 mt-2 border-t border-krearte-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-krearte-gray-500 uppercase">Sample (A3)</span>
                                  <span className="text-sm font-normal text-krearte-black">{formatCurrency(material.samplePriceA3)}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <div className="pt-4 border-t border-krearte-gray-100">
                            <p className="text-xs font-medium text-krearte-gray-500 uppercase tracking-wider mb-1">
                              Starting From
                            </p>
                            <p className="text-lg font-normal text-krearte-black">
                              {formatCurrency(material.pricePerM2)}<span className="text-sm font-light text-krearte-gray-500">/m²</span>
                            </p>
                            
                            {/* Stock Info */}
                            {material.stock !== undefined && (
                              <p className={`text-xs mt-1 ${material.stock > 0 ? 'text-krearte-gray-500' : 'text-red-500'}`}>
                                Stock: {material.stock} m² {material.stock === 0 && "(Out of stock)"}
                              </p>
                            )}
                          </div>

                          {/* CTA */}
                          <div className="mt-6">
                            <Link
                              href="/custom"
                              className="inline-flex items-center text-sm font-medium text-krearte-black hover:text-krearte-gray-600 transition-colors"
                            >
                              Order Now
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-krearte-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-light text-krearte-gray-600 mb-4 tracking-widest uppercase">
              Why Krearte
            </p>
            <h2 className="font-sans text-3xl md:text-4xl font-light mb-6 text-krearte-black">
              Quality You Can Trust
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-krearte-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-krearte-white" />
                </div>
                <h3 className="font-sans text-lg font-normal mb-3 text-krearte-black">
                  {feature.title}
                </h3>
                <p className="font-light text-krearte-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample CTA Section */}
      <section id="samples" className="py-24 md:py-32 bg-krearte-black text-krearte-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-light text-krearte-gray-400 mb-6 tracking-widest uppercase">
                Experience Before You Commit
              </p>
              <h2 className="font-sans text-3xl md:text-5xl font-light mb-8">
                Order Material Samples
              </h2>
              <p className="text-lg font-light text-krearte-gray-300 mb-12 leading-relaxed">
                See and feel the quality firsthand. Our sample kits include A3 swatches 
                of your chosen materials, so you can evaluate texture, color, and finish 
                in your actual space before making a decision.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-krearte-gray-800 rounded-lg p-6">
                  <p className="text-2xl font-normal mb-2">Rp 50.000</p>
                  <p className="text-sm font-light text-krearte-gray-400">PVC Standard Sample (A3)</p>
                </div>
                <div className="bg-krearte-gray-800 rounded-lg p-6">
                  <p className="text-2xl font-normal mb-2">Rp 65.000</p>
                  <p className="text-sm font-light text-krearte-gray-400">Special Effect Sample (A3)</p>
                </div>
                <div className="bg-krearte-gray-800 rounded-lg p-6">
                  <p className="text-2xl font-normal mb-2">Rp 75.000</p>
                  <p className="text-sm font-light text-krearte-gray-400">Non-Woven / Fabric Back (A3)</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  href="/custom"
                  className="inline-flex items-center justify-center px-8 py-4 bg-krearte-white text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-gray-100 transition-colors"
                >
                  Start Custom Project
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  href="/collection/wallcovering"
                  className="inline-flex items-center justify-center px-8 py-4 border border-krearte-white text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-white hover:text-krearte-black transition-colors"
                >
                  Browse Collections
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <section className="py-16 bg-krearte-cream">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <p className="text-sm font-light text-krearte-gray-500">
            All prices are retail pricing in Indonesian Rupiah (IDR). 
            <br />
            For designer and reseller pricing, please contact our trade program.
          </p>
        </div>
      </section>
    </div>
  );
}