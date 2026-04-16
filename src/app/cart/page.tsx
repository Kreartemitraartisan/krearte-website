"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/lib/cart/context";
import { ShoppingBag, Trash2, Minus, Plus, ChevronLeft, Package, Edit2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Material {
  id: string;
  name: string;
  pricePerM2: number;
  waste: number;
  width?: string | null;
  category?: string;
  description?: string | null;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  materialId?: string;
  materialName?: string;
  pricePerM2?: number;
  wasteCost?: number;
  areaM2?: number;
  price: number;
  quantity: number;
  size?: string;
  widthCm?: number;
  heightCm?: number;
  width?: number;
  height?: number;
  image?: string;
  addOns?: string[];
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, updateCartItem, total, itemCount } = useCart();
  
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editWidthCm, setEditWidthCm] = useState(100);
  const [editHeightCm, setEditHeightCm] = useState(100);
  const [editMaterialId, setEditMaterialId] = useState<string>("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const fetchMaterials = async (itemId: string) => {
    setEditingItem(itemId);
    setLoadingMaterials(true);
    try {
      const response = await fetch("/api/materials");
      const result = await response.json();
      
      if (result.success) {
        // Filter out service materials
        const materialOnly = (result.materials || result.items || []).filter(
          (m: Material) => !m.category?.toLowerCase().includes('service')
        );
        setMaterials(materialOnly);
        
        const item = cart.find(i => i.id === itemId);
        setEditWidthCm(item?.widthCm || 100);
        setEditHeightCm(item?.heightCm || 100);
        setEditMaterialId(item?.materialId || "");
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleEditSave = async (itemId: string) => {
    setSaving(true);
    
    try {
      const selectedMaterial = materials.find(m => m.id === editMaterialId);
      
      if (!selectedMaterial) {
        alert("Please select a material");
        setSaving(false);
        return;
      }
      
      // Calculate area in m²
      const areaM2 = (editWidthCm / 100) * (editHeightCm / 100);
      const pricePerM2 = selectedMaterial.pricePerM2;
      const wasteCost = selectedMaterial.waste || 60000;
      
      // Calculate new price
      const materialCost = areaM2 * pricePerM2;
      const wasteArea = areaM2 * 0.15; // 15% waste estimation
      const wastePrice = wasteArea * wasteCost;
      const newPrice = materialCost + wastePrice;
      
      await updateCartItem(itemId, {
        widthCm: editWidthCm,
        heightCm: editHeightCm,
        width: editWidthCm / 100,
        height: editHeightCm / 100,
        materialId: selectedMaterial.id,
        material: selectedMaterial.name,
        pricePerM2: pricePerM2,
        wasteCost: wasteCost,
        areaM2: areaM2,
        price: newPrice,
        size: `${editWidthCm}cm × ${editHeightCm}cm`,
      });
      
      setTimeout(() => {
        setSaving(false);
        setEditingItem(null);
      }, 300);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditWidthCm(100);
    setEditHeightCm(100);
    setEditMaterialId("");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-krearte-cream">
        <div className="container mx-auto px-6 md:px-12 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg mx-auto"
          >
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-krearte-gray-300" />
            <h1 className="font-sans text-4xl font-light mb-6">Your Cart is Empty</h1>
            <p className="text-krearte-gray-600 font-light mb-8">
              Add some products to your cart before checking out.
            </p>
            <Link
              href="/collection/wallcovering"
              className="inline-flex items-center px-8 py-4 bg-krearte-black text-krearte-white rounded-full text-sm font-medium hover:bg-krearte-charcoal transition-colors"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Header */}
      <div className="container mx-auto px-6 md:px-12 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Continue Shopping
        </Link>
      </div>

      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <h1 className="font-sans text-4xl font-light mb-12">
            Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT: Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item: CartItem) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200"
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="w-32 h-40 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback - First Letter */}
                      <span className={`text-4xl font-light ${item.image ? 'hidden' : ''} text-krearte-gray-400 absolute inset-0 flex items-center justify-center`}>
                        {item.name?.charAt(0).toUpperCase() || 'P'}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h2 className="font-sans text-xl font-normal mb-2">{item.name}</h2>
                          
                          {editingItem === item.id ? (
                            /* Edit Mode */
                            <div className="space-y-3 bg-krearte-gray-50 p-4 rounded-lg border border-krearte-gray-200">
                              <div>
                                <label className="block text-xs font-normal mb-1 text-krearte-gray-600">
                                  Dimensions (centimeters)
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editWidthCm}
                                    onChange={(e) => setEditWidthCm(parseInt(e.target.value) || 100)}
                                    step="1"
                                    min="10"
                                    className="w-24 px-3 py-2 border border-krearte-gray-200 rounded text-sm focus:outline-none focus:border-krearte-black"
                                  />
                                  <span className="text-krearte-gray-500">×</span>
                                  <input
                                    type="number"
                                    value={editHeightCm}
                                    onChange={(e) => setEditHeightCm(parseInt(e.target.value) || 100)}
                                    step="1"
                                    min="10"
                                    className="w-24 px-3 py-2 border border-krearte-gray-200 rounded text-sm focus:outline-none focus:border-krearte-black"
                                  />
                                  <span className="text-krearte-gray-500">cm</span>
                                </div>
                                <p className="text-xs text-krearte-gray-500 mt-1">
                                  = {((editWidthCm / 100) * (editHeightCm / 100)).toFixed(2)} m²
                                </p>
                              </div>

                              <div>
                                <label className="block text-xs font-normal mb-1 text-krearte-gray-600">
                                  Material
                                </label>
                                {loadingMaterials && editingItem === item.id ? (
                                  <div className="text-xs text-krearte-gray-500">Loading materials...</div>
                                ) : (
                                  <select
                                    value={editMaterialId}
                                    onChange={(e) => setEditMaterialId(e.target.value)}
                                    className="w-full px-3 py-2 border border-krearte-gray-200 rounded text-sm focus:outline-none focus:border-krearte-black"
                                  >
                                    <option value="">Select Material</option>
                                    {materials.map((material) => (
                                      <option key={material.id} value={material.id}>
                                        {material.name} - {formatCurrency(material.pricePerM2)}/m²
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => handleEditSave(item.id)}
                                  disabled={saving || !editMaterialId}
                                  className="px-4 py-2 bg-krearte-black text-white text-sm rounded hover:bg-krearte-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-4 py-2 border border-krearte-gray-300 text-sm rounded hover:bg-krearte-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* View Mode */
                            <div className="space-y-2">
                              {/* ✅ Size in CM */}
                              <p className="text-sm text-krearte-gray-600">
                                <span className="font-medium">Size:</span> {item.widthCm || (item.width ? item.width * 100 : 100)}cm × {item.heightCm || (item.height ? item.height * 100 : 100)}cm 
                                <span className="text-krearte-gray-400 ml-2">
                                  ({item.areaM2?.toFixed(2) || ((item.width || 1) * (item.height || 1)).toFixed(2)} m²)
                                </span>
                              </p>
                              
                              {/* ✅ Material Name */}
                              {item.materialName && (
                                <p className="text-sm text-krearte-gray-600">
                                  <span className="font-medium">Material:</span> {item.materialName}
                                </p>
                              )}
                              
                              {/* ✅ Add-Ons */}
                              {item.addOns && item.addOns.length > 0 && (
                                <div className="text-sm text-krearte-gray-600">
                                  <span className="font-medium">Add-ons:</span> {item.addOns.join(', ')}
                                </div>
                              )}
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => fetchMaterials(item.id)}
                                className="inline-flex items-center gap-1 text-sm text-krearte-black font-medium hover:underline mt-2"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-krearte-gray-400 hover:text-red-500 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quantity Controls & Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-krearte-gray-100">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 border border-krearte-gray-200 flex items-center justify-center hover:bg-krearte-gray-50 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 border border-krearte-gray-200 flex items-center justify-center hover:bg-krearte-gray-50 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-xl font-normal text-krearte-black">
                            {item.price && !isNaN(item.price)
                              ? formatCurrency(item.price * item.quantity)
                              : formatCurrency(0)}
                          </p>
                          <p className="text-xs text-krearte-gray-500">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* RIGHT: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200 sticky top-32">
                <h2 className="font-sans text-xl font-normal mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6 pb-6 border-b border-krearte-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-krearte-gray-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium text-krearte-black">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-krearte-gray-600">Shipping</span>
                    <span className="text-krearte-black">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-krearte-gray-600">Taxes</span>
                    <span className="text-krearte-black">Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-medium mb-6">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full py-4 bg-krearte-black text-white text-center font-medium rounded-lg hover:bg-krearte-charcoal transition-colors mb-4"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/collection/wallcovering"
                  className="block w-full py-4 border border-krearte-gray-300 text-krearte-black text-center font-medium rounded-lg hover:bg-krearte-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}