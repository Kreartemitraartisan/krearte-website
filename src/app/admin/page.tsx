"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Settings,
  Image as ImageIcon,
  Film
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  images: string[];
  stock: number;
  createdAt: string;
  // ✅ TAMBAHKAN PROPERTIES INI untuk price range dari materials
  hasMaterialPrices?: boolean;
  minPrice?: number;
  maxPrice?: number;
  availableMaterialIds?: string[];
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: any[];
  recentProducts: Product[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    recentOrders: [],
    recentProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log('📊 Fetching dashboard stats...');
        
        // Fetch products count & list
        const productsRes = await fetch("/api/admin/products");
        const productsData = await productsRes.json();
        
        console.log('📦 Products data:', productsData);
        
        // Fetch orders
        const ordersRes = await fetch("/api/admin/orders");
        const ordersData = await ordersRes.json();
        
        console.log('📦 Orders data:', ordersData);
        
        if (productsData.success && ordersData.success) {
          // Ambil dari "products" bukan "items" atau "data"
          let products = productsData.products || productsData.items || productsData.data || [];
          const orders = ordersData.orders || ordersData.items || ordersData.data || [];
          
          // ✅ FIX: Process products to include price range from materials
          const productsWithPrices = await Promise.all(
            products.map(async (product: Product) => {
              try {
                if ((product.availableMaterialIds?.length || 0) > 0) {
                  // Fetch materials untuk product ini
                  const materialRes = await fetch(`/api/products/${product.slug}/materials`);
                  const materialData = await materialRes.json();
                  
                  if (materialData.success && materialData.priceRange) {
                    return {
                      ...product,
                      hasMaterialPrices: true,
                      minPrice: materialData.priceRange.min,
                      maxPrice: materialData.priceRange.max,
                    };
                  }
                }
                // Fallback ke base price
                return {
                  ...product,
                  hasMaterialPrices: false,
                  minPrice: product.price,
                  maxPrice: product.price,
                };
              } catch (error) {
                console.error(`Error fetching materials for ${product.name}:`, error);
                return {
                  ...product,
                  hasMaterialPrices: false,
                  minPrice: product.price,
                  maxPrice: product.price,
                };
              }
            })
          );
          
          const totalRevenue = orders.reduce(
            (sum: number, order: any) => sum + (order.total || 0), 
            0
          );

          setStats({
            totalProducts: productsWithPrices.length,
            totalOrders: orders.length,
            totalRevenue,
            totalCustomers: 0,
            recentOrders: orders.slice(0, 5),
            recentProducts: productsWithPrices.slice(0, 5), // ✅ Sudah include price range
          });
          
          console.log(`✅ Dashboard loaded: ${productsWithPrices.length} products, ${orders.length} orders`);
        } else {
          console.warn('⚠️ API response not successful:', { productsData, ordersData });
        }
      } catch (error) {
        console.error("❌ Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // ✅ Helper: Get primary image (filter videos)
  const getPrimaryImage = (images: string[]) => {
    if (!images || images.length === 0) return null;
    
    // Prioritize images over videos for thumbnail
    const firstImage = images.find(
      img => !img.endsWith('.mp4') && !img.endsWith('.webm')
    ) || images[0];
    
    return firstImage;
  };

  // ✅ Helper: Check if product has video
  const hasVideo = (images: string[]) => {
    return images?.some(img => img.endsWith('.mp4') || img.endsWith('.webm'));
  };

  const statCards = [
    {
      name: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500",
      change: stats.totalProducts > 0 ? `+${stats.totalProducts}` : "0",
    },
    {
      name: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-green-500",
      change: stats.totalOrders > 0 ? `+${stats.totalOrders}` : "0",
    },
    {
      name: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-purple-500",
      change: stats.totalRevenue > 0 ? "+New" : "0",
    },
    {
      name: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-orange-500",
      change: "+0",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-krearte-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-krearte-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-sans text-3xl font-light mb-2">Dashboard</h1>
        <p className="text-krearte-gray-600 font-light">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-krearte-white rounded-lg p-6 border border-krearte-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-krearte-white" />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-normal mb-1">{stat.value}</p>
            <p className="text-sm text-krearte-gray-600 font-light">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Products Section */}
      <div className="bg-krearte-white rounded-lg border border-krearte-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-krearte-gray-200">
          <h2 className="font-sans text-lg font-normal">Recent Products</h2>
          <Link
            href="/admin/products"
            className="text-sm text-krearte-black font-medium hover:text-krearte-gray-600 flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        
        {stats.recentProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {stats.recentProducts.map((product) => {
              const primaryImage = getPrimaryImage(product.images);
              const productHasVideo = hasVideo(product.images);
              
              return (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}/edit`}
                  className="group flex gap-4 p-4 border border-krearte-gray-200 rounded-lg hover:border-krearte-black hover:bg-krearte-gray-50 transition-colors"
                >
                  {/* Product Thumbnail */}
                  <div className="w-20 h-20 bg-krearte-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {primaryImage ? (
                      primaryImage.endsWith('.mp4') || primaryImage.endsWith('.webm') ? (
                        <video
                          src={primaryImage}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load image:', primaryImage);
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    
                    {/* Video Badge */}
                    {productHasVideo && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-krearte-black/70 rounded-full flex items-center justify-center">
                        <Film className="w-3 h-3 text-krearte-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-krearte-black truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-krearte-gray-500 capitalize">
                      {product.category}
                    </p>
                    
                    {/* ✅ Display price range from materials */}
                    <p className="text-sm font-normal text-krearte-black mt-1">
                      {product.hasMaterialPrices ? (
                        <>
                          {formatCurrency(product.minPrice || 0)}
                          {product.maxPrice && product.maxPrice !== product.minPrice && (
                            <span className="text-krearte-gray-500 font-light">
                              {' '}- {formatCurrency(product.maxPrice)}
                            </span>
                          )}
                          <span className="text-krearte-gray-500 font-light">/m²</span>
                        </>
                      ) : (
                        <>
                          {formatCurrency(product.price)}
                          <span className="text-krearte-gray-500 font-light">/m²</span>
                        </>
                      )}
                    </p>
                    
                    <p className={`text-xs mt-1 ${
                      product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {product.stock} units in stock
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-krearte-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products yet</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 mt-4 text-krearte-black font-medium hover:text-krearte-gray-600"
            >
              <Package className="w-4 h-4" />
              Add your first product
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-krearte-white rounded-lg border border-krearte-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-krearte-gray-200">
          <h2 className="font-sans text-lg font-normal">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-krearte-black font-medium hover:text-krearte-gray-600 flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-krearte-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-krearte-gray-200">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-krearte-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-krearte-black">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-krearte-gray-600">
                      {order.firstName} {order.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-krearte-black">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-krearte-gray-600">
                      {new Date(order.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-krearte-gray-500">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/products/new"
          className="bg-krearte-black text-krearte-white rounded-lg p-6 hover:bg-krearte-charcoal transition-colors"
        >
          <Package className="w-8 h-8 mb-3" />
          <h3 className="font-sans text-lg font-normal mb-1">Add Product</h3>
          <p className="text-sm font-light text-krearte-gray-300">
            Create a new product listing
          </p>
        </Link>
        
        <Link
          href="/admin/orders"
          className="bg-krearte-white border border-krearte-gray-200 rounded-lg p-6 hover:border-krearte-black transition-colors"
        >
          <ShoppingCart className="w-8 h-8 mb-3 text-krearte-black" />
          <h3 className="font-sans text-lg font-normal mb-1">Manage Orders</h3>
          <p className="text-sm font-light text-krearte-gray-600">
            View and process orders
          </p>
        </Link>
        
        <Link
          href="/admin/settings"
          className="bg-krearte-white border border-krearte-gray-200 rounded-lg p-6 hover:border-krearte-black transition-colors"
        >
          <Settings className="w-8 h-8 mb-3 text-krearte-black" />
          <h3 className="font-sans text-lg font-normal mb-1">Settings</h3>
          <p className="text-sm font-light text-krearte-gray-600">
            Configure your store
          </p>
        </Link>
      </div>
    </div>
  );
}