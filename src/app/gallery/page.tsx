"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";

// Sample Gallery Data
const galleryItems = [
  { id: 1, category: "Wallcovering", title: "Kyoto Installation", location: "Tokyo, Japan", image: "/images/gallery-1.jpg", span: "md:col-span-2 md:row-span-2" },
  { id: 2, category: "Designer", title: "Minimal Study", location: "New York, USA", image: "/images/gallery-2.jpg", span: "md:col-span-1" },
  { id: 3, category: "Custom", title: "Bespoke Pattern", location: "London, UK", image: "/images/gallery-3.jpg", span: "md:col-span-1" },
  { id: 4, category: "Wallcovering", title: "Abstract Flow", location: "Berlin, Germany", image: "/images/gallery-4.jpg", span: "md:col-span-1" },
  { id: 5, category: "Designer", title: "Signature Series", location: "Paris, France", image: "/images/gallery-5.jpg", span: "md:col-span-1 md:row-span-2" },
  { id: 6, category: "Custom", title: "Corporate Office", location: "Singapore", image: "/images/gallery-6.jpg", span: "md:col-span-2" },
  { id: 7, category: "Wallcovering", title: "Texture Detail", location: "Amsterdam, NL", image: "/images/gallery-7.jpg", span: "md:col-span-1" },
  { id: 8, category: "Designer", title: "Limited Edition", location: "Milan, Italy", image: "/images/gallery-8.jpg", span: "md:col-span-1" },
];

const categories = ["All", "Wallcovering", "Designer", "Custom"];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredItems = selectedCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory);

  const openLightbox = (id: number) => {
    setSelectedImage(id);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    const currentIndex = galleryItems.findIndex(item => item.id === selectedImage);
    const newIndex = direction === "prev"
      ? (currentIndex - 1 + galleryItems.length) % galleryItems.length
      : (currentIndex + 1) % galleryItems.length;
    setSelectedImage(galleryItems[newIndex].id);
  };

  return (
    <div className="min-h-screen bg-krearte-cream">
      
      {/* ==================== GALLERY HEADER ==================== */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-krearte-white border-b border-krearte-gray-100">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500 mb-4 block">
              Portfolio
            </span>
            <h1 className="font-sans text-4xl md:text-6xl font-light mb-6">
              Gallery
            </h1>
            <p className="text-krearte-gray-600 text-lg font-light leading-relaxed">
              Explore our curated collection of installations and projects 
              from around the world. Each space tells a unique story.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ==================== FILTER BAR ==================== */}
      <section className="sticky top-16 md:top-20 z-40 bg-krearte-cream/95 backdrop-blur-md border-b border-krearte-gray-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex items-center gap-6 py-6 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-sm font-light whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "text-krearte-black font-normal"
                    : "text-krearte-gray-500 hover:text-krearte-black"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== GALLERY GRID ==================== */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px]"
          >
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`relative group overflow-hidden bg-krearte-gray-100 cursor-pointer ${item.span}`}
                  onClick={() => openLightbox(item.id)}
                >
                  {/* Image Placeholder */}
                  <div className="w-full h-full flex items-center justify-center text-krearte-gray-400 group-hover:scale-105 transition-transform duration-700">
                    <span className="text-sm font-light">{item.title}</span>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-krearte-black/0 group-hover:bg-krearte-black/40 transition-colors duration-500 flex flex-col justify-end p-6">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-krearte-white text-xs font-medium tracking-widest uppercase mb-2">
                        {item.category}
                      </p>
                      <h3 className="text-krearte-white text-lg font-light mb-1">
                        {item.title}
                      </h3>
                      <p className="text-krearte-gray-300 text-sm font-light">
                        {item.location}
                      </p>
                    </div>
                  </div>

                  {/* View Icon */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Maximize2 className="w-5 h-5 text-krearte-white" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ==================== LIGHTBOX ==================== */}
      <AnimatePresence>
        {lightboxOpen && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-krearte-black/95 backdrop-blur-md flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 text-krearte-white hover:text-krearte-gray-300 transition-colors z-50"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("prev"); }}
              className="absolute left-6 p-2 text-krearte-white hover:text-krearte-gray-300 transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("next"); }}
              className="absolute right-6 p-2 text-krearte-white hover:text-krearte-gray-300 transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl max-h-[80vh] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const item = galleryItems.find(i => i.id === selectedImage);
                return item ? (
                  <div className="bg-krearte-gray-800 aspect-[4/3] flex items-center justify-center text-krearte-gray-400">
                    <span className="text-sm font-light">{item.title}</span>
                  </div>
                ) : null;
              })()}
              
              {/* Image Info */}
              {(() => {
                const item = galleryItems.find(i => i.id === selectedImage);
                return item ? (
                  <div className="mt-6 text-center">
                    <h3 className="text-krearte-white text-2xl font-light mb-2">
                      {item.title}
                    </h3>
                    <p className="text-krearte-gray-400 text-sm font-light">
                      {item.location}
                    </p>
                  </div>
                ) : null;
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CTA SECTION ==================== */}
      <section className="py-24 bg-krearte-white border-t border-krearte-gray-100">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-sans text-3xl md:text-4xl font-light mb-6">
              Ready to Start Your Project?
            </h2>
            <p className="text-krearte-gray-600 mb-8 max-w-xl mx-auto font-light">
              Let us help you create a space that reflects your vision and style.
            </p>
            <Link
              href="/custom"
              className="inline-flex items-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors"
            >
              Get in Touch
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}