// src/app/admin/gallery/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon, Plus, Loader2, X, Check, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  description: string | null;
  createdAt: string;
  order: number;
}

// Component untuk setiap item yang bisa di-drag
function SortableGalleryItem({ item, onDelete }: { item: GalleryItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="group border border-krearte-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-krearte-black transition-all bg-white"
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="bg-krearte-gray-50 p-2 cursor-move flex items-center gap-2 border-b border-krearte-gray-200"
      >
        <GripVertical className="w-5 h-5 text-krearte-gray-400" />
        <span className="text-xs text-krearte-gray-500">Drag to reorder</span>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] bg-krearte-gray-100 overflow-hidden">
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
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
        
        <div className="text-xs text-krearte-gray-400 mb-4">
          {new Date(item.createdAt).toLocaleDateString("id-ID", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
        
        {/* Delete Button */}
        <div className="pt-4 border-t border-krearte-gray-100">
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors w-full justify-center"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminGalleryPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reordering, setReordering] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "general",
    description: "",
  });

  // Setup drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gallery");
      const result = await response.json();
      
      if (result.success) {
        // Sort by order field
        const sorted = (result.gallery || []).sort((a: GalleryItem, b: GalleryItem) => a.order - b.order);
        setGallery(sorted);
      } else {
        console.error("Failed to fetch gallery:", result.error);
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

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, WebP)");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large! Maximum size is 10MB.`);
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

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

    try {
      const response = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Gallery photo uploaded successfully!");
        setPreview(null);
        setSelectedFile(null);
        setFormData({
          title: "",
          category: "general",
          description: "",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      const response = await fetch(`/api/admin/gallery?id=${id}`, {
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

  // Handle drag end - update order
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setReordering(true);
      
      const oldIndex = gallery.findIndex(item => item.id === active.id);
      const newIndex = gallery.findIndex(item => item.id === over.id);
      const newItems = arrayMove(gallery, oldIndex, newIndex);
      
      // Update local state
      setGallery(newItems);
      
      // Update order field
      const itemsWithOrder = newItems.map((item, index) => ({
        id: item.id,
        order: index
      }));
      
      try {
        const response = await fetch("/api/admin/gallery/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsWithOrder }),
        });

        if (!response.ok) {
          throw new Error("Failed to update order");
        }
      } catch (error) {
        console.error("Reorder error:", error);
        alert("Failed to update order. Please refresh and try again.");
        fetchGallery(); // Reload original order
      } finally {
        setReordering(false);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-krearte-black mb-2">Gallery Management</h1>
        <p className="text-krearte-gray-600 font-light">
          Upload and manage your gallery photos. Drag and drop to reorder.
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-krearte-gray-200">
        <h2 className="text-xl font-light mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-krearte-black" />
          Upload New Photo
        </h2>

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-normal text-krearte-black mb-3">
              Photo *
            </label>
            
            {!preview ? (
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
              <div className="relative">
                <div className="border-2 border-krearte-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-lg border border-krearte-gray-200" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-krearte-black truncate">
                        {selectedFile?.name}
                      </p>
                      <p className="text-sm text-krearte-gray-500">
                        {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <Check className="w-4 h-4" /> Ready to upload
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPreview}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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

      {/* Gallery List with Drag & Drop */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-krearte-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-krearte-black" />
            Existing Gallery Items
            {reordering && <Loader2 className="w-4 h-4 animate-spin text-krearte-gray-500" />}
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
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={gallery.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((item) => (
                  <SortableGalleryItem 
                    key={item.id} 
                    item={item} 
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}