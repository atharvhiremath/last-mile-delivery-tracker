"use client";

import React, { useState, useEffect } from "react";
import {
  Calculator,
  Box,
  Scale,
  MapPin,
  CreditCard,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface RateBreakdown {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  weightBasis: "ACTUAL" | "VOLUMETRIC";
  weightBasisExplanation: string;
  pickupZoneName: string;
  dropZoneName: string;
  zoneScope: "INTRA_ZONE" | "INTER_ZONE";
  isSameZone: boolean;
  estimatedDistanceKm: number;
  rateCardName: string;
  orderType: "B2B" | "B2C";
  paymentType: "PREPAID" | "COD";
  baseCharge: number;
  additionalWeightKg: number;
  weightCharge: number;
  codCharge: number;
  taxAmount: number;
  totalAmount: number;
  formulaExplanation: {
    volumetricFormula: string;
    weightDecision: string;
    rateFormula: string;
    codFormula: string;
    totalFormula: string;
  };
}

interface RateCalculatorCardProps {
  onCalculated?: (breakdown: RateBreakdown) => void;
  initialValues?: {
    pickupPincode?: string;
    dropPincode?: string;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    actualWeightKg?: number;
    orderType?: "B2B" | "B2C";
    paymentType?: "PREPAID" | "COD";
    declaredValue?: number;
  };
}

export default function RateCalculatorCard({
  onCalculated,
  initialValues,
}: RateCalculatorCardProps) {
  const [pickupPincode, setPickupPincode] = useState(initialValues?.pickupPincode || "110001");
  const [dropPincode, setDropPincode] = useState(initialValues?.dropPincode || "110020");
  const [lengthCm, setLengthCm] = useState(initialValues?.lengthCm || 30);
  const [widthCm, setWidthCm] = useState(initialValues?.widthCm || 20);
  const [heightCm, setHeightCm] = useState(initialValues?.heightCm || 15);
  const [actualWeightKg, setActualWeightKg] = useState(initialValues?.actualWeightKg || 1.5);
  const [orderType, setOrderType] = useState<"B2B" | "B2C">(initialValues?.orderType || "B2C");
  const [paymentType, setPaymentType] = useState<"PREPAID" | "COD">(initialValues?.paymentType || "PREPAID");
  const [declaredValue, setDeclaredValue] = useState(initialValues?.declaredValue || 1500);

  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<RateBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live volumetric preview
  const liveVolumetric = Math.round(((lengthCm * widthCm * heightCm) / 5000) * 100) / 100;
  const liveBillable = Math.max(actualWeightKg, liveVolumetric);

  const calculateRates = async () => {
    setLoading(true);
    setError(null);
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
      if (!res.ok) {
        throw new Error(data.error || "Calculation failed.");
      }

      setBreakdown(data.breakdown);
      if (onCalculated) {
        onCalculated(data.breakdown);
      }
    } catch (err: any) {
      setError(err.message || "Failed to calculate quote.");
      setBreakdown(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRates();
  }, [pickupPincode, dropPincode, lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType, declaredValue]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Live Delivery Rate Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Volumetric billing • Zone auto-detection • COD surcharges</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
          Auto-Synced
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form */}
        <div className="lg:col-span-6 space-y-4">
          {/* Order Type & Payment Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Order Type</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrderType("B2C")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    orderType === "B2C" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  B2C Retail
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("B2B")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    orderType === "B2B" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  B2B Bulk
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentType("PREPAID")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    paymentType === "PREPAID" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Prepaid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("COD")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    paymentType === "COD" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  COD
                </button>
              </div>
            </div>
          </div>

          {/* Pickup & Drop Pincodes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Pickup Pincode
              </label>
              <input
                type="text"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                placeholder="e.g. 110001"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Drop Pincode
              </label>
              <input
                type="text"
                value={dropPincode}
                onChange={(e) => setDropPincode(e.target.value)}
                placeholder="e.g. 110020"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Package Dimensions L x W x H */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Box className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Dimensions (L × W × H in cm)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Volumetric Divisor: 5000</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  min="1"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  placeholder="L"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="block text-[10px] text-center text-slate-400 mt-0.5">Length (cm)</span>
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  placeholder="W"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="block text-[10px] text-center text-slate-400 mt-0.5">Width (cm)</span>
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  placeholder="H"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="block text-[10px] text-center text-slate-400 mt-0.5">Height (cm)</span>
              </div>
            </div>
          </div>

          {/* Actual Weight & Declared Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Actual Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={actualWeightKg}
                onChange={(e) => setActualWeightKg(Number(e.target.value))}
                placeholder="1.0"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Declared Value ($)
              </label>
              <input
                type="number"
                min="0"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(Number(e.target.value))}
                placeholder="1000"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Rate Quote</span>
              {breakdown && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {breakdown.zoneScope === "INTRA_ZONE" ? "Intra-Zone" : "Inter-Zone"}
                </span>
              )}
            </div>

            {error ? (
              <div className="p-4 rounded-xl bg-rose-900/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : breakdown ? (
              <div className="space-y-4">
                {/* Total Price Display */}
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-black text-white tracking-tight">
                    ${breakdown.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 text-right">
                    <span>Includes base & weight charges</span>
                    {breakdown.codCharge > 0 && <span> + COD surcharge</span>}
                  </div>
                </div>

                {/* Weight Comparison Card */}
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Actual Weight:</span>
                    <span className="font-mono">{breakdown.actualWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Volumetric Weight (L×B×H ÷ 5000):</span>
                    <span className="font-mono text-indigo-300 font-semibold">{breakdown.volumetricWeightKg} kg</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-700 flex justify-between font-bold text-white">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Billable Weight:
                    </span>
                    <span className="font-mono text-emerald-400">{breakdown.billableWeightKg} kg ({breakdown.weightBasis})</span>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Freight ({breakdown.rateCardName}):</span>
                    <span className="font-mono">${breakdown.baseCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Additional Weight ({breakdown.additionalWeightKg} kg):</span>
                    <span className="font-mono">${breakdown.weightCharge.toFixed(2)}</span>
                  </div>
                  {breakdown.codCharge > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>COD Surcharge:</span>
                      <span className="font-mono">${breakdown.codCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Detected Route:</span>
                    <span className="font-medium text-slate-200">
                      {breakdown.pickupZoneName} → {breakdown.dropZoneName} ({breakdown.estimatedDistanceKm} km)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">Calculating instant shipping rates...</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Formula: Rate = BaseRate + (max(Actual, Volumetric) - BaseWeight) × PerKgRate
          </div>
        </div>
      </div>
    </div>
  );
}
