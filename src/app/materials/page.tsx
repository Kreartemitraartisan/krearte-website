"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Layers, Shield, Droplets, Sun } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function MaterialsPage() {
  const materials = [
    {
      category: "PVC Wallcoverings",
      description: "Our signature collection. Durable, versatile, and available in 9 unique textures. Perfect for high-traffic areas while maintaining elegance.",
      icon: Layers,
      products: [
        {
          name: "Standard PVC",
          texture: "Smooth / Industrial",
          price: 345000,
          description: "The foundation of Krearte collection. Clean, minimal, and endlessly adaptable.",
          bestFor: "Living rooms, bedrooms, offices",
        },
        {
          name: "Self Adhesive",
          texture: "Fabric Back",
          price: 335000,
          description: "DIY-friendly without compromising quality. Peel, stick, transform.",
          bestFor: "Quick renovations, rental spaces",
        },
        {
          name: "Non-Woven",
          texture: "White / Creamy Raw",
          price: 450000,
          description: "Breathable material that's easy to install and remove. Eco-conscious choice.",
          bestFor: "Eco-friendly projects, temporary installations",
        },
        {
          name: "Fabric Back",
          texture: "Cross Hatch / Fine Sand",
          price: 385000,
          description: "The perfect balance between durability and sophistication.",
          bestFor: "Commercial spaces, hospitality",
        },
      ],
    },
    {
      category: "Metallic Collection",
      description: "Where light meets texture. Our metallic finishes catch and reflect light, creating dynamic spaces that change throughout the day.",
      icon: Sparkles,
      products: [
        {
          name: "Straw Raw Metallic",
          texture: "Gold / Flex",
          price: 400000,
          description: "Subtle shimmer with organic texture. Luxury that doesn't shout.",
          bestFor: "Feature walls, dining rooms",
        },
        {
          name: "Abstract Embossing",
          texture: "Silver Metallic",
          price: 750000,
          description: "Bold patterns with reflective depth. Art for your walls.",
          bestFor: "Statement walls, galleries, boutiques",
        },
        {
          name: "Japanese Silk",
          texture: "Metallic Silver",
          price: 860000,
          description: "Our premium offering. Inspired by traditional Japanese craftsmanship.",
          bestFor: "Luxury residences, high-end hospitality",
        },
      ],
    },
    {
      category: "Special Effects",
      description: "For the extraordinary. These finishes transform wallcoverings into immersive experiences.",
      icon: Sun,
      products: [
        {
          name: "2.5D Print",
          texture: "Raised Print Effect",
          price: 500000,
          description: "Add-on service. Your chosen pattern with tactile depth you can feel.",
          bestFor: "Art walls, branded spaces, installations",
          note: "Add-on: +Rp 500.000/m² from base material price",
        },
        {
          name: "Custom Print",
          texture: "Your Design",
          price: 200000,
          description: "Bring your vision to life. Any pattern, any color, any size.",
          bestFor: "Branded spaces, personal art, unique projects",
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
                      className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6 hover:border-krearte-black transition-colors group"
                    >
                      {/* Price Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-medium text-krearte-gray-500 uppercase tracking-wider">
                          {product.texture}
                        </span>
                        {product.note && (
                          <span className="text-xs font-medium text-krearte-black bg-krearte-gray-100 px-2 py-1 rounded">
                            Add-on
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-sans text-xl font-normal mb-3 text-krearte-black group-hover:underline decoration-krearte-gray-300 underline-offset-4">
                        {product.name}
                      </h3>

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
              <h2 className="font-sans text-3xl md:text-5xl font-light mb-8 mb-8">
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