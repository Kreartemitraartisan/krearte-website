"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Edit, Save, Upload, Loader2, Package } from "lucide-react";

interface Material {
  id: string;
  name: string;
  category: string;
  width: string | null;
  effectiveWidth: number | null;
  pricePerM2: number;
  waste: number;
  samplePriceA3: number;
  stock: number;
  description: string | null;
  imageUrl: string | null; // ✅ Pastikan field ini ada di database atau gunakan field lain
}

export default function MaterialsManagementPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Material>>({});
  const [saving, setSaving] = useState(false);

  // Fetch Materials
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch("/api/admin/materials");
        const data = await res.json();
        if (data.success) setMaterials(data.materials);
      } catch (err) {
        console.error("Failed to fetch materials", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  // Handle Edit Click
  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setFormData(material);
  };

  // Handle Save
  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...formData }),
      });
      const data = await res.json();
      if (data.success) {
        setMaterials(prev => prev.map(m => m.id === editingId ? data.material : m));
        setEditingId(null);
        setFormData({});
      }
    } catch (err) {
      console.error("Failed to save", err);
      alert("Gagal menyimpan!");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light">Materials Management</h1>
        <button className="px-4 py-2 bg-krearte-black text-white rounded hover:opacity-90">
          Add Material (Coming Soon)
        </button>
      </div>

      <div className="grid gap-6">
        {materials.map((material) => (
          <div key={material.id} className="bg-white p-6 rounded-lg border border-gray-200">
            {editingId === material.id ? (
              // ✅ MODE EDIT
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Name</label>
                    <input
                      className="w-full p-2 border rounded"
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Category</label>
                    <input
                      className="w-full p-2 border rounded"
                      value={formData.category || ""}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Price per m²</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={formData.pricePerM2 || 0}
                      onChange={(e) => handleInputChange("pricePerM2", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Effective Width (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border rounded"
                      value={formData.effectiveWidth || ""}
                      onChange={(e) => handleInputChange("effectiveWidth", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Image URL (Supabase)</label>
                    <input
                      className="w-full p-2 border rounded"
                      placeholder="https://..."
                      value={(formData as any).imageUrl || ""}
                      onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-black text-white rounded flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // ✅ MODE VIEW
              <div className="flex items-start gap-6">
                {/* Preview Image */}
                <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {(material as any).imageUrl ? (
                    <img src={(material as any).imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Package /></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium">{material.name}</h3>
                  <p className="text-sm text-gray-500">{material.category}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span>{formatCurrency(material.pricePerM2)}/m²</span>
                    <span>Effective Width: {material.effectiveWidth || "-"}m</span>
                  </div>
                </div>

                <button onClick={() => handleEdit(material)} className="p-2 text-gray-400 hover:text-black">
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}