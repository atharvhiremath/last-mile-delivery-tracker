"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  User,
  Shield,
  MapPin,
} from "lucide-react";

export interface StatusHistoryItem {
  id?: string;
  status: string;
  previousStatus?: string | null;
  actorRole: string;
  actorName: string;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: string | Date;
}

interface OrderTimelineProps {
  currentStatus: string;
  history: StatusHistoryItem[];
  failedReason?: string | null;
  rescheduledDate?: string | Date | null;
  rescheduledSlot?: string | null;
}

const ORDER_STEPS = [
  { key: "PLACED", label: "Order Placed" },
  { key: "ASSIGNED", label: "Agent Assigned" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function OrderTimeline({
  currentStatus,
  history,
  failedReason,
  rescheduledDate,
  rescheduledSlot,
}: OrderTimelineProps) {
  const getStepIndex = (status: string) => {
    switch (status) {
      case "PLACED":
        return 0;
      case "ASSIGNED":
        return 1;
      case "PICKED_UP":
        return 2;
      case "IN_TRANSIT":
        return 3;
      case "OUT_FOR_DELIVERY":
        return 4;
      case "DELIVERED":
        return 5;
      case "FAILED":
        return 4; // Failed during out for delivery
      case "RESCHEDULED":
        return 1; // Re-queued for assignment/delivery
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isFailed = currentStatus === "FAILED";
  const isRescheduled = currentStatus === "RESCHEDULED";
  const isDelivered = currentStatus === "DELIVERED";

  return (
    <div className="space-y-6">
      {/* Visual Step Progress Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center justify-between">
          <span>Live Delivery Progress</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isDelivered
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : isFailed
                ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                : isRescheduled
                ? "bg-purple-100 text-purple-800 border border-purple-300"
                : "bg-indigo-100 text-indigo-800 border border-indigo-300"
            }`}
          >
            {currentStatus.replace(/_/g, " ")}
          </span>
        </h3>

        {/* Failed Alert Banner */}
        {isFailed && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Delivery Attempt Failed</div>
              <div className="text-xs text-rose-700 mt-1">
                Reason: {failedReason || "Customer unavailable / Address issue"}. You can reschedule this order for a new delivery attempt.
              </div>
            </div>
          </div>
        )}

        {/* Rescheduled Alert Banner */}
        {isRescheduled && (
          <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Delivery Rescheduled by Customer</div>
              <div className="text-xs text-purple-700 mt-1">
                Scheduled for: <strong>{rescheduledDate ? new Date(rescheduledDate).toLocaleDateString() : "Next Available Day"}</strong> ({rescheduledSlot || "Standard Morning Slot"}).
              </div>
            </div>
          </div>
        )}

        {/* Stepper Nodes */}
        <div className="relative">
          <div className="hidden sm:flex items-center justify-between">
            {ORDER_STEPS.map((step, idx) => {
              const isCompleted = isDelivered ? true : idx <= currentIndex && !isFailed;
              const isCurrent = idx === currentIndex && !isFailed;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative group">
                  {/* Horizontal connecting line */}
                  {idx < ORDER_STEPS.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 right-[-50%] h-1 z-0 transition-colors duration-500 ${
                        idx < currentIndex ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Node icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all shadow-sm ${
                      isCompleted
                        ? "bg-indigo-600 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse"
                        : isFailed && idx === currentIndex
                        ? "bg-rose-600 text-white ring-4 ring-rose-200"
                        : "bg-slate-100 text-slate-400 border border-slate-300"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isFailed && idx === currentIndex ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <span
                    className={`mt-2 text-xs font-medium text-center transition ${
                      isCompleted || isCurrent ? "text-slate-900 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Immutable Event History Timeline */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Immutable Audit Trail & Status History
          </h3>
          <span className="text-xs text-slate-500">{history.length} events logged</span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {history.map((event, idx) => {
            const date = new Date(event.timestamp);
            const isLatest = idx === 0;

            return (
              <div key={event.id || idx} className="relative group">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                    isLatest
                      ? event.status === "FAILED"
                        ? "bg-rose-500 ring-4 ring-rose-100"
                        : event.status === "DELIVERED"
                        ? "bg-emerald-500 ring-4 ring-emerald-100"
                        : "bg-indigo-600 ring-4 ring-indigo-100"
                      : "bg-slate-400"
                  }`}
                />

                <div className="bg-slate-50 hover:bg-slate-100/80 transition p-4 rounded-xl border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          event.status === "FAILED"
                            ? "bg-rose-500"
                            : event.status === "DELIVERED"
                            ? "bg-emerald-500"
                            : "bg-indigo-600"
                        }`}
                      />
                      {event.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>

                  {/* Actor Details */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 mb-2">
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                      {event.actorRole === "ADMIN" && <Shield className="w-3 h-3 text-indigo-600" />}
                      {event.actorRole === "AGENT" && <Truck className="w-3 h-3 text-amber-600" />}
                      {event.actorRole === "CUSTOMER" && <User className="w-3 h-3 text-blue-600" />}
                      Actor: {event.actorName} ({event.actorRole})
                    </span>
                    {event.latitude && event.longitude && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>

                  {/* Notes / Explanation */}
                  {event.notes && (
                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
