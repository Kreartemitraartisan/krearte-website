"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, ShoppingBag, Trash2, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/lib/wishlist/context";
import { useCart } from "@/lib/cart/context";

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  material?: string;
  width?: number;
  height?: number;
}

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {  wishlist, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();
  
  const [mountedWishlist, setMountedWishlist] = useState<WishlistItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    setIsClient(true);
    
    const stored = localStorage.getItem('krearte-wishlist');
    console.log('💾 Wishlist Page - LocalStorage:', stored);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('💾 Wishlist Page - Parsed:', parsed);
        setMountedWishlist(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error parsing wishlist:', error);
        setMountedWishlist([]);
      }
    }
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account/wishlist");
    }
  }, [status, router]);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      
      const newWishlist = mountedWishlist.filter(item => item.productId !== productId);
      setMountedWishlist(newWishlist);
      localStorage.setItem('krearte-wishlist', JSON.stringify(newWishlist));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert("Failed to remove item");
    }
  };

  // ✅ Add to Cart Handler
  const handleAddToCart = async (item: WishlistItem) => {
    setAddingToCart(item.productId);
    
    try {
      const cartItem: CartItem = {
        id: `${item.productId}-${Date.now()}`,
        productId: item.productId,
        name: item.productName,
        slug: item.productSlug,
        price: item.price,
        quantity: 1,
        image: item.productImage,
        material: "Standard Material",
        width: 1,
        height: 1,
      };
      
      addToCart(cartItem);
      
      // Optional: Show success message or notification
      console.log('✅ Added to cart:', cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isClient || status === "loading" || wishlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  const displayWishlist = mountedWishlist.length > 0 ? mountedWishlist : wishlist;

  return (
    <div className="min-h-screen bg-krearte-cream py-12">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-sans text-4xl font-light mb-2">My Wishlist</h1>
          <p className="text-krearte-gray-600 font-light">
            {displayWishlist.length} {displayWishlist.length === 1 ? "item" : "items"} in your wishlist
          </p>
        </div>

        {/* Wishlist Items */}
        {displayWishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 mx-auto mb-6 text-krearte-gray-300" />
            <h2 className="font-sans text-2xl font-light mb-4">Your wishlist is empty</h2>
            <p className="text-krearte-gray-600 font-light mb-8">
              Start adding products you love to your wishlist
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-8 py-3 bg-krearte-black text-white font-medium rounded-lg hover:bg-krearte-charcoal transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayWishlist.map((item: WishlistItem) => (
              <div
                key={item.productId}
                className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 overflow-hidden group hover:shadow-lg transition-shadow"
              >
                {/* Product Image - ASPECT RATIO 4/3 */}
                <div className="relative w-full aspect-[4/3] bg-krearte-gray-100 overflow-hidden">
                  {item.productImage ? (
                    <Link href={`/product/${item.productSlug}`}>
                      {item.productImage.endsWith('.mp4') || item.productImage.endsWith('.webm') ? (
                        <video
                          src={item.productImage}
                          className="w-full h-full object-cover"
                          muted
                          autoPlay
                          loop
                        />
                      ) : (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder-product.jpg";
                          }}
                        />
                      )}
                    </Link>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-krearte-gray-400" />
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <Link href={`/product/${item.productSlug}`}>
                    <h3 className="font-medium text-krearte-black mb-1 line-clamp-2 hover:text-krearte-gray-600 transition-colors">
                      {item.productName}
                    </h3>
                  </Link>
                  <p className="text-lg font-light text-krearte-black mb-4">
                    {formatCurrency(item.price)}
                  </p>
                  
                  {/* ✅ Add to Cart Button - dengan loading state */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={addingToCart === item.productId}
                    className={`w-full px-4 py-3 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
                      addingToCart === item.productId
                        ? "bg-krearte-gray-300 cursor-not-allowed"
                        : "bg-krearte-black text-white hover:bg-krearte-charcoal"
                    }`}
                  >
                    {addingToCart === item.productId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart
                      </>
                    )}
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