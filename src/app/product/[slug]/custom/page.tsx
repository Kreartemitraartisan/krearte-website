"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Ruler } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
}

export default function CustomSizePage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    width: "",
    height: "",
    unit: "cm",
    quantity: "1",
    projectType: "residential",
    timeline: "",
    notes: "",
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: params.slug,
          productName: product?.name,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit custom request");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Custom request error:", err);
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
          <h1 className="font-sans text-4xl font-light mb-6">Custom Request Submitted!</h1>
          <p className="text-krearte-gray-600 font-light leading-relaxed mb-8">
            Thank you for your custom size request. Our design team will review your 
            specifications and get back to you within 2-3 business days with a quote.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href={`/product/${params.slug}`}
              className="inline-flex items-center justify-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors"
            >
              Back to Product
            </Link>
            <Link
              href="/custom"
              className="inline-flex items-center justify-center px-8 py-4 border border-krearte-black text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-colors"
            >
              More Custom Options
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
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="text-center mb-12">
                <span className="text-sm font-light text-krearte-gray-600 mb-4 block">
                  Bespoke Service
                </span>
                <h1 className="font-sans text-4xl md:text-5xl font-light mb-6 text-krearte-black">
                  Custom Size Request
                </h1>
                <p className="text-lg font-light text-krearte-gray-600">
                  Need a specific size? We can customize any wallcovering to fit your space perfectly.
                </p>
              </div>

              {/* Product Info */}
              {product && (
                <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-krearte-gray-100 flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-3xl font-light text-krearte-gray-400">
                          {product.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-sans text-xl font-normal mb-1">{product.name}</h3>
                      <p className="text-sm text-krearte-gray-500">{product.description?.substring(0, 100)}...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-8">
                <h2 className="font-sans text-2xl font-light mb-6">Your Specifications</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>

                  {/* Dimensions */}
                  <div className="border-t border-krearte-gray-200 pt-6">
                    <h3 className="font-sans text-lg font-normal mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5" />
                      Dimensions
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          Width *
                        </label>
                        <input
                          type="number"
                          name="width"
                          value={formData.width}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          Height *
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          Unit *
                        </label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        >
                          <option value="cm">Centimeters (cm)</option>
                          <option value="m">Meters (m)</option>
                          <option value="in">Inches (in)</option>
                          <option value="ft">Feet (ft)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="border-t border-krearte-gray-200 pt-6">
                    <h3 className="font-sans text-lg font-normal mb-4">Project Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          Project Type *
                        </label>
                        <select
                          name="projectType"
                          value={formData.projectType}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        >
                          <option value="residential">Residential</option>
                          <option value="commercial">Commercial</option>
                          <option value="hospitality">Hospitality</option>
                          <option value="office">Office</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          Quantity (panels) *
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Project Timeline
                      </label>
                      <input
                        type="text"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="e.g., 2 weeks, ASAP, Flexible"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="Describe your project, special requirements, or any questions..."
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 text-sm font-medium transition-all duration-300 ${
                      submitting
                        ? "bg-krearte-gray-300 cursor-not-allowed"
                        : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
                    }`}
                  >
                    {submitting ? "Submitting..." : "Submit Custom Request"}
                  </button>

                  <p className="text-xs text-krearte-gray-500 text-center">
                    Our team will respond within 2-3 business days with a custom quote.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}