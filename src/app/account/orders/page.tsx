"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Package, Search, Filter, ChevronRight, Loader2, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const {  session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account/orders");
    } else if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/account/orders");
      const result = await response.json();

      if (result.success) {
        setOrders(result.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
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
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pending Payment",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return labels[status.toLowerCase()] || status;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    all: orders.length,
    pending: orders.filter((o) => o.status.toLowerCase() === "pending").length,
    processing: orders.filter((o) => o.status.toLowerCase() === "processing").length,
    shipped: orders.filter((o) => o.status.toLowerCase() === "shipped").length,
    delivered: orders.filter((o) => o.status.toLowerCase() === "delivered").length,
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
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black mb-4"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to My Account
          </Link>
          <h1 className="font-sans text-4xl font-light mb-2">Order History</h1>
          <p className="text-krearte-gray-600 font-light">
            Track and manage your orders ({orders.length} total)
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === "all"
                ? "bg-krearte-black text-krearte-white"
                : "bg-white text-krearte-gray-600 hover:bg-krearte-gray-100 border border-krearte-gray-200"
            }`}
          >
            All Orders ({orderStats.all})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === "pending"
                ? "bg-yellow-500 text-white"
                : "bg-white text-krearte-gray-600 hover:bg-krearte-gray-100 border border-krearte-gray-200"
            }`}
          >
            Pending ({orderStats.pending})
          </button>
          <button
            onClick={() => setStatusFilter("processing")}
            className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === "processing"
                ? "bg-blue-500 text-white"
                : "bg-white text-krearte-gray-600 hover:bg-krearte-gray-100 border border-krearte-gray-200"
            }`}
          >
            Processing ({orderStats.processing})
          </button>
          <button
            onClick={() => setStatusFilter("shipped")}
            className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === "shipped"
                ? "bg-purple-500 text-white"
                : "bg-white text-krearte-gray-600 hover:bg-krearte-gray-100 border border-krearte-gray-200"
            }`}
          >
            Shipped ({orderStats.shipped})
          </button>
          <button
            onClick={() => setStatusFilter("delivered")}
            className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === "delivered"
                ? "bg-green-500 text-white"
                : "bg-white text-krearte-gray-600 hover:bg-krearte-gray-100 border border-krearte-gray-200"
            }`}
          >
            Delivered ({orderStats.delivered})
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order number..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-6 text-krearte-gray-300" />
            <h2 className="font-sans text-xl font-normal mb-2">No orders found</h2>
            <p className="text-krearte-gray-600 font-light mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter"
                : "You haven't placed any orders yet"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link
                href="/collections"
                className="inline-block px-8 py-3 bg-krearte-black text-white font-medium rounded-lg hover:bg-krearte-charcoal transition-colors"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-krearte-gray-100">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-sans text-lg font-normal text-krearte-black">
                          Order #{order.orderNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-krearte-gray-600">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {order.itemCount} items
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-krearte-gray-600 mb-1">Total Amount</p>
                      <p className="text-xl font-light text-krearte-black">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="p-6 bg-krearte-gray-50">
                    <p className="text-sm font-medium text-krearte-gray-600 mb-4">
                      Order Items ({order.items.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-krearte-gray-200 rounded overflow-hidden flex-shrink-0">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-krearte-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-krearte-black truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-krearte-gray-500">
                              {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex items-center justify-center w-16 h-16 bg-krearte-gray-100 rounded text-krearte-gray-500 text-sm font-medium">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Actions */}
                <div className="p-6 border-t border-krearte-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-krearte-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment: {order.status === "delivered" ? "Completed" : "Pending"}</span>
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-2 px-6 py-2 bg-krearte-black text-white text-sm font-medium rounded-lg hover:bg-krearte-charcoal transition-colors"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}