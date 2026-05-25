"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image?: string;
  materialName?: string;
  widthCm?: number;
  heightCm?: number;
  areaM2?: number;
  pricePerM2?: number;
  wasteCost?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{
    orderStatus?: boolean;
    paymentStatus?: boolean;
  }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch order data
  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      // ✅ Gunakan endpoint admin yang benar
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        setOrder(result.order);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to fetch order' });
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle status update via API
  const handleStatusChange = async (
    newStatus: string, 
    type: 'order' | 'payment'
  ) => {
    // Konfirmasi sebelum update
    const confirmMsg = type === 'order' 
      ? `Change order status to "${newStatus}"?`
      : `Change payment status to "${newStatus}"?`;
    
    if (!confirm(confirmMsg)) return;

    // Set loading state untuk dropdown yang sesuai
    setUpdating(prev => ({ ...prev, [`${type}Status`]: true }));
    setMessage(null);

    try {
      // ✅ Panggil API PATCH ke endpoint admin
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type === 'order' ? 'status' : 'paymentStatus']: newStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        // ✅ OPTIMISTIC UPDATE: Update local state supaya UI langsung berubah
        setOrder(prev => prev ? {
          ...prev,
          status: type === 'order' ? newStatus : prev.status,
          paymentStatus: type === 'payment' ? newStatus : prev.paymentStatus,
        } : null);
        
        setMessage({ type: 'success', text: 'Status updated successfully!' });
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update status' });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setUpdating(prev => ({ ...prev, [`${type}Status`]: false }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="text-center py-24">
        <h1 className="font-sans text-3xl font-light mb-4">Order Not Found</h1>
        <Link href="/admin/orders" className="text-krearte-black font-medium underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 text-krearte-gray-600 hover:text-krearte-black hover:bg-krearte-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-sans text-3xl font-light mb-2">Order Details</h1>
            <p className="text-krearte-gray-600 font-light">
              {order.orderNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-krearte-gray-200 text-krearte-black rounded-lg text-sm font-medium hover:bg-krearte-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-krearte-gray-200 text-krearte-black rounded-lg text-sm font-medium hover:bg-krearte-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Message Notification */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
          <button 
            onClick={() => setMessage(null)}
            className="ml-auto text-current hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-4 pb-4 border-b border-krearte-gray-100 last:border-0">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-krearte-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-krearte-gray-400">
                        <span className="text-xl font-light">{item.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-krearte-black truncate">{item.name}</p>
                    <p className="text-sm text-krearte-gray-500">Size: {item.size}</p>
                    {item.materialName && (
                      <p className="text-xs text-krearte-gray-400">Material: {item.materialName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-krearte-gray-600">Qty: {item.quantity}</p>
                    <p className="font-normal text-krearte-black">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-6">Customer Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-krearte-gray-500 mb-1">Name</p>
                <p className="font-medium text-krearte-black">{order.firstName} {order.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-krearte-gray-500 mb-1">Email</p>
                <p className="font-medium text-krearte-black">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-krearte-gray-500 mb-1">Phone</p>
                <p className="font-medium text-krearte-black">{order.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-krearte-gray-500 mb-1">Order Date</p>
                <p className="font-medium text-krearte-black">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-6">Shipping Address</h2>
            <div className="space-y-2 text-krearte-black">
              <p>{order.address}</p>
              <p>{order.city}, {order.postalCode}</p>
            </div>
          </div>
        </div>

        {/* Order Summary & Status */}
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-6">Order Status</h2>
            <div className="space-y-4">
              
              {/* Order Status Dropdown */}
              <div>
                <p className="text-sm text-krearte-gray-500 mb-2">Order Status</p>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value, 'order')}
                  disabled={updating.orderStatus}
                  className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-krearte-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating.orderStatus ? (
                    <option>Updating...</option>
                  ) : (
                    <>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
              </div>

              {/* Payment Status Dropdown */}
              <div>
                <p className="text-sm text-krearte-gray-500 mb-2">Payment Status</p>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handleStatusChange(e.target.value, 'payment')}
                  disabled={updating.paymentStatus}
                  className={`w-full px-4 py-3 border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-krearte-black disabled:opacity-50 disabled:cursor-not-allowed ${
                    order.paymentStatus === "paid"
                      ? "bg-green-50 text-green-800 border-green-200"
                      : order.paymentStatus === "pending_verification"
                      ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                      : "bg-krearte-gray-50 border-krearte-gray-200"
                  }`}
                >
                  {updating.paymentStatus ? (
                    <option>Updating...</option>
                  ) : (
                    <>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </>
                  )}
                </select>
              </div>

            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-6">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-krearte-gray-600">Subtotal</span>
                <span className="font-normal text-krearte-black">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-krearte-gray-600">Shipping</span>
                <span className="font-normal text-krearte-black">{formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-lg pt-3 border-t border-krearte-gray-200">
                <span className="font-normal text-krearte-black">Total</span>
                <span className="font-normal text-krearte-black">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const message = `Halo ${order.firstName}, ini konfirmasi dari Krearte untuk order ${order.orderNumber}. Total: ${formatCurrency(order.total)}.`;
                  const waLink = `https://wa.me/62${order.phone?.replace(/^0+/, '')}?text=${encodeURIComponent(message)}`;
                  window.open(waLink, '_blank');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>💬 Chat Customer via WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.orderNumber);
                  alert("Order number copied!");
                }}
                className="w-full px-4 py-2 border border-krearte-gray-200 text-krearte-black rounded-lg text-sm font-medium hover:bg-krearte-gray-50 transition-colors"
              >
                📋 Copy Order Number
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}