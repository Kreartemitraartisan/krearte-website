"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart/context";
import { X, Trash2, Minus, Plus, Edit2, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface Material {
  id: string;
  name: string;
  pricePerM2: number;
  waste: number;
  category?: string;
  width?: string | null;
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
  width?: number;
  height?: number;
  widthCm?: number;
  heightCm?: number;
  image?: string;
  addOns?: string[];
}

export function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, updateCartItem, total, itemCount, isCartOpen, closeCart } = useCart();
  
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editWidthCm, setEditWidthCm] = useState(100);
  const [editHeightCm, setEditHeightCm] = useState(100);
  const [editMaterialId, setEditMaterialId] = useState<string>("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
  useEffect(() => {
    console.log('🛒 Cart items:', cart.map(item => ({
      name: item.name,
      image: item.image,
      hasImage: !!item.image,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      materialName: item.material,
    })));
  }, [cart]);

  // Fetch materials when edit modal opens
  useEffect(() => {
    if (editingItem) {
      fetchMaterials();
    }
  }, [editingItem]);

  const fetchMaterials = async () => {
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
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleEditOpen = (item: CartItem) => {
    setEditingItem(item.id);
    // ✅ Use widthCm/heightCm if available, otherwise convert from meters
    setEditWidthCm(item.widthCm || (item.width ? Math.round(item.width * 100) : 100));
    setEditHeightCm(item.heightCm || (item.height ? Math.round(item.height * 100) : 100));
    setEditMaterialId(item.materialId || "");
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
      
      console.log('💰 BEFORE UPDATE:', {
        itemId,
        editWidthCm,
        editHeightCm,
        material: selectedMaterial.name,
        pricePerM2,
        wasteCost,
        areaM2,
        newPrice,
      });
      
      // ✅ Update cart item with cm values
      const updatedItem = {
        widthCm: editWidthCm,
        heightCm: editHeightCm,
        width: editWidthCm / 100,
        height: editHeightCm / 100,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        pricePerM2: pricePerM2,
        wasteCost: wasteCost,
        areaM2: areaM2,
        price: newPrice,
        size: `${editWidthCm}cm × ${editHeightCm}cm`,
      };
      
      console.log('📦 Updating with:', updatedItem);
      
      await updateCartItem(itemId, updatedItem);
      
      // Wait for state to update
      setTimeout(() => {
        setSaving(false);
        setEditingItem(null);
      }, 300);
      
    } catch (error) {
      console.error("❌ Error updating item:", error);
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

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) {
      return "Rp 0";
    }
    
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />

      {/* Cart Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-krearte-gray-200">
          <h2 className="font-sans text-xl font-normal flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-krearte-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-krearte-gray-300" />
              <p className="text-krearte-gray-500 font-light mb-4">Your cart is empty</p>
              <Link
                href="/collections"
                onClick={closeCart}
                className="inline-block px-6 py-3 bg-krearte-black text-white font-medium rounded-lg hover:bg-krearte-charcoal transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item: CartItem) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-6 border-b border-krearte-gray-100"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center relative">
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
                    <span className={`text-2xl font-light ${item.image ? 'hidden' : ''} text-krearte-gray-400 absolute inset-0 flex items-center justify-center`}>
                      {item.name?.charAt(0).toUpperCase() || 'P'}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-medium text-krearte-black mb-1">
                      {item.name}
                    </h3>
                    
                    {/* Size/Material Info */}
                    <div className="text-sm text-krearte-gray-600 mb-2">
                      {editingItem === item.id ? (
                        /* Edit Mode */
                        <div className="space-y-3 bg-krearte-gray-50 p-3 rounded-lg border border-krearte-gray-200">
                          {/* Dimensions in CM */}
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
                                className="w-20 px-2 py-1 border border-krearte-gray-200 rounded text-sm focus:outline-none focus:border-krearte-black"
                              />
                              <span className="text-krearte-gray-500">×</span>
                              <input
                                type="number"
                                value={editHeightCm}
                                onChange={(e) => setEditHeightCm(parseInt(e.target.value) || 100)}
                                step="1"
                                min="10"
                                className="w-20 px-2 py-1 border border-krearte-gray-200 rounded text-sm focus:outline-none focus:border-krearte-black"
                              />
                              <span className="text-krearte-gray-500">cm</span>
                            </div>
                            <p className="text-xs text-krearte-gray-500 mt-1">
                              = {((editWidthCm / 100) * (editHeightCm / 100)).toFixed(2)} m²
                            </p>
                          </div>

                          {/* Material Selection */}
                          <div>
                            <label className="block text-xs font-normal mb-1 text-krearte-gray-600">
                              Material
                            </label>
                            {loadingMaterials ? (
                              <div className="text-xs text-krearte-gray-500">Loading materials...</div>
                            ) : (
                              <select
                                value={editMaterialId}
                                onChange={(e) => setEditMaterialId(e.target.value)}
                                className="w-full px-2 py-1 border border-krearte-gray-200 rounded text-sm focus:outline-none focus:border-krearte-black"
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

                          {/* Price Preview */}
                          {editWidthCm && editHeightCm && editMaterialId && (
                            <div className="text-xs text-krearte-gray-600 bg-white p-2 rounded">
                              <p>Area: {((editWidthCm / 100) * (editHeightCm / 100)).toFixed(2)} m²</p>
                              <p>
                                Estimated:{" "}
                                {formatCurrency(
                                  ((materials.find(m => m.id === editMaterialId)?.pricePerM2 || 0) +
                                  (materials.find(m => m.id === editMaterialId)?.waste || 60000)) *
                                  (editWidthCm / 100) *
                                  (editHeightCm / 100)
                                )}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleEditSave(item.id)}
                              disabled={saving || !editMaterialId}
                              className="flex-1 px-3 py-2 bg-krearte-black text-white text-sm rounded hover:bg-krearte-charcoal disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 px-3 py-2 border border-krearte-gray-300 text-sm rounded hover:bg-krearte-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <>
                          {/* ✅ Size in CM */}
                          <p className="text-xs text-krearte-gray-600">
                            Size: {item.widthCm || (item.width ? Math.round(item.width * 100) : 100)}cm × 
                            {item.heightCm || (item.height ? Math.round(item.height * 100) : 100)}cm
                            <span className="text-krearte-gray-400 ml-1">
                              ({((item.widthCm || (item.width ? item.width * 100 : 100)) / 100 * 
                                (item.heightCm || (item.height ? item.height * 100 : 100)) / 100).toFixed(2)} m²)
                            </span>
                          </p>
                          
                          {/* ✅ Material Name */}
                          {item.materialName && (
                            <p className="text-xs text-krearte-gray-600 mt-0.5">
                              Material: {item.materialName}
                            </p>
                          )}
                          
                          {/* Add-Ons */}
                          {item.addOns && item.addOns.length > 0 && (
                            <p className="text-xs text-krearte-gray-500 mt-0.5">
                              + {item.addOns.join(', ')}
                            </p>
                          )}
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditOpen(item)}
                            className="text-xs text-krearte-gray-600 hover:text-krearte-black underline mt-1 inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        </>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 border border-krearte-gray-200 rounded flex items-center justify-center hover:bg-krearte-gray-50 text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 border border-krearte-gray-200 rounded flex items-center justify-center hover:bg-krearte-gray-50 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <p className="font-medium text-krearte-black text-sm">
                      {item.price && !isNaN(item.price) && item.price > 0
                        ? formatCurrency(item.price * item.quantity)
                        : formatCurrency((item.pricePerM2 || 0) * (item.areaM2 || 1) * item.quantity)
                      }
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-krearte-gray-400 hover:text-red-500 transition-colors self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-krearte-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-krearte-gray-600">Subtotal</span>
              <span className="text-xl font-medium text-krearte-black">
                {total && !isNaN(total) ? formatCurrency(total) : "Rp 0"}
              </span>
            </div>
            <p className="text-sm text-krearte-gray-500">
              Shipping and taxes calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full py-4 bg-krearte-black text-white text-center font-medium rounded-lg hover:bg-krearte-charcoal transition-colors"
            >
              Checkout →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}