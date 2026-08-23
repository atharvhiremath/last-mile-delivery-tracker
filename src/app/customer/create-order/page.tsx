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

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+86", label: "🇨🇳 +86" },
];

export default function CreateOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Sender details
  const [senderName, setSenderName] = useState(user?.name || "TechHub Electronics");
  const [senderCountryCode, setSenderCountryCode] = useState("+91");
  const [senderPhone, setSenderPhone] = useState("98110 00001");
  const [pickupAddress, setPickupAddress] = useState("Shop 14, Inner Circle, Connaught Place");
  const [pickupPincode, setPickupPincode] = useState("110001");
  const [pickupCity, setPickupCity] = useState("New Delhi");

  // Recipient details
  const [recipientName, setRecipientName] = useState("Aarav Gupta");
  const [recipientCountryCode, setRecipientCountryCode] = useState("+91");
  const [recipientPhone, setRecipientPhone] = useState("98220 99999");
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

      if (res.ok) {
        const data = await res.json();
        setRateBreakdown(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading]);

  // Debounced quote updates on parameter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRateQuote();
    }, 300);
    return () => clearTimeout(timer);
  }, [pickupPincode, dropPincode, lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType, declaredValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrderSubmitting(true);

    const fullSenderPhone = `${senderCountryCode} ${senderPhone.trim()}`;
    const fullRecipientPhone = `${recipientCountryCode} ${recipientPhone.trim()}`;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderPhone: fullSenderPhone,
          pickupAddress,
          pickupPincode,
          pickupCity,
          recipientName,
          recipientPhone: fullRecipientPhone,
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
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Create Delivery Order</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated volumetric weight calculation • Dynamic zone rate lookup
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Order Specifications */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
              Service & Payment Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Order Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOrderType("B2C")}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      orderType === "B2C" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    B2C Retail
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("B2B")}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      orderType === "B2B" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    B2B Freight
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentType("PREPAID")}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      paymentType === "PREPAID" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Prepaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("COD")}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      paymentType === "COD" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Cash on Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Pickup & Drop Addresses */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
              Addresses & Locations
            </h2>

            {/* Sender Details */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Sender & Pickup Address
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Sender Name</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Sender Phone</label>
                  <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
                    <select
                      value={senderCountryCode}
                      onChange={(e) => setSenderCountryCode(e.target.value)}
                      className="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-white font-semibold border-r border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer flex-shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full min-w-0 px-3 py-2 text-xs bg-transparent dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Pickup Address</label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Pickup Pincode</label>
                  <input
                    type="text"
                    required
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                    placeholder="110001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Recipient & Delivery Address
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Recipient Phone</label>
                  <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
                    <select
                      value={recipientCountryCode}
                      onChange={(e) => setRecipientCountryCode(e.target.value)}
                      className="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-white font-semibold border-r border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer flex-shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full min-w-0 px-3 py-2 text-xs bg-transparent dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Delivery Address</label>
                <input
                  type="text"
                  required
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Drop Pincode</label>
                  <input
                    type="text"
                    required
                    value={dropPincode}
                    onChange={(e) => setDropPincode(e.target.value)}
                    placeholder="110020"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={dropCity}
                    onChange={(e) => setDropCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Package Dimensions & Weight */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
              Package Dimensions & Actual Weight
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Width (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Physical Wt (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Package Contents / Items</label>
                <input
                  type="text"
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g. Garments, Electronics..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Declared Value ($)</label>
                <input
                  type="number"
                  min="0"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(Number(e.target.value))}
                  placeholder="For insurance / COD surcharge"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Summary & Auto Quote: 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 sticky top-24 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">Live Rate Quotation</h3>
              </div>
              {rateLoading && (
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">Calculating...</span>
              )}
            </div>

            {rateBreakdown ? (
              <div className="space-y-4 text-xs">
                {/* Weight Comparison Card */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Actual Physical Weight:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{rateBreakdown.actualWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Volumetric Weight (L×B×H÷5000):</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {rateBreakdown.volumetricWeightKg} kg
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-slate-900 dark:text-white text-sm">
                    <span>Billable Weight:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      {rateBreakdown.billableWeightKg} kg
                    </span>
                  </div>
                </div>

                {/* Zone & Route Detection */}
                <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Detected Route:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {rateBreakdown.pickupZone?.name} → {rateBreakdown.dropZone?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Zone Topology:</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      {rateBreakdown.zoneScope === "INTRA_ZONE" ? "Intra-Zone (Same Area)" : "Inter-Zone (Cross Sector)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Applied Rate Card:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{rateBreakdown.rateCardName}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Base Freight (Up to {rateBreakdown.breakdown?.baseWeightKg}kg):</span>
                    <span className="font-mono">${rateBreakdown.baseFreight?.toFixed(2)}</span>
                  </div>
                  {rateBreakdown.weightSurcharge > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Extra Weight ({rateBreakdown.breakdown?.extraWeightKg}kg @ ${rateBreakdown.breakdown?.perKgRate}/kg):</span>
                      <span className="font-mono">${rateBreakdown.weightSurcharge?.toFixed(2)}</span>
                    </div>
                  )}
                  {rateBreakdown.codSurcharge > 0 && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-300 font-medium">
                      <span>COD Cash Handling Surcharge:</span>
                      <span className="font-mono">${rateBreakdown.codSurcharge?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Applicable GST/Tax:</span>
                    <span className="font-mono">${rateBreakdown.taxAmount?.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-lg font-black text-slate-900 dark:text-white">
                    <span>Total Auto-Calculated:</span>
                    <span className="text-2xl text-indigo-600 dark:text-indigo-400 font-mono">
                      ${rateBreakdown.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Enter valid pincodes and package dimensions to calculate dynamic quote.
              </div>
            )}

            <button
              type="submit"
              disabled={orderSubmitting || !rateBreakdown}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Truck className="w-5 h-5" />
              <span>{orderSubmitting ? "Generating & Assigning..." : "Confirm & Book Delivery"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
