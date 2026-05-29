// app/checkout/checkout-client.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart/context";
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CreditCard, 
  Phone, 
  Copy, 
  CheckCircle,
  Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ==========================================
// ⚙️ KONFIGURASI TOKO
// ==========================================
const STORE_CONFIG = {
  adminPhone: "6287705661978",
  bankDetails: {
    bca: {
      bankName: "Bank Central Asia",
      accountNumber: "5105961313",
      accountName: "CV. KREARTE MITRA ARTISAN",
    },
    qris: {
      imageUrl: "/images/qris-krearte.png" 
    }
  }
};

// ✅ INTERFACE LENGKAP (Tanpa Duplicate Identifier)
interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  materialId?: string;
  materialName?: string;
  material?: string; // String biasa (misal: "PVC Standard")
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
  
  // ✅ Tambahan untuk Sample Order Flow
  isSample?: boolean;
  product?: { name: string; slug: string; image: string }; // Info produk untuk sample
  materialInfo?: { name: string; category: string }; // Info material untuk sample
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    notes: string;
  };
}

export default function CheckoutClient() {
  const { cart, total, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State Management
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  // Step: 'form' | 'payment' | 'done'
  const [step, setStep] = useState<"form" | "payment" | "done">("form");
  const [paymentMethod, setPaymentMethod] = useState<"bca" | "qris">("bca");
  
  const [formData, setFormData] = useState({
    email: session?.user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    notes: "",
  });

  // ✅ DETECT SAMPLE ORDER
  const isSampleOrder = searchParams.get('source') === 'sample';
  const [sampleData, setSampleData] = useState<CartItem | null>(null);

  // ✅ Load sample order dari localStorage
  useEffect(() => {
    if (isSampleOrder) {
      const savedSample = localStorage.getItem('krearte_pending_sample');
      if (savedSample) {
        try {
          const sample = JSON.parse(savedSample);
          setSampleData(sample);
          
          // Auto-fill form dengan data customer dari sample
          if (sample.customerInfo) {
            setFormData({
              email: sample.customerInfo.email || "",
              firstName: sample.customerInfo.firstName || "",
              lastName: sample.customerInfo.lastName || "",
              address: sample.customerInfo.address || "",
              city: sample.customerInfo.city || "",
              postalCode: sample.customerInfo.postalCode || "",
              phone: sample.customerInfo.phone || "",
              notes: sample.customerInfo.notes || "",
            });
          }
        } catch (e) {
          console.error("Failed to parse sample data:", e);
          localStorage.removeItem('krearte_pending_sample');
        }
      }
    }
  }, [isSampleOrder]);

  // ✅ Fix Type: Explicitly type as CartItem[]
  const displayItems: CartItem[] = sampleData 
    ? [sampleData as CartItem] 
    : (cart as CartItem[] || []);
    
  const displayTotal = sampleData ? sampleData.price : total;

  // Redirect jika belum login (opsional)
  useEffect(() => {
    if (status === "unauthenticated" && !searchParams.get("guest")) {
      // router.push(`/login?callbackUrl=/checkout`);
    }
  }, [status, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone || !formData.address) {
      setError("Mohon lengkapi Nama, No. HP, dan Alamat.");
      return;
    }
    setError("");
    setStep("payment");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Checkout via WhatsApp
  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      // ✅ Prepare order data (handle both sample & regular)
      const itemsForOrder = displayItems?.map((item: CartItem) => {
        if (item.isSample) {
          // ✅ FIX: Pisahkan materialName dan material untuk sample
          return {
            productId: null, // Sample tidak perlu productId valid
            name: `Sample - ${item.product?.name || 'Unknown'}`,
            size: item.size || 'A3 Sample',
            price: item.price || 0,
            quantity: item.quantity || 1,
            // ✅ FIX: Material fields terpisah, bukan digabung string
            materialName: item.materialInfo?.name || null,
            material: item.materialInfo?.category || null,
            isSample: true,
          };
        }
        // Regular product
        return {
          productId: item.productId || null,
          name: item.name || 'Unknown',
          size: item.size || null,
          price: item.price || 0,
          quantity: item.quantity || 1,
          materialName: item.materialName || item.material || null,
          material: item.material || null,
          width: item.width || null,
          height: item.height || null,
          widthCm: item.widthCm || null,
          heightCm: item.heightCm || null,
          areaM2: item.areaM2 || null,
          pricePerM2: item.pricePerM2 || null,
          wasteCost: item.wasteCost || null,
          is25DAddOn: Boolean(item.is25DAddOn),
          isSample: false,
        };
      }) || [];

      const orderData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        phone: formData.phone,
        items: itemsForOrder,
        subtotal: displayTotal,
        shipping: 0,
        total: displayTotal,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentStatus: "pending_verification",
        userId: session?.user?.id || null,
        isSampleOrder: !!sampleData,
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

      const orderId = result.orderId || `ORD-${Date.now()}`;

      // Trigger n8n webhook (Opsional)
      if (process.env.N8N_WEBHOOK_URL) {
        await fetch(`${process.env.N8N_WEBHOOK_URL}/order-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId,
            items: orderData.items,
            customer: {
              email: formData.email,
              name: `${formData.firstName} ${formData.lastName}`,
              phone: formData.phone,
              address: `${formData.address}, ${formData.city} ${formData.postalCode}`,
            },
            total: orderData.total,
            paymentMethod: paymentMethod.toUpperCase(),
            isSampleOrder: !!sampleData,
          }),
        }).catch(err => console.warn("n8n webhook failed:", err));
      }

      // ✅ Generate WhatsApp message (handle sample vs regular)
      const itemsList = displayItems?.map((item: CartItem, idx: number) => {
        if (item.isSample) {
          return `${idx + 1}. *SAMPLE - ${item.product?.name}*\n   - Material: ${item.materialInfo?.name}\n   - Category: ${item.materialInfo?.category}\n   - Size: A3 Sample (29.7 × 21cm)\n   - Qty: ${item.quantity}\n   - Harga: ${formatCurrency(item.price)}`;
        }
        return `${idx + 1}. *${item.name}*\n   - Size: ${item.widthCm || Math.round((item.width||1)*100)}cm × ${item.heightCm || Math.round((item.height||1)*100)}cm\n   - Material: ${item.materialName || '-'}\n   - Qty: ${item.quantity}\n   - Harga: ${formatCurrency(item.price)}`;
      }).join("\n\n");

      const message = `*🎨 ${sampleData ? 'SAMPLE ORDER' : 'ORDER BARU'} - KREARTE WEBSITE*
*Order ID:* ${orderId}
*Tanggal:* ${new Date().toLocaleDateString('id-ID')}

*📦 Detail Pesanan:*
${itemsList}

*💰 Total Tagihan:* ${formatCurrency(displayTotal)}
*🏦 Metode Bayar:* ${paymentMethod.toUpperCase()}

*👤 Data Pemesan:*
Nama: ${formData.firstName} ${formData.lastName}
Email: ${formData.email || '-'}
No. HP: ${formData.phone}
Alamat: ${formData.address}, ${formData.city} ${formData.postalCode}
${formData.notes ? `Notes: ${formData.notes}` : ''}

Halo Admin, ${sampleData ? 'saya ingin order sample seperti di atas.' : 'saya sudah melakukan pembayaran sesuai nominal di atas.'} Mohon dicek dan diproses ya. Terima kasih! 🙏`;

      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${STORE_CONFIG.adminPhone}?text=${encodedMessage}`;

      // Buka WhatsApp
      window.open(waUrl, "_blank");
      
      // ✅ Cleanup: Hapus localStorage jika sample order, clear cart jika regular
      if (sampleData) {
        localStorage.removeItem('krearte_pending_sample');
      } else {
        clearCart();
      }
      
      setOrderPlaced(true);
      setStep("done");
      
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Gagal memproses pesanan. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Helper: Calculate waste (hanya untuk produk biasa)
  const calculateWasteInfo = (item: CartItem) => {
    const widthCm = item.widthCm || (item.width ? Math.round(item.width * 100) : 100);
    const heightCm = item.heightCm || (item.height ? Math.round(item.height * 100) : 100);
    const widthWithOverlap = (widthCm + 6) / 100;
    const heightWithOverlap = (heightCm + 6) / 100;
    const printArea = widthWithOverlap * heightWithOverlap;
    const materialWidth = 1.40;
    const panelsNeeded = Math.ceil(widthWithOverlap / materialWidth);
    const totalMaterialArea = panelsNeeded * materialWidth * heightWithOverlap;
    const wasteArea = totalMaterialArea - printArea;
    
    return { printArea, panelsNeeded, totalMaterialArea, wasteArea, materialWidth };
  };

  // Loading State
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty State (handle both cart & sample)
  if (displayItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto px-6">
          <h1 className="font-sans text-3xl font-light mb-6">Your cart is empty</h1>
          <p className="text-krearte-gray-600 font-light mb-8">Add some products before checking out.</p>
          <Link href="/collection/wallcovering" className="inline-flex items-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors">
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success State
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg mx-auto px-6 py-24">
          <div className="w-20 h-20 bg-krearte-black rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-krearte-white" />
          </div>
          <h1 className="font-sans text-4xl font-light mb-6">Order Received!</h1>
          <p className="text-krearte-gray-600 font-light leading-relaxed mb-8">
            Terima kasih! Kami sudah menerima pesananmu via WhatsApp. 
            Admin akan memverifikasi pembayaran dan mengonfirmasi proses produksi secepatnya.
          </p>
          <Link href="/" className="inline-flex items-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors">
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
        <Link href={sampleData ? `/product/${sampleData.product?.slug}` : "/cart"} className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {sampleData ? "Back to Product" : "Back to Cart"}
        </Link>
      </div>

      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
            
            {/* LEFT: Checkout Form / Payment / Done */}
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-sans text-3xl md:text-4xl font-light mb-8">
                {step === "form" ? (sampleData ? "Confirm Sample Order" : "Checkout") : step === "payment" ? "Pembayaran" : "Selesai"}
              </motion.h1>

              {/* STEP 1: FORM DATA PEMESAN */}
              {step === "form" && (
                <form onSubmit={handleProceedToPayment} className="space-y-8">
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-light rounded">
                      {error}
                    </motion.div>
                  )}

                  {/* Contact Info */}
                  <div>
                    <h2 className="font-sans text-lg font-normal mb-6 flex items-center gap-2">
                      <Phone className="w-5 h-5" /> Contact Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">Email Address *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light" placeholder="your@email.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">Phone Number (WhatsApp) *</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light" placeholder="+62 xxx xxxx xxxx" />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h2 className="font-sans text-lg font-normal mb-6 flex items-center gap-2">
                      <Truck className="w-5 h-5" /> Shipping Address
                    </h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-normal text-krearte-black mb-2">First Name *</label>
                          <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light" />
                        </div>
                        <div>
                          <label className="block text-sm font-normal text-krearte-black mb-2">Last Name *</label>
                          <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">Address *</label>
                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light" placeholder="Jl. Mawar No. 123" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-normal text-krearte-black mb-2">City *</label>
                          <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light" />
                        </div>
                        <div>
                          <label className="block text-sm font-normal text-krearte-black mb-2">Postal Code *</label>
                          <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required className="w-full px-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={isProcessing} className="w-full py-4 text-sm font-medium bg-krearte-black text-krearte-white hover:bg-krearte-charcoal transition-all duration-300 disabled:opacity-50">
                    {sampleData ? "Confirm & Proceed to Payment" : "Continue to Payment"}
                  </button>
                </form>
              )}

              {/* STEP 2: PAYMENT METHOD */}
              {step === "payment" && (
                <form onSubmit={handleWhatsAppCheckout} className="space-y-8">
                  <div className="mb-6">
                    <button type="button" onClick={() => setStep("form")} className="text-sm text-krearte-gray-500 hover:text-krearte-black flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Ubah Data Pengiriman
                    </button>
                  </div>

                  <h2 className="font-sans text-lg font-normal mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Pilih Metode Pembayaran
                  </h2>

                  {/* Payment Options */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button type="button" onClick={() => setPaymentMethod("bca")} className={`p-4 border rounded-xl flex items-center justify-center gap-2 transition-all ${paymentMethod === 'bca' ? 'border-krearte-black bg-krearte-gray-50 ring-2 ring-krearte-black' : 'border-krearte-gray-200 hover:border-krearte-gray-400'}`}>
                      <span className="font-bold text-blue-800">BCA Transfer</span>
                    </button>
                    <button type="button" onClick={() => setPaymentMethod("qris")} className={`p-4 border rounded-xl flex items-center justify-center gap-2 transition-all ${paymentMethod === 'qris' ? 'border-krearte-black bg-krearte-gray-50 ring-2 ring-krearte-black' : 'border-krearte-gray-200 hover:border-krearte-gray-400'}`}>
                      <span className="font-bold">QRIS</span>
                    </button>
                  </div>

                  {/* BCA Details */}
                  {paymentMethod === "bca" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-krearte-gray-50 p-6 rounded-xl space-y-4">
                      <h3 className="font-medium text-lg">{STORE_CONFIG.bankDetails.bca.bankName}</h3>
                      <div className="flex items-center justify-between bg-krearte-white p-4 rounded-lg border border-krearte-gray-200">
                        <div>
                          <p className="text-sm text-krearte-gray-500">Nomor Rekening</p>
                          <p className="text-2xl font-mono font-bold tracking-wider">{STORE_CONFIG.bankDetails.bca.accountNumber}</p>
                          <p className="text-sm text-krearte-gray-600 mt-1">a.n. {STORE_CONFIG.bankDetails.bca.accountName}</p>
                        </div>
                        <button type="button" onClick={() => copyToClipboard(STORE_CONFIG.bankDetails.bca.accountNumber)} className="p-2 hover:bg-krearte-gray-100 rounded-lg transition-colors">
                          {copied ? <CheckCircle className="text-green-600 w-6 h-6" /> : <Copy className="text-krearte-gray-500 w-6 h-6" />}
                        </button>
                      </div>
                      <p className="text-xs text-krearte-gray-500 italic">*Transfer persis sesuai total belanja agar verifikasi otomatis.</p>
                    </motion.div>
                  )}

                  {/* QRIS Details */}
                  {paymentMethod === "qris" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-krearte-gray-50 p-6 rounded-xl space-y-4 text-center">
                      <h3 className="font-medium text-lg">Scan QRIS</h3>
                      <div className="bg-krearte-white p-4 rounded-lg border border-krearte-gray-200 inline-block">
                        <img src={STORE_CONFIG.bankDetails.qris.imageUrl} alt="QRIS Code" className="w-48 h-48 object-contain mx-auto" />
                      </div>
                      <p className="text-xs text-krearte-gray-500 italic">*Gunakan e-wallet atau mobile banking apa saja untuk scan.</p>
                    </motion.div>
                  )}

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">⚠️ Harap transfer <strong>tepat sesuai nominal</strong>. Pembayaran akan diverifikasi manual oleh admin.</p>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={() => setStep("form")} className="flex-1 py-4 border border-krearte-gray-300 rounded-lg font-medium hover:bg-krearte-gray-50 transition-colors">
                      Kembali
                    </button>
                    <button type="submit" disabled={isProcessing} className="flex-[2] bg-green-600 text-krearte-white py-4 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                      {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      {sampleData ? "Confirm Sample via WhatsApp" : "Bayar & Konfirmasi via WhatsApp"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* RIGHT: Order Summary (Sticky) */}
            <div className="lg:pl-12 lg:border-l border-krearte-gray-200">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="sticky top-32">
                <h2 className="font-sans text-lg font-normal mb-6">Order Summary</h2>
                
                {/* Items List */}
                <div className="space-y-6 mb-8 pb-8 border-b border-krearte-gray-200">
                  {displayItems.map((item: CartItem, idx: number) => {
                    const isSample = item.isSample === true;
                    const wasteInfo = !isSample ? calculateWasteInfo(item) : null;
                    
                    return (
                      <div key={isSample ? 'sample' : item.id} className="space-y-3">
                        <div className="flex gap-4">
                          <div className="w-16 h-20 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={isSample ? item.product?.name : item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-lg text-krearte-gray-400">{(isSample ? item.product?.name : item.name)?.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-sans text-sm font-normal mb-1">
                              {isSample ? `Sample - ${item.product?.name}` : item.name}
                            </h3>
                            <p className="text-xs font-light text-krearte-gray-500 mb-1">
                              {isSample ? item.size : `Size: ${item.widthCm || Math.round((item.width||1)*100)}cm × ${item.heightCm || Math.round((item.height||1)*100)}cm`}
                              {!isSample && wasteInfo && <span className="text-krearte-gray-400 ml-1">({wasteInfo.printArea.toFixed(2)} m²)</span>}
                            </p>
                            {isSample ? (
                              <>
                                <p className="text-xs font-light text-krearte-gray-500">Material: {item.materialInfo?.name}</p>
                                <p className="text-xs font-light text-krearte-gray-500">Category: {item.materialInfo?.category}</p>
                              </>
                            ) : (
                              <>
                                {item.materialName && <p className="text-xs font-light text-krearte-gray-500">Material: {item.materialName}</p>}
                                {item.addOns && item.addOns.length > 0 && <p className="text-xs font-light text-krearte-gray-500">+ {item.addOns.join(', ')}</p>}
                              </>
                            )}
                            <p className="text-xs text-krearte-gray-500 mt-1">Qty: {item.quantity}</p>
                          </div>
                        </div>

                        {/* Price Breakdown - Regular products only */}
                        {!isSample && wasteInfo && (
                          <div className="ml-20 p-3 bg-krearte-gray-50 rounded text-xs space-y-1.5">
                            <div className="flex justify-between text-krearte-gray-600">
                              <span>Material ({formatCurrency(item.pricePerM2 || 0)}/m² × {wasteInfo.printArea.toFixed(2)} m²):</span>
                              <span className="font-normal">{formatCurrency((item.pricePerM2 || 0) * wasteInfo.printArea)}</span>
                            </div>
                            {item.wasteCost && item.wasteCost > 0 && (
                              <div className="flex justify-between text-krearte-gray-600">
                                <span>Waste ({wasteInfo.wasteArea.toFixed(2)} m² × {formatCurrency(item.wasteCost)}/m²):</span>
                                <span className="font-normal">{formatCurrency(wasteInfo.wasteArea * item.wasteCost)}</span>
                              </div>
                            )}
                            {item.addOns?.includes('2.5D Print Effect') && (
                              <div className="flex justify-between text-krearte-gray-600">
                                <span>2.5D Effect ({formatCurrency(500000)}/m² × {wasteInfo.printArea.toFixed(2)} m²):</span>
                                <span className="font-normal">{formatCurrency(500000 * wasteInfo.printArea)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-krearte-black font-medium pt-2 border-t border-krearte-gray-200 mt-2">
                              <span>Subtotal (Qty {item.quantity}):</span>
                              <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Simple price for sample */}
                        {isSample && (
                          <div className="ml-20 p-3 bg-krearte-gray-50 rounded text-xs">
                            <div className="flex justify-between text-krearte-black font-medium">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(item.price)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-light text-krearte-gray-600">Subtotal</span>
                    <span className="font-normal text-krearte-black">{formatCurrency(displayTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-light text-krearte-gray-600">Shipping</span>
                    <span className="font-normal text-krearte-black">Calculated by Admin</span>
                  </div>
                  <div className="flex justify-between text-lg pt-4 border-t border-krearte-gray-200">
                    <span className="font-normal text-krearte-black">Total</span>
                    <span className="font-normal text-krearte-black">{formatCurrency(displayTotal)}</span>
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
                      <Phone className="w-6 h-6 text-krearte-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-light text-krearte-gray-600">WhatsApp Support</p>
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