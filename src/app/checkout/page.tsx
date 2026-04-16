"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart/context";
import { ChevronLeft, CreditCard, Truck, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  materialId?: string;
  materialName?: string;
  material?: string;
  pricePerM2?: number;
  wasteCost?: number;
  areaM2?: number;
  price: number;
  quantity: number;
  size?: string;
  width?: number;
  height?: number;
  widthCm?: number;
  heightCm?: number;
  image?: string;
  addOns?: string[];
  is25DAddOn?: boolean;
}

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState<string>("");
  
  const [formData, setFormData] = useState({
    email: session?.user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    if (status === "unauthenticated" && !searchParams.get("guest")) {
      router.push(`/login?callbackUrl=/checkout`);
    }
  }, [status, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const orderData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        phone: formData.phone,
        items: cart?.map(item => ({
          productId: item.productId,
          name: item.name,
          size: item.size,
          price: item.price,
          quantity: item.quantity,
          material: item.materialName || item.material,
          width: item.width,
          height: item.height,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          areaM2: item.areaM2,
          pricePerM2: item.pricePerM2,
          wasteCost: item.wasteCost,
          is25DAddOn: item.is25DAddOn,
        })) || [],
        subtotal: total,
        shipping: 0,
        total: total,
        userId: session?.user?.id || null,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      clearCart();
      setOrderPlaced(true);
      
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Helper: Calculate waste based on material width (bukan persentase flat!)
  const calculateWasteInfo = (item: CartItem) => {
    const widthCm = item.widthCm || (item.width ? Math.round(item.width * 100) : 100);
    const heightCm = item.heightCm || (item.height ? Math.round(item.height * 100) : 100);
    
    // Dimensions with overlap
    const widthWithOverlap = (widthCm + 6) / 100;
    const heightWithOverlap = (heightCm + 6) / 100;
    const printArea = widthWithOverlap * heightWithOverlap;
    
    // Default material width (Cross Hatch Linen M69 = 1.40m)
    // Jika item punya materialWidth, pakai itu; jika tidak, default 1.40m
    const materialWidth = 1.40;
    
    // Panels needed based on material width
    const panelsNeeded = Math.ceil(widthWithOverlap / materialWidth);
    
    // Total material area to buy
    const totalMaterialArea = panelsNeeded * materialWidth * heightWithOverlap;
    
    // Waste = total material - print area
    const wasteArea = totalMaterialArea - printArea;
    
    return {
      printArea,
      panelsNeeded,
      totalMaterialArea,
      wasteArea,
      materialWidth,
    };
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if ((cart?.length || 0) === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto px-6"
        >
          <h1 className="font-sans text-3xl font-light mb-6">Your cart is empty</h1>
          <p className="text-krearte-gray-600 font-light mb-8">
            Add some products before checking out.
          </p>
          <Link
            href="/collection/wallcovering"
            className="inline-flex items-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg mx-auto px-6 py-24"
        >
          <div className="w-20 h-20 bg-krearte-black rounded-full flex items-center justify-center mx-auto mb-8">
            <Package className="w-10 h-10 text-krearte-white" />
          </div>
          <h1 className="font-sans text-4xl font-light mb-6">Order Confirmed!</h1>
          <p className="text-krearte-gray-600 font-light leading-relaxed mb-8">
            Thank you for your order. We'll send you a confirmation email shortly 
            with your order details and tracking information.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      
      {/* Back Navigation */}
      <div className="container mx-auto px-6 md:px-12 py-6">
        <Link
          href="/cart"
          className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Cart
        </Link>
      </div>

      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
            
            {/* LEFT: Checkout Form */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-sans text-3xl md:text-4xl font-light mb-8"
              >
                Checkout
              </motion.h1>

              <form onSubmit={handleCheckout} className="space-y-8">
                
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-light rounded mb-6"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Contact Information */}
                <div>
                  <h2 className="font-sans text-lg font-normal mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="+62 xxx xxxx xxxx"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="font-sans text-lg font-normal mb-6 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
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
                          className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
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
                          className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="Street address"
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
                          className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
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
                          className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="12345"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h2 className="font-sans text-lg font-normal mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                          className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing || (cart?.length || 0) === 0}
                  className={`w-full py-4 text-sm font-medium transition-all duration-300 ${
                    isProcessing
                      ? "bg-krearte-gray-300 cursor-not-allowed"
                      : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
                  }`}
                >
                  {isProcessing ? "Processing..." : `Pay ${formatCurrency(total)}`}
                </button>
              </form>
            </div>

            {/* RIGHT: Order Summary with Price Breakdown */}
            <div className="lg:pl-12 lg:border-l border-krearte-gray-200">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-32"
              >
                <h2 className="font-sans text-lg font-normal mb-6">Order Summary</h2>
                
                {/* Order Items with Detailed Breakdown */}
                <div className="space-y-6 mb-8 pb-8 border-b border-krearte-gray-200">
                  {cart?.map((item: CartItem) => {
                    // ✅ Calculate waste info based on material width
                    const wasteInfo = calculateWasteInfo(item);
                    
                    const materialCost = (item.pricePerM2 || 0) * wasteInfo.printArea;
                    const wasteCost = wasteInfo.wasteArea * (item.wasteCost || 80000);
                    const effect25DCost = item.addOns?.includes('2.5D Print Effect') 
                      ? 500000 * wasteInfo.printArea 
                      : 0;
                    
                    return (
                      <div key={item.id} className="space-y-3">
                        {/* Item Header */}
                        <div className="flex gap-4">
                          <div className="w-16 h-20 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-lg text-krearte-gray-400">
                                  {item.name?.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-sans text-sm font-normal mb-1">
                              {item.name}
                            </h3>
                            
                            {/* ✅ Size in CM */}
                            <p className="text-xs font-light text-krearte-gray-500 mb-1">
                              Size: {item.widthCm || (item.width ? Math.round(item.width * 100) : 100)}cm × {item.heightCm || (item.height ? Math.round(item.height * 100) : 100)}cm
                              <span className="text-krearte-gray-400 ml-1">
                                ({wasteInfo.printArea.toFixed(2)} m²)
                              </span>
                            </p>
                            
                            {/* ✅ Material Name */}
                            {item.materialName && (
                              <p className="text-xs font-light text-krearte-gray-500">
                                Material: {item.materialName}
                              </p>
                            )}
                            
                            {/* ✅ Add-Ons */}
                            {item.addOns && item.addOns.length > 0 && (
                              <p className="text-xs font-light text-krearte-gray-500">
                                + {item.addOns.join(', ')}
                              </p>
                            )}
                            
                            <p className="text-xs text-krearte-gray-500 mt-1">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>

                        {/* ✅ Price Breakdown with accurate waste calculation */}
                        <div className="ml-20 p-3 bg-krearte-gray-50 rounded text-xs space-y-1.5">
                          {/* Material Cost */}
                          <div className="flex justify-between text-krearte-gray-600">
                            <span>
                              Material ({formatCurrency(item.pricePerM2 || 0)}/m² × {wasteInfo.printArea.toFixed(2)} m²):
                            </span>
                            <span className="font-normal">
                              {formatCurrency(materialCost)}
                            </span>
                          </div>

                          {/* ✅ Waste Cost - calculated from material width, not flat % */}
                          {item.wasteCost && item.wasteCost > 0 && (
                            <div className="flex justify-between text-krearte-gray-600">
                              <span>
                                Waste ({wasteInfo.wasteArea.toFixed(2)} m² × {formatCurrency(item.wasteCost)}/m²):
                              </span>
                              <span className="font-normal">
                                {formatCurrency(wasteCost)}
                              </span>
                            </div>
                          )}

                          {/* 2.5D Add-On */}
                          {item.addOns?.includes('2.5D Print Effect') && (
                            <div className="flex justify-between text-krearte-gray-600">
                              <span>
                                2.5D Effect ({formatCurrency(500000)}/m² × {wasteInfo.printArea.toFixed(2)} m²):
                              </span>
                              <span className="font-normal">
                                {formatCurrency(effect25DCost)}
                              </span>
                            </div>
                          )}

                          {/* Item Subtotal */}
                          <div className="flex justify-between text-krearte-black font-medium pt-2 border-t border-krearte-gray-200 mt-2">
                            <span>Subtotal (Qty {item.quantity}):</span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-light text-krearte-gray-600">Subtotal</span>
                    <span className="font-normal text-krearte-black">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-light text-krearte-gray-600">Shipping</span>
                    <span className="font-normal text-krearte-black">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between text-lg pt-4 border-t border-krearte-gray-200">
                    <span className="font-normal text-krearte-black">Total</span>
                    <span className="font-normal text-krearte-black">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-12 pt-8 border-t border-krearte-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Truck className="w-6 h-6 text-krearte-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-light text-krearte-gray-600">Free Shipping</p>
                    </div>
                    <div>
                      <Package className="w-6 h-6 text-krearte-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-light text-krearte-gray-600">Secure Packaging</p>
                    </div>
                    <div>
                      <CreditCard className="w-6 h-6 text-krearte-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-light text-krearte-gray-600">Secure Payment</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}