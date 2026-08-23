"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  MapPin,
  Box,
  Scale,
  CreditCard,
  Truck,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from "lucide-react";

export default function CreateOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Sender details
  const [senderName, setSenderName] = useState(user?.name || "TechHub Electronics");
  const [senderPhone, setSenderPhone] = useState(user?.phone || "+91 98110 00001");
  const [pickupAddress, setPickupAddress] = useState("Shop 14, Inner Circle, Connaught Place");
  const [pickupPincode, setPickupPincode] = useState("110001");
  const [pickupCity, setPickupCity] = useState("New Delhi");

  // Recipient details
  const [recipientName, setRecipientName] = useState("Aarav Gupta");
  const [recipientPhone, setRecipientPhone] = useState("+91 98220 99999");
  const [dropAddress, setDropAddress] = useState("Flat 204, Lotus Tower, Okhla Industrial Area");
  const [dropPincode, setDropPincode] = useState("110020");
  const [dropCity, setDropCity] = useState("New Delhi");

  // Package specs
  const [lengthCm, setLengthCm] = useState(30);
  const [widthCm, setWidthCm] = useState(25);
  const [heightCm, setHeightCm] = useState(15);
  const [actualWeightKg, setActualWeightKg] = useState(1.2);
  const [itemDescription, setItemDescription] = useState("Smart Home Hub & Accessories");
  const [declaredValue, setDeclaredValue] = useState(3500);

  // Logistics parameters
  const [orderType, setOrderType] = useState<"B2B" | "B2C">("B2C");
  const [paymentType, setPaymentType] = useState<"PREPAID" | "COD">("PREPAID");
  const [deliveryNotes, setDeliveryNotes] = useState("Ring doorbell upon arrival.");

  // Rate quotation state
  const [rateBreakdown, setRateBreakdown] = useState<any | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto calculate quote on change
  const fetchRateQuote = async () => {
    if (!pickupPincode || !dropPincode || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0 || actualWeightKg <= 0) {
      return;
    }
    setRateLoading(true);
    try {
      const res = await fetch("/api/rates/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupPincode,
          dropPincode,
          lengthCm: Number(lengthCm),
          widthCm: Number(widthCm),
          heightCm: Number(heightCm),
          actualWeightKg: Number(actualWeightKg),
          orderType,
          paymentType,
          declaredValue: Number(declaredValue) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRateBreakdown(data.breakdown);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    fetchRateQuote();
  }, [pickupPincode, dropPincode, lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType, declaredValue]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderPhone,
          pickupAddress,
          pickupPincode,
          pickupCity,
          recipientName,
          recipientPhone,
          dropAddress,
          dropPincode,
          dropCity,
          lengthCm: Number(lengthCm),
          widthCm: Number(widthCm),
          heightCm: Number(heightCm),
          actualWeightKg: Number(actualWeightKg),
          orderType,
          paymentType,
          itemDescription,
          declaredValue: Number(declaredValue) || 0,
          deliveryNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order.");
      }

      // Navigate to live tracking page
      router.push(`/track/${data.order.trackingNumber}`);
    } catch (err: any) {
      setError(err.message || "Failed to create delivery order.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customer"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Delivery Order</h1>
            <p className="text-xs text-slate-500">
              Automated volumetric weight calculation • Dynamic zone rate lookup
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Order Configuration */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                Order Configuration
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setOrderType("B2C")}
                      className={`py-2 text-xs font-bold rounded-lg transition ${
                        orderType === "B2C" ? "bg-white text-indigo-600 shadow" : "text-slate-600"
                      }`}
                    >
                      B2C Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("B2B")}
                      className={`py-2 text-xs font-bold rounded-lg transition ${
                        orderType === "B2B" ? "bg-white text-indigo-600 shadow" : "text-slate-600"
                      }`}
                    >
                      B2B Freight
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaymentType("PREPAID")}
                      className={`py-2 text-xs font-bold rounded-lg transition ${
                        paymentType === "PREPAID" ? "bg-white text-indigo-600 shadow" : "text-slate-600"
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType("COD")}
                      className={`py-2 text-xs font-bold rounded-lg transition ${
                        paymentType === "COD" ? "bg-white text-indigo-600 shadow" : "text-slate-600"
                      }`}
                    >
                      Cash on Delivery
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Pickup & Drop Addresses */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                Addresses & Locations
              </h2>

              {/* Sender Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Sender & Pickup Address
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Sender Name</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Sender Phone</label>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Pickup Address</label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Pickup Pincode</label>
                    <input
                      type="text"
                      required
                      value={pickupPincode}
                      onChange={(e) => setPickupPincode(e.target.value)}
                      placeholder="110001"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" /> Recipient & Delivery Address
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Recipient Phone</label>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Drop Pincode</label>
                    <input
                      type="text"
                      required
                      value={dropPincode}
                      onChange={(e) => setDropPincode(e.target.value)}
                      placeholder="110020"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={dropCity}
                      onChange={(e) => setDropCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Package Specifications */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                Package Dimensions & Weight
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g. Electronic gadgets, books, machine parts..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Dimensions (cm)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Volumetric Divisor: 5000</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="number"
                      min="1"
                      required
                      value={lengthCm}
                      onChange={(e) => setLengthCm(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Length (cm)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      required
                      value={widthCm}
                      onChange={(e) => setWidthCm(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Width (cm)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      required
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Height (cm)</span>
                  </div>
                </div>
              </div>

              {/* Actual Weight & Declared Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Declared Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Delivery Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Gate code, landmark, calling preferences..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: 5 Columns Quotation & Checkout Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">Charge Breakdown</h3>
                </div>
                {rateBreakdown && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {rateBreakdown.zoneScope === "INTRA_ZONE" ? "Intra-Zone" : "Inter-Zone"}
                  </span>
                )}
              </div>

              {rateLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Computing real-time rate card...</div>
              ) : rateBreakdown ? (
                <div className="space-y-5">
                  {/* Total Amount */}
                  <div className="flex items-baseline justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Total Estimated Charge</span>
                      <div className="text-3xl font-black text-white">${rateBreakdown.totalAmount.toFixed(2)}</div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                      {paymentType}
                    </span>
                  </div>

                  {/* Weight Comparison */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Actual Weight:</span>
                      <span className="font-mono text-slate-200">{rateBreakdown.actualWeightKg} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Volumetric Weight:</span>
                      <span className="font-mono text-indigo-300 font-semibold">{rateBreakdown.volumetricWeightKg} kg</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Billable Weight:
                      </span>
                      <span className="font-mono text-emerald-400">{rateBreakdown.billableWeightKg} kg ({rateBreakdown.weightBasis})</span>
                    </div>
                  </div>

                  {/* Pricing Components */}
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Freight ({rateBreakdown.rateCardName}):</span>
                      <span className="font-mono">${rateBreakdown.baseCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Extra Weight ({rateBreakdown.additionalWeightKg} kg):</span>
                      <span className="font-mono">${rateBreakdown.weightCharge.toFixed(2)}</span>
                    </div>
                    {rateBreakdown.codCharge > 0 && (
                      <div className="flex justify-between text-amber-300 font-semibold">
                        <span>COD Cash Handling Surcharge:</span>
                        <span className="font-mono">${rateBreakdown.codCharge.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                      <span>Detected Route:</span>
                      <span className="font-medium text-slate-200 text-right">
                        {rateBreakdown.pickupZoneName} → {rateBreakdown.dropZoneName} ({rateBreakdown.estimatedDistanceKm} km)
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    <span>{orderSubmitting ? "Creating Shipment..." : "Confirm & Book Delivery"}</span>
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Fill in address pincodes and package dimensions to calculate charge.
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
