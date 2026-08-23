"use client";

import React, { useState } from "react";
import { Calendar, Clock, RotateCcw, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface RescheduleModalProps {
  orderId: string;
  trackingNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({
  orderId,
  trackingNumber,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  // Default to tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  const [rescheduledDate, setRescheduledDate] = useState(minDateStr);
  const [rescheduledSlot, setRescheduledSlot] = useState("MORNING (09:00 AM - 01:00 PM)");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rescheduledDate: new Date(rescheduledDate).toISOString(),
          rescheduledSlot,
          deliveryNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reschedule order.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit reschedule request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Reschedule Delivery Attempt</h3>
            <p className="text-xs text-slate-500 font-mono">Order #{trackingNumber}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
          The previous delivery attempt was unsuccessful. Please select your preferred date and time window. We will automatically re-assign an agent for your slot.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> New Delivery Date
            </label>
            <input
              type="date"
              min={minDateStr}
              value={rescheduledDate}
              onChange={(e) => setRescheduledDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" /> Preferred Time Slot
            </label>
            <select
              value={rescheduledSlot}
              onChange={(e) => setRescheduledSlot(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="MORNING (09:00 AM - 01:00 PM)">Morning Slot (09:00 AM - 01:00 PM)</option>
              <option value="AFTERNOON (01:00 PM - 05:00 PM)">Afternoon Slot (01:00 PM - 05:00 PM)</option>
              <option value="EVENING (05:00 PM - 08:30 PM)">Evening Slot (05:00 PM - 08:30 PM)</option>
              <option value="ANYTIME (09:00 AM - 08:00 PM)">Anytime during working hours</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Updated Delivery Instructions / Landmarks (Optional)
            </label>
            <textarea
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Leave with neighbor at flat 301 if unavailable, or call alternative number..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow transition flex items-center gap-1.5"
            >
              {loading ? "Confirming..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
