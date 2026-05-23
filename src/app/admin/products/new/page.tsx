"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, Film, Image as ImageIcon } from "lucide-react";
import { slugify , formatCurrency } from "@/lib/utils";

interface Material {
  id: string;
  name: string;
  category: string;
  pricePerM2: number;
  waste: number;
  width: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  // ✅ Fetch materials dari database
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  
  // ✅ Updated formData with stock field
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "wallcovering",
    collectionType: "wallcovering",
    is25DEligible: false,
    stock: 0, // ✅ Added stock field
    availableMaterialIds: [] as string[],
    recommendedMaterialIds: [] as string[],
  });

  const [images, setImages] = useState<string[]>([]);

  // ✅ Fetch materials dari API
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const response = await fetch("/api/materials");
        const result = await response.json();
        
        if (result.success) {
          const materialsOnly = result.materials.filter((m: Material) => {
            const category = m.category?.toLowerCase() || '';
            return !category.includes('jasa') && !category.includes('service');
          });
          
          setMaterials(materialsOnly);
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoadingMaterials(false);
      }
    }
    
    fetchMaterials();
  }, []);

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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("type", type);
        
        if (formData.slug) {
          const fileExtension = file.name.split(".").pop();
          const fileName = `${formData.slug}-${i + 1}.${fileExtension}`;
          formDataUpload.append("slug", fileName.replace(`.${fileExtension}`, ""));
        }

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formDataUpload,
        });

        const result = await response.json();
        
        if (result.success) {
          setImages(prev => [...prev, result.url]);
        } else {
          alert(result.error || "Upload failed!");
        }
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      setError("Failed to upload media");
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
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images,
          price: 0, // Not used for wallcovering
          sizes: [], // Not used for wallcovering
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create product");
      }

      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  // Group materials by category
  const materialsByCategory = materials.reduce((acc, material) => {
    const category = material.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

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
        {/* Basic Info - WITH STOCK FIELD */}
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

            {/* ✅ Stock Field - NEW */}
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

            {/* 2.5D Eligible Checkbox */}
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
                className="cursor-pointer inline-flex items-center gap-3 px-6 py-3 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Images"}
              </label>
              <p className="text-sm text-krearte-gray-500 mt-2">
                PNG, JPG, WebP up to 10MB
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
                accept="video/mp4,video/webm"
                multiple
                onChange={(e) => handleMediaUpload(e, "video")}
                disabled={uploading}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer inline-flex items-center gap-3 px-6 py-3 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Videos"}
              </label>
              <p className="text-sm text-krearte-gray-500 mt-2">
                MP4 or WebM up to 50MB
              </p>
            </div>
          </div>

          {/* Media Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {images.map((media, index) => {
                const isVideo = media.endsWith('.mp4') || media.endsWith('.webm');
                
                return (
                  <div key={index} className="relative aspect-square bg-krearte-gray-100 rounded-lg overflow-hidden group">
                    {isVideo ? (
                      <video
                        src={media}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
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

        {/* Available Materials */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-2">Available Materials</h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-6">
            Pilih material yang tersedia untuk product ini. Material yang dicentang akan muncul sebagai pilihan di halaman product.
          </p>
          
          {loadingMaterials ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-krearte-black border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-krearte-gray-500">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ No materials found. Please add materials first in the Materials section.
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
                        <p className="font-normal text-sm">{material.name}</p>
                        <p className={`text-xs ${
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
                Selected Materials ({formData.availableMaterialIds.length}):
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
                      <button
                        type="button"
                        onClick={() => toggleAvailableMaterial(material.id)}
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

        {/* Services / Add-Ons Section */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6 mt-6">
          <h2 className="font-sans text-lg font-normal mb-2">Available Services / Add-Ons</h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-6">
            Pilih jasa/add-on yang tersedia untuk product ini
          </p>
          
          {loadingMaterials ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-krearte-black border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-krearte-gray-500">Loading services...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                // ✅ Filter services from materials
                const services = materials.filter(m => {
                  const cat = m.category.toLowerCase();
                  return cat.includes('service') || 
                        cat.includes('jasa') || 
                        cat.includes('print') ||
                        cat.includes('design');
                });

                if (services.length === 0) {
                  return (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No services found. Please add services in Materials section first.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((service) => (
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
                        <p className="font-normal text-sm">{service.name}</p>
                        <p className={`text-xs ${
                          formData.availableMaterialIds.includes(service.id) ? "text-krearte-gray-300" : "text-krearte-gray-500"
                        }`}>
                          {formatCurrency(service.pricePerM2)}
                        </p>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
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
            {loading ? "Creating..." : uploading ? "Uploading..." : loadingMaterials ? "Loading Materials..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}