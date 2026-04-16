"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  items: any[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setOrder(result.order);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b border-krearte-gray-100 last:border-0">
                  <div className="w-16 h-16 bg-krearte-gray-100 flex items-center justify-center">
                    <span className="text-2xl font-light text-krearte-gray-400">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-krearte-black">{item.name}</p>
                    <p className="text-sm text-krearte-gray-500">Size: {item.size}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-krearte-gray-600">Qty: {item.quantity}</p>
                    <p className="font-normal text-krearte-black">{formatCurrency(item.price * item.quantity)}</p>
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
                  {new Date(order.createdAt).toLocaleDateString()}
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

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 p-6">
            <h2 className="font-sans text-lg font-normal mb-6">Order Status</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-krearte-gray-500 mb-2">Order Status</p>
                <select
                  value={order.status}
                  onChange={(e) => {
                    // TODO: Update order status via API
                    console.log("New status:", e.target.value);
                  }}
                  className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 rounded-lg font-medium"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <p className="text-sm text-krearte-gray-500 mb-2">Payment Status</p>
                <div className={`px-4 py-3 rounded-lg font-medium ${
                  order.paymentStatus === "paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {order.paymentStatus}
                </div>
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
        </div>
      </div>
    </div>
  );
}