"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  description: string | null;
  createdAt: string;
}

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const categories = ["All", "general", "residential", "commercial", "custom", "installation"];

  // ✅ Fetch data dari database
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gallery");
      const result = await response.json();
      
      if (result.success) {
        setGalleryItems(result.gallery || []);
      } else {
        console.error("Failed to fetch gallery:", result.error);
      }
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory);

  const openLightbox = (id: string) => {
    setSelectedImage(id);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    const currentIndex = filteredItems.findIndex(item => item.id === selectedImage);
    const newIndex = direction === "prev"
      ? (currentIndex - 1 + filteredItems.length) % filteredItems.length
      : (currentIndex + 1) % filteredItems.length;
    setSelectedImage(filteredItems[newIndex].id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

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
                className={`text-sm font-light whitespace-nowrap transition-colors capitalize ${
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
          {filteredItems.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-krearte-gray-500 text-lg font-light">
                No gallery items found
              </p>
            </div>
          ) : (
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
                    className={`relative group overflow-hidden bg-krearte-gray-100 cursor-pointer ${
                      index % 5 === 0 ? "md:col-span-2 md:row-span-2" : ""
                    }`}
                    onClick={() => openLightbox(item.id)}
                  >
                    {/* ✅ Image dari database */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-krearte-black/0 group-hover:bg-krearte-black/40 transition-colors duration-500 flex flex-col justify-end p-6">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-krearte-white text-xs font-medium tracking-widest uppercase mb-2">
                          {item.category}
                        </p>
                        <h3 className="text-krearte-white text-lg font-light mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-krearte-gray-300 text-sm font-light line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
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
                const item = filteredItems.find(i => i.id === selectedImage);
                return item ? (
                  <>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-auto max-h-[70vh] object-contain"
                    />
                    <div className="mt-6 text-center">
                      <h3 className="text-krearte-white text-2xl font-light mb-2">
                        {item.title}
                      </h3>
                      <p className="text-krearte-gray-400 text-sm font-light capitalize">
                        {item.category}
                      </p>
                      {item.description && (
                        <p className="text-krearte-gray-400 text-sm font-light mt-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </>
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