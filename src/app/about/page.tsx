"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, Heart, Award, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Back Navigation */}
      <div className="container mx-auto px-6 md:px-12 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <p className="text-sm font-light text-krearte-gray-600 mb-4 tracking-widest uppercase">
              Our Story
            </p>
            <h1 className="font-sans text-4xl md:text-6xl font-light mb-8 text-krearte-black">
              Crafted with Passion,<br />Designed for Elegance
            </h1>
            <p className="text-lg font-light text-krearte-gray-600 leading-relaxed">
              Krearte is dedicated to transforming spaces through exquisite wallcoverings 
              that blend artistry with craftsmanship.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-krearte-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-krearte-white" />
              </div>
              <h3 className="font-sans text-xl font-normal mb-4">Handcrafted with Love</h3>
              <p className="text-krearte-gray-600 font-light leading-relaxed">
                Each piece is carefully crafted by skilled artisans who pour their 
                passion into every detail.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-krearte-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-krearte-white" />
              </div>
              <h3 className="font-sans text-xl font-normal mb-4">Premium Quality</h3>
              <p className="text-krearte-gray-600 font-light leading-relaxed">
                We use only the finest materials and techniques to ensure our 
                wallcoverings stand the test of time.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-krearte-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-krearte-white" />
              </div>
              <h3 className="font-sans text-xl font-normal mb-4">Personalized Service</h3>
              <p className="text-krearte-gray-600 font-light leading-relaxed">
                From consultation to installation, we're with you every step of the 
                way to create your perfect space.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-sans text-3xl md:text-4xl font-light mb-6">
              Ready to Transform Your Space?
            </h2>
            <p className="text-krearte-gray-600 font-light mb-8 leading-relaxed">
              Explore our collections and discover the perfect wallcovering for your home or business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/collection/wallcovering"
                className="inline-flex items-center px-8 py-4 bg-krearte-black text-white font-medium rounded-full hover:bg-krearte-charcoal transition-colors"
              >
                Shop Wallcoverings
              </Link>
              <Link
                href="/custom"
                className="inline-flex items-center px-8 py-4 border border-krearte-black text-krearte-black font-medium rounded-full hover:bg-krearte-black hover:text-white transition-colors"
              >
                Custom Order
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}