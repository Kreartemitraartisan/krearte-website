"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Truck, Package, Clock, Globe } from "lucide-react";

export default function ShippingPage() {
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

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-16">
              <p className="text-sm font-light text-krearte-gray-600 mb-4 tracking-widest uppercase">
                Delivery Information
              </p>
              <h1 className="font-sans text-4xl md:text-6xl font-light mb-6 text-krearte-black">
                Shipping & Delivery
              </h1>
              <p className="text-lg font-light text-krearte-gray-600">
                We carefully package and ship your wallcoverings to ensure they arrive 
                in perfect condition.
              </p>
            </div>

            {/* Shipping Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200"
              >
                <div className="w-12 h-12 bg-krearte-black rounded-full flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-krearte-white" />
                </div>
                <h3 className="font-sans text-lg font-normal mb-2">Domestic Shipping</h3>
                <p className="text-sm text-krearte-gray-600 font-light mb-4">
                  Shipping available for everywhere around Indonesia.
                </p>
                <p className="text-sm font-medium text-krearte-black">3-7 business days</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200"
              >
                <div className="w-12 h-12 bg-krearte-black rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-krearte-white" />
                </div>
                <h3 className="font-sans text-lg font-normal mb-2">International</h3>
                <p className="text-sm text-krearte-gray-600 font-light mb-4">
                  Worldwide shipping available. Rates calculated at checkout.
                </p>
                <p className="text-sm font-medium text-krearte-black">7-14 business days</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200"
              >
                <div className="w-12 h-12 bg-krearte-black rounded-full flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-krearte-white" />
                </div>
                <h3 className="font-sans text-lg font-normal mb-2">Custom Orders</h3>
                <p className="text-sm text-krearte-gray-600 font-light mb-4">
                  Production time plus shipping. Timeline provided upon confirmation.
                </p>
                <p className="text-sm font-medium text-krearte-black">Varies by project</p>
              </motion.div>
            </div>

            {/* Additional Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
                <h2 className="font-sans text-2xl font-light mb-6">Shipping Process</h2>
                <div className="space-y-4 text-krearte-gray-600 font-light leading-relaxed">
                  <p>
                    <strong className="text-krearte-black font-normal">1. Order Processing:</strong> All orders 
                    are processed within 1-2 business days. Custom orders may require additional production time.
                  </p>
                  <p>
                    <strong className="text-krearte-black font-normal">2. Packaging:</strong> Your wallcoverings 
                    are carefully packaged in protective materials to prevent damage during transit.
                  </p>
                  <p>
                    <strong className="text-krearte-black font-normal">3. Tracking:</strong> Once your order ships, 
                    you'll receive a tracking number via email to monitor your delivery.
                  </p>
                  <p>
                    <strong className="text-krearte-black font-normal">4. Delivery:</strong> Please inspect your 
                    package upon arrival. If there's any damage, contact us immediately at hello@krearte.com.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
                <h2 className="font-sans text-2xl font-light mb-6">Important Notes</h2>
                <ul className="space-y-3 text-krearte-gray-600 font-light">
                  <li className="flex items-start gap-3">
                    <span className="text-krearte-black font-medium">•</span>
                    <span>Please ensure someone is available to receive the delivery</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-krearte-black font-medium">•</span>
                    <span>Wallcoverings should be stored flat and dry before installation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-krearte-black font-medium">•</span>
                    <span>For large orders, white glove delivery can be arranged (additional fee)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-krearte-black font-medium">•</span>
                    <span>Remote areas may require additional delivery time</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <p className="text-krearte-gray-600 font-light mb-6">
                Have questions about shipping to your location?
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-krearte-black text-white font-medium rounded-full hover:bg-krearte-charcoal transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}