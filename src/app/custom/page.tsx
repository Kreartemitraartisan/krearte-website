"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Ruler, Sparkles, Calculator, Info, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  collectionType: string;
  recommendedMaterials: string[];
}

export default function CustomWithUsPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showMaterialInfo, setShowMaterialInfo] = useState(false);
  const [designs, setDesigns] = useState<Product[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Product | null>(null);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  
  // ✅ Dimensions dalam CM saja
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    materialType: "pvc-standard",
    materialWidth: "1.06",
    width: "", // cm
    height: "", // cm
    addOn25D: false,
    projectType: "residential",
    timeline: "",
    notes: "",
  });

  // ✅ Material options dari pricelist 2026 (dengan waste cost)
  const materials = [
    {
      category: "PVC Wallcoverings",
      options: [
        { id: "pvc-standard", name: "PVC Standard (Smooth/Industrial)", price: 345000, waste: 60000, width: 1.06 },
        { id: "pvc-self-adhesive", name: "Self Adhesive (Fabric Back)", price: 335000, waste: 90000, width: 1.52 },
        { id: "pvc-non-woven", name: "Non-Woven (White/Creamy)", price: 450000, waste: 115000, width: 1.37 },
        { id: "pvc-fabric-back", name: "Fabric Back (Cross Hatch/Fine Sand)", price: 385000, waste: 80000, width: 1.40 },
        { id: "linen", name: "Linen Texture", price: 375000, waste: 70000, width: 1.06 },
        { id: "plain-smooth", name: "Plain Smooth", price: 300000, waste: 50000, width: 1.26 },
      ],
    },
    {
      category: "Metallic Collection",
      options: [
        { id: "metallic-straw", name: "Straw Raw Metallic (Gold/Flex)", price: 400000, waste: 80000, width: 1.07 },
        { id: "metallic-straw-flx", name: "Straw Raw Metallic FLX", price: 450000, waste: 80000, width: 1.07 },
        { id: "metallic-abstract", name: "Abstract Embossing (Silver)", price: 750000, waste: 90000, width: 1.37 },
        { id: "metallic-silver-gold", name: "Silver/Gold Metallic", price: 500000, waste: 80000, width: 1.07 },
        { id: "metallic-japanese", name: "Japanese Silk (Metallic Silver)", price: 860000, waste: 200000, width: 1.37 },
      ],
    },
    {
      category: "Custom Print",
      options: [
        { id: "custom-standard", name: "Custom Print (Standard Material)", price: 200000, waste: 80000, width: 1.37 },
        { id: "custom-carpet", name: "Custom Print (Carpet/Roller Blind)", price: 250000, waste: 80000, width: 1.37 },
      ],
    },
  ];

  const addOns = [
    { id: "25d-print", name: "2.5D Print Effect", price: 500000, description: "Raised print texture you can feel" },
  ];

  // Fetch designs from API
  useEffect(() => {
    async function fetchDesigns() {
      try {
        const response = await fetch("/api/products?limit=100");
        const result = await response.json();
        if (result.success) {
          setDesigns(result.products || []);
        }
      } catch (error) {
        console.error("Error fetching designs:", error);
      } finally {
        setLoadingDesigns(false);
      }
    }
    fetchDesigns();
  }, []);

  // ✅ Get selected material info
  const getSelectedMaterial = () => {
    for (const category of materials) {
      const mat = category.options.find(m => m.id === formData.materialType);
      if (mat) return mat;
    }
    return materials[0].options[0]; // Default
  };

  // ✅ Calculate panels & price WITH CORRECT FORMULA
  const calculateEstimate = () => {
    const widthCm = parseFloat(formData.width) || 0;
    const heightCm = parseFloat(formData.height) || 0;
    
    const selectedMaterial = getSelectedMaterial();
    const materialPrice = selectedMaterial.price;
    const wastePrice = selectedMaterial.waste;
    const materialWidth = selectedMaterial.width;

    // Area = 0, show base price
    if (widthCm === 0 || heightCm === 0) {
      return {
        actualArea: 0,
        panelsNeeded: 0,
        wasteArea: 0,
        materialCost: materialPrice,
        wasteCost: wastePrice,
        _25DCost: formData.addOn25D ? 500000 : 0,
        total: materialPrice + wastePrice + (formData.addOn25D ? 500000 : 0),
        pricePerM2: materialPrice + wastePrice,
      };
    }

    // ✅ 1. Tambahkan overlap 3cm keliling (6cm total)
    const widthWithOverlap = (widthCm + 6) / 100; // cm → m
    const heightWithOverlap = (heightCm + 6) / 100; // cm → m

    // ✅ 2. Area sebenarnya yang dibutuhkan
    const actualArea = widthWithOverlap * heightWithOverlap;

    // ✅ 3. Hitung jumlah panel yang dibutuhkan
    const panelsNeeded = Math.ceil(widthWithOverlap / materialWidth);

    // ✅ 4. Hitung total area panel yang dibeli
    const totalPanelArea = panelsNeeded * (materialWidth * heightWithOverlap);

    // ✅ 5. Hitung waste (sisa potongan)
    const wasteArea = totalPanelArea - actualArea;

    // ✅ 6. Hitung harga
    const materialCost = actualArea * materialPrice;
    const wasteCost = wasteArea * wastePrice;
    const _25DCost = formData.addOn25D ? (500000 * actualArea) : 0;
    const total = materialCost + wasteCost + _25DCost;

    return {
      actualArea,
      panelsNeeded,
      wasteArea,
      totalPanelArea,
      materialCost,
      wasteCost,
      _25DCost,
      total,
      pricePerM2: materialPrice + wastePrice,
    };
  };

  const estimate = calculateEstimate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // ✅ Handle number inputs dengan validation di onBlur
    if (name === 'width' || name === 'height') {
      if (value === '') {
        setFormData(prev => ({ ...prev, [name]: '' }));
        return;
      }
      const numValue = parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? '' : value }));
      return;
    }
    
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'width' || name === 'height') {
      const numValue = parseFloat(value);
      const minValue = name === 'width' ? 10 : 10; // Min 10cm
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? '' : Math.max(minValue, numValue).toString()
      }));
    }
  };

  const handleMaterialChange = (materialId: string) => {
    let materialWidth = "1.06";
    materials.forEach(cat => {
      const mat = cat.options.find(m => m.id === materialId);
      if (mat) materialWidth = mat.width.toString();
    });
    setFormData(prev => ({
      ...prev,
      materialType: materialId,
      materialWidth,
    }));
  };

  // ✅ Submit to WhatsApp
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedMaterial = getSelectedMaterial();
      
      const message = `
*🎨 CUSTOM WALLCOVERING REQUEST*

*👤 Customer Info:*
• Name: ${formData.firstName} ${formData.lastName}
• Email: ${formData.email}
• Phone: ${formData.phone}

*🖼️ Design:*
${selectedDesign ? `• Design: ${selectedDesign.name} (${selectedDesign.slug})` : "• Design: Custom / No specific design selected"}

*📦 Material:*
• Type: ${selectedMaterial.name}
• Width: ${selectedMaterial.width}m
• Price: ${formatCurrency(selectedMaterial.price)}/m²
• Waste: ${formatCurrency(selectedMaterial.waste)}/m²

*📏 Dimensions:*
• Width: ${formData.width}cm
• Height: ${formData.height}cm
• Area (with 3cm overlap): ~${estimate.actualArea.toFixed(2)} m²
• Panels needed: ${estimate.panelsNeeded}

*✨ Add-ons:*
${formData.addOn25D ? "• ✅ 2.5D Print Effect (+Rp 500.000/m²)" : "• No add-ons"}

*📋 Project Details:*
• Type: ${formData.projectType}
• Timeline: ${formData.timeline || "Not specified"}
• Notes: ${formData.notes || "No additional notes"}

*💰 Price Breakdown:*
• Material: ${formatCurrency(estimate.materialCost)}
• Waste: ${formatCurrency(estimate.wasteCost)}
${formData.addOn25D ? `• 2.5D Effect: ${formatCurrency(estimate._25DCost)}` : ''}
*• Estimated Total: ${formatCurrency(estimate.total)}*

_Mohon konfirmasi ketersediaan dan harga final. Terima kasih!_
`.trim();

      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = "6287705661978";
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, "_blank");
      setSuccess(true);
    } catch (err: any) {
      console.error("WhatsApp redirect error:", err);
      alert("Failed to open WhatsApp. Please try again or contact us directly at +62 877-0566-1978");
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="font-sans text-4xl font-light mb-6">Request Submitted!</h1>
          <p className="text-krearte-gray-600 font-light leading-relaxed mb-8">
            You're being redirected to WhatsApp to complete your custom request.
            If the window didn't open, please click the button below.
          </p>
          <div className="flex flex-col gap-4">
            <a
              href={`https://wa.me/6287705661978?text=${encodeURIComponent("Hi Krearte, I'd like to continue my custom wallcovering request.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-full text-sm font-medium hover:bg-[#128C7E] transition-colors"
            >
              <Smartphone className="w-5 h-5" />
              Open WhatsApp
            </a>
            <Link
              href="/collection/wallcovering"
              className="inline-flex items-center justify-center px-8 py-4 border border-krearte-black text-krearte-black rounded-full text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-colors"
            >
              Browse Collections
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
          href="/"
          className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="text-center mb-16">
                <p className="text-sm font-light text-krearte-gray-600 mb-4 tracking-widest uppercase">
                  Bespoke Service
                </p>
                <h1 className="font-sans text-4xl md:text-6xl font-light mb-6 text-krearte-black">
                  Custom with Us
                </h1>
                <p className="text-lg font-light text-krearte-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Have a specific vision? We work with you to create bespoke wallcoverings
                  tailored to your space. Choose from our premium materials, add special
                  effects, and bring your dream walls to life.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* LEFT: Form */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Design Selection */}
                    <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6 mb-8">
                      <h2 className="font-sans text-xl font-light mb-6">Choose Your Design (Optional)</h2>
                      <p className="text-sm font-light text-krearte-gray-600 mb-6">
                        Already have a design in mind? Select it below and we'll show you the recommended materials.
                        Or skip this and tell us about your custom vision.
                      </p>

                      {/* Design Grid */}
                      {loadingDesigns ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1,2,3].map(i => (
                            <div key={i} className="animate-pulse">
                              <div className="aspect-video bg-krearte-gray-200 mb-3 rounded" />
                              <div className="h-4 bg-krearte-gray-200 w-3/4 mb-2" />
                              <div className="h-3 bg-krearte-gray-200 w-1/4" />
                            </div>
                          ))}
                        </div>
                      ) : designs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {designs.map((design) => (
                            <button
                              key={design.id}
                              type="button"
                              onClick={() => setSelectedDesign(design)}
                              className={`p-4 border rounded-lg text-left transition-all ${
                                selectedDesign?.id === design.id
                                  ? "border-krearte-black bg-krearte-black text-krearte-white"
                                  : "border-krearte-gray-200 hover:border-krearte-black"
                              }`}
                            >
                              <div className="aspect-video bg-krearte-gray-100 mb-3 rounded overflow-hidden">
                                {design.images && design.images.length > 0 ? (
                                  (() => {
                                    const thumbnailImage = design.images.find(img =>
                                      !img.endsWith('.mp4') && !img.endsWith('.webm')
                                    ) || design.images[0];
                                    const isVideo = thumbnailImage.endsWith('.mp4') || thumbnailImage.endsWith('.webm');
                                    return isVideo ? (
                                      <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                        <source src={thumbnailImage} type="video/mp4" />
                                      </video>
                                    ) : (
                                      <img src={thumbnailImage} alt={design.name} className="w-full h-full object-cover" />
                                    );
                                  })()
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                                    <span className="text-2xl font-light">{design.name.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                              <p className="font-normal text-sm mb-1">{design.name}</p>
                              <p className={`text-xs ${selectedDesign?.id === design.id ? "text-krearte-gray-300" : "text-krearte-gray-500"}`}>
                                {formatCurrency(design.price)}/m²
                              </p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-krearte-gray-500 text-center py-8">
                          No designs available yet. You can still describe your custom vision below.
                        </p>
                      )}

                      {/* Recommended Materials for Selected Design */}
                      {selectedDesign && selectedDesign.recommendedMaterials && selectedDesign.recommendedMaterials.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-krearte-gray-50 rounded-lg border border-krearte-gray-200"
                        >
                          <h3 className="font-sans text-lg font-normal mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-krearte-black" />
                            Recommended Materials for "{selectedDesign.name}"
                          </h3>
                          <p className="text-sm font-light text-krearte-gray-600 mb-4">
                            These materials work best with this design based on pattern complexity and visual impact.
                          </p>
                          <div className="space-y-3">
                            {selectedDesign.recommendedMaterials.map((material, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  const materialId = material.toLowerCase().replace(/\s+/g, '-').replace(/\(/g, '').replace(/\)/g, '').replace(/\//g, '-');
                                  handleMaterialChange(materialId);
                                }}
                                className="w-full p-4 bg-krearte-white border border-krearte-gray-200 rounded-lg hover:border-krearte-black transition-colors text-left"
                              >
                                <p className="font-normal text-krearte-black mb-1">{material}</p>
                                <p className="text-sm text-krearte-gray-500">
                                  Click to select this material for your custom order
                                </p>
                              </button>
                            ))}
                          </div>
                          <div className="mt-4 pt-4 border-t border-krearte-gray-200">
                            <p className="text-xs text-krearte-gray-500">
                              💡 Tip: You can still choose other materials if these don't match your vision.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {selectedDesign && (
                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDesign(null)}
                            className="text-sm text-krearte-gray-600 hover:text-krearte-black underline"
                          >
                            Clear selection
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
                      <h2 className="font-sans text-xl font-light mb-6">Contact Information</h2>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                    </div>

                    {/* Material Selection */}
                    <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-sans text-xl font-light">Select Material</h2>
                        <button
                          type="button"
                          onClick={() => setShowMaterialInfo(!showMaterialInfo)}
                          className="flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black"
                        >
                          <Info className="w-4 h-4" />
                          Material Guide
                        </button>
                      </div>
                      {showMaterialInfo && (
                        <div className="mb-6 p-4 bg-krearte-gray-50 rounded-lg">
                          <p className="text-sm font-light text-krearte-gray-600 mb-2">
                            Not sure which material to choose?
                          </p>
                          <Link
                            href="/materials"
                            className="text-sm font-medium text-krearte-black underline hover:text-krearte-gray-600"
                          >
                            View complete materials guide →
                          </Link>
                        </div>
                      )}
                      <div className="space-y-6">
                        {materials.map((category) => (
                          <div key={category.category}>
                            <h3 className="text-sm font-medium text-krearte-gray-500 uppercase tracking-wider mb-3">
                              {category.category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {category.options.map((material) => (
                                <button
                                  key={material.id}
                                  type="button"
                                  onClick={() => handleMaterialChange(material.id)}
                                  className={`p-4 border rounded-lg text-left transition-all ${
                                    formData.materialType === material.id
                                      ? "border-krearte-black bg-krearte-black text-krearte-white"
                                      : "border-krearte-gray-200 hover:border-krearte-black"
                                  }`}
                                >
                                  <p className={`font-normal mb-1 ${formData.materialType === material.id ? "text-krearte-white" : "text-krearte-black"}`}>
                                    {material.name}
                                  </p>
                                  <p className={`text-sm ${formData.materialType === material.id ? "text-krearte-gray-300" : "text-krearte-gray-500"}`}>
                                    {formatCurrency(material.price)}/m² • Waste: {formatCurrency(material.waste)} • {material.width}m
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 2.5D Print Add-on */}
                      <div className="mt-6 p-4 border border-krearte-gray-200 rounded-lg">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            name="addOn25D"
                            checked={formData.addOn25D}
                            onChange={handleInputChange}
                            className="mt-1 w-5 h-5 border-krearte-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-4 h-4 text-krearte-black" />
                              <label className="font-normal text-krearte-black cursor-pointer">
                                Add 2.5D Print Effect
                              </label>
                            </div>
                            <p className="text-sm font-light text-krearte-gray-600">
                              Raised print texture that adds depth and tactile experience to your wallcovering.
                            </p>
                            <p className="text-sm font-medium text-krearte-black mt-1">
                              +{formatCurrency(500000)}/m²
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ✅ Dimensions - CM Only, Auto-Calculate Panels */}
                    <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Ruler className="w-5 h-5 text-krearte-black" />
                        <h2 className="font-sans text-xl font-light">Dimensions</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-normal text-krearte-black mb-2">
                            Width *
                          </label>
                          <input
                            type="number"
                            name="width"
                            value={formData.width}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            min="10"
                            step="1"
                            className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                            placeholder="e.g., 260"
                          />
                          <p className="text-xs text-krearte-gray-500 mt-1">in centimeters (cm)</p>
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
                            onBlur={handleBlur}
                            required
                            min="10"
                            step="1"
                            className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                            placeholder="e.g., 300"
                          />
                          <p className="text-xs text-krearte-gray-500 mt-1">in centimeters (cm)</p>
                        </div>
                      </div>

                      {/* ✅ Auto-calculated Panels - Read Only */}
                      {estimate.panelsNeeded > 0 && (
                        <div className="mb-6 p-4 bg-krearte-gray-50 rounded-lg">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-krearte-gray-600">Area (with 3cm overlap):</p>
                              <p className="font-medium text-krearte-black">{estimate.actualArea.toFixed(2)} m²</p>
                            </div>
                            <div>
                              <p className="text-krearte-gray-600">Panels needed:</p>
                              <p className="font-medium text-krearte-black">{estimate.panelsNeeded} panel(s)</p>
                            </div>
                            <div>
                              <p className="text-krearte-gray-600">Waste:</p>
                              <p className="font-medium text-krearte-black">{estimate.wasteArea.toFixed(2)} m²</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-normal text-krearte-black mb-2">
                          Project Timeline
                        </label>
                        <input
                          type="text"
                          name="timeline"
                          value={formData.timeline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="e.g., 2 weeks, ASAP"
                        />
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
                      <h2 className="font-sans text-xl font-light mb-6">Project Details</h2>
                      <div className="mb-6">
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
                          Additional Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                          placeholder="Describe your vision, color preferences, or any special requirements..."
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-4 text-sm font-medium transition-all duration-300 rounded-full flex items-center justify-center gap-2 ${
                        submitting
                          ? "bg-krearte-gray-300 cursor-not-allowed"
                          : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
                      }`}
                    >
                      {submitting ? (
                        "Opening WhatsApp..."
                      ) : (
                        <>
                          <Smartphone className="w-5 h-5" />
                          Submit via WhatsApp
                        </>
                      )}
                    </button>
                    <p className="text-xs text-krearte-gray-500 text-center">
                      You'll be redirected to WhatsApp to send your request.
                      <br />
                      Our team will respond within 2-3 business days.
                    </p>
                  </form>
                </div>

                {/* RIGHT: Price Calculator */}
                <div className="lg:col-span-1">
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="sticky top-32"
                  >
                    <div className="bg-krearte-black text-krearte-white rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Calculator className="w-5 h-5" />
                        <h2 className="font-sans text-xl font-light">Estimated Price</h2>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-krearte-gray-400">Area</span>
                          <span className="font-normal">{estimate.actualArea > 0 ? estimate.actualArea.toFixed(2) : '0.00'} m²</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-krearte-gray-400">Material</span>
                          <span className="font-normal">{formatCurrency(estimate.materialCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-krearte-gray-400">Waste</span>
                          <span className="font-normal">{formatCurrency(estimate.wasteCost)}</span>
                        </div>
                        {formData.addOn25D && (
                          <div className="flex justify-between text-sm">
                            <span className="text-krearte-gray-400">2.5D Print</span>
                            <span className="font-normal">+{formatCurrency(estimate._25DCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg pt-4 border-t border-krearte-gray-700">
                          <span className="font-normal">Estimated Total</span>
                          <span className="font-normal">{formatCurrency(estimate.total)}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-krearte-gray-800 rounded-lg">
                        <p className="text-xs text-krearte-gray-400 leading-relaxed">
                          <strong className="text-krearte-white">Note:</strong> This is an estimate only.
                          Final pricing will be confirmed after our team reviews your specifications.
                          Minimum order: 1m². Waste cost covers cutting allowance and pattern matching.
                          <br /><br />
                          <strong className="text-krearte-white">Calculation:</strong> Includes 3cm overlap on all sides for installation.
                        </p>
                      </div>
                      {/* Sample CTA */}
                      <div className="mt-6 pt-6 border-t border-krearte-gray-700">
                        <p className="text-sm text-krearte-gray-400 mb-3">
                          Want to see materials first?
                        </p>
                        <Link
                          href="/materials"
                          className="inline-flex items-center text-sm font-medium text-krearte-white hover:text-krearte-gray-300 transition-colors"
                        >
                          Order Material Samples
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}