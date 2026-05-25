// src/app/admin/page.tsx
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
  Film,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ==================== TYPES ====================
interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  images: string[];
  stock: number;
  createdAt: string;
  // Price range dari material calculation
  hasMaterialPrices?: boolean;
  minPrice?: number;
  maxPrice?: number;
  availableMaterialIds?: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentProducts: Product[];
  recentOrders: Order[];
}

// ==================== MAIN COMPONENT ====================
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    recentProducts: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch all dashboard data from single endpoint
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching dashboard data...');
      
      // ✅ Single API call ke endpoint dashboard yang sudah kita buat
      const response = await fetch("/api/admin/dashboard");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Dashboard data received:', result);
      
      if (result.success) {
        setStats({
          totalProducts: result.stats?.totalProducts || 0,
          totalOrders: result.stats?.totalOrders || 0,
          totalRevenue: result.stats?.totalRevenue || 0,
          totalCustomers: result.stats?.totalCustomers || 0,
          recentProducts: result.recentProducts || [],
          recentOrders: result.recentOrders || [],
        });
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }
    } catch (err: any) {
      console.error("❌ Error fetching dashboard:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper: Get primary image (filter videos)
  const getPrimaryImage = (images: string[]) => {
    if (!images || images.length === 0) return null;
    // Prioritize images over videos for thumbnail
    return images.find(img => !img.endsWith('.mp4') && !img.endsWith('.webm')) || images[0];
  };

  // ✅ Helper: Check if product has video
  const hasVideo = (images: string[]) => {
    return images?.some(img => img.endsWith('.mp4') || img.endsWith('.webm'));
  };

  // ✅ Helper: Format price display with range support
  const formatProductPrice = (product: Product) => {
    if (product.hasMaterialPrices && product.minPrice !== undefined) {
      if (product.maxPrice && product.maxPrice !== product.minPrice) {
        return `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}/m²`;
      }
      return `${formatCurrency(product.minPrice)}/m²`;
    }
    return `${formatCurrency(product.price)}/m²`;
  };

  // ✅ Helper: Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-32 bg-krearte-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-krearte-gray-100 animate-pulse rounded-lg" />
          <div className="h-96 bg-krearte-gray-100 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-krearte-black mb-2">Failed to Load Dashboard</h3>
        <p className="text-krearte-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-6 py-3 bg-krearte-black text-krearte-white rounded-lg hover:bg-krearte-charcoal transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // ==================== STAT CARDS DATA ====================
  const statCards = [
    {
      name: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: "bg-blue-500",
      trend: stats.totalProducts > 0 ? `+${stats.totalProducts}` : "0",
    },
    {
      name: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "bg-green-500",
      trend: stats.totalOrders > 0 ? `+${stats.totalOrders}` : "0",
    },
    {
      name: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-purple-500",
      trend: stats.totalRevenue > 0 ? "+New" : "0",
    },
    {
      name: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: "bg-orange-500",
      trend: "+0",
    },
  ];

  // ==================== MAIN RENDER ====================
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-3xl font-light mb-2">Dashboard</h1>
          <p className="text-krearte-gray-600 font-light">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 text-krearte-gray-500 hover:text-krearte-black hover:bg-krearte-gray-100 rounded-lg transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
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
                {stat.trend}
              </span>
            </div>
            <p className="text-2xl font-normal mb-1">{stat.value}</p>
            <p className="text-sm text-krearte-gray-600 font-light">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Content Grid: Products & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Products */}
        <div className="bg-krearte-white rounded-lg border border-krearte-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-krearte-gray-200">
            <h2 className="font-sans text-lg font-normal">Recent Products</h2>
            <Link
              href="/admin/products"
              className="text-sm text-krearte-black font-medium hover:text-krearte-gray-600 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          {stats.recentProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {stats.recentProducts.map((product) => {
                const primaryImage = getPrimaryImage(product.images);
                const productHasVideo = hasVideo(product.images);
                
                return (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}/edit`}
                    className="group flex gap-4 p-4 border border-krearte-gray-200 rounded-lg hover:border-krearte-black hover:bg-krearte-gray-50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-krearte-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {primaryImage ? (
                        primaryImage.endsWith('.mp4') || primaryImage.endsWith('.webm') ? (
                          <video src={primaryImage} className="w-full h-full object-cover" muted />
                        ) : (
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      {productHasVideo && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-krearte-black/70 rounded-full flex items-center justify-center">
                          <Film className="w-3 h-3 text-krearte-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-krearte-black truncate">{product.name}</p>
                      <p className="text-sm text-krearte-gray-500 capitalize">{product.category}</p>
                      
                      {/* Price with range support */}
                      <p className="text-sm font-normal text-krearte-black mt-1">
                        {formatProductPrice(product)}
                      </p>
                      
                      <p className={`text-xs mt-1 ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
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
              <Link href="/admin/products/new" className="inline-flex items-center gap-2 mt-4 text-krearte-black font-medium hover:text-krearte-gray-600">
                <Package className="w-4 h-4" /> Add your first product
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
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-krearte-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-krearte-gray-600 uppercase tracking-wider">Date</th>
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
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
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
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/products/new"
          className="bg-krearte-black text-krearte-white rounded-lg p-6 hover:bg-krearte-charcoal transition-colors"
        >
          <Package className="w-8 h-8 mb-3" />
          <h3 className="font-sans text-lg font-normal mb-1">Add Product</h3>
          <p className="text-sm font-light text-krearte-gray-300">Create a new product listing</p>
        </Link>
        
        <Link
          href="/admin/orders"
          className="bg-krearte-white border border-krearte-gray-200 rounded-lg p-6 hover:border-krearte-black transition-colors"
        >
          <ShoppingCart className="w-8 h-8 mb-3 text-krearte-black" />
          <h3 className="font-sans text-lg font-normal mb-1">Manage Orders</h3>
          <p className="text-sm font-light text-krearte-gray-600">View and process orders</p>
        </Link>
        
        <Link
          href="/admin/settings"
          className="bg-krearte-white border border-krearte-gray-200 rounded-lg p-6 hover:border-krearte-black transition-colors"
        >
          <Settings className="w-8 h-8 mb-3 text-krearte-black" />
          <h3 className="font-sans text-lg font-normal mb-1">Settings</h3>
          <p className="text-sm font-light text-krearte-gray-600">Configure your store</p>
        </Link>
      </div>
    </div>
  );
}