"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, Film, Image as ImageIcon } from "lucide-react";
import { slugify, formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase-client";

interface Material {
  id: string;
  name: string;
  category: string;
  pricePerM2: number;
  waste: number;
  width: string;
  designerPricePerM2?: number;
  resellerPricePerM2?: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "wallcovering",
    collectionType: "wallcovering",
    is25DEligible: false,
    stock: 0,
    availableMaterialIds: [] as string[],
    recommendedMaterialIds: [] as string[],
  });

  const [images, setImages] = useState<string[]>([]);

  // ✅ Fetch ALL materials (termasuk services/add-ons), filter nanti di UI
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const response = await fetch("/api/materials");
        const result = await response.json();
        
        if (result.success) {
          setMaterials(result.materials);
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoadingMaterials(false);
      }
    }
    
    fetchMaterials();
  }, []);

  // ✅ Helper functions untuk memisahkan tipe material
  const isPhysicalMaterial = (m: Material) => {
    const cat = m.category?.toLowerCase() || '';
    return !cat.includes('jasa') && 
           !cat.includes('service') && 
           !cat.includes('add-on') &&
           !cat.includes('print') &&
           !cat.includes('design') &&
           m.pricePerM2 > 0;
  };

  const isServiceOrAddon = (m: Material) => !isPhysicalMaterial(m);

  // ✅ Filter & group materials untuk display
  const physicalMaterials = materials.filter(isPhysicalMaterial);
  const services = materials.filter(isServiceOrAddon);

  const materialsByCategory = physicalMaterials.reduce((acc, material) => {
    const category = material.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        if (name === "name") {
          updated.slug = slugify(value);
        }
        return updated;
      });
    }
  };

  // ✅ UPDATED: Upload ke VPS via API Route (bukan Supabase)
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const isVideo = type === "video";
        const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
        const allowedTypes = isVideo 
          ? ["video/mp4", "video/webm", "video/quicktime"]
          : ["image/jpeg", "image/png", "image/gif", "image/webp"];
        
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File type not allowed. Allowed: ${isVideo ? "MP4, WebM, MOV" : "JPG, PNG, GIF, WebP"}`);
        }
        
        if (file.size > maxSize) {
          throw new Error(`File too large. Max ${isVideo ? "100MB" : "20MB"}`);
        }

        // Upload progress simulation
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        // ✅ Upload ke API route yang forward ke VPS
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch('/api/upload-to-vps', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        
        // ✅ URL sudah format https://assets.krearte.id/...
        setImages(prev => [...prev, result.url]);
        
        setTimeout(() => setUploadProgress(0), 500);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload media");
      alert(`❌ ${err.message || "Upload failed!"}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAvailableMaterial = (materialId: string) => {
    setFormData(prev => {
      const isAlreadyAvailable = prev.availableMaterialIds.includes(materialId);
      
      if (isAlreadyAvailable) {
        return {
          ...prev,
          availableMaterialIds: prev.availableMaterialIds.filter(id => id !== materialId),
          recommendedMaterialIds: prev.recommendedMaterialIds.filter(id => id !== materialId)
        };
      } else {
        return {
          ...prev,
          availableMaterialIds: [...prev.availableMaterialIds, materialId]
        };
      }
    });
  };

  const toggleRecommendedMaterial = (materialId: string) => {
    if (!formData.availableMaterialIds.includes(materialId)) {
      alert("Please add this material to Available Materials first");
      return;
    }

    setFormData(prev => {
      const isAlreadyRecommended = prev.recommendedMaterialIds.includes(materialId);
      
      if (isAlreadyRecommended) {
        return {
          ...prev,
          recommendedMaterialIds: prev.recommendedMaterialIds.filter(id => id !== materialId)
        };
      } else {
        return {
          ...prev,
          recommendedMaterialIds: [...prev.recommendedMaterialIds, materialId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.name.trim()) throw new Error("Product name is required");
      if (!formData.slug.trim()) throw new Error("Slug is required");
      
      const imagePayload = images.length > 0 
        ? images.filter(url => url && url.trim() !== "") 
        : ["/images/wallpaper-fallback.jpg"];

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || "",
        category: formData.category || "wallcovering",
        price: 0,
        images: imagePayload,
        collectionType: formData.collectionType || "wallcovering",
        is25DEligible: Boolean(formData.is25DEligible),
        stock: Number(formData.stock) || 0,
        availableMaterialIds: formData.availableMaterialIds || [],
        recommendedMaterialIds: formData.recommendedMaterialIds || [],
      };

      console.log("📤 Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("📥 Raw Response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { error: "Invalid JSON from server", raw: responseText };
      }

      if (!response.ok) {
        console.error("❌ API Error:", result);
        throw new Error(result.error || result.message || `HTTP ${response.status}`);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      console.error("💥 Error:", err);
      setError(err.message || "Failed to create product");
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 text-krearte-gray-600 hover:text-krearte-black hover:bg-krearte-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-sans text-3xl font-light mb-2">Add Product</h1>
          <p className="text-krearte-gray-600 font-light">
            Create a new wallcovering product listing
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                placeholder="e.g., Blush Bunny Meadow"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                placeholder="e.g., blush-bunny-meadow"
              />
              <p className="text-xs text-krearte-gray-500 mt-1">
                Used in URL: /product/{formData.slug || "your-slug"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
              >
                <option value="wallcovering">Wallcovering</option>
                <option value="designer">Designer Collection</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">
                Stock (units)
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                placeholder="0"
              />
              <p className="text-xs text-krearte-gray-500 mt-1">
                Available inventory for this product
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is25DEligible"
                id="is25DEligible"
                checked={formData.is25DEligible}
                onChange={handleInputChange}
                className="w-4 h-4 accent-krearte-black mr-2"
                disabled={formData.collectionType !== "designer"}
              />
              <label htmlFor="is25DEligible" className="text-sm font-normal text-krearte-black">
                2.5D Print Effect Eligible
                {formData.collectionType !== "designer" && (
                  <span className="text-krearte-gray-400 ml-1">(Designer Collection only)</span>
                )}
              </label>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-normal text-krearte-black mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
              placeholder="Describe the design, pattern, and visual characteristics..."
            />
          </div>
        </div>

        {/* Collection Type */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-6">Collection Type</h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-4">
            Pilih kategori koleksi untuk design ini. Designer Collections menampilkan material premium & metallic.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, collectionType: "wallcovering", is25DEligible: false }))}
              className={`p-4 border rounded-lg text-left transition-all ${
                formData.collectionType === "wallcovering"
                  ? "border-krearte-black bg-krearte-black text-krearte-white"
                  : "border-krearte-gray-200 hover:border-krearte-black"
              }`}
            >
              <p className="font-normal mb-1">Wallcovering</p>
              <p className={`text-sm ${
                formData.collectionType === "wallcovering" ? "text-krearte-gray-300" : "text-krearte-gray-500"
              }`}>
                Standard collection with PVC materials
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, collectionType: "designer" }))}
              className={`p-4 border rounded-lg text-left transition-all ${
                formData.collectionType === "designer"
                  ? "border-krearte-black bg-krearte-black text-krearte-white"
                  : "border-krearte-gray-200 hover:border-krearte-black"
              }`}
            >
              <p className="font-normal mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Designer Collections
              </p>
              <p className={`text-sm ${
                formData.collectionType === "designer" ? "text-krearte-gray-300" : "text-krearte-gray-500"
              }`}>
                Premium & metallic materials showcase
              </p>
            </button>
          </div>
        </div>

        {/* Product Media Section */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-6">Product Media</h2>
          
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-normal text-krearte-black mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Product Images
            </label>
            <div className="border-2 border-dashed border-krearte-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleMediaUpload(e, "image")}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                  uploading 
                    ? "bg-krearte-gray-400 cursor-not-allowed" 
                    : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? `Uploading... ${uploadProgress}%` : "Upload Images"}
              </label>
              <p className="text-sm text-krearte-gray-500 mt-2">
                PNG, JPG, GIF, WebP up to 20MB
              </p>
            </div>
          </div>

          {/* Video Upload */}
          <div className="mb-6">
            <label className="block text-sm font-normal text-krearte-black mb-3 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Product Videos
            </label>
            <div className="border-2 border-dashed border-krearte-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                multiple
                onChange={(e) => handleMediaUpload(e, "video")}
                disabled={uploading}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className={`cursor-pointer inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                  uploading 
                    ? "bg-krearte-gray-400 cursor-not-allowed" 
                    : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? `Uploading... ${uploadProgress}%` : "Upload Videos"}
              </label>
              <p className="text-sm text-krearte-gray-500 mt-2">
                MP4, WebM, MOV up to 100MB
              </p>
            </div>
          </div>

          {/* Media Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {images.map((media, index) => {
                const isVideo = media.endsWith('.mp4') || media.endsWith('.webm') || media.endsWith('.mov');
                
                return (
                  <div key={index} className="relative aspect-square bg-krearte-gray-100 rounded-lg overflow-hidden group">
                    {isVideo ? (
                      <video
                        src={media}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <img
                        src={media}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    <div className="absolute top-2 left-2 flex gap-1">
                      {index === 0 && (
                        <span className="px-2 py-1 bg-krearte-black text-krearte-white text-xs rounded">
                          Primary
                        </span>
                      )}
                      {isVideo && (
                        <span className="px-2 py-1 bg-blue-600 text-krearte-white text-xs rounded flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          Video
                        </span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-krearte-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Materials - PHYSICAL ONLY (no badge) */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-2">Available Materials</h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-6">
            Pilih material fisik yang tersedia untuk product ini.
          </p>
          
          {loadingMaterials ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-krearte-black border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-krearte-gray-500">Loading materials...</p>
            </div>
          ) : physicalMaterials.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ No physical materials found. Please add materials first in the Materials section.
              </p>
              <Link
                href="/admin/materials"
                className="inline-flex items-center gap-2 mt-2 text-sm text-krearte-black font-medium hover:text-krearte-gray-600"
              >
                Go to Materials Management →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-krearte-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryMaterials.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => toggleAvailableMaterial(material.id)}
                        className={`p-3 border rounded-lg text-left transition-all ${
                          formData.availableMaterialIds.includes(material.id)
                            ? "border-krearte-black bg-krearte-black text-krearte-white"
                            : "border-krearte-gray-200 hover:border-krearte-black"
                        }`}
                      >
                        {/* ✅ Removed PHYSICAL badge, cleaner layout */}
                        <p className="font-normal text-sm">{material.name}</p>
                        <p className={`text-xs mt-1 ${
                          formData.availableMaterialIds.includes(material.id) ? "text-krearte-gray-300" : "text-krearte-gray-500"
                        }`}>
                          Rp {material.pricePerM2.toLocaleString()}/m² • {material.width}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Materials Summary */}
          {formData.availableMaterialIds.length > 0 && (
            <div className="mt-6 p-4 bg-krearte-gray-50 rounded-lg border border-krearte-gray-200">
              <p className="text-sm font-medium text-krearte-black mb-3">
                Selected ({formData.availableMaterialIds.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {materials
                  .filter(m => formData.availableMaterialIds.includes(m.id))
                  .map((material) => (
                    <span
                      key={material.id}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-krearte-black text-krearte-white text-xs rounded-full"
                    >
                      {material.name}
                      {isServiceOrAddon(material) && (
                        <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded">ADD-ON</span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleAvailableMaterial(material.id)}
                        className="hover:text-krearte-gray-300 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommended Materials */}
        {formData.availableMaterialIds.length > 0 && (
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-2">Recommended Materials (Optional)</h2>
            <p className="text-sm font-light text-krearte-gray-600 mb-6">
              Tandai material yang direkomendasikan untuk design ini (harus sudah ada di available materials).
            </p>
            
            <div className="space-y-6">
              {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-krearte-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryMaterials
                      .filter(m => formData.availableMaterialIds.includes(m.id))
                      .map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => toggleRecommendedMaterial(material.id)}
                          className={`p-3 border rounded-lg text-left transition-all ${
                            formData.recommendedMaterialIds.includes(material.id)
                              ? "border-krearte-black bg-krearte-black text-krearte-white"
                              : "border-krearte-gray-200 hover:border-krearte-black"
                          }`}
                        >
                          <p className="font-normal text-sm">{material.name}</p>
                          <p className={`text-xs ${
                            formData.recommendedMaterialIds.includes(material.id) ? "text-krearte-gray-300" : "text-krearte-gray-500"
                          }`}>
                            Rp {material.pricePerM2.toLocaleString()}/m²
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended Summary */}
            {formData.recommendedMaterialIds.length > 0 && (
              <div className="mt-6 p-4 bg-krearte-gray-50 rounded-lg border border-krearte-gray-200">
                <p className="text-sm font-medium text-krearte-black mb-3">
                  Recommended ({formData.recommendedMaterialIds.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {materials
                    .filter(m => formData.recommendedMaterialIds.includes(m.id))
                    .map((material) => (
                      <span
                        key={material.id}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-krearte-black text-krearte-white text-xs rounded-full"
                      >
                        {material.name}
                        <button
                          type="button"
                          onClick={() => toggleRecommendedMaterial(material.id)}
                          className="hover:text-krearte-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Services / Add-Ons Section - SEPARATE */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6 mt-6">
          <h2 className="font-sans text-lg font-normal mb-2 flex items-center gap-2">
            Available Services / Add-Ons
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              {services.length}
            </span>
          </h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-6">
            Pilih jasa/add-on yang tersedia untuk product ini (opsional, bisa dicentang terpisah dari material fisik)
          </p>
          
          {loadingMaterials ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-krearte-black border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-krearte-gray-500">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="p-4 bg-krearte-gray-50 border border-krearte-gray-200 rounded-lg">
              <p className="text-sm text-krearte-gray-500">
                ℹ️ No services/add-ons configured yet. Add them in Materials section with categories like "Jasa", "Service", "Add-On", "Print", or "Design".
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const servicesByCategory = services.reduce((acc, service) => {
                  const category = service.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(service);
                  return acc;
                }, {} as Record<string, Material[]>);

                return Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-krearte-gray-500 uppercase tracking-wider mb-3">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleAvailableMaterial(service.id)}
                          className={`p-3 border rounded-lg text-left transition-all ${
                            formData.availableMaterialIds.includes(service.id)
                              ? "border-krearte-black bg-krearte-black text-krearte-white"
                              : "border-krearte-gray-200 hover:border-krearte-black"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-normal text-sm">{service.name}</p>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              ADD-ON
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${
                            formData.availableMaterialIds.includes(service.id) ? "text-krearte-gray-300" : "text-krearte-gray-500"
                          }`}>
                            {formatCurrency(service.pricePerM2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-krearte-gray-200">
          <Link
            href="/admin/products"
            className="px-6 py-3 text-krearte-black font-medium hover:text-krearte-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploading || loadingMaterials}
            className={`px-8 py-3 rounded-full text-sm font-medium transition-colors ${
              loading || uploading || loadingMaterials
                ? "bg-krearte-gray-300 cursor-not-allowed"
                : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
            }`}
          >
            {loading ? "Creating..." : uploading ? `Uploading ${uploadProgress}%...` : loadingMaterials ? "Loading..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}