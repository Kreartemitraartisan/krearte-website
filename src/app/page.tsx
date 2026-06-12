// app/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

// ================= INTERFACES =================
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
  category_slug?: string | null;
  price: number;
  images: string[] | null;
  sizes: ProductSize[];
  collectionType?: string;
  priceRange?: { min: number; max: number } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collection_type: string;
  parent_id: string | null;
}

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
}

// ================= CONSTANTS =================
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Flower & Leaves",
    slug: "flower-leaves",
    description: "Beautiful floral patterns and botanical leaf designs",
    image_url: null,
    collection_type: "wallcovering",
    parent_id: null,
  },
  {
    id: "2",
    name: "Chinoiserie",
    slug: "chinoiserie",
    description: "Asian-inspired oriental designs with traditional motifs",
    image_url: null,
    collection_type: "wallcovering",
    parent_id: null,
  },
  {
    id: "3",
    name: "Lotus",
    slug: "lotus",
    description: "Sacred lotus flower patterns and water garden themes",
    image_url: null,
    collection_type: "wallcovering",
    parent_id: null,
  },
];

// Shuffle interval: 3 menit (180000 ms)
const SHUFFLE_INTERVAL = 3 * 60 * 1000;

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.4], [1, 0.6]);
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [categoryImageIndex, setCategoryImageIndex] = useState<Record<string, number>>({});
  
  const shuffleInitialized = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Products dari API ADMIN
  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('🔍 Fetching all products from admin API...');
        
        const response = await fetch("/api/admin/products");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        console.log('📦 Products API response:', {
          success: result.success,
          count: result.products?.length
        });
        
        if (result.success) {
          // ✅ Ambil SEMUA products yang punya images (tidak difilter collectionType)
          const allProducts = (result.products || [])
            .filter((p: Product) => p.images && p.images.length > 0);
          
          console.log(`✅ Loaded ${allProducts.length} products with images`);
          setFeaturedProducts(allProducts);
        }
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  // 2. Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories?collectionType=wallcovering&parentId=null');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (result.success && result.categories && result.categories.length > 0) {
          setCategories(result.categories.slice(0, 3));
          console.log('✅ Categories loaded:', result.categories.slice(0, 3).map((c: Category) => c.slug));
        } else {
          setCategories(FALLBACK_CATEGORIES);
          console.log('⚠️ Using fallback categories');
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // 3. Fetch Gallery Items
  useEffect(() => {
    async function fetchGallery() {
      try {
        const response = await fetch('/api/gallery');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (result.success && result.gallery && result.gallery.length > 0) {
          setGalleryItems(result.gallery.slice(0, 6));
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoadingGallery(false);
      }
    }
    fetchGallery();
  }, []);

  // ✅ 4. Helper: Match product ke category berdasarkan category_slug atau category
  const matchProductToCategory = useCallback((product: Product, category: Category): boolean => {
    // Priority 1: Match by category_slug (exact match)
    if (product.category_slug && product.category_slug === category.slug) {
      return true;
    }
    
    // Priority 2: Match by category field (case-insensitive)
    if (product.category && product.category.toLowerCase() === category.name.toLowerCase()) {
      return true;
    }
    
    // Priority 3: Match by category field contains category slug
    if (product.category && product.category.toLowerCase().includes(category.slug.toLowerCase())) {
      return true;
    }
    
    return false;
  }, []);

  // ✅ 5. Shuffle Logic - Ganti gambar setiap 3 menit
  useEffect(() => {
    if (categories.length === 0 || featuredProducts.length === 0) return;
    
    const performShuffle = () => {
      console.log('🎲 Performing shuffle...');
      const newIndex: Record<string, number> = {};
      
      categories.forEach((category) => {
        // ✅ Cari products yang match dengan category ini berdasarkan category_slug/category
        const categoryProducts = featuredProducts.filter(p => matchProductToCategory(p, category));
        
        console.log(`📊 [${category.name} (${category.slug})] Found ${categoryProducts.length} matching products`);
        
        if (categoryProducts.length > 0) {
          // Pilih random index
          newIndex[category.id] = Math.floor(Math.random() * categoryProducts.length);
        } else {
          // Fallback: pakai index 0
          newIndex[category.id] = 0;
        }
      });
      
      setCategoryImageIndex(newIndex);
    };

    // Jalankan shuffle pertama kali
    performShuffle();
    shuffleInitialized.current = true;
    
    // Setup interval untuk shuffle setiap 3 menit
    intervalRef.current = setInterval(performShuffle, SHUFFLE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [categories, featuredProducts, matchProductToCategory]);

  // ✅ 6. Helper: Ambil gambar kategori dari product yang sesuai category
  const getCategoryHeroImage = useCallback((category: Category): { image: string | null; productName: string } => {
    // Priority 1: category.image_url dari database
    if (category.image_url) {
      return { image: category.image_url, productName: category.name };
    }
    
    // Priority 2: Cari product yang match dengan category berdasarkan category_slug/category
    const categoryProducts = featuredProducts.filter(p => matchProductToCategory(p, category));
    
    console.log(`🖼️ [${category.name}] Found ${categoryProducts.length} products for category ${category.slug}`);
    
    if (categoryProducts.length === 0) {
      // Fallback: pakai featured products pertama
      const fallbackProduct = featuredProducts[0];
      if (fallbackProduct?.images) {
        const img = fallbackProduct.images.find(i => i && !i.endsWith('.mp4') && !i.endsWith('.webm'));
        return { image: img || null, productName: fallbackProduct.name };
      }
      return { image: null, productName: category.name };
    }
    
    // Ambil product berdasarkan shuffle index
    const currentIndex = categoryImageIndex[category.id] ?? 0;
    const selectedProduct = categoryProducts[currentIndex] || categoryProducts[0];
    
    const images = selectedProduct?.images || [];
    const img = images.find(i => i && !i.endsWith('.mp4') && !i.endsWith('.webm'));
    
    return { image: img || null, productName: selectedProduct?.name || category.name };
  }, [featuredProducts, categoryImageIndex, matchProductToCategory]);

  // HELPER: Format price
  const formatProductPrice = (product: Product) => {
    if (product.priceRange && product.priceRange.min > 0) {
      const min = formatCurrency(product.priceRange.min);
      const max = product.priceRange.max !== product.priceRange.min 
        ? ` - ${formatCurrency(product.priceRange.max)}` 
        : '';
      return `Start from ${min}${max} <span class="text-sm text-krearte-gray-500 font-light">/m²</span>`;
    }
    if (product.price > 0) {
      return `Start from ${formatCurrency(product.price)} <span class="text-sm text-krearte-gray-500 font-light">/m²</span>`;
    }
    return `<span class="text-sm text-krearte-gray-400">Contact for pricing</span>`;
  };

  return (
    <div ref={containerRef} className="relative">
      
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/videos/wallpapers/dreamy-sky.mp4" type="video/mp4" />
            <img src="/images/dreamy-sky.jpg" alt="Luxury Wallpaper" className="w-full h-full object-cover" />
          </video>
          <div className="absolute inset-0 bg-krearte-cream/30" />
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-between items-center mb-16 md:mb-24">
              <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500">Krearte</span>
              <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500">01 / 03</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="font-sans text-5xl md:text-7xl lg:text-8xl font-light leading-[1.1] tracking-tight text-krearte-black">
              <span className="block">Luxury</span>
              <span className="block font-normal mt-2">Redefined</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-xl mb-16 editorial-line pl-8">
              <p className="text-lg md:text-xl text-krearte-gray-700 leading-relaxed font-light">
                Handcrafted wallcoverings and accessories that blend timeless elegance with contemporary design.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="flex flex-wrap gap-4">
              <Link href="/collection/wallcovering" className="group inline-flex items-center px-8 py-4 border border-krearte-black text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-all duration-500">
                Explore Collection
                <svg className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link href="/custom" className="inline-flex items-center px-8 py-4 text-krearte-black text-sm font-medium hover:text-krearte-gray-600 transition-colors">
                Custom Design
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-px h-16 bg-krearte-black/50" />
        </motion.div>
      </section>

      {/* ==================== FEATURED SECTION ==================== */}
      <section className="py-40 md:py-60 bg-krearte-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: 0.2 }} className="md:col-span-2">
              <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500 mb-6 block">Curated</span>
              <h2 className="font-sans text-3xl md:text-4xl font-light leading-tight mb-8">
                Timeless elegance, <br /><span className="font-normal">crafted for today.</span>
              </h2>
              <p className="text-krearte-gray-600 leading-relaxed mb-8 font-light max-w-2xl">
                Each piece is thoughtfully designed and meticulously crafted to bring you unparalleled quality that transcends seasons.
              </p>
              <Link href="/collection/wallcovering" className="inline-flex items-center text-krearte-black font-medium border-b border-krearte-black pb-0.5 hover:border-krearte-gray-400 transition-colors">
                View Collection
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== CATEGORIES SECTION ==================== */}
      <section className="py-40 md:py-60 bg-krearte-cream">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-16">
            <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500 mb-4 block">Shop by Category</span>
            <h2 className="font-sans text-4xl md:text-5xl font-light">Featured Collections</h2>
            <p className="text-sm text-krearte-gray-500 font-light mt-2">Images rotate every 3 minutes</p>
          </motion.div>

          {loadingCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-krearte-gray-200 mb-4 rounded-lg" />
                  <div className="h-6 bg-krearte-gray-200 w-3/4 rounded mb-2" />
                  <div className="h-4 bg-krearte-gray-200 w-full rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {categories.map((category, index) => {
                const { image: heroImage, productName } = getCategoryHeroImage(category);
                return (
                  <motion.div 
                    key={category.id} 
                    initial={{ opacity: 0, y: 40 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }} 
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link href={`/collection/wallcovering/${category.slug}`} className="group relative block aspect-[4/5] rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500">
                      {heroImage ? (
                        <img 
                          key={`${category.id}-${categoryImageIndex[category.id]}`} 
                          src={heroImage} 
                          alt={`${category.name} - ${productName}`} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          loading="lazy" 
                        />
                      ) : (
                        <div className="absolute inset-0 bg-krearte-gray-100 flex items-center justify-center">
                          <span className="text-8xl font-light text-krearte-gray-400">{category.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
                        <h3 className="font-sans text-2xl md:text-3xl font-normal text-white mb-2 drop-shadow-md group-hover:underline decoration-white/60 underline-offset-4 transition-all">{category.name}</h3>
                        {category.description && <p className="text-white/85 font-light text-sm md:text-base line-clamp-2 drop-shadow-sm leading-relaxed">{category.description}</p>}
                        <div className="mt-4 flex items-center text-white/90 text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                          Explore Collection
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="text-center mt-16">
            <Link href="/collection/wallcovering" className="inline-flex items-center text-krearte-black font-medium border-b border-krearte-black pb-0.5 hover:border-krearte-gray-400 transition-colors">
              View All Collections
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ==================== PRODUCTS SECTION ==================== */}
      <section className="py-40 md:py-60 bg-krearte-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-24">
            <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500 mb-4 block">New Arrivals</span>
            <h2 className="font-sans text-4xl md:text-5xl font-light">Featured Products</h2>
          </motion.div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-krearte-gray-200 mb-6 rounded-lg" />
                  <div className="h-6 bg-krearte-gray-200 mb-3 rounded" />
                  <div className="h-4 bg-krearte-gray-200 w-24 rounded" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-krearte-gray-500 font-light">No products found</p>
              <Link href="/admin/products" className="text-krearte-black font-medium underline mt-4 inline-block">Add Products in Admin</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {featuredProducts.slice(0, 6).map((product, productIndex) => {
                  const images = product.images || [];
                  const firstImage = images.find(img => img && !img.endsWith('.mp4') && !img.endsWith('.webm')) || images[0] || '';

                  return (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: productIndex * 0.1, ease: [0.16, 1, 0.3, 1] }} className="group cursor-pointer">
                      <Link href={`/product/${product.slug}`}>
                        <div className="aspect-[4/3] bg-krearte-gray-100 mb-6 overflow-hidden rounded-lg">
                          {firstImage ? (
                            <img src={firstImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                              <span className="text-6xl font-light">{product.name?.charAt(0) || 'P'}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-sans text-lg font-normal mb-3 group-hover:underline decoration-krearte-gray-300 underline-offset-4 transition-all">{product.name}</h4>
                          
                          <div className="text-krearte-black font-normal text-base" dangerouslySetInnerHTML={{ __html: formatProductPrice(product) }} />
                          
                          {product.description && <p className="text-sm text-krearte-gray-500 font-light mt-2 line-clamp-2">{product.description}</p>}
                          
                          <button type="button" className="w-full mt-4 py-3 bg-krearte-black text-krearte-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded">
                            Quick View
                          </button>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="text-center mt-24">
                <Link href="/collection/wallcovering" className="inline-flex items-center text-krearte-black font-medium border-b border-krearte-black pb-0.5 hover:border-krearte-gray-400 transition-colors">
                  View All Products
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* ==================== GALLERY SECTION ==================== */}
      <section className="py-40 md:py-60 bg-krearte-cream">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-16 md:mb-24">
            <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500 mb-4 block">Inspiration</span>
            <h2 className="font-sans text-4xl md:text-5xl font-light">Gallery</h2>
          </motion.div>

          {loadingGallery ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-krearte-gray-200 rounded-lg" />
              ))}
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-krearte-gray-500 font-light">No gallery items found</p>
              <Link href="/admin/gallery" className="text-krearte-black font-medium underline mt-4 inline-block">Add Gallery Items in Admin</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px]">
              {galleryItems.map((item, index) => {
                const spanClass = index === 0 ? "md:row-span-2 md:col-span-2" :
                                  index === 4 ? "md:col-span-1 md:row-span-2" :
                                  index === 5 ? "md:col-span-2" :
                                  "md:col-span-1";
                
                return (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    whileInView={{ opacity: 1, scale: 1 }} 
                    viewport={{ once: true, margin: "-50px" }} 
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }} 
                    className={`relative group overflow-hidden bg-krearte-gray-100 rounded-lg ${spanClass} cursor-pointer`}
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                        <span className="text-sm font-light">{item.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-krearte-black/0 group-hover:bg-krearte-black/40 transition-colors duration-500 flex items-center justify-center rounded-lg">
                      <span className="text-krearte-white text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 tracking-widest uppercase">View Project</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="text-center mt-16">
            <Link href="/gallery" className="inline-flex items-center text-krearte-black font-medium border-b border-krearte-black pb-0.5 hover:border-krearte-gray-400 transition-colors">
              View Full Gallery
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ==================== CUSTOM SECTION ==================== */}
      <section className="py-40 md:py-60 bg-krearte-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="text-center">
              <span className="text-xs font-medium tracking-widest uppercase text-krearte-gray-500 mb-6 block">Bespoke Service</span>
              <h2 className="font-sans text-4xl md:text-5xl font-light leading-tight mb-8">Custom with Us</h2>
              <p className="text-krearte-gray-600 leading-relaxed mb-12 font-light max-w-2xl mx-auto">
                Have a specific vision in mind? We work with you to create bespoke wallcoverings and accessories tailored to your space and style. From custom dimensions to unique patterns.
              </p>
              
              <div className="space-y-6 mb-12 max-w-xl mx-auto">
                {[
                  { title: "Custom Dimensions", desc: "Any size to fit your space perfectly" },
                  { title: "Pattern Customization", desc: "Modify colors, scale, or elements" },
                  { title: "Material Selection", desc: "Choose from premium sustainable materials" },
                ].map((option, index) => (
                  <motion.div key={option.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="text-left">
                    <h4 className="font-sans text-sm font-normal mb-1">{option.title}</h4>
                    <p className="text-krearte-gray-500 text-sm font-light">{option.desc}</p>
                  </motion.div>
                ))}
              </div>
              
              <Link href="/custom" className="inline-flex items-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors">
                Start Custom Project
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}