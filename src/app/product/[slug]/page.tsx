// app/product/[slug]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingBag, ChevronLeft, Heart, Share2, Star, Package, Wrench } from "lucide-react";
import { useCart } from "@/lib/cart/context";
import { formatCurrency } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist/context";
import { useSession } from "next-auth/react";

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
  description: string;
  category: string;
  price: number;
  images: string[];
  sizes: ProductSize[];
  availableMaterialIds?: string[];
  recommendedMaterialIds?: string[];
  is25DEligible?: boolean;
  collectionType?: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  width: string | null;
  effectiveWidth?: number | null;
  pricePerM2: number;
  designerPricePerM2?: number;
  resellerPricePerM2?: number;
  samplePriceA3: number;
  waste: number;
  stock: number;
  is25DEligible: boolean;
  description: string | null;
  isRecommended?: boolean;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "service" | "effect";
}

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
}

export default function ProductDetail() {
  const params = useParams();
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  const [widthCm, setWidthCm] = useState<number>(100);
  const [heightCm, setHeightCm] = useState<number>(100);
  
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const materialContainerRef = useRef<HTMLDivElement>(null);
  
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isAddOnsOpen, setIsAddOnsOpen] = useState(false);
  
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${params.slug}`);
        const result = await response.json();
        
        if (result.success) {
          setProduct(result.data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  useEffect(() => {
    async function fetchMaterials() {
      if (!params.slug || !product) return;
      
      try {
        const response = await fetch(`/api/products/${params.slug}/materials`);
        const result = await response.json();
        
        if (result.success) {
          const allItems = result.materials || [];
          
          const materialsOnly = allItems.filter((m: Material) => {
            const cat = m.category.toLowerCase();
            const name = m.name.toLowerCase();
            
            return !cat.includes('service') && 
                   !cat.includes('jasa') && 
                   !cat.includes('add-on') &&
                   !cat.includes('print') &&
                   !cat.includes('design') &&
                   !name.includes('2.5d') &&
                   !name.includes('sample') &&
                   m.pricePerM2 > 0;
          });

          const servicesOnly = allItems.filter((m: Material) => {
            const cat = m.category.toLowerCase();
            const name = m.name.toLowerCase();
            
            const isService = cat.includes('service') || 
                             cat.includes('jasa') || 
                             cat.includes('add-on') ||
                             cat.includes('print') ||
                             cat.includes('design');
            
            const isSample = name.includes('sample') || cat.includes('sample');
            
            return isService && !isSample;
          }).map((service: Material) => ({
            id: service.id,
            name: service.name,
            description: service.description || '',
            price: service.pricePerM2,
            type: 'service' as const
          }));
          
          const isDesignerCollection = product.collectionType === 'designer' || product.is25DEligible;
          
          let allAddOns = [...servicesOnly];
          
          if (isDesignerCollection && product.is25DEligible) {
            const existing25D = allItems.find((m: Material) => 
              m.name.toLowerCase().includes('2.5d') || 
              m.name.toLowerCase().includes('25d')
            );
            
            if (existing25D) {
              allAddOns.push({
                id: existing25D.id,
                name: existing25D.name,
                description: existing25D.description || 'Raised texture effect',
                price: existing25D.pricePerM2,
                type: 'effect' as const
              });
            } else {
              allAddOns.push({
                id: '25d-effect',
                name: '2.5D Print Effect',
                description: 'Raised texture that you can feel - adds depth and luxury',
                price: 500000,
                type: 'effect' as const
              });
            }
          }
          
          setMaterials(materialsOnly);
          setAddOns(allAddOns);
          setPriceRange(result.priceRange || { min: 0, max: 0 });
          
          const recommended = materialsOnly?.find((m: Material) => m.isRecommended);
          if (recommended) {
            setSelectedMaterial(recommended);
          } else if (materialsOnly?.length > 0) {
            setSelectedMaterial(materialsOnly[0]);
          }
        } else {
          setPriceRange({ min: product.price, max: product.price });
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
        if (product) {
          setPriceRange({ min: product.price, max: product.price });
        }
      } finally {
        setLoadingMaterials(false);
      }
    }

    fetchMaterials();
  }, [params.slug, product]);

  useEffect(() => {
    const container = materialContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      container.scrollTop += e.deltaY;
    };

    container.addEventListener('wheel', handleWheel, { 
      passive: false,
      capture: true
    });
      
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [materials]);

  const getPriceByRole = (material: Material) => {
    const userRole = session?.user?.role as string || 'customer';
    
    if (userRole === 'reseller' && material.resellerPricePerM2) {
      return { 
        price: material.resellerPricePerM2, 
        label: 'Reseller Price', 
        discount: material.pricePerM2 - material.resellerPricePerM2 
      };
    }
    if (userRole === 'designer' && material.designerPricePerM2) {
      return { 
        price: material.designerPricePerM2, 
        label: 'Designer Price', 
        discount: material.pricePerM2 - material.designerPricePerM2 
      };
    }
    return { 
      price: material.pricePerM2, 
      label: 'Retail Price', 
      discount: 0 
    };
  };

  // ✅ UPDATED: Panel info dengan perhitungan yang benar
  const getPanelInfo = () => {
    if (!selectedMaterial) return null;
    
    const effectiveWidth = selectedMaterial.effectiveWidth || 
                          (selectedMaterial.width ? parseFloat(selectedMaterial.width) : 1.03);
    
    // ✅ Print area WITH bleed (width+6cm, height+6cm)
    const printWidthCm = widthCm + 6;
    const printHeightCm = heightCm + 6;
    
    // ✅ Round to 2 decimals
    const printArea = Math.round(((printWidthCm / 100) * (printHeightCm / 100)) * 100) / 100;
    
    // Hitung panel menggunakan effectiveWidth
    const panelsNeeded = Math.ceil(printWidthCm / (effectiveWidth * 100));
    
    // ✅ FIX: Tambah trim allowance 4cm untuk atas/bawah
    const trimAllowanceCm = 4;
    const materialHeightPerPanelM = (printHeightCm + trimAllowanceCm) / 100;
    
    // Total material area
    const totalPanelArea = panelsNeeded * effectiveWidth * materialHeightPerPanelM;
    
    // ✅ Round totalPanelArea to 2 decimals
    const roundedTotalPanelArea = Math.round(totalPanelArea * 100) / 100;
    
    // Waste = Material Needed - Print Area
    const wasteArea = Math.round((roundedTotalPanelArea - printArea) * 100) / 100;
    
    return {
      printWidthCm,
      printHeightCm,
      printArea,
      panelsNeeded,
      wasteArea,
      totalPanelArea: roundedTotalPanelArea,
      effectiveWidth,
    };
  };

  // ✅ UPDATED: Calculate total price dengan logika yang benar
  const calculateTotalPrice = () => {
    if (!selectedMaterial && product) {
      const areaM2 = (widthCm / 100) * (heightCm / 100);
      return (product.price + 60000) * areaM2;
    }
    if (!selectedMaterial) return 0;
    
    const effectiveWidth = selectedMaterial.effectiveWidth || 
                          (selectedMaterial.width ? parseFloat(selectedMaterial.width) : 1.03);
    
    // ✅ Print area WITH bleed
    const printWidthCm = widthCm + 6;
    const printHeightCm = heightCm + 6;
    const printArea = Math.round(((printWidthCm / 100) * (printHeightCm / 100)) * 100) / 100;
    
    // Hitung panel
    const panelsNeeded = Math.ceil(printWidthCm / (effectiveWidth * 100));
    
    // ✅ FIX: Tambah trim allowance
    const trimAllowanceCm = 4;
    const materialHeightPerPanelM = (printHeightCm + trimAllowanceCm) / 100;
    
    // Total material area
    const totalPanelArea = Math.round((panelsNeeded * effectiveWidth * materialHeightPerPanelM) * 100) / 100;
    
    // Waste
    const wasteArea = Math.round((totalPanelArea - printArea) * 100) / 100;
    
    const { price: materialPrice } = getPriceByRole(selectedMaterial);
    const wastePrice = selectedMaterial.waste || 60000;

    // ✅ Material cost dari PRINT AREA
    const materialCost = Math.round(printArea * materialPrice);
    
    // ✅ Waste cost dari WASTE AREA
    const wasteCost = Math.round(wasteArea * wastePrice);
    
    let totalPrice = materialCost + wasteCost;
    
    // ✅ Add-Ons calculation dengan Math.round
    selectedAddOns.forEach(addOnId => {
      const addOn = addOns.find(a => a.id === addOnId);
      if (addOn) {
        if (addOn.type === 'effect') {
          // ✅ 2.5D Effect: harga per m² × print area
          const addonCost = Math.round(addOn.price * printArea);
          totalPrice += addonCost;
        } else {
          // Service: harga fixed
          totalPrice += addOn.price;
        }
      }
    });
    
    return totalPrice;
  };

  // ✅ FIX: Function untuk hitung add-on total
  const calculateAddOnTotal = (addOnId: string) => {
    const addOn = addOns.find(a => a.id === addOnId);
    if (!addOn || !panelInfo) return 0;
    
    if (addOn.type === 'effect') {
      return Math.round(addOn.price * panelInfo.printArea);
    }
    return addOn.price;
  };

  const calculatedPrice = calculateTotalPrice();
  const areaM2 = (widthCm / 100) * (heightCm / 100);
  const panelInfo = getPanelInfo();

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const material = selectedMaterial || {
      id: 'fallback',
      name: 'Standard Material',
      pricePerM2: product.price,
      waste: 60000,
      width: 'N/A',
      effectiveWidth: null,
      category: 'fallback',
      samplePriceA3: 50000,
      stock: 999,
      is25DEligible: false,
      description: null
    };
    
    const firstImage = product.images?.find(
      img => !img.endsWith('.mp4') && !img.endsWith('.webm')
    ) || product.images?.[0] || "";
    
    const selectedAddOnNames = addOns
      .filter(a => selectedAddOns.includes(a.id))
      .map(a => a.name);
    
    const cartItem = {
      id: `${product.id}-${material.id}-${widthCm}x${heightCm}${selectedAddOns.join('-')}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      materialId: material.id,
      materialName: material.name,
      pricePerM2: material.pricePerM2,
      wasteCost: material.waste,
      areaM2: areaM2,
      price: calculateTotalPrice(),
      quantity: 1,
      size: `${widthCm}cm × ${heightCm}cm`,
      widthCm: widthCm,
      heightCm: heightCm,
      image: firstImage,
      addOns: selectedAddOnNames,
    };
    
    addToCart(cartItem);
  };

  const handleShare = async () => {
    if (!product) return;
    
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `${product.name} | Krearte`;
    const shareText = `Check out ${product.name} - Luxury wallcovering from Krearte`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        console.log('✅ Shared successfully');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('✅ Link copied to clipboard!');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      alert('✅ Link copied to clipboard!');
    } catch (err) {
      window.confirm('Unable to copy. Please copy manually:\n\n' + text);
    }
    document.body.removeChild(textArea);
  };

  const handleWishlist = async () => {
    if (!product) return;
    const firstImage = product.images?.find(
      img => !img.endsWith('.mp4') && !img.endsWith('.webm')
    ) || product.images?.[0] || "";
    
    const wishlistItem: WishlistItem = {
      id: product.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: firstImage,
      price: calculatedPrice || product.price,
    };
    
    await toggleWishlist(wishlistItem);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-sans text-3xl font-light mb-4">Product Not Found</h1>
          <Link href="/collection/wallcovering" className="text-krearte-black font-medium border-b border-krearte-black pb-0.5">
            Back to Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      <div className="container mx-auto px-6 md:px-12 py-6">
        <Link href="/collection/wallcovering" className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Collection
        </Link>
      </div>

      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
            
            {/* LEFT: Product Images */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="aspect-[16/9] bg-krearte-gray-100 overflow-hidden rounded-lg">
                {product.images && product.images.length > 0 ? (
                  (() => {
                    const currentMedia = product.images[selectedImage];
                    const isVideo = currentMedia?.endsWith('.mp4') || currentMedia?.endsWith('.webm');
                    
                    return isVideo ? (
                      <video src={currentMedia} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={currentMedia} alt={`${product.name} ${selectedImage + 1}`} className="w-full h-full object-cover" />
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                    <span className="text-9xl font-light">{product.name.charAt(0)}</span>
                  </div>
                )}
              </motion.div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                        selectedImage === index ? "border-2 border-krearte-black shadow-md" : "border-2 border-transparent hover:border-krearte-gray-300"
                      }`}
                    >
                      {img.endsWith('.mp4') || img.endsWith('.webm') ? (
                        <>
                          <video src={img} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <svg className="w-6 h-6 text-krearte-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Info */}
            <div className="lg:py-12">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-sm font-light text-krearte-gray-600 mb-4 capitalize">{product.category}</p>
                <h1 className="font-sans text-4xl md:text-5xl font-light mb-6 text-krearte-black">{product.name}</h1>

                <div className="mb-8">
                  {loadingMaterials ? (
                    <div className="h-8 w-64 bg-krearte-gray-200 animate-pulse rounded" />
                  ) : selectedMaterial ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <p className="text-2xl font-normal text-krearte-black">
                          {formatCurrency(getPriceByRole(selectedMaterial).price)}
                        </p>
                        <span className="text-sm font-light text-krearte-gray-500">/m² (belum termasuk waste)</span>
                        {session?.user?.role && session.user.role !== 'customer' && (
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            session.user.role === 'designer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getPriceByRole(selectedMaterial).label}
                          </span>
                        )}
                      </div>
                      {getPriceByRole(selectedMaterial).discount > 0 && (
                        <p className="text-sm text-green-600 font-light">You save: {formatCurrency(getPriceByRole(selectedMaterial).discount)}/m²</p>
                      )}
                    </div>
                  ) : materials.length > 0 ? (
                    <p className="text-2xl font-normal text-krearte-black">
                      Start from {formatCurrency(priceRange.min)}
                      {priceRange.max !== priceRange.min && (
                        <span className="text-lg font-light text-krearte-gray-500 ml-2">- {formatCurrency(priceRange.max)}</span>
                      )}
                      <span className="text-sm font-light text-krearte-gray-500 ml-2">/m²</span>
                    </p>
                  ) : (
                    <p className="text-2xl font-normal text-krearte-black">
                      {formatCurrency(product.price)}
                      <span className="text-sm font-light text-krearte-gray-500 ml-2">/m²</span>
                    </p>
                  )}
                </div>

                <p className="font-light text-krearte-gray-700 leading-relaxed mb-8">{product.description}</p>

                {/* Material Selector */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-krearte-black" />
                      <label className="text-sm font-normal text-krearte-black">Select Material</label>
                    </div>
                    {selectedMaterial?.width && (
                      <span className="text-sm font-light text-krearte-gray-600">
                        Width: {selectedMaterial.width}m
                        {selectedMaterial.effectiveWidth && (
                          <span className="text-krearte-gray-400"> (print: {selectedMaterial.effectiveWidth}m)</span>
                        )}
                      </span>
                    )}
                  </div>

                  {loadingMaterials ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-krearte-gray-200 animate-pulse rounded" />
                      ))}
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="p-4 bg-krearte-gray-50 rounded-lg border border-krearte-gray-200">
                      <p className="text-sm font-light text-krearte-gray-600">No materials available.</p>
                    </div>
                  ) : (
                    <div ref={materialContainerRef} className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {materials.map((material) => (
                        <button
                          key={material.id}
                          onClick={() => setSelectedMaterial(material)}
                          className={`w-full p-4 border-2 text-left transition-all rounded-lg ${
                            selectedMaterial?.id === material.id ? "border-krearte-black bg-krearte-gray-50" : "border-krearte-gray-200 hover:border-krearte-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-normal text-krearte-black">{material.name}</span>
                                {material.isRecommended && <span className="text-yellow-500">⭐</span>}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-normal text-krearte-black text-sm">{formatCurrency(getPriceByRole(material).price)}</p>
                              <p className="text-xs font-light text-krearte-gray-500">+ {formatCurrency(material.waste)} waste</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add-Ons Section */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setIsAddOnsOpen(!isAddOnsOpen)}
                    className="w-full flex items-center justify-between p-4 bg-krearte-gray-50 border-2 border-krearte-gray-200 rounded-lg hover:border-krearte-black transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-krearte-black" />
                      <span className="text-sm font-normal text-krearte-black">Add-On Services</span>
                      {addOns.length > 0 && <span className="text-xs text-krearte-gray-500">({selectedAddOns.length} selected)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedAddOns.length > 0 && panelInfo && (
                        <span className="text-sm font-normal text-krearte-black">
                          {formatCurrency(
                            selectedAddOns.reduce((total, addOnId) => {
                              return total + calculateAddOnTotal(addOnId);
                            }, 0)
                          )}
                        </span>
                      )}
                      <svg className={`w-5 h-5 text-krearte-gray-600 transition-transform duration-200 ${isAddOnsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  <motion.div initial={false} animate={{ height: isAddOnsOpen ? 'auto' : 0, opacity: isAddOnsOpen ? 1 : 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="pt-4 space-y-3">
                      {addOns.map((addOn) => (
                        <label key={addOn.id} className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${selectedAddOns.includes(addOn.id) ? "border-krearte-black bg-krearte-gray-50" : "border-krearte-gray-200 hover:border-krearte-gray-300"}`}>
                          <input type="checkbox" checked={selectedAddOns.includes(addOn.id)} onChange={() => toggleAddOn(addOn.id)} className="w-4 h-4 mt-0.5 accent-krearte-black" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-normal text-krearte-black text-sm">{addOn.name}</span>
                              <span className="font-normal text-krearte-black text-sm">
                                {addOn.type === 'effect' && panelInfo 
                                  ? `${formatCurrency(addOn.price)}/m²`
                                  : formatCurrency(addOn.price)
                                }
                              </span>
                            </div>
                            <p className="text-xs font-light text-krearte-gray-500 mb-1">{addOn.description}</p>
                            {addOn.type === 'effect' && panelInfo && (
                              <p className="text-xs text-krearte-gray-400">
                                = {formatCurrency(Math.round(addOn.price * panelInfo.printArea))} for {panelInfo.printArea.toFixed(2)} m²
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Dimensions Calculator */}
                <div className="mb-8">
                  <label className="block text-sm font-normal text-krearte-black mb-4">Dimensions (centimeters)</label>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-light text-krearte-gray-600 mb-2">Width (cm)</label>
                      <input type="number" value={widthCm} onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)} onBlur={(e) => setWidthCm(Math.max(10, parseFloat(e.target.value) || 100))} step="1" min="1" className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light" />
                    </div>
                    <div>
                      <label className="block text-xs font-light text-krearte-gray-600 mb-2">Height (cm)</label>
                      <input type="number" value={heightCm} onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)} onBlur={(e) => setHeightCm(Math.max(10, parseFloat(e.target.value) || 100))} step="1" min="1" className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light" />
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {(selectedMaterial || materials.length === 0) && panelInfo && (
                    <div className="p-4 bg-krearte-gray-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm border-b border-krearte-gray-200 pb-2">
                        <span className="font-light text-krearte-gray-600">Dimensions:</span>
                        <span className="font-normal text-krearte-black">{widthCm}cm × {heightCm}cm</span>
                      </div>
                      
                      <div className="flex justify-between text-sm border-b border-krearte-gray-200 pb-2">
                        <span className="font-light text-krearte-gray-600">With 3cm overlap:</span>
                        <span className="font-normal text-krearte-black">{panelInfo.printWidthCm}cm × {panelInfo.printHeightCm}cm = {panelInfo.printArea.toFixed(2)} m²</span>
                      </div>
                      
                      {selectedMaterial && (
                        <>
                          <div className="flex justify-between text-sm border-b border-krearte-gray-200 pb-2">
                            <span className="font-light text-krearte-gray-600">Effective width per panel:</span>
                            <span className="font-normal text-krearte-black">{panelInfo.effectiveWidth.toFixed(2)}m</span>
                          </div>
                          
                          <div className="flex justify-between text-sm border-b border-krearte-gray-200 pb-2">
                            <span className="font-light text-krearte-gray-600">Panels needed:</span>
                            <span className="font-normal text-krearte-black">{panelInfo.panelsNeeded} panel(s)</span>
                          </div>
                          
                          <div className="flex justify-between text-sm border-b border-krearte-gray-200 pb-2">
                            <span className="font-light text-krearte-gray-600">Print Area:</span>
                            <span className="font-normal text-krearte-black">{panelInfo.printArea.toFixed(2)} m²</span>
                          </div>
                          
                          <div className="flex justify-between text-sm border-b border-krearte-gray-200 pb-2">
                            <span className="font-light text-krearte-gray-600">Waste:</span>
                            <span className="font-normal text-orange-600">{panelInfo.wasteArea.toFixed(2)} m²</span>
                          </div>
                          
                          <div className="flex justify-between text-sm mt-2">
                            <span className="font-light text-krearte-gray-600">Material ({getPriceByRole(selectedMaterial).label}):</span>
                            <span className="font-light text-krearte-black">{formatCurrency(getPriceByRole(selectedMaterial).price)} × {panelInfo.printArea.toFixed(2)} m²</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="font-light text-krearte-gray-600">Waste (cutting):</span>
                            <span className="font-light text-krearte-black">{formatCurrency(selectedMaterial.waste || 60000)} × {panelInfo.wasteArea.toFixed(2)} m²</span>
                          </div>
                        </>
                      )}
                      
                      {/* Add-Ons Breakdown */}
                      {selectedAddOns.length > 0 && (
                        <div className="border-t border-krearte-gray-200 pt-2 mt-2 space-y-1">
                          <p className="text-xs font-medium text-krearte-gray-600 mb-2">Add-Ons:</p>
                          {selectedAddOns.map(addOnId => {
                            const addOn = addOns.find(a => a.id === addOnId);
                            if (!addOn) return null;
                            
                            const addOnTotal = calculateAddOnTotal(addOnId);
                            
                            return (
                              <div key={addOnId} className="flex justify-between text-sm">
                                <span className="font-light text-krearte-gray-600">
                                  {addOn.name}:
                                  {addOn.type === 'effect' && panelInfo && (
                                    <span className="text-xs text-krearte-gray-400 ml-1">
                                      ({formatCurrency(addOn.price)}/m² × {panelInfo.printArea.toFixed(2)} m²)
                                    </span>
                                  )}
                                </span>
                                <span className="font-light text-krearte-black">{formatCurrency(addOnTotal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="border-t border-krearte-gray-200 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-normal text-krearte-black">Total:</span>
                          <span className="text-lg font-normal text-krearte-black">{formatCurrency(calculateTotalPrice())}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add to Cart Button */}
                <motion.button
                  whileHover={selectedMaterial || materials.length === 0 ? { scale: 1.02 } : {}}
                  whileTap={selectedMaterial || materials.length === 0 ? { scale: 0.98 } : {}}
                  onClick={handleAddToCart}
                  disabled={!selectedMaterial && materials.length > 0}
                  className={`w-full py-4 text-sm font-medium transition-all duration-300 mb-4 ${
                    selectedMaterial || materials.length === 0 ? "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal cursor-pointer" : "bg-krearte-gray-200 text-krearte-gray-400 cursor-not-allowed"
                  }`}
                >
                  {selectedMaterial || materials.length === 0 ? `Add to Cart - ${formatCurrency(calculatedPrice)}` : "Select a Material"}
                </motion.button>

                {/* Sample & Custom Print Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Link href={`/product/${product.slug}/sample`} className="flex items-center justify-center gap-2 py-3 border border-krearte-black text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Order Sample
                  </Link>
                  <Link href="/custom" className="flex items-center justify-center gap-2 py-3 border border-krearte-black text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                    Custom Print
                  </Link>
                </div>

                {/* Share & Wishlist */}
                <div className="mt-8 flex items-center gap-4">
                  <button onClick={handleWishlist} disabled={wishlistLoading} className={`flex items-center gap-2 text-sm font-light transition-colors ${isInWishlist(product?.id || "") ? "text-red-500" : "text-krearte-gray-600 hover:text-krearte-black"} ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <Heart className={`w-5 h-5 ${isInWishlist(product?.id || "") ? "fill-current" : ""}`} />
                    {wishlistLoading ? "..." : isInWishlist(product?.id || "") ? "Wishlisted" : "Add to Wishlist"}
                  </button>
                  
                  <button type="button" onClick={handleShare} className="flex items-center gap-2 text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors cursor-pointer">
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}