"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What materials do you use for your wallcoverings?",
    answer: "We offer a variety of premium materials including PVC Standard, PVC Premium (Linen texture), Non-Woven, Metallic collections, and custom print options. Each material has unique characteristics suited for different applications. You can explore our complete materials guide on our Materials page."
  },
  {
    question: "How do I measure my wall for wallcovering?",
    answer: "Measure the width and height of your wall in meters or centimeters. Multiply width by height to get the total square meters (m²). We recommend adding 10-15% extra for pattern matching and waste. Our team can help verify your measurements during the ordering process."
  },
  {
    question: "Can I order a custom design?",
    answer: "Absolutely! Our 'Custom with Us' service allows you to create bespoke wallcoverings tailored to your vision. You can choose from our premium materials, add special effects like 2.5D printing, and work directly with our design team. Simply fill out our custom order form and we'll get back to you within 2-3 business days."
  },
  {
    question: "How long does shipping take?",
    answer: "For domestic orders within Indonesia, standard shipping takes 3-7 business days. International orders take 7-14 business days. Custom orders require additional production time, which will be communicated during the ordering process. Free shipping is available for orders over Rp 1.000.000."
  },
  {
    question: "What is the 2.5D print effect?",
    answer: "Our 2.5D print effect creates a raised, tactile texture that you can actually feel. It adds depth and dimension to your wallcovering, making patterns and designs more dynamic. This premium add-on costs Rp 500.000 per m² and is available on select materials."
  },
  {
    question: "Can I install the wallcovering myself?",
    answer: "While professional installation is recommended for best results, many of our wallcoverings can be self-installed if you have DIY experience. We provide detailed installation instructions with every order. For complex patterns or large spaces, we recommend hiring a professional installer."
  },
  {
    question: "How do I care for my wallcovering?",
    answer: "Most of our wallcoverings are easy to maintain. Simply dust regularly with a soft, dry cloth. For PVC and vinyl options, you can gently wipe with a damp cloth. Avoid harsh chemicals or abrasive cleaners. Non-woven materials should be kept dry. Specific care instructions come with your order."
  },
  {
    question: "Do you offer samples?",
    answer: "Yes! We offer material samples for Rp 50.000 - Rp 75.000 per A3 size sample. This allows you to see and feel the quality before committing to a full order. Sample costs can be credited toward your final purchase if you order within 30 days."
  },
  {
    question: "What is your return policy?",
    answer: "Due to the custom nature of our products, we accept returns only for manufacturing defects or damaged goods. Please inspect your order immediately upon arrival and report any issues within 7 days. We'll work with you to resolve the issue quickly."
  },
  {
    question: "Can I get a discount for bulk orders?",
    answer: "Yes, we offer special pricing for bulk orders and trade professionals. Please contact us at hello@krearte.com or call +62 877-0566-1978 to discuss your project requirements and receive a custom quote."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
                Help Center
              </p>
              <h1 className="font-sans text-4xl md:text-6xl font-light mb-6 text-krearte-black">
                Frequently Asked Questions
              </h1>
              <p className="text-lg font-light text-krearte-gray-600">
                Find answers to common questions about our products, services, and processes.
              </p>
            </div>

            {/* FAQ List */}
            <div className="space-y-4 mb-16">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-krearte-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-krearte-gray-50 transition-colors"
                  >
                    <span className="font-medium text-krearte-black pr-8">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-krearte-black flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-krearte-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5"
                    >
                      <p className="text-krearte-gray-600 font-light leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-krearte-gray-600 font-light mb-6">
                Still have questions? We're here to help.
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