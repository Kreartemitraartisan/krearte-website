// app/admin/designers/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Edit, Trash2, ExternalLink, Instagram, Globe } from "lucide-react";

interface Designer {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo: string | null;
  instagram: string | null;
  website: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: {
    products: number;
  };
}

export default function DesignersAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    bio: "",
    photo: "",
    instagram: "",
    website: "",
    sortOrder: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    } else {
      fetchDesigners();
    }
  }, [status, router]);

  const fetchDesigners = async () => {
    try {
      const response = await fetch("/api/admin/designers");
      const result = await response.json();
      
      if (result.success) {
        setDesigners(result.designers);
      }
    } catch (error) {
      console.error("Error fetching designers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDesigner 
        ? `/api/admin/designers/${editingDesigner.id}`
        : "/api/admin/designers";
      
      const method = editingDesigner ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Designer ${editingDesigner ? "updated" : "created"} successfully!`);
        setShowModal(false);
        setEditingDesigner(null);
        setFormData({
          name: "",
          slug: "",
          bio: "",
          photo: "",
          instagram: "",
          website: "",
          sortOrder: 0,
        });
        fetchDesigners();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving designer:", error);
      alert("Failed to save designer");
    }
  };

  const handleEdit = (designer: Designer) => {
    setEditingDesigner(designer);
    setFormData({
      name: designer.name,
      slug: designer.slug,
      bio: designer.bio || "",
      photo: designer.photo || "",
      instagram: designer.instagram || "",
      website: designer.website || "",
      sortOrder: designer.sortOrder,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this designer?")) return;
    
    try {
      const response = await fetch(`/api/admin/designers/${id}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("Designer deleted successfully!");
        fetchDesigners();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting designer:", error);
      alert("Failed to delete designer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      <div className="container mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-sans text-3xl font-light mb-2">Manage Designers</h1>
            <p className="text-krearte-gray-600 font-light">
              Manage designer collections and their profiles
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-krearte-black text-krearte-white rounded-lg hover:bg-krearte-charcoal transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Designer
          </button>
        </div>

        {/* Designers List */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-krearte-gray-50 border-b border-krearte-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-krearte-gray-500 uppercase tracking-wider">
                    Designer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-krearte-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-krearte-gray-500 uppercase tracking-wider">
                    Social Links
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-krearte-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-krearte-gray-200">
                {designers.map((designer) => (
                  <tr key={designer.id} className="hover:bg-krearte-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {designer.photo ? (
                          <img
                            src={designer.photo}
                            alt={designer.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-krearte-gray-200 flex items-center justify-center">
                            <span className="text-krearte-gray-400 font-light">
                              {designer.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-normal text-krearte-black">
                            {designer.name}
                          </div>
                          <div className="text-sm text-krearte-gray-500">
                            {designer.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-krearte-gray-600">
                        {designer._count.products} products
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {designer.instagram && (
                          <a
                            href={designer.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-krearte-gray-400 hover:text-krearte-black"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {designer.website && (
                          <a
                            href={designer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-krearte-gray-400 hover:text-krearte-black"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(designer)}
                          className="p-2 text-krearte-gray-600 hover:text-krearte-black transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(designer.id)}
                          className="p-2 text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {designers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-krearte-gray-500 font-light">
                No designers found. Click "Add Designer" to create one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-krearte-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-sans text-2xl font-light mb-6">
                {editingDesigner ? "Edit Designer" : "Add New Designer"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-krearte-black mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-krearte-black mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                    placeholder="e.g., krearte-botanical"
                    required
                  />
                  <p className="text-xs text-krearte-gray-500 mt-1">
                    Used in URL (lowercase, hyphens only)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-krearte-black mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-krearte-black mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="w-full px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                    placeholder="https://..."
                  />
                  {formData.photo && (
                    <div className="mt-2">
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-krearte-black mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-krearte-black mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-krearte-black mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>

                <div className="flex items-center justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingDesigner(null);
                      setFormData({
                        name: "",
                        slug: "",
                        bio: "",
                        photo: "",
                        instagram: "",
                        website: "",
                        sortOrder: 0,
                      });
                    }}
                    className="px-6 py-2 border border-krearte-gray-200 text-krearte-black rounded-lg hover:bg-krearte-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-krearte-black text-krearte-white rounded-lg hover:bg-krearte-charcoal transition-colors"
                  >
                    {editingDesigner ? "Update" : "Create"} Designer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}