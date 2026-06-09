"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Layers, Shield, Droplets, Sun } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function MaterialsPage() {
  const materials = [
    {
      category: "Wallpaper Standard (PVC Coated)",
      description: "Our signature collection. Durable, versatile, and available in 9 unique textures. Perfect for high-traffic areas while maintaining elegance.",
      icon: Layers,
      products: [
        {
          name: "PVC Wallcoverings - Smooth Sand",
          code: "Krearte-BST 8626-7",
          texture: "Smooth",
          width: "1.06m (Print: 1.04m)",
          price: 345000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Smooth+Sand+PVC",
          description: "Clean, minimal, and endlessly adaptable. The foundation of Krearte collection.",
          bestFor: "Living rooms, bedrooms, offices",
        },
        {
          name: "PVC Wallcoverings - Industrial",
          code: "Krearte-BST 8622-1",
          texture: "Industrial",
          width: "1.06m (Print: 1.04m)",
          price: 345000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Industrial+PVC",
          description: "Raw, urban aesthetic with durable PVC coating.",
          bestFor: "Commercial spaces, lofts, modern interiors",
        },
        {
          name: "Self Adhesive - Art Fabric",
          code: "DX340A-E2",
          texture: "Fabric Back",
          width: "1.52m (Print: 1.5m)",
          price: 335000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Self+Adhesive+Fabric",
          description: "DIY-friendly without compromising quality. Peel, stick, transform.",
          bestFor: "Quick renovations, rental spaces",
        },
      ],
    },
    {
      category: "Special Effect Wallpaper (Metallic)",
      description: "Where light meets texture. Our metallic finishes catch and reflect light, creating dynamic spaces that change throughout the day.",
      icon: Sparkles,
      products: [
        {
          name: "Straw Raw Texture Metallic",
          code: "DE030K",
          texture: "Gold",
          width: "1.07m (Print: 1.05m)",
          price: 400000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Straw+Raw+Metallic",
          description: "Subtle shimmer with organic texture. Luxury that doesn't shout.",
          bestFor: "Feature walls, dining rooms",
        },
        {
          name: "Straw Raw Texture Metallic FLX",
          code: "DE030K",
          texture: "Flex",
          width: "1.07m (Print: 1.05m)",
          price: 450000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Straw+Raw+Metallic+FLX",
          description: "Enhanced flexibility with metallic finish.",
          bestFor: "Curved surfaces, architectural features",
        },
        {
          name: "Abstract Embossing Texture-Metallic",
          code: "WP137-Silver 01",
          texture: "Silver Metallic",
          width: "1.37m (Print: 1.35m)",
          price: 750000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Abstract+Embossing",
          description: "Bold patterns with reflective depth. Art for your walls.",
          bestFor: "Statement walls, galleries, boutiques",
        },
        {
          name: "Silver/Gold Metallic",
          code: "PGS/PSSS 01",
          texture: "Metallic",
          width: "1.07m (Print: 1.05m)",
          price: 500000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Silver+Gold+Metallic",
          description: "Premium metallic finish. Note: Non-join installation.",
          bestFor: "Luxury residences, feature walls",
          note: "⚠️ NON JOIN INSTALLATION",
        },
        {
          name: "Metallic Silver Japanese Silk",
          code: "XQ-4097",
          texture: "Metallic Silk",
          width: "1.37m (Print: 1.35m)",
          price: 860000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Japanese+Silk",
          description: "Our premium offering. Inspired by traditional Japanese craftsmanship.",
          bestFor: "Luxury residences, high-end hospitality",
        },
        {
          name: "White or Creamy Raw Texture",
          code: "XQ-4011/XQ-4030",
          texture: "Non-Woven",
          width: "1.37m (Print: 1.35m)",
          price: 450000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=White+Creamy+Raw",
          description: "Breathable material that's easy to install and remove.",
          bestFor: "Eco-friendly projects, temporary installations",
        },
        {
          name: "Art Texture",
          code: "YM-0937",
          texture: "Raw Texture",
          width: "1.37m (Print: 1.35m)",
          price: 400000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Art+Texture",
          description: "Artistic texture with natural appeal.",
          bestFor: "Creative spaces, studios",
        },
      ],
    },
    {
      category: "Non-Woven & Fabric Back",
      description: "Breathable, eco-conscious materials with superior durability. Perfect for those who value sustainability without compromising on style.",
      icon: Shield,
      products: [
        {
          name: "Linen (While Stock Last!)",
          code: "N/A",
          texture: "Linen",
          width: "1.2/1.38/1.59/2.78m",
          price: 375000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Linen+Non+Woven",
          description: "Natural linen texture with eco-friendly non-woven backing.",
          bestFor: "Eco-conscious projects, residential",
          note: "⚠️ Limited stock available",
        },
        {
          name: "Plain Smooth (While Stock Last!)",
          code: "N3001",
          texture: "Smooth",
          width: "1.26m (Print: 1.25m)",
          price: 300000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Plain+Smooth",
          description: "Clean, minimalist finish. Great base for any space.",
          bestFor: "Minimalist designs, offices",
          note: "⚠️ Limited stock available",
        },
        {
          name: "Cross Hatch Linen",
          code: "M69",
          texture: "Cross Hatch",
          width: "1.4m (Print: 1.38m)",
          price: 385000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Cross+Hatch+Linen",
          description: "The perfect balance between durability and sophistication.",
          bestFor: "Commercial spaces, hospitality",
        },
        {
          name: "Fine Sand Texture",
          code: "M70",
          texture: "Fine Sand",
          width: "1.4m (Print: 1.38m)",
          price: 385000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Fine+Sand+Texture",
          description: "Subtle sand texture with fabric backing.",
          bestFor: "Hotels, restaurants, offices",
        },
      ],
    },
    {
      category: "Special Services",
      description: "For the extraordinary. These finishes transform wallcoverings into immersive experiences.",
      icon: Sun,
      products: [
        {
          name: "2.5D Print Effect",
          code: "Add-On",
          texture: "Raised Print",
          width: "N/A",
          price: 500000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=2.5D+Print+Effect",
          description: "Add-on service. Your chosen pattern with tactile depth you can feel.",
          bestFor: "Art walls, branded spaces, installations",
          note: "Add-on: +Rp 500.000/m² from base material price",
        },
        {
          name: "Custom Print Service",
          code: "Custom",
          texture: "Your Design",
          width: "Variable",
          price: 200000,
          image: "https://placehold.co/800x600/e8e6e1/333333?text=Custom+Print",
          description: "Bring your vision to life. Any pattern, any color, any size.",
          bestFor: "Branded spaces, personal art, unique projects",
          note: "Add-on: +Rp 200.000/m² from base material price",
        },
      ],
    },
  ];

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
            {materials.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
              >
                {/* Category Header */}
                <div className="flex items-start gap-6 mb-12">
                  <div className="w-16 h-16 bg-krearte-black rounded-full flex items-center justify-center flex-shrink-0">
                    <category.icon className="w-8 h-8 text-krearte-white" />
                  </div>
                  <div>
                    <h2 className="font-sans text-3xl md:text-4xl font-light mb-4 text-krearte-black">
                      {category.category}
                    </h2>
                    <p className="text-lg font-light text-krearte-gray-600 leading-relaxed max-w-3xl">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {category.products.map((product, productIndex) => (
                    <motion.div
                      key={product.name}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: productIndex * 0.1 }}
                      className="bg-krearte-white rounded-lg border border-krearte-gray-200 overflow-hidden hover:border-krearte-black transition-colors group"
                    >
                      {/* ✅ CLOSE-UP IMAGE DI ATAS CARD */}
                      <div className="aspect-[4/3] bg-krearte-gray-100 overflow-hidden relative">
                        <img
                          src={product.image || "https://placehold.co/800x600/e8e6e1/333333?text=Material+Closeup"}
                          alt={`${product.name} material close-up detail`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Optional: Texture badge overlay on image */}
                        <div className="absolute top-4 left-4 bg-krearte-black/80 backdrop-blur-sm text-krearte-white text-xs px-3 py-1 rounded-full">
                          {product.texture}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        {/* Product Name */}
                        <h3 className="font-sans text-xl font-normal mb-3 text-krearte-black group-hover:underline decoration-krearte-gray-300 underline-offset-4">
                          {product.name}
                        </h3>

                        {/* Product Code */}
                        {product.code && product.code !== "N/A" && (
                          <p className="text-xs font-medium text-krearte-gray-500 mb-2">
                            Code: {product.code}
                          </p>
                        )}

                        {/* Width Info */}
                        {product.width && (
                          <p className="text-xs font-medium text-krearte-gray-500 mb-3">
                            Width: {product.width}
                          </p>
                        )}

                        {/* Description */}
                        <p className="text-sm font-light text-krearte-gray-600 mb-4 leading-relaxed">
                          {product.description}
                        </p>

                        {/* Best For */}
                        <div className="mb-4">
                          <p className="text-xs font-medium text-krearte-gray-500 uppercase tracking-wider mb-1">
                            Best For
                          </p>
                          <p className="text-sm font-light text-krearte-gray-600">
                            {product.bestFor}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="pt-4 border-t border-krearte-gray-100">
                          <p className="text-xs font-medium text-krearte-gray-500 uppercase tracking-wider mb-1">
                            Starting From
                          </p>
                          <p className="text-lg font-normal text-krearte-black">
                            {formatCurrency(product.price)}<span className="text-sm font-light text-krearte-gray-500">/m²</span>
                          </p>
                          {product.note && (
                            <p className="text-xs text-krearte-gray-400 mt-1">
                              {product.note}
                            </p>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="mt-6">
                          <Link
                            href="/materials#samples"
                            className="inline-flex items-center text-sm font-medium text-krearte-black hover:text-krearte-gray-600 transition-colors"
                          >
                            Order Sample
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
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