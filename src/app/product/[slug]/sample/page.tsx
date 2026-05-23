"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  samplePriceA3: number;
}

export default function SampleOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });

  // Sample prices based on pricelist 2026
  const getSamplePrice = (material: Material | null) => {
    if (!material) return 50000; // Default price
    
    // Auto-detect based on category
    if (material.category.includes("Non-Woven")) return 75000;
    if (material.category.includes("Fabric Back")) return 75000;
    if (material.category.includes("Special Effect")) return 65000;
    if (material.category.includes("Metallic")) return 65000;
    
    // Default for PVC, Standard, etc.
    return material.samplePriceA3 || 50000;
  };

  const samplePrice = getSamplePrice(selectedMaterial);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch product
        const productRes = await fetch(`/api/products/${params.slug}`);
        const productResult = await productRes.json();
        
        if (productResult.success) {
          setProduct(productResult.data);
          
          // Fetch materials for this product
          const materialsRes = await fetch(`/api/products/${params.slug}/materials`);
          const materialsResult = await materialsRes.json();
          
          if (materialsResult.success) {
            setMaterials(materialsResult.materials || []);
            
            // Set first material as default
            if (materialsResult.materials?.length > 0) {
              setSelectedMaterial(materialsResult.materials[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.slug) {
      fetchData();
    }
  }, [params.slug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create sample order
      const response = await fetch("/api/sample-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: params.slug,
          productName: product?.name,
          materialId: selectedMaterial?.id,
          materialName: selectedMaterial?.name,
          samplePrice: samplePrice,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit sample order");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Sample order error:", err);
      alert("Failed to submit sample order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg mx-auto px-6 py-24"
        >
          <div className="w-20 h-20 bg-krearte-black rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-krearte-white" />
          </div>
          <h1 className="font-sans text-4xl font-light mb-6">Sample Order Submitted!</h1>
          <p className="text-krearte-gray-600 font-light leading-relaxed mb-8">
            Thank you for your sample order. We'll process it within 1-2 business days 
            and ship it to your address. You'll receive a confirmation email shortly.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href={`/product/${params.slug}`}
              className="inline-flex items-center justify-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors"
            >
              Back to Product
            </Link>
            <Link
              href="/collection/wallcovering"
              className="inline-flex items-center justify-center px-8 py-4 border border-krearte-black text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-colors"
            >
              Browse Collection
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Back Navigation */}
      <div className="container mx-auto px-6 md:px-12 py-6">
        <Link
          href={`/product/${params.slug}`}
          className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Product
        </Link>
      </div>

      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
            
            {/* LEFT: Product Info */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-sm font-light text-krearte-gray-600 mb-4 block">
                  Order Sample
                </span>
                <h1 className="font-sans text-4xl md:text-5xl font-light mb-6 text-krearte-black">
                  {product?.name}
                </h1>
                
                {/* ✅ Image with 16:9 aspect ratio - only show images (not videos) */}
                <div className="aspect-[16/9] bg-krearte-gray-100 rounded-lg mb-8 overflow-hidden">
                  {product?.images && product.images.length > 0 ? (
                    (() => {
                      // Find first image that's NOT a video
                      const firstImage = product.images.find(
                        img => !img.endsWith('.mp4') && !img.endsWith('.webm')
                      ) || product.images[0];
                      
                      return (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                      <span className="text-9xl font-light">{product?.name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Material Selector */}
                {materials.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-normal text-krearte-black mb-3">
                      Select Material for Sample
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {materials.map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => setSelectedMaterial(material)}
                          className={`w-full p-4 border-2 text-left transition-all rounded-lg ${
                            selectedMaterial?.id === material.id
                              ? "border-krearte-black bg-krearte-gray-50"
                              : "border-krearte-gray-200 hover:border-krearte-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-normal text-krearte-black">{material.name}</p>
                              <p className="text-xs text-krearte-gray-500">{material.category}</p>
                            </div>
                            <p className="text-sm font-medium text-krearte-black">
                              {formatCurrency(getSamplePrice(material))}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Info */}
                <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
                  <h3 className="font-sans text-lg font-normal mb-4">What's Included</h3>
                  <ul className="space-y-3 text-krearte-gray-600 font-light">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-krearte-black" />
                      <span>A3 size sample swatch (29.7 × 21cm)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-krearte-black" />
                      <span>Material texture & finish reference</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-krearte-black" />
                      <span>Color accuracy under natural light</span>
                    </li>
                  </ul>
                  
                  <div className="mt-6 pt-6 border-t border-krearte-gray-200">
                    <p className="text-sm text-krearte-gray-500 mb-2">Sample Price</p>
                    <p className="text-2xl font-normal text-krearte-black">
                      {formatCurrency(samplePrice)}
                    </p>
                    <p className="text-xs text-krearte-gray-400 mt-2">
                      Price may vary depending on material type
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* RIGHT: Order Form */}
            <div className="lg:py-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-8"
              >
                <h2 className="font-sans text-2xl font-light mb-6">Shipping Information</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Phone Number *
                    </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="+62 xxx xxxx xxxx"
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Shipping Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="Street address, building, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="Jakarta"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="Any special instructions..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 text-sm font-medium transition-all duration-300 ${
                      submitting
                        ? "bg-krearte-gray-300 cursor-not-allowed"
                        : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
                    }`}
                  >
                    {submitting ? "Submitting..." : `Order Sample - ${formatCurrency(samplePrice)}`}
                  </button>

                  <p className="text-xs text-krearte-gray-500 text-center">
                    Shipping calculated at checkout. Delivery in 3-5 business days.
                  </p>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}