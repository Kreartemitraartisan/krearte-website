"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  material?: string;
  materialId?: string;
  materialName?: string;
  width?: number;
  height?: number;
  widthCm?: number;
  heightCm?: number;
  areaM2?: number;
  pricePerM2?: number;
  wasteCost?: number;
  is25DAddOn?: boolean;
  size?: string;
  addOns?: string[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  openCart: () => void;
  closeCart: () => void;
  isCartOpen: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("krearte-cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const sanitized = parsed.map((item: CartItem) => ({
          ...item,
          price: item.price && !isNaN(item.price) ? item.price : 0,
          // ✅ Fallback: hitung width/height dari cm jika tidak ada
          width: item.width || (item.widthCm ? item.widthCm / 100 : 1),
          height: item.height || (item.heightCm ? item.heightCm / 100 : 1),
          pricePerM2: item.pricePerM2 || 0,
          wasteCost: item.wasteCost || 0,
        }));
        setCart(sanitized);
      } catch (error) {
        console.error("Error loading cart:", error);
        setCart([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("krearte-cart", JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  // ✅ Calculate price helper function
  const calculatePrice = (
    pricePerM2: number,
    wasteCost: number,
    width: number,
    height: number,
    is25DAddOn: boolean
  ): number => {
    const area = width * height;
    let price = (pricePerM2 + wasteCost) * area;
    
    if (is25DAddOn) {
      price += 500000 * area;
    }
    
    return price && !isNaN(price) && price > 0 ? price : 0;
  };

  // ✅ Add to cart with proper width/height handling
  const addToCart = (item: CartItem) => {
    // ✅ Use width/height in meters, or convert from cm
    const width = item.width || (item.widthCm ? item.widthCm / 100 : 1);
    const height = item.height || (item.heightCm ? item.heightCm / 100 : 1);
    const pricePerM2 = item.pricePerM2 || 0;
    const wasteCost = item.wasteCost || 0;
    const is25DAddOn = item.is25DAddOn || false;
    
    // Calculate area from meters
    const areaM2 = width * height;
    
    // Calculate or validate price
    let finalPrice = item.price;
    if (!finalPrice || finalPrice === 0 || isNaN(finalPrice)) {
      finalPrice = calculatePrice(pricePerM2, wasteCost, width, height, is25DAddOn);
    }
    
    const cartItem: CartItem = {
      ...item,
      id: item.id || `${item.productId}-${Date.now()}`,
      price: finalPrice,
      quantity: item.quantity || 1,
      width,
      height,
      areaM2: item.areaM2 || areaM2,  // ✅ Use provided areaM2 or calculate
      pricePerM2,
      wasteCost,
      is25DAddOn,
    };
    
    console.log('✅ Adding to cart:', {
      ...cartItem,
      calculatedArea: `${item.widthCm || width * 100}cm × ${item.heightCm || height * 100}cm = ${areaM2} m²`
    });
    
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItem.id 
            ? { ...i, quantity: i.quantity + cartItem.quantity } 
            : i
        );
      }
      return [...prev, cartItem];
    });
    
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // ✅ Update cart item with robust calculation
  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    console.log('🔄 updateCartItem called with:', { id, updates });
    
    setCart((prev) => {
      const newCart = prev.map((item) => {
        if (item.id === id) {
          // ✅ Use width/height in meters, or convert from cm
          const width = updates.width ?? item.width ?? (updates.widthCm ?? item.widthCm ? (updates.widthCm ?? item.widthCm)! / 100 : 1);
          const height = updates.height ?? item.height ?? (updates.heightCm ?? item.heightCm ? (updates.heightCm ?? item.heightCm)! / 100 : 1);
          const pricePerM2 = updates.pricePerM2 ?? item.pricePerM2 ?? 0;
          const wasteCost = updates.wasteCost ?? item.wasteCost ?? 0;
          const is25DAddOn = updates.is25DAddOn ?? item.is25DAddOn ?? false;
          
          const areaM2 = width * height;
          const newPrice = calculatePrice(pricePerM2, wasteCost, width, height, is25DAddOn);
          
          const updated = {
            ...item,
            ...updates,
            width,
            height,
            areaM2: updates.areaM2 || areaM2,
            pricePerM2,
            wasteCost,
            is25DAddOn,
            price: newPrice,
          };
          
          console.log('✅ Updated item:', {
            ...updated,
            calculatedArea: `${updates.widthCm || item.widthCm || width * 100}cm × ${updates.heightCm || item.heightCm || height * 100}cm = ${areaM2} m²`
          });
          return updated;
        }
        return item;
      });
      
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // ✅ Calculate totals with validation
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cart.reduce((sum, item) => {
    const price = item.price && !isNaN(item.price) ? item.price : 0;
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItem,
        clearCart,
        itemCount,
        total,
        openCart,
        closeCart,
        isCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}