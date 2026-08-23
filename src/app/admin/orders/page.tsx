"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Search,
  Filter,
  Truck,
  Plus,
  Zap,
  ExternalLink,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
} from "lucide-react";
import StatusOverrideModal from "@/components/StatusOverrideModal";

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [orderTypeFilter, setOrderTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Action states
  const [autoAssigningId, setAutoAssigningId] = useState<string | null>(null);
  const [manualAssigningId, setManualAssigningId] = useState<string | null>(null);
  const [overrideModalOrder, setOverrideModalOrder] = useState<any | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (zoneFilter !== "ALL") params.append("zoneId", zoneFilter);
      if (agentFilter !== "ALL") params.append("agentId", agentFilter);
      if (orderTypeFilter !== "ALL") params.append("orderType", orderTypeFilter);
      if (search.trim()) params.append("search", search.trim());

      const [ordersRes, agentsRes, zonesRes] = await Promise.all([
        fetch(`/api/orders?${params.toString()}`),
        fetch("/api/agents"),
        fetch("/api/zones"),
      ]);

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.orders || []);
      }
      if (agentsRes.ok) {
        const aData = await agentsRes.json();
        setAgents(aData.agents || []);
      }
      if (zonesRes.ok) {
        const zData = await zonesRes.json();
        setZones(zData.zones || []);
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
      if (user.role !== "ADMIN") {
        router.push("/customer");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, statusFilter, zoneFilter, agentFilter, orderTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Trigger Intelligent Auto-Assignment
  const triggerAutoAssign = async (orderId: string) => {
    setAutoAssigningId(orderId);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto: true }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccessMsg(`Auto-assignment success: ${data.message}`);
        await fetchData();
      } else {
        alert(data.error || "Auto-assignment failed.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAutoAssigningId(null);
    }
  };

  // Manual Agent Assignment
  const triggerManualAssign = async (orderId: string, agentId: string) => {
    if (!agentId) return;
    setManualAssigningId(orderId);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccessMsg(`Agent assigned successfully.`);
        await fetchData();
      } else {
        alert(data.error || "Manual assignment failed.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setManualAssigningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Delivered</span>;
      case "FAILED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">Failed</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Out for Delivery</span>;
      case "RESCHEDULED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Rescheduled</span>;
      case "PLACED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Placed (Unassigned)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">{status.replace(/_/g, " ")}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Admin Operations Deck
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Order Lifecycle & Dispatch Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent auto-assignment • Multi-criteria filters • Status overrides with immutable audit logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/customer/create-order"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Order for Customer</span>
          </Link>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-xs text-emerald-600 font-bold">Dismiss</button>
        </div>
      )}

      {/* Multi-Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Orders</label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tracking #, customer, sender, city..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </form>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLACED">PLACED (Pending Assignment)</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="PICKED_UP">PICKED UP</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Zone Scope</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Order Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Order Type</label>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Types (B2B & B2C)</option>
              <option value="B2C">B2C Retail</option>
              <option value="B2B">B2B Bulk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Master Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Orders Directory</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold font-mono">
              {orders.length} total
            </span>
          </div>
          <button onClick={fetchData} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            ↻ Refresh Table
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading order records...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No matching orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Tracking #</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Route & Zones</th>
                  <th className="py-3.5 px-4">Weight & Amount</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isUnassigned = !order.assignedAgentId || order.status === "PLACED";
                  const isAutoAssigning = autoAssigningId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      {/* Tracking # */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/track/${order.trackingNumber}`} className="hover:text-indigo-600 flex items-center gap-1">
                          <span>#{order.trackingNumber}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                        <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(order.status)}
                        {order.failedReason && (
                          <div className="text-[10px] text-rose-600 truncate max-w-[140px] mt-1" title={order.failedReason}>
                            ⚠️ {order.failedReason}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">{order.customer?.name}</div>
                        <div className="text-[11px] text-slate-500">{order.recipientPhone}</div>
                      </td>

                      {/* Route & Zones */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="font-medium">{order.pickupCity}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-medium">{order.dropCity}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {order.pickupZone?.name || "Zone"} → {order.dropZone?.name || "Zone"}
                        </div>
                      </td>

                      {/* Weight & Total */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">${order.totalAmount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">
                          {order.billableWeightKg} kg billed • {order.paymentType}
                        </div>
                      </td>

                      {/* Assigned Agent & Manual Dropdown */}
                      <td className="py-4 px-4">
                        {order.assignedAgent ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{order.assignedAgent.user?.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {order.assignedAgent.vehicleType} ({order.assignedAgent.vehicleNumber})
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Dispatch Actions */}
                      <td className="py-4 px-4 text-right space-y-1">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Auto Assign Button */}
                          {isUnassigned && (
                            <button
                              type="button"
                              onClick={() => triggerAutoAssign(order.id)}
                              disabled={isAutoAssigning}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow transition flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3 text-amber-300" />
                              <span>{isAutoAssigning ? "Routing..." : "Auto-Assign"}</span>
                            </button>
                          )}

                          {/* Manual Assign Select */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                triggerManualAssign(order.id, e.target.value);
                              }
                            }}
                            defaultValue=""
                            className="px-2 py-1 text-[11px] border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
                          >
                            <option value="" disabled>Manual Assign...</option>
                            {agents.map((ag) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.user?.name} ({ag.vehicleType} - Load: {ag.currentActiveLoad}/{ag.maxCapacity})
                              </option>
                            ))}
                          </select>

                          {/* Override Modal Button */}
                          <button
                            type="button"
                            onClick={() => setOverrideModalOrder(order)}
                            title="Admin Status Override"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition border border-slate-200"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Status Override Modal */}
      {overrideModalOrder && (
        <StatusOverrideModal
          orderId={overrideModalOrder.id}
          trackingNumber={overrideModalOrder.trackingNumber}
          currentStatus={overrideModalOrder.status}
          isOpen={Boolean(overrideModalOrder)}
          onClose={() => setOverrideModalOrder(null)}
          onSuccess={() => {
            setOverrideModalOrder(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
