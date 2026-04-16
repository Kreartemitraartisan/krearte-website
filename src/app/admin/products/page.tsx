"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
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
}

interface Material {
  id: string;
  name: string;
  pricePerM2: number;
  waste: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch products and materials
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching admin data...');
      
      const [productsRes, materialsRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/materials"),
      ]);

      const productsData = await productsRes.json();
      const materialsData = await materialsRes.json();

      console.log('📦 Products API response:', productsData);
      console.log('📦 Materials API response:', materialsData);

      // ✅ FIX: API returns "products" not "items"
      setProducts(productsData.products || productsData.items || []);
      setMaterials(materialsData.materials || materialsData.items || []);
      
      console.log(`✅ Loaded ${productsData.products?.length || 0} products`);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate price range per m² based on available materials
  const calculatePriceRange = (availableMaterialIds: string[]) => {
    if (!availableMaterialIds || availableMaterialIds.length === 0) {
      return { min: 0, max: 0 };
    }

    // Filter materials yang tersedia untuk product ini
    const availableMaterials = materials.filter(m => 
      availableMaterialIds.includes(m.id)
    );

    if (availableMaterials.length === 0) {
      return { min: 0, max: 0 };
    }

    // ✅ Min price = material termurah (pricePerM2)
    const minPrice = Math.min(...availableMaterials.map(m => m.pricePerM2));
    
    // ✅ Max price = material termahal (pricePerM2)
    const maxPrice = Math.max(...availableMaterials.map(m => m.pricePerM2));

    return { 
      min: minPrice, 
      max: maxPrice,
    };
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Product deleted successfully!");
        fetchData(); // Refresh list
      } else {
        alert("❌ Delete failed: " + result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Delete failed");
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

      {/* Search */}
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

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-krearte-gray-50 border-b border-krearte-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">
                Product
              </th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">
                Price Range
              </th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">
                Stock
              </th>
              <th className="px-6 py-4 text-left text-xs font-normal text-krearte-gray-600 uppercase">
                Created
              </th>
              <th className="px-6 py-4 text-right text-xs font-normal text-krearte-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-krearte-gray-100">
            {filteredProducts.map((product) => {
              const priceRange = calculatePriceRange(product.availableMaterialIds);
              
              return (
                <tr key={product.id} className="hover:bg-krearte-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-10 h-10 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          (() => {
                            const firstImage = product.images.find(
                              img => !img.endsWith('.mp4') && !img.endsWith('.webm')
                            ) || product.images[0];
                            
                            return firstImage?.endsWith('.mp4') || firstImage?.endsWith('.webm') ? (
                              <video 
                                src={firstImage} 
                                className="w-full h-full object-cover" 
                                muted 
                                playsInline
                              />
                            ) : (
                              <img 
                                src={firstImage} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                            );
                          })()
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                            <span className="text-sm">{product.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-krearte-black">
                          {product.name}
                        </p>
                        <p className="text-sm text-krearte-gray-500">
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-krearte-gray-600 capitalize">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {priceRange.min > 0 ? (
                        <>
                          <span className="font-medium text-krearte-black">
                            {formatCurrency(priceRange.min)}
                          </span>
                          {priceRange.min !== priceRange.max && (
                            <>
                              <span className="text-krearte-gray-500 mx-1">-</span>
                              <span className="text-krearte-gray-600">
                                {formatCurrency(priceRange.max)}
                              </span>
                            </>
                          )}
                          <span className="text-xs text-krearte-gray-400 ml-1">
                            /m²
                          </span>
                        </>
                      ) : product.availableMaterialIds?.length === 0 ? (
                        <span className="text-krearte-gray-400 text-xs">
                          No materials assigned
                        </span>
                      ) : materials.length === 0 ? (
                        <span className="text-krearte-gray-400 text-xs">
                          Loading materials...
                        </span>
                      ) : (
                        <span className="text-krearte-gray-400 text-xs">
                          Materials not found
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${
                      product.stock > 0 
                        ? "text-krearte-black" 
                        : "text-red-600"
                    }`}>
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
                        className="p-2 hover:bg-krearte-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-krearte-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
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