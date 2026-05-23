"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Image, Plus, Loader2 } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  description: string | null;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminGalleryPage() {
  const router = useRouter();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    category: "residential",
    description: "",
  });

  // Fetch gallery items
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await fetch("/api/gallery");
      const result = await response.json();
      
      if (result.success) {
        setGallery(result.items || []);
      }
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Create preview
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fileInput = document.getElementById("gallery-upload") as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("title", formData.title);
    uploadFormData.append("category", formData.category);
    uploadFormData.append("description", formData.description);

    try {
      const response = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Gallery photo uploaded successfully!");
        setPreview(null);
        setFormData({ title: "", category: "residential", description: "" });
        fileInput.value = "";
        fetchGallery();
      } else {
        alert("❌ Upload failed: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
        alert("❌ Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Gallery Management</h1>
        <p className="text-krearte-gray-600">Upload and manage your gallery photos</p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-krearte-gray-200">
        <h2 className="text-xl font-light mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload New Photo
        </h2>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-normal mb-2">Photo</label>
            <div className="border-2 border-dashed border-krearte-gray-300 rounded-lg p-8 text-center hover:border-krearte-black transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="gallery-upload"
              />
              <label htmlFor="gallery-upload" className="cursor-pointer">
                <div className="text-krearte-gray-600">
                  <Image className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-krearte-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </label>
            </div>

            {preview && (
              <div className="mt-4">
                <img src={preview} alt="Preview" className="w-48 h-48 object-cover rounded-lg border border-krearte-gray-200" />
              </div>
            )}
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-normal mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
                placeholder="e.g., Dreamy Sky Installation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-normal mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="custom">Custom</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-normal mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black transition-colors"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !preview}
            className="px-8 py-4 bg-krearte-black text-white font-medium rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Upload Photo
              </>
            )}
          </button>
        </form>
      </div>

      {/* Gallery List */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
        <h2 className="text-xl font-light mb-6 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Existing Gallery Items ({gallery.length})
        </h2>

        {gallery.length === 0 ? (
          <div className="text-center py-12 text-krearte-gray-500">
            <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No gallery items yet</p>
            <p className="text-sm mt-2">Upload your first photo above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item) => (
              <div key={item.id} className="border border-krearte-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-normal mb-2">{item.title}</h3>
                  <p className="text-sm text-krearte-gray-500 mb-2 capitalize">{item.category}</p>
                  {item.description && (
                    <p className="text-sm text-krearte-gray-600 mb-4 line-clamp-2">{item.description}</p>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}