// src/app/admin/gallery/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Image as ImageIcon, Plus, Loader2, X, Check } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  description: string | null;
  isFeatured: boolean;
  order: number;
  createdAt: string;
}

export default function AdminGalleryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "general",
    description: "",
    isFeatured: false,
    order: 0,
  });

  // Fetch gallery items
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/gallery");
      const result = await response.json();
      
      if (result.success) {
        setGallery(result.gallery || []);
      } else {
        console.error("Failed to fetch gallery:", result.error);
      }
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    if (!formData.title.trim()) {
      alert("Please enter a title for the gallery item");
      return;
    }

    setUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append("file", selectedFile);
    uploadFormData.append("title", formData.title.trim());
    uploadFormData.append("category", formData.category);
    uploadFormData.append("description", formData.description.trim());
    uploadFormData.append("isFeatured", formData.isFeatured.toString());
    uploadFormData.append("order", formData.order.toString());

    try {
      // ✅ Upload via Vercel API (yang proxy ke VPS)
      const response = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: uploadFormData,
        // ❌ JANGAN set Content-Type header manual, biar browser handle boundary
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Gallery photo uploaded successfully!");
        // Reset form
        setPreview(null);
        setSelectedFile(null);
        setFormData({
          title: "",
          category: "general",
          description: "",
          isFeatured: false,
          order: 0,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh list
        fetchGallery();
      } else {
        alert("❌ Upload failed: " + (result.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("❌ Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      const response = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Deleted successfully!");
        fetchGallery();
      } else {
        alert("❌ Delete failed: " + (result.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      alert("❌ Delete failed: " + error.message);
    }
  };

  // Handle input change
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Clear preview
  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-krearte-black mb-2">Gallery Management</h1>
        <p className="text-krearte-gray-600 font-light">
          Upload and manage your gallery photos
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-krearte-gray-200">
        <h2 className="text-xl font-light mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-krearte-black" />
          Upload New Photo
        </h2>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-normal text-krearte-black mb-3">
              Photo *
            </label>
            
            {!preview ? (
              // Drop zone / Upload button
              <div 
                className="border-2 border-dashed border-krearte-gray-300 rounded-lg p-8 text-center hover:border-krearte-black hover:bg-krearte-gray-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="gallery-upload"
                />
                <div className="text-krearte-gray-600">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-krearte-gray-400" />
                  <p className="font-medium text-krearte-black">Click to upload or drag and drop</p>
                  <p className="text-sm text-krearte-gray-500 mt-1">PNG, JPG, WebP up to 10MB</p>
                </div>
              </div>
            ) : (
              // Preview mode
              <div className="relative">
                <div className="border-2 border-krearte-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-lg border border-krearte-gray-200" 
                    />
                    <div className="flex-1">
                      <p className="font-medium text-krearte-black truncate">
                        {selectedFile?.name}
                      </p>
                      <p className="text-sm text-krearte-gray-500">
                        {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <Check className="w-4 h-4" /> Ready to upload
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPreview}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                placeholder="e.g., Dreamy Sky Installation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
              >
                <option value="general">General</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="custom">Custom</option>
                <option value="installation">Installation</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-normal text-krearte-black mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          {/* Featured & Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleInputChange("isFeatured", e.target.checked)}
                className="w-4 h-4 accent-krearte-black"
              />
              <label htmlFor="isFeatured" className="text-sm font-normal text-krearte-black">
                Feature this item on homepage
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-normal text-krearte-black mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => handleInputChange("order", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                min="0"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-krearte-gray-200">
            <button
              type="submit"
              disabled={uploading || !preview}
              className="px-8 py-3 bg-krearte-black text-white font-medium rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading to VPS...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Upload Photo
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Gallery List */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-krearte-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-krearte-black" />
            Existing Gallery Items
          </h2>
          <span className="text-sm text-krearte-gray-500">
            {gallery.length} item{gallery.length !== 1 ? 's' : ''}
          </span>
        </div>

        {gallery.length === 0 ? (
          <div className="text-center py-12 text-krearte-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-light">No gallery items yet</p>
            <p className="text-sm mt-2">Upload your first photo above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item) => (
              <div 
                key={item.id} 
                className="group border border-krearte-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-krearte-black transition-all"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-krearte-gray-100">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                    }}
                  />
                  {item.isFeatured && (
                    <span className="absolute top-3 left-3 px-2 py-1 bg-krearte-black text-white text-xs rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-normal text-krearte-black mb-1 truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-krearte-gray-500 mb-2 capitalize">
                    {item.category}
                  </p>
                  {item.description && (
                    <p className="text-sm text-krearte-gray-600 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-krearte-gray-400">
                    <span>Order: {item.order}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-krearte-gray-100">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors w-full justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}