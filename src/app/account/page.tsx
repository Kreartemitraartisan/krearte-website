"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Package, 
  Heart, 
  User, 
  ChevronRight,
  Loader2,
  ShoppingBag,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

export default function MyAccountPage() {
  const router = useRouter();
  const {  session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
  });
  
  // ✅ NEW: User profile state
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account");
    } else if (status === "authenticated") {
      fetchAccountData();
    }
  }, [status, router]);

  const fetchAccountData = async () => {
    try {
      // ✅ UPDATED: Fetch profile, orders, and stats
      const [profileRes, ordersRes, statsRes] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/orders"),
        fetch("/api/account/stats"),
      ]);

      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();

      // ✅ NEW: Set profile data
      if (profileData.success && profileData.user) {
        setUserProfile({
          name: profileData.user.name || "",
          email: profileData.user.email || "",
          phone: profileData.user.phone || "",
          address: profileData.user.address || "",
          city: profileData.user.city || "",
          postalCode: profileData.user.postalCode || "",
        });
      }

      if (ordersData.success) {
        setRecentOrders(ordersData.orders.slice(0, 5));
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Error fetching account ", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream py-12">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-sans text-4xl font-light mb-2">My Account</h1>
          <p className="text-krearte-gray-600 font-light">
            Welcome back, {userProfile.name || session?.user?.name || session?.user?.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-krearte-gray-600">Total Orders</p>
                <p className="text-2xl font-light text-krearte-black">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-krearte-gray-600">Total Spent</p>
                <p className="text-2xl font-light text-krearte-black">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-krearte-gray-600">Wishlist</p>
                <p className="text-2xl font-light text-krearte-black">{stats.wishlistItems} items</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-krearte-gray-600">Member Since</p>
                <p className="text-lg font-light text-krearte-black">2024</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-krearte-gray-200">
                <h2 className="font-sans text-xl font-normal flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Recent Orders
                </h2>
                <Link
                  href="/account/orders"
                  className="text-sm text-krearte-black font-medium hover:text-krearte-gray-600 flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-krearte-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet</p>
                  <Link
                    href="/collections"
                    className="inline-block mt-4 text-krearte-black font-medium hover:underline"
                  >
                    Start Shopping →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-krearte-gray-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-krearte-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-krearte-black">
                            Order #{order.orderNumber}
                          </p>
                          <p className="text-sm text-krearte-gray-500">
                            {formatDate(order.createdAt)} • {order.itemCount} items
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-light text-krearte-black">
                          {formatCurrency(order.total)}
                        </p>
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="text-sm text-krearte-black font-medium hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Menu */}
            <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200">
              <div className="p-6 border-b border-krearte-gray-200">
                <h3 className="font-sans text-lg font-normal">Account</h3>
              </div>
              <nav className="p-4 space-y-2">
                <Link
                  href="/account/profile"
                  className="flex items-center gap-3 px-4 py-3 text-krearte-black hover:bg-krearte-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  Profile Information
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-4 py-3 text-krearte-black hover:bg-krearte-gray-100 rounded-lg transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Order History
                </Link>
                <Link
                  href="/account/wishlist"
                  className="flex items-center gap-3 px-4 py-3 text-krearte-black hover:bg-krearte-gray-100 rounded-lg transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                </Link>
              </nav>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 p-6">
              <h3 className="font-sans text-lg font-normal mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-krearte-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-krearte-gray-600">Email</p>
                    <p className="text-sm font-medium text-krearte-black">
                      {userProfile.email || session?.user?.email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-krearte-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-krearte-gray-600">Phone</p>
                    <p className="text-sm font-medium text-krearte-black">
                      {userProfile.phone || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-krearte-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-krearte-gray-600">Address</p>
                    <p className="text-sm font-medium text-krearte-black">
                      {userProfile.address 
                        ? `${userProfile.address}${userProfile.city ? `, ${userProfile.city}` : ''}`
                        : "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/account/profile"
                className="block mt-4 text-center px-4 py-2 border border-krearte-black text-krearte-black text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-colors rounded"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}