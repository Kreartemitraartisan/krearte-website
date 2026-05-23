"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Loader2, Save, Upload, Film, Image as ImageIcon, Trash2, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Material {
  id: string;
  name: string;
  category: string;
  pricePerM2: number;
  waste: number;
  width: string | null;
  description: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  stock: number;
  images: string[];
  availableMaterialIds: string[];
  recommendedMaterialIds: string[];
  collectionType?: string;
  is25DEligible?: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "wallcovering",
    collectionType: "wallcovering",
    is25DEligible: false,
    price: 0,
    description: "",
    stock: 0,
    images: [] as string[],
    availableMaterialIds: [] as string[],
    recommendedMaterialIds: [] as string[],
  });

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

  // ✅ NEW: Filter out sample items (karena sudah ada tombol Order Sample di product page)
  const isSampleItem = (m: Material) => {
    const name = m.name?.toLowerCase() || '';
    const cat = m.category?.toLowerCase() || '';
    return name.includes('sample') || cat.includes('sample');
  };

  const isServiceOrAddon = (m: Material) => {
    return !isPhysicalMaterial(m) && !isSampleItem(m); // ✅ Exclude samples
  };

  // ✅ Fetch Product & Materials
  useEffect(() => {
    async function fetchData() {
      try {
        const [productRes, materialsRes] = await Promise.all([
          fetch(`/api/admin/products/${productId}`),
          fetch("/api/materials"),
        ]);

        const productData = await productRes.json();
        const materialsData = await materialsRes.json();

        if (productData.success) {
          setFormData({
            name: productData.product.name || "",
            slug: productData.product.slug || "",
            category: productData.product.category || "wallcovering",
            collectionType: productData.product.collectionType || "wallcovering",
            is25DEligible: productData.product.is25DEligible || false,
            price: productData.product.price || 0,
            description: productData.product.description || "",
            stock: productData.product.stock || 0,
            images: productData.product.images || [],
            availableMaterialIds: productData.product.availableMaterialIds || [],
            recommendedMaterialIds: productData.product.recommendedMaterialIds || [],
          });
        }

        setMaterials(materialsData.materials || []);
        
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        alert("Failed to load product");
      } finally {
        setLoading(false);
        setLoadingMaterials(false);
      }
    }

    if (productId) {
      fetchData();
    }
  }, [productId]);

  // ✅ Handle Media Upload
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

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formDataUpload,
        });

        const result = await response.json();
        
        if (result.success) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, result.url]
          }));
        } else {
          alert(result.error || "Upload failed!");
        }
      }
    } catch (error) {
      console.error("❌ Error uploading media:", error);
      alert("Upload failed!");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
      alert("Please add this material to available materials first");
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        if (name === "category") {
          updated.collectionType = value === "designer" ? "designer" : "wallcovering";
        }
        return updated;
      });
    }
  };

  const handleCollectionTypeChange = (newType: "wallcovering" | "designer") => {
    setFormData(prev => ({
      ...prev,
      collectionType: newType,
      category: newType,
      is25DEligible: newType === "wallcovering" ? false : prev.is25DEligible,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Product updated successfully!");
        router.push("/admin/products");
      } else {
        alert("❌ Update failed: " + result.error);
      }
    } catch (error) {
      console.error("❌ Update error:", error);
      alert("❌ Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Filter materials untuk display
  const physicalMaterials = materials.filter(isPhysicalMaterial);
  const services = materials.filter(isServiceOrAddon); // ✅ Sudah exclude samples

  const materialsByCategory = physicalMaterials.reduce((acc, material) => {
    const category = material.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-3xl font-light mb-2">Edit Product</h1>
        <p className="text-krearte-gray-600">Update product information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
          <h2 className="text-xl font-light mb-6">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-normal mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-normal mb-2">Slug (URL-friendly) *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                placeholder="dreamy-sky"
                required
              />
              <p className="text-xs text-krearte-gray-500 mt-1">
                Used in URL: /product/{formData.slug || "your-slug"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-normal mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
              >
                <option value="wallcovering">Wallcovering</option>
                <option value="designer">Designer Collection</option>
                <option value="material">Material</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-normal mb-2">Base Price (Rp) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-normal mb-2">Stock (units)</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                min="0"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-normal mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
              rows={4}
              placeholder="Product description..."
            />
          </div>
        </div>

        {/* Collection Type Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
          <h2 className="text-xl font-light mb-6">Collection Type</h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-4">
            Pilih kategori koleksi untuk design ini. Designer Collections menampilkan material premium & metallic.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleCollectionTypeChange("wallcovering")}
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
              onClick={() => handleCollectionTypeChange("designer")}
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

          {formData.collectionType === "designer" && (
            <div className="mt-6 p-4 bg-krearte-gray-50 rounded-lg border border-krearte-gray-200">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="is25DEligible"
                  id="is25DEligible"
                  checked={formData.is25DEligible}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-krearte-black mt-1"
                />
                <div>
                  <label htmlFor="is25DEligible" className="text-sm font-medium text-krearte-black cursor-pointer">
                    2.5D Print Effect Eligible
                  </label>
                  <p className="text-xs text-krearte-gray-500 mt-1">
                    Enable this to allow 2.5D textured print effect for this design. Only available for Designer Collections.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {formData.collectionType === "wallcovering" && (
            <p className="text-xs text-krearte-gray-400 mt-4 italic">
              2.5D Print Effect is only available for Designer Collections.
            </p>
          )}
        </div>

        {/* Product Media Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
          <h2 className="text-xl font-light mb-6">Product Media</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-normal mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Product Images
            </label>
            <div className="border-2 border-dashed border-krearte-gray-200 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleMediaUpload(e, "image")}
                disabled={uploading}
                className="hidden"
                id="image-upload-edit"
              />
              <label
                htmlFor="image-upload-edit"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-krearte-black text-krearte-white rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Images"}
              </label>
              <p className="text-xs text-krearte-gray-500 mt-2">PNG, JPG, WebP (max 10MB)</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-normal mb-3 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Product Videos
            </label>
            <div className="border-2 border-dashed border-krearte-gray-200 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/mp4,video/webm"
                multiple
                onChange={(e) => handleMediaUpload(e, "video")}
                disabled={uploading}
                className="hidden"
                id="video-upload-edit"
              />
              <label
                htmlFor="video-upload-edit"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-krearte-black text-krearte-white rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Videos"}
              </label>
              <p className="text-xs text-krearte-gray-500 mt-2">MP4, WebM (max 50MB)</p>
            </div>
          </div>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {formData.images.map((media, index) => {
                const isVideo = media.endsWith('.mp4') || media.endsWith('.webm');
                
                return (
                  <div key={index} className="relative aspect-square bg-krearte-gray-100 rounded-lg overflow-hidden group">
                    {isVideo ? (
                      <video src={media} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={media} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                    
                    <div className="absolute top-2 left-2 flex gap-1">
                      {index === 0 && (
                        <span className="px-2 py-1 bg-krearte-black text-krearte-white text-xs rounded">Primary</span>
                      )}
                      {isVideo && (
                        <span className="px-2 py-1 bg-blue-600 text-krearte-white text-xs rounded flex items-center gap-1">
                          <Film className="w-3 h-3" /> Video
                        </span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
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

        {/* Materials Section - PHYSICAL ONLY */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
          <h2 className="text-xl font-light mb-6">Materials</h2>

          {/* Available Materials */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-krearte-black">Available Materials</h3>
            
            {physicalMaterials.length === 0 ? (
              <div className="p-4 bg-krearte-gray-50 rounded-lg border border-krearte-gray-200">
                <p className="text-sm text-krearte-gray-600">
                  No physical materials available. Please add materials first.
                </p>
                <Link href="/admin/materials" className="inline-flex items-center gap-2 mt-2 text-sm text-krearte-black font-medium hover:text-krearte-gray-600">
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
                        <label
                          key={material.id}
                          className="flex items-center gap-3 p-4 border border-krearte-gray-200 rounded-lg hover:border-krearte-black transition-colors cursor-pointer bg-krearte-white"
                        >
                          <input
                            type="checkbox"
                            checked={formData.availableMaterialIds.includes(material.id)}
                            onChange={() => toggleAvailableMaterial(material.id)}
                            className="w-4 h-4 accent-krearte-black"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-krearte-black truncate">
                              {material.name}
                            </p>
                            <p className="text-xs text-krearte-gray-500">
                              {formatCurrency(material.pricePerM2)}/m²
                              {material.width && ` • ${material.width}`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Materials */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-krearte-black mb-3">
              Recommended Materials (Optional)
            </h3>
            <p className="text-xs text-krearte-gray-500 mb-3">
              Select materials to recommend (must be in available materials first)
            </p>
            
            {formData.availableMaterialIds.length === 0 ? (
              <p className="text-sm text-krearte-gray-500 italic">
                Select available materials first to enable recommendations
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {physicalMaterials
                  .filter((m) => formData.availableMaterialIds.includes(m.id))
                  .map((material) => (
                    <label
                      key={material.id}
                      className="flex items-center gap-3 p-4 border border-krearte-gray-200 rounded-lg cursor-pointer hover:bg-krearte-gray-50 transition-colors bg-krearte-white"
                    >
                      <input
                        type="checkbox"
                        checked={formData.recommendedMaterialIds.includes(material.id)}
                        onChange={() => toggleRecommendedMaterial(material.id)}
                        className="w-4 h-4 accent-krearte-black"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-krearte-black truncate">
                          {material.name}
                        </p>
                        <p className="text-xs text-krearte-gray-500">
                          {formatCurrency(material.pricePerM2)}/m²
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ✅ Services / Add-Ons Section - EXCLUDE SAMPLES */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-2 flex items-center gap-2">
            Available Services / Add-Ons
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              {services.length}
            </span>
          </h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-6">
            Pilih jasa/add-on yang tersedia untuk product ini (opsional)
          </p>
          
          {loadingMaterials ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-krearte-black border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-krearte-gray-500">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="p-4 bg-krearte-gray-50 border border-krearte-gray-200 rounded-lg">
              <p className="text-sm text-krearte-gray-500">
                ℹ️ No services/add-ons configured yet.
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
                        <label
                          key={service.id}
                          className="flex items-center gap-3 p-4 border border-krearte-gray-200 rounded-lg hover:border-krearte-black transition-colors cursor-pointer bg-krearte-white"
                        >
                          <input
                            type="checkbox"
                            checked={formData.availableMaterialIds.includes(service.id)}
                            onChange={() => toggleAvailableMaterial(service.id)}
                            className="w-4 h-4 accent-krearte-black"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-krearte-black truncate">
                                {service.name}
                              </p>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded flex-shrink-0">
                                ADD-ON
                              </span>
                            </div>
                            <p className="text-xs text-krearte-gray-500">
                              {formatCurrency(service.pricePerM2)}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-8 py-3 border border-krearte-gray-300 rounded-lg hover:bg-krearte-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 px-8 py-3 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
            ) : (
              <><Save className="w-5 h-5" /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}