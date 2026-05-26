// app/admin/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Edit, Trash2, Loader2, Search, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  images: string[];
  availableMaterialIds: string[];
  recommendedMaterialIds: string[];
  stock: number;
  createdAt: string;
  updatedAt: string;
  // ✅ TAMBAHKAN: priceRange dari API
  priceRange?: {
    min: number;
    max: number;
  };
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching admin products...');
      
      const productsRes = await fetch("/api/admin/products");
      const productsData = await productsRes.json();

      console.log('📦 Products API response:', productsData);

      // ✅ FIX: API returns "products"
      setProducts(productsData.products || productsData.items || []);
      
      console.log(`✅ Loaded ${productsData.products?.length || 0} products`);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ IMPROVED: Delete function
  const handleDelete = async (id: string, productName: string) => {
    const confirmed = confirm(
      `⚠️ Are you sure you want to delete "${productName}"?\n\nThis will also remove all associated images and material assignments.`
    );
    
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        alert(`✅ "${productName}" deleted successfully!`);
      } else {
        const errorMsg = result.error || result.message || "Unknown error";
        
        if (errorMsg.includes('foreign key') || errorMsg.includes('constraint')) {
          alert(
            `❌ Cannot delete "${productName}"\n\n` +
            `This product is still referenced by other data (e.g., orders, quotes).\n\n` +
            `Please remove those references first, or contact support.`
          );
        } else {
          alert(`❌ Delete failed: ${errorMsg}`);
        }
        console.error("Delete API error:", result);
      }
    } catch (error: any) {
      console.error("Delete network error:", error);
      
      if (error.message?.includes('Failed to fetch')) {
        alert("❌ Connection error. Please check your internet and try again.");
      } else {
        alert("❌ Delete failed: " + (error.message || "Unknown error"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light mb-2">Products Management</h1>
          <p className="text-krearte-gray-600">
            Manage your product catalog ({products.length} products)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-6 py-3 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-krearte-gray-50 border-b border-krearte-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">Product</th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">Category</th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">Price Range</th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">Stock</th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">Created</th>
              <th className="px-6 py-4 text-right text-xs font-normal text-krearte-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-krearte-gray-100">
            {filteredProducts.map((product) => {
              const isDeleting = deletingId === product.id;
              
              return (
                <tr key={product.id} className="hover:bg-krearte-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          (() => {
                            const firstImage = product.images.find(
                              img => !img.endsWith('.mp4') && !img.endsWith('.webm')
                            ) || product.images[0];
                            
                            return firstImage?.endsWith('.mp4') || firstImage?.endsWith('.webm') ? (
                              <video src={firstImage} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={firstImage} alt={product.name} className="w-full h-full object-cover" />
                            );
                          })()
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                            <span className="text-sm">{product.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-krearte-black">{product.name}</p>
                        <p className="text-sm text-krearte-gray-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-krearte-gray-600 capitalize">{product.category}</span>
                  </td>
                  
                  {/* ✅ PRICE RANGE - Gunakan dari API */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {product.priceRange && product.priceRange.min > 0 ? (
                        <>
                          <span className="font-medium text-krearte-black">
                            {formatCurrency(product.priceRange.min)}
                          </span>
                          {product.priceRange.min !== product.priceRange.max && (
                            <>
                              <span className="text-krearte-gray-500 mx-1">-</span>
                              <span className="text-krearte-gray-600">
                                {formatCurrency(product.priceRange.max)}
                              </span>
                            </>
                          )}
                          <span className="text-xs text-krearte-gray-400 ml-1">/m²</span>
                        </>
                      ) : product.availableMaterialIds?.length === 0 ? (
                        <span className="text-krearte-gray-400 text-xs">No materials assigned</span>
                      ) : (
                        <span className="text-krearte-gray-400 text-xs">Materials not found</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`text-sm ${product.stock > 0 ? "text-krearte-black" : "text-red-600"}`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-krearte-gray-600">
                      {new Date(product.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 hover:bg-krearte-gray-100 rounded transition-colors disabled:opacity-50"
                        title="Edit"
                        onClick={(e) => isDeleting && e.preventDefault()}
                      >
                        <Edit className="w-4 h-4 text-krearte-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={isDeleting}
                        className={`p-2 rounded transition-colors ${
                          isDeleting ? "bg-red-100 cursor-not-allowed" : "hover:bg-red-50"
                        }`}
                        title={isDeleting ? "Deleting..." : "Delete"}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-krearte-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? "No products match your search" : "No products found"}</p>
            {!searchTerm && (
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-2 mt-4 text-krearte-black font-medium hover:text-krearte-gray-600"
              >
                <Plus className="w-4 h-4" />
                Add your first product
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}