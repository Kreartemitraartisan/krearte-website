"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ChevronLeft, 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  MapPin,
  Loader2,
  Download
} from "lucide-react";
import Link from "next/link";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: string;
  items: OrderItem[];
  trackingNumber?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const {  session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account/orders");
    } else if (status === "authenticated" && params.id) {
      fetchOrderDetail();
    }
  }, [status, router, params]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/account/orders/${params.id}`);
      const result = await response.json();

      if (result.success) {
        setOrder(result.order);
      }
    } catch (error) {
      console.error("Error fetching order detail:", error);
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
      hour: "2-digit",
      minute: "2-digit",
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-krearte-gray-300" />
          <h1 className="text-2xl font-light mb-2">Order Not Found</h1>
          <Link
            href="/account/orders"
            className="text-krearte-black font-medium hover:underline"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krearte-cream py-12">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Order History
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-sans text-4xl font-light mb-2">Order Details</h1>
              <p className="text-krearte-gray-600 font-light">
                Order #{order.orderNumber}
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 border border-krearte-gray-300 rounded-lg hover:bg-krearte-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans text-xl font-normal">Order Status</h2>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* Progress Tracker */}
              <div className="relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-krearte-gray-200"></div>
                <div className="relative flex justify-between">
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      ["pending", "processing", "shipped", "delivered"].includes(order.status.toLowerCase())
                        ? "bg-green-500 text-white"
                        : "bg-krearte-gray-200 text-krearte-gray-400"
                    }`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-krearte-gray-600">Payment</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      ["processing", "shipped", "delivered"].includes(order.status.toLowerCase())
                        ? "bg-green-500 text-white"
                        : "bg-krearte-gray-200 text-krearte-gray-400"
                    }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-krearte-gray-600">Processing</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      ["shipped", "delivered"].includes(order.status.toLowerCase())
                        ? "bg-green-500 text-white"
                        : "bg-krearte-gray-200 text-krearte-gray-400"
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-krearte-gray-600">Shipped</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      order.status.toLowerCase() === "delivered"
                        ? "bg-green-500 text-white"
                        : "bg-krearte-gray-200 text-krearte-gray-400"
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-krearte-gray-600">Delivered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200">
              <div className="p-6 border-b border-krearte-gray-200">
                <h2 className="font-sans text-xl font-normal">Order Items</h2>
              </div>
              <div className="divide-y divide-krearte-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-4">
                    <div className="w-24 h-24 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-krearte-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-krearte-black mb-1">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-krearte-gray-600">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-krearte-gray-600">
                        Price: {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-krearte-black">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 p-6">
              <h2 className="font-sans text-xl font-normal mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-krearte-gray-600">Subtotal</span>
                  <span className="text-krearte-black">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-krearte-gray-600">Shipping</span>
                  <span className="text-krearte-black">
                    {order.shippingCost === 0 ? "FREE" : formatCurrency(order.shippingCost)}
                  </span>
                </div>
                <div className="border-t border-krearte-gray-200 pt-4 flex justify-between">
                  <span className="font-medium text-krearte-black">Total</span>
                  <span className="font-medium text-krearte-black">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-white rounded-lg shadow-sm border border-krearte-gray-200 p-6">
              <h2 className="font-sans text-xl font-normal mb-6">Order Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-krearte-gray-600 mb-1">Order Number</p>
                  <p className="font-medium text-krearte-black">#{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-krearte-gray-600 mb-1">Order Date</p>
                  <p className="font-medium text-krearte-black flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                {order.trackingNumber && (
                  <div>
                    <p className="text-sm text-krearte-gray-600 mb-1">Tracking Number</p>
                    <p className="font-medium text-krearte-black">{order.trackingNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-krearte-gray-600 mb-1">Shipping Address</p>
                  <p className="font-medium text-krearte-black flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {order.shippingAddress || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-krearte-gray-50 rounded-lg border border-krearte-gray-200 p-6">
              <h3 className="font-sans text-lg font-normal mb-2">Need Help?</h3>
              <p className="text-sm text-krearte-gray-600 mb-4">
                Have questions about your order? Contact our support team.
              </p>
              <Link
                href="/contact"
                className="block text-center px-4 py-2 bg-krearte-black text-white text-sm font-medium rounded hover:bg-krearte-charcoal transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}