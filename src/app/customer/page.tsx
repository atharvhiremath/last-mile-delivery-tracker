"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  Plus,
  Search,
  ExternalLink,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Truck,
  Filter,
} from "lucide-react";
import RescheduleModal from "@/components/RescheduleModal";

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedFailedOrder, setSelectedFailedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/orders`;
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchOrders();
    }
  }, [user, authLoading, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Delivered</span>;
      case "FAILED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">Failed</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Out for Delivery</span>;
      case "RESCHEDULED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Rescheduled</span>;
      case "ASSIGNED":
      case "PICKED_UP":
      case "IN_TRANSIT":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">{status.replace(/_/g, " ")}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Customer Workspace</div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name || "Customer"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active shipments, view immutable transit histories, and book new deliveries
          </p>
        </div>

        <Link
          href="/customer/create-order"
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Book New Delivery</span>
        </Link>
      </div>

      {/* Orders List Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Tracking # or Recipient..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </form>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "PLACED", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RESCHEDULED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading your deliveries...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-900 text-base">No deliveries found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You don&apos;t have any orders matching the current filter. Create a new delivery order to get started!
            </p>
            <Link
              href="/customer/create-order"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Delivery</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {orders.map((order) => {
              const isFailed = order.status === "FAILED";
              return (
                <div
                  key={order.id}
                  className="p-5 sm:p-6 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        #{order.trackingNumber}
                      </span>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {order.orderType} • {order.paymentType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">{order.pickupCity} ({order.pickupPincode})</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium text-slate-800">{order.dropCity} ({order.dropPincode})</span>
                      <span className="text-slate-400">•</span>
                      <span>{order.itemDescription} ({order.billableWeightKg} kg billed)</span>
                    </div>

                    {isFailed && (
                      <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 inline-block font-medium">
                        ⚠️ Reason: {order.failedReason || "Customer unavailable"}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isFailed && (
                      <button
                        onClick={() => setSelectedFailedOrder(order)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    <Link
                      href={`/track/${order.trackingNumber}`}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5"
                    >
                      <span>Live Track</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {selectedFailedOrder && (
        <RescheduleModal
          orderId={selectedFailedOrder.id}
          trackingNumber={selectedFailedOrder.trackingNumber}
          isOpen={Boolean(selectedFailedOrder)}
          onClose={() => setSelectedFailedOrder(null)}
          onSuccess={() => {
            setSelectedFailedOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
