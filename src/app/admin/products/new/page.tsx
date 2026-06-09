// app/admin/products/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, Film, Image as ImageIcon, Loader2 } from "lucide-react";
import { slugify, formatCurrency } from "@/lib/utils";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  collectionType: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    collectionType: "wallcovering",
    category_slug: "",
    is25DEligible: false,
    stock: 0,
    availableMaterialIds: [] as string[],
    recommendedMaterialIds: [] as string[],
  });

  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔍 Fetching materials and categories...');
        
        const [materialsRes, categoriesRes] = await Promise.all([
          fetch("/api/materials"),
          fetch("/api/categories"),
        ]);

        const materialsData = await materialsRes.json();
        const categoriesData = await categoriesRes.json();
        
        console.log('📦 Materials API:', materialsData);
        console.log('📦 Categories API:', categoriesData);
        
        if (materialsData.success) {
          setMaterials(materialsData.materials || []);
        }
        
        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        } else {
          console.warn('⚠️ Categories API tidak return data');
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setLoadingMaterials(false);
        setLoadingCategories(false);
      }
    }
    
    fetchData();
  }, []);

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

  const physicalMaterials = materials.filter(isPhysicalMaterial);
  const services = materials.filter(isServiceOrAddon);

  const materialsByCategory = physicalMaterials.reduce((acc, material) => {
    const category = material.category || 'Other';
    if (!acc[category]) acc[category] = [];
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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`📁 Processing ${type}:`, file.name);

        const isVideo = type === "video";
        const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
        
        if (file.size > maxSize) {
          throw new Error(`File terlalu besar. Maksimal ${isVideo ? "100MB" : "20MB"}`);
        }

        if (isVideo) {
          const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
          if (!allowed.includes(file.type)) throw new Error("Format video tidak didukung");
        } else {
          const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowed.includes(file.type)) throw new Error("Format gambar tidak didukung");
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('type', type);

        const response = await fetch('https://assets.krearte.id/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer krearte-super-secret-upload-key-2026-pb6xv4Tqz7RDtFj0yXcUO5QkJ'
          },
          body: formDataUpload,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        if (!result.url) throw new Error("Invalid server response");
        
        setImages(prev => [...prev, result.url]);
      }
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      setError(err.message || "Upload failed");
      alert(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
      setUploadProgress(0);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAvailableMaterial = (materialId: string) => {
    setFormData(prev => {
      const exists = prev.availableMaterialIds.includes(materialId);
      if (exists) {
        return {
          ...prev,
          availableMaterialIds: prev.availableMaterialIds.filter(id => id !== materialId),
          recommendedMaterialIds: prev.recommendedMaterialIds.filter(id => id !== materialId)
        };
      } else {
        return { ...prev, availableMaterialIds: [...prev.availableMaterialIds, materialId] };
      }
    });
  };

  const toggleRecommendedMaterial = (materialId: string) => {
    if (!formData.availableMaterialIds.includes(materialId)) {
      alert("Add to Available Materials first");
      return;
    }
    setFormData(prev => {
      const exists = prev.recommendedMaterialIds.includes(materialId);
      if (exists) {
        return { ...prev, recommendedMaterialIds: prev.recommendedMaterialIds.filter(id => id !== materialId) };
      } else {
        return { ...prev, recommendedMaterialIds: [...prev.recommendedMaterialIds, materialId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('📝 Form data sebelum submit:', formData);
      
      if (!formData.name.trim() || !formData.slug.trim()) {
        throw new Error("Name and Slug are required");
      }

      if (!formData.category_slug) {
        throw new Error("Category Slug (untuk filtering) harus dipilih");
      }
      
      const imagePayload = images.length > 0 
        ? images.filter(url => url?.trim()) 
        : ["/images/wallpaper-fallback.jpg"];

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || "",
        category: formData.collectionType === 'wallcovering' ? 'wallcovering' : 'designer',
        category_slug: formData.category_slug,
        collectionType: formData.collectionType || "wallcovering",
        is25DEligible: Boolean(formData.is25DEligible),
        stock: Number(formData.stock) || 0,
        price: 0,
        images: imagePayload,
        availableMaterialIds: formData.availableMaterialIds || [],
        recommendedMaterialIds: formData.recommendedMaterialIds || [],
      };

      console.log("📤 Creating product with payload:", payload);

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('📥 API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}`);
      }

      alert("✅ Product created successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      console.error("💥 Error creating product:", err);
      setError(err.message || "Failed to create product");
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 text-krearte-gray-600 hover:text-krearte-black hover:bg-krearte-gray-100 rounded transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-sans text-3xl font-light mb-2">Add Product</h1>
          <p className="text-krearte-gray-600 font-light">Create a new wallcovering product listing</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-normal text-krearte-black mb-2">Product Name *</label>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-normal text-krearte-black mb-2">Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                placeholder="e.g., blush-bunny-meadow"
              />
              <p className="text-xs text-krearte-gray-500 mt-1">Used in URL: /product/{formData.slug || "your-slug"}</p>
            </div>

            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">Collection Type *</label>
              <select
                name="collectionType"
                value={formData.collectionType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light bg-white"
              >
                <option value="wallcovering">Wallcovering</option>
                <option value="designer">Designer Collections</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">Category Slug (Filter) *</label>
              <select
                name="category_slug"
                value={formData.category_slug}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light bg-white"
              >
                <option value="">Select category...</option>
                {formData.collectionType === 'wallcovering' ? (
                  <>
                    <option value="chinoiserie">Chinoiserie</option>
                    <option value="zen">Zen</option>
                    <option value="flower-leaves">Flower & Leaves</option>
                    <option value="animals">Animals</option>
                    <option value="abstract">Abstract</option>
                    <option value="geometric">Geometric</option>
                    <option value="tropical">Tropical</option>
                    <option value="lotus">Lotus</option>
                    <option value="marble">Marble</option>
                    <option value="toile-de-jouy">Toile de Jouy</option>
                    <option value="scenery">Scenery</option>
                    <option value="du-pavillon">Du Pavillon</option>
                    <option value="jolly-wolly">Jolly Wolly</option>
                  </>
                ) : (
                  <>
                    {/* ✅ UPDATED: Ganti ke nama designer Krearte */}
                    <option value="krearte-botanical">Krearte Botanical</option>
                    <option value="krearte-metallic">Krearte Metallic</option>
                    <option value="krearte-textured">Krearte Textured</option>
                    <option value="krearte-exclusive">Krearte Exclusive</option>
                  </>
                )}
              </select>
              <p className="text-xs text-krearte-gray-500 mt-1">Untuk URL: /collection/{formData.collectionType}/{formData.category_slug || 'category'}</p>
            </div>

            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">Stock (units)</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                placeholder="0"
              />
            </div>

            {/* ✅ UPDATED: Hapus disabled dari checkbox is25DEligible */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is25DEligible"
                id="is25DEligible"
                checked={formData.is25DEligible}
                onChange={handleInputChange}
                className="w-4 h-4 accent-krearte-black mr-2"
              />
              <label htmlFor="is25DEligible" className="text-sm font-normal text-krearte-black">
                2.5D Print Effect Eligible
              </label>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-normal text-krearte-black mb-2">Description</label>
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

        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-6">Product Media</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-normal text-krearte-black mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Product Images
            </label>
            <div className="border-2 border-dashed border-krearte-gray-300 rounded-lg p-6 text-center">
              <input type="file" accept="image/*" multiple onChange={(e) => handleMediaUpload(e, "image")} disabled={uploading} className="hidden" id="image-upload" />
              <label htmlFor="image-upload" className={`cursor-pointer inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${uploading ? "bg-krearte-gray-400" : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? `Uploading...` : "Upload Images"}
              </label>
              <p className="text-sm text-krearte-gray-500 mt-2">PNG, JPG, GIF, WebP up to 20MB</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-normal text-krearte-black mb-3 flex items-center gap-2">
              <Film className="w-4 h-4" /> Product Videos
            </label>
            <div className="border-2 border-dashed border-krearte-gray-300 rounded-lg p-6 text-center">
              <input type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={(e) => handleMediaUpload(e, "video")} disabled={uploading} className="hidden" id="video-upload" />
              <label htmlFor="video-upload" className={`cursor-pointer inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${uploading ? "bg-krearte-gray-400" : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? `Uploading...` : "Upload Videos"}
              </label>
              <p className="text-sm text-krearte-gray-500 mt-2">MP4, WebM, MOV up to 100MB</p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {images.map((media, index) => {
                const isVideo = media.endsWith('.mp4') || media.endsWith('.webm') || media.endsWith('.mov');
                return (
                  <div key={index} className="relative aspect-square bg-krearte-gray-100 rounded-lg overflow-hidden group">
                    {isVideo ? <video src={media} className="w-full h-full object-cover" muted playsInline /> : <img src={media} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {index === 0 && <span className="px-2 py-1 bg-krearte-black text-krearte-white text-xs rounded">Primary</span>}
                      {isVideo && <span className="px-2 py-1 bg-blue-600 text-krearte-white text-xs rounded flex items-center gap-1"><Film className="w-3 h-3" /> Video</span>}
                    </div>
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-krearte-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
          <h2 className="font-sans text-lg font-normal mb-2">Available Materials</h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-6">Pilih material fisik yang tersedia untuk product ini.</p>
          
          {loadingMaterials ? (
            <div className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-krearte-black border-t-transparent rounded-full mx-auto mb-2" /><p className="text-sm text-krearte-gray-500">Loading materials...</p></div>
          ) : physicalMaterials.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-sm text-yellow-800">⚠️ No physical materials found.</p><Link href="/admin/materials" className="inline-flex items-center gap-2 mt-2 text-sm text-krearte-black font-medium hover:text-krearte-gray-600">Go to Materials Management →</Link></div>
          ) : (
            <div className="space-y-6">
              {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-krearte-gray-500 uppercase tracking-wider mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryMaterials.map((material) => (
                      <button key={material.id} type="button" onClick={() => toggleAvailableMaterial(material.id)} className={`p-3 border rounded-lg text-left transition-all ${formData.availableMaterialIds.includes(material.id) ? "border-krearte-black bg-krearte-black text-krearte-white" : "border-krearte-gray-200 hover:border-krearte-black"}`}>
                        <p className="font-normal text-sm">{material.name}</p>
                        <p className={`text-xs mt-1 ${formData.availableMaterialIds.includes(material.id) ? "text-krearte-gray-300" : "text-krearte-gray-500"}`}>Rp {material.pricePerM2.toLocaleString()}/m² • {material.width}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formData.availableMaterialIds.length > 0 && (
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-2">Recommended Materials (Optional)</h2>
            <p className="text-sm font-light text-krearte-gray-600 mb-6">Tandai material yang direkomendasikan untuk design ini.</p>
            <div className="space-y-6">
              {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-krearte-gray-500 uppercase tracking-wider mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryMaterials.filter(m => formData.availableMaterialIds.includes(m.id)).map((material) => (
                      <button key={material.id} type="button" onClick={() => toggleRecommendedMaterial(material.id)} className={`p-3 border rounded-lg text-left transition-all ${formData.recommendedMaterialIds.includes(material.id) ? "border-krearte-black bg-krearte-black text-krearte-white" : "border-krearte-gray-200 hover:border-krearte-black"}`}>
                        <p className="font-normal text-sm">{material.name}</p>
                        <p className={`text-xs ${formData.recommendedMaterialIds.includes(material.id) ? "text-krearte-gray-300" : "text-krearte-gray-500"}`}>Rp {material.pricePerM2.toLocaleString()}/m²</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6 mt-6">
          <h2 className="font-sans text-lg font-normal mb-2 flex items-center gap-2">Available Services / Add-Ons <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{services.length}</span></h2>
          <p className="text-sm font-light text-krearte-gray-600 mb-6">Pilih jasa/add-on yang tersedia untuk product ini (opsional).</p>
          
          {loadingMaterials ? (
            <div className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-krearte-black border-t-transparent rounded-full mx-auto mb-2" /><p className="text-sm text-krearte-gray-500">Loading services...</p></div>
          ) : services.length === 0 ? (
            <div className="p-4 bg-krearte-gray-50 border border-krearte-gray-200 rounded-lg"><p className="text-sm text-krearte-gray-500">ℹ️ No services/add-ons configured yet.</p></div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const servicesByCategory = services.reduce((acc, service) => { const cat = service.category || 'Other'; if (!acc[cat]) acc[cat] = []; acc[cat].push(service); return acc; }, {} as Record<string, Material[]>);
                return Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-krearte-gray-500 uppercase tracking-wider mb-3">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryServices.map((service) => (
                        <button key={service.id} type="button" onClick={() => toggleAvailableMaterial(service.id)} className={`p-3 border rounded-lg text-left transition-all ${formData.availableMaterialIds.includes(service.id) ? "border-krearte-black bg-krearte-black text-krearte-white" : "border-krearte-gray-200 hover:border-krearte-black"}`}>
                          <div className="flex items-center justify-between"><p className="font-normal text-sm">{service.name}</p><span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">ADD-ON</span></div>
                          <p className={`text-xs mt-1 ${formData.availableMaterialIds.includes(service.id) ? "text-krearte-gray-300" : "text-krearte-gray-500"}`}>{formatCurrency(service.pricePerM2)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-krearte-gray-200">
          <Link href="/admin/products" className="px-6 py-3 text-krearte-black font-medium hover:text-krearte-gray-600">Cancel</Link>
          <button type="submit" disabled={loading || uploading || loadingMaterials} className={`px-8 py-3 rounded-full text-sm font-medium transition-colors ${loading || uploading || loadingMaterials ? "bg-krearte-gray-300 cursor-not-allowed" : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"}`}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : uploading ? "Uploading..." : loadingMaterials ? "Loading..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}