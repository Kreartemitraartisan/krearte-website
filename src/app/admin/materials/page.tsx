// src/app/admin/materials/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Edit, Save, Upload, Loader2, Package, X, Image as ImageIcon } from "lucide-react";

interface Material {
  id: string;
  name: string;
  category: string;
  width: string | null;
  effectiveWidth: number | null;
  pricePerM2: number;
  designerPricePerM2?: number | null;
  resellerPricePerM2?: number | null;
  waste: number;
  samplePriceA3: number;
  stock: number;
  is25DEligible: boolean;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MaterialsManagementPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Material>>({});
  const [saving, setSaving] = useState(false);
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Materials
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/materials");
      const data = await res.json();
      
      if (data.success) {
        setMaterials(data.materials);
      } else {
        alert("Failed to fetch materials: " + data.error);
      }
    } catch (err: any) {
      console.error("Failed to fetch materials", err);
      alert("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle File Upload (ke VPS via Vercel API proxy)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload JPG, PNG, or WEBP");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB");
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      // ✅ Upload via Vercel API proxy ke VPS
      // Header "folder" memberitahu VPS untuk simpan di folder materials/
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
        headers: {
          "folder": "materials", // ✅ Penting: folder tujuan di VPS
        },
        // ❌ JANGAN set Content-Type: multipart/form-data manual!
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Auto-fill imageUrl di form dengan URL dari VPS
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        alert("Image uploaded successfully!");
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Edit Click
  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setFormData({ ...material });
  };

  // Handle Save (Update material ke database)
  const handleSave = async () => {
    if (!editingId) return;
    
    // Validate required fields
    if (!formData.name?.trim()) {
      alert("Material name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingId, 
          ...formData,
          // ✅ imageUrl sudah termasuk di formData dari hasil upload
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMaterials(prev => prev.map(m => m.id === editingId ? data.material : m));
        setEditingId(null);
        setFormData({});
        alert("Material updated successfully!");
      } else {
        alert(`Save failed: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Failed to save", err);
      alert("Failed to save material!");
    } finally {
      setSaving(false);
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  // Handle Input Change
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-krearte-black">Materials Management</h1>
        <p className="text-krearte-gray-600 font-light mt-2">
          Manage your material catalog, pricing, and images
        </p>
      </div>

      {/* Materials List */}
      <div className="grid gap-6">
        {materials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-krearte-gray-200">
            <Package className="w-12 h-12 mx-auto text-krearte-gray-300 mb-4" />
            <p className="text-krearte-gray-500 font-light">No materials found</p>
            <p className="text-sm text-krearte-gray-400 mt-1">Materials will appear here once created</p>
          </div>
        ) : (
          materials.map((material) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-krearte-gray-200 overflow-hidden"
            >
              {editingId === material.id ? (
                // ✅ EDIT MODE dengan Upload
                <div className="p-6 space-y-6">
                  {/* Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-krearte-black mb-3">
                      Material Image
                    </label>
                    
                    {formData.imageUrl ? (
                      // Preview uploaded image
                      <div className="relative w-full h-64 bg-krearte-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={formData.imageUrl}
                          alt="Material preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                        <button
                          onClick={() => handleInputChange("imageUrl", null)}
                          className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      // Upload button
                      <div className="border-2 border-dashed border-krearte-gray-300 rounded-lg p-8 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="material-image-upload"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Uploading to VPS...
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5" />
                              Choose Image
                            </>
                          )}
                        </button>
                        <p className="text-sm text-krearte-gray-500 mt-3">
                          PNG, JPG, WebP up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-krearte-gray-600 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-4 py-2 border border-krearte-gray-300 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                        placeholder="e.g., Standard PVC"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-krearte-gray-600 mb-2">
                        Category *
                      </label>
                      <input
                        type="text"
                        value={formData.category || ""}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        className="w-full px-4 py-2 border border-krearte-gray-300 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                        placeholder="e.g., PVC Wallcoverings"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-krearte-gray-600 mb-2">
                        Price per m² (Rp)
                      </label>
                      <input
                        type="number"
                        value={formData.pricePerM2 || 0}
                        onChange={(e) => handleInputChange("pricePerM2", Number(e.target.value))}
                        className="w-full px-4 py-2 border border-krearte-gray-300 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-krearte-gray-600 mb-2">
                        Effective Width (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.effectiveWidth || ""}
                        onChange={(e) => handleInputChange("effectiveWidth", e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-2 border border-krearte-gray-300 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                        placeholder="1.03"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-krearte-gray-600 mb-2">
                        Stock (m²)
                      </label>
                      <input
                        type="number"
                        value={formData.stock || 0}
                        onChange={(e) => handleInputChange("stock", Number(e.target.value))}
                        className="w-full px-4 py-2 border border-krearte-gray-300 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-krearte-gray-600 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-krearte-gray-300 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                      placeholder="Material description..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-krearte-gray-200">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 text-sm font-medium text-krearte-gray-600 hover:text-krearte-black transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || uploading}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // ✅ VIEW MODE
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Image Preview */}
                    <div className="w-24 h-24 bg-krearte-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {material.imageUrl ? (
                        <img
                          src={material.imageUrl}
                          alt={material.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-krearte-black mb-1">
                        {material.name}
                      </h3>
                      <p className="text-sm text-krearte-gray-500 mb-3">
                        {material.category}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="font-medium text-krearte-black">
                          {formatCurrency(material.pricePerM2)}/m²
                        </span>
                        {material.effectiveWidth && (
                          <span className="text-krearte-gray-600">
                            Effective: {material.effectiveWidth}m
                          </span>
                        )}
                        <span className="text-krearte-gray-600">
                          Stock: {material.stock} m²
                        </span>
                      </div>

                      {material.description && (
                        <p className="text-sm text-krearte-gray-600 mt-3 line-clamp-2">
                          {material.description}
                        </p>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(material)}
                      className="p-2 text-krearte-gray-400 hover:text-krearte-black hover:bg-krearte-gray-100 rounded-lg transition-colors"
                      title="Edit material"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}