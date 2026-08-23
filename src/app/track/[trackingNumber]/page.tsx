"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  Package,
  MapPin,
  Calendar,
  Clock,
  RotateCcw,
  ArrowLeft,
  Phone,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Box,
  Scale,
  Sparkles,
} from "lucide-react";
import OrderTimeline from "@/components/OrderTimeline";
import LiveMap from "@/components/LiveMap";
import RescheduleModal from "@/components/RescheduleModal";

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumber = params?.trackingNumber as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const fetchOrderDetails = async () => {
    if (!trackingNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track/${trackingNumber}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Shipment not found.");
      }
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || "Failed to load tracking details.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [trackingNumber]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-slate-600 text-sm font-medium">Fetching real-time tracking data...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Shipment Not Found</h2>
        <p className="text-xs text-slate-600 mb-6">
          {error || `We couldn't locate any active delivery records matching "${trackingNumber}".`}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </Link>
      </div>
    );
  }

  const isFailed = order.status === "FAILED";
  const isDelivered = order.status === "DELIVERED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-mono">
              #{order.trackingNumber}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isDelivered
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : isFailed
                  ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                  : "bg-indigo-100 text-indigo-800 border border-indigo-300"
              }`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Booked on {new Date(order.createdAt).toLocaleDateString()} • {order.orderType} Shipping • {order.paymentType}
          </p>
        </div>

        {/* Failed Reschedule Button Prompt */}
        {isFailed && (
          <button
            onClick={() => setRescheduleOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg flex items-center gap-2 animate-bounce transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reschedule Delivery Attempt</span>
          </button>
        )}
      </div>

      {/* Main Grid: Stepper & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Progress Stepper & Immutable Event Trail */}
        <div className="lg:col-span-7 space-y-6">
          <OrderTimeline
            currentStatus={order.status}
            history={order.statusHistory || []}
            failedReason={order.failedReason}
            rescheduledDate={order.rescheduledDate}
            rescheduledSlot={order.rescheduledSlot}
          />
        </div>

        {/* Right Column: Live Map & Package Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live GPS Telemetry Map */}
          <LiveMap
            pickupLat={order.pickupLat}
            pickupLng={order.pickupLng}
            pickupAddress={`${order.pickupAddress}, ${order.senderCity}`}
            dropLat={order.dropLat}
            dropLng={order.dropLng}
            dropAddress={`${order.dropAddress}, ${order.recipientCity}`}
            agentLat={order.assignedAgent?.currentLatitude}
            agentLng={order.assignedAgent?.currentLongitude}
            agentName={order.assignedAgent?.name}
            vehicleType={order.assignedAgent?.vehicleType}
          />

          {/* Assigned Agent Card (if assigned) */}
          {order.assignedAgent && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                Assigned Delivery Agent
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {order.assignedAgent.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{order.assignedAgent.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {order.assignedAgent.vehicleType} • {order.assignedAgent.vehicleNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    ★ {order.assignedAgent.rating.toFixed(1)}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {order.assignedAgent.phone}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Package & Weight Billing Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Box className="w-4 h-4 text-indigo-600" />
              Package & Billing Breakdown
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Contents:</span>
                <span className="font-semibold text-slate-900">{order.itemDescription}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Actual Weight:</span>
                <span className="font-mono text-slate-900">{order.actualWeightKg} kg</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Volumetric Weight (L×B×H ÷ 5000):</span>
                <span className="font-mono text-indigo-600 font-semibold">{order.volumetricWeightKg} kg</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Billable Weight:
                </span>
                <span className="font-mono text-indigo-700">{order.billableWeightKg} kg</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Total Charges</span>
                <span className="text-xl font-extrabold text-slate-900">${order.totalAmount.toFixed(2)}</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {order.paymentType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {isFailed && (
        <RescheduleModal
          orderId={order.id}
          trackingNumber={order.trackingNumber}
          isOpen={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          onSuccess={() => {
            fetchOrderDetails();
          }}
        />
      )}
    </div>
  );
}
