"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Navigation,
  Package,
  Power,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Shield,
  Compass,
} from "lucide-react";

export default function AgentDashboard() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Failure Modal state
  const [failureModalOrder, setFailureModalOrder] = useState<any | null>(null);
  const [failureReason, setFailureReason] = useState("Customer Unavailable (Door locked, phone unanswered)");
  const [failureNotes, setFailureNotes] = useState("");

  // GPS Telemetry simulation state
  const [currentLat, setCurrentLat] = useState(user?.agentProfile?.currentLatitude || 28.6139);
  const [currentLng, setCurrentLng] = useState(user?.agentProfile?.currentLongitude || 77.2090);
  const [isAvailable, setIsAvailable] = useState(user?.agentProfile?.isAvailable ?? true);
  const [gpsUpdating, setGpsUpdating] = useState(false);

  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
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
      if (user.role !== "AGENT" && user.role !== "ADMIN") {
        router.push("/customer");
      } else {
        fetchAssignedOrders();
        if (user.agentProfile) {
          setCurrentLat(user.agentProfile.currentLatitude);
          setCurrentLng(user.agentProfile.currentLongitude);
          setIsAvailable(user.agentProfile.isAvailable);
        }
      }
    }
  }, [user, authLoading]);

  // Toggle availability
  const toggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    try {
      await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      await refreshUser();
    } catch (e) {
      console.error(e);
    }
  };

  // Update GPS telemetry
  const updateGps = async () => {
    setGpsUpdating(true);
    try {
      await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentLatitude: Number(currentLat),
          currentLongitude: Number(currentLng),
        }),
      });
      await refreshUser();
      alert("GPS Coordinates updated successfully!");
    } catch (e) {
      console.error(e);
    } finally {
      setGpsUpdating(false);
    }
  };

  // Transition Order Status
  const handleUpdateStatus = async (
    orderId: string,
    targetStatus: string,
    notes?: string,
    failedReasonText?: string
  ) => {
    setStatusUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          notes,
          failedReason: failedReasonText,
          latitude: currentLat,
          longitude: currentLng,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      await fetchAssignedOrders();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || "Failed to update order status.");
    } finally {
      setStatusUpdating(null);
    }
  };

  // Submit Failure
  const submitFailure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failureModalOrder) return;

    await handleUpdateStatus(
      failureModalOrder.id,
      "FAILED",
      failureNotes,
      `${failureReason} ${failureNotes ? `- ${failureNotes}` : ""}`
    );

    setFailureModalOrder(null);
    setFailureNotes("");
  };

  const activeOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "FAILED"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["DELIVERED", "FAILED"].includes(o.status)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Agent Profile & Live Status Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user?.name}</h1>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  {user?.agentProfile?.vehicleType || "BIKE"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Reg: {user?.agentProfile?.vehicleNumber || "DL-01-BK-9921"} • Zone: {user?.agentProfile?.operatingZone?.name || "North Metro Hub"} • Rating: ★ {user?.agentProfile?.rating || "4.9"}
              </p>
            </div>
          </div>

          {/* Availability Toggle Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAvailability}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition flex items-center gap-2 ${
                isAvailable
                  ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isAvailable ? "Online (Available for Dispatch)" : "Offline (Paused)"}</span>
            </button>
          </div>
        </div>

        {/* Load Status & GPS Simulator Sub-bar */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Capacity Load</span>
            <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-300">
              {activeOrders.length} / {user?.agentProfile?.maxCapacity || 5} Active Packages
            </span>
          </div>

          {/* GPS Telemetry Simulation Controls */}
          <div className="md:col-span-8 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400 font-medium">Simulated Agent GPS:</span>
              <input
                type="number"
                step="0.0001"
                value={currentLat}
                onChange={(e) => setCurrentLat(Number(e.target.value))}
                className="w-24 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono"
              />
              <span className="text-slate-500">,</span>
              <input
                type="number"
                step="0.0001"
                value={currentLng}
                onChange={(e) => setCurrentLng(Number(e.target.value))}
                className="w-24 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono"
              />
            </div>

            <button
              type="button"
              onClick={updateGps}
              disabled={gpsUpdating}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition"
            >
              {gpsUpdating ? "Syncing..." : "Sync Live GPS"}
            </button>
          </div>
        </div>
      </div>

      {/* Active Tasks Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Active Deliveries ({activeOrders.length})</span>
          </h2>
          <button
            onClick={fetchAssignedOrders}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            ↻ Refresh Tasks
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading delivery tasks...</div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2 transition-colors">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="font-bold text-slate-900 dark:text-white text-base">All Caught Up!</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You currently have no active deliveries assigned. New orders from your operating zone will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map((order) => {
              const isUpdating = statusUpdating === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 hover:border-indigo-300 dark:hover:border-indigo-600 transition"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">#{order.trackingNumber}</span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{order.orderType} • {order.paymentType}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Route Addresses */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                      <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">Pickup: {order.senderName} ({order.senderPhone})</div>
                        <div className="text-slate-800 dark:text-slate-200">{order.pickupAddress}, {order.pickupCity} ({order.pickupPincode})</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                      <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Drop: {order.recipientName} ({order.recipientPhone})</div>
                        <div className="text-slate-800 dark:text-slate-200">{order.dropAddress}, {order.dropCity} ({order.dropPincode})</div>
                      </div>
                    </div>
                  </div>

                  {/* Package & Payment */}
                  <div className="flex justify-between items-center bg-slate-100/70 dark:bg-slate-800/80 p-3 rounded-2xl text-xs border border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{order.itemDescription} ({order.billableWeightKg} kg)</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {order.paymentType === "COD" ? `Collect COD: $${order.totalAmount}` : `Prepaid`}
                    </span>
                  </div>

                  {/* Action Transition Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {order.status === "ASSIGNED" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "PICKED_UP", "Package collected from sender.")}
                        disabled={isUpdating}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                      >
                        <Package className="w-4 h-4" />
                        <span>Confirm Package Pickup</span>
                      </button>
                    )}

                    {order.status === "PICKED_UP" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "IN_TRANSIT", "Package en route to hub/sector.")}
                        disabled={isUpdating}
                        className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Mark In Transit</span>
                      </button>
                    )}

                    {order.status === "IN_TRANSIT" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY", "Out for delivery to customer.")}
                        disabled={isUpdating}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Start Out for Delivery</span>
                      </button>
                    )}

                    {order.status === "OUT_FOR_DELIVERY" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus(order.id, "DELIVERED", "Delivered successfully to recipient.")}
                          disabled={isUpdating}
                          className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Delivered</span>
                        </button>
                        <button
                          onClick={() => setFailureModalOrder(order)}
                          disabled={isUpdating}
                          className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Mark Failed</span>
                        </button>
                      </div>
                    )}

                    <div className="text-center">
                      <Link
                        href={`/track/${order.trackingNumber}`}
                        className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium inline-flex items-center gap-1"
                      >
                        <span>View Live Map & Full Timeline</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Orders History */}
      {completedOrders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Completed / Attempted Deliveries
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {completedOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">#{order.trackingNumber}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2">{order.dropAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      order.status === "DELIVERED"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {order.status}
                  </span>
                  <Link
                    href={`/track/${order.trackingNumber}`}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failure Reason Modal */}
      {failureModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Delivery Failure</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Order #{failureModalOrder.trackingNumber}</p>
              </div>
            </div>

            <form onSubmit={submitFailure} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Failure Reason</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Customer Unavailable (Door locked, phone unanswered)">Customer Unavailable (Door locked, phone unanswered)</option>
                  <option value="Incorrect Address / Unlocatable Landmark">Incorrect Address / Unlocatable Landmark</option>
                  <option value="Customer Refused Delivery / COD Payment Issue">Customer Refused Delivery / COD Payment Issue</option>
                  <option value="Package Damaged in Transit">Package Damaged in Transit</option>
                  <option value="Severe Weather / Route Inaccessible">Severe Weather / Route Inaccessible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  placeholder="e.g. Called customer 3 times, guard said flat is locked..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailureModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow"
                >
                  Confirm Failure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
