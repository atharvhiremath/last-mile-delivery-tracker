"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calculator,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function AdminRateCardsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rateCards, setRateCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Rate Card Form State
  const [newName, setNewName] = useState("");
  const [newOrderType, setNewOrderType] = useState<"B2B" | "B2C">("B2C");
  const [newZoneScope, setNewZoneScope] = useState<"INTRA_ZONE" | "INTER_ZONE">("INTRA_ZONE");
  const [newBaseWeight, setNewBaseWeight] = useState(0.5);
  const [newBaseRate, setNewBaseRate] = useState(40.0);
  const [newPerKgRate, setNewPerKgRate] = useState(15.0);
  const [newCodFixed, setNewCodFixed] = useState(20.0);
  const [newCodPercent, setNewCodPercent] = useState(1.5);
  const [newMinCod, setNewMinCod] = useState(20.0);

  const fetchRateCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rate-cards");
      if (res.ok) {
        const data = await res.json();
        setRateCards(data.rateCards || []);
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
        fetchRateCards();
      }
    }
  }, [user, authLoading]);

  // Create Rate Card
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/rate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          orderType: newOrderType,
          zoneScope: newZoneScope,
          baseWeightKg: Number(newBaseWeight),
          baseRate: Number(newBaseRate),
          perKgRate: Number(newPerKgRate),
          codSurchargeFixed: Number(newCodFixed),
          codSurchargePercent: Number(newCodPercent),
          minCodSurcharge: Number(newMinCod),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create rate card.");
      }

      setShowCreateModal(false);
      setActionSuccess("New rate card created successfully.");
      await fetchRateCards();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Update Rate Card
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setError(null);
    try {
      const res = await fetch("/api/rate-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCard.id,
          name: editingCard.name,
          baseWeightKg: Number(editingCard.baseWeightKg),
          baseRate: Number(editingCard.baseRate),
          perKgRate: Number(editingCard.perKgRate),
          codSurchargeFixed: Number(editingCard.codSurchargeFixed),
          codSurchargePercent: Number(editingCard.codSurchargePercent),
          minCodSurcharge: Number(editingCard.minCodSurcharge),
          isActive: editingCard.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update rate card.");
      }

      setEditingCard(null);
      setActionSuccess("Rate card updated successfully.");
      await fetchRateCards();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-indigo-400" />
            Pricing Configuration Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Dynamic Rate Cards</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Intra-zone & Inter-zone rates for B2B vs B2C, base weights, and COD surcharges without code changes
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Rate Card</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-xs text-emerald-600 font-bold">Dismiss</button>
        </div>
      )}

      {/* Rate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-xs text-slate-500">Loading rate cards...</div>
        ) : (
          rateCards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-indigo-200 transition"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{card.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        card.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {card.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                    {card.orderType} • {card.zoneScope.replace(/_/g, " ")}
                  </div>
                </div>

                <button
                  onClick={() => setEditingCard({ ...card })}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Base Pricing</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">${card.baseRate.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">Up to {card.baseWeightKg} kg</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Incremental Rate</span>
                  <div className="text-base font-bold text-indigo-600 mt-0.5">${card.perKgRate.toFixed(2)} / kg</div>
                  <div className="text-[11px] text-slate-500">Beyond base weight</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">COD Surcharge Policy</span>
                  <div className="text-xs font-medium text-slate-800 mt-1">
                    Fixed: <strong>${card.codSurchargeFixed.toFixed(2)}</strong> • Percent: <strong>{card.codSurchargePercent}%</strong> • Min: <strong>${card.minCodSurcharge.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Rate Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Edit Rate Card</h3>
              <button onClick={() => setEditingCard(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rate Card Name</label>
                <input
                  type="text"
                  required
                  value={editingCard.name}
                  onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingCard.baseWeightKg}
                    onChange={(e) => setEditingCard({ ...editingCard, baseWeightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Rate ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingCard.baseRate}
                    onChange={(e) => setEditingCard({ ...editingCard, baseRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Per Kg Rate ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingCard.perKgRate}
                    onChange={(e) => setEditingCard({ ...editingCard, perKgRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">COD Fixed ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={editingCard.codSurchargeFixed}
                    onChange={(e) => setEditingCard({ ...editingCard, codSurchargeFixed: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">COD % Surcharge</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingCard.codSurchargePercent}
                    onChange={(e) => setEditingCard({ ...editingCard, codSurchargePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min COD Fee ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={editingCard.minCodSurcharge}
                    onChange={(e) => setEditingCard({ ...editingCard, minCodSurcharge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingCard.isActive}
                  onChange={(e) => setEditingCard({ ...editingCard, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-slate-800">
                  Rate Card Active in Quotation Engine
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Rate Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Create New Rate Card</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rate Card Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Express B2C Intra-Zone 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Type</label>
                  <select
                    value={newOrderType}
                    onChange={(e) => setNewOrderType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="B2C">B2C Retail</option>
                    <option value="B2B">B2B Bulk Freight</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zone Scope</label>
                  <select
                    value={newZoneScope}
                    onChange={(e) => setNewZoneScope(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="INTRA_ZONE">Intra-Zone (Same Zone)</option>
                    <option value="INTER_ZONE">Inter-Zone (Cross Zone)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newBaseWeight}
                    onChange={(e) => setNewBaseWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Rate ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newBaseRate}
                    onChange={(e) => setNewBaseRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Per Kg Rate ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newPerKgRate}
                    onChange={(e) => setNewPerKgRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">COD Fixed ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={newCodFixed}
                    onChange={(e) => setNewCodFixed(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">COD %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCodPercent}
                    onChange={(e) => setNewCodPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min COD ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={newMinCod}
                    onChange={(e) => setNewMinCod(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow"
                >
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
