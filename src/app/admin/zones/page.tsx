"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Plus,
  Compass,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Building,
} from "lucide-react";

export default function AdminZonesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Zone Form
  const [zoneName, setZoneName] = useState("");
  const [zoneCode, setZoneCode] = useState("");
  const [zoneDesc, setZoneDesc] = useState("");
  const [centerLat, setCenterLat] = useState(28.6139);
  const [centerLng, setCenterLng] = useState(77.2090);

  // New Pincode Form
  const [pincode, setPincode] = useState("");
  const [areaName, setAreaName] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [state, setState] = useState("Delhi");
  const [pinLat, setPinLat] = useState(28.6139);
  const [pinLng, setPinLng] = useState(77.2090);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zones");
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
        if (data.zones?.length && !selectedZoneId) {
          setSelectedZoneId(data.zones[0].id);
        }
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
        fetchZones();
      }
    }
  }, [user, authLoading]);

  // Create Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: zoneName,
          code: zoneCode,
          description: zoneDesc,
          centerLat: Number(centerLat),
          centerLng: Number(centerLng),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create zone.");

      setShowZoneModal(false);
      setActionSuccess(`Zone ${data.zone.name} created successfully.`);
      await fetchZones();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add Pincode Mapping
  const handleAddPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneId) return;

    try {
      const res = await fetch("/api/zones/pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode,
          areaName,
          city,
          state,
          zoneId: selectedZoneId,
          latitude: Number(pinLat),
          longitude: Number(pinLng),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add pincode.");

      setShowPincodeModal(false);
      setPincode("");
      setAreaName("");
      setActionSuccess(`Pincode ${pincode} mapped to zone.`);
      await fetchZones();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-400" />
            Territory & Zone Topology
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Delivery Zones & Pincode Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">
            Define logistics zones, centroid coordinates, and associate postal codes for automated zone resolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPincodeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Map Area Pincode</span>
          </button>
          <button
            onClick={() => setShowZoneModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Zone</span>
          </button>
        </div>
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

      {/* Main Zones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Zones List: 4 cols */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">Operational Zones</div>
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading zones...</div>
          ) : (
            zones.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`w-full p-4 rounded-2xl text-left transition border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-800 shadow-md"
                      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{zone.name}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-100 text-slate-600"}`}>
                      {zone.code}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                    Centroid: {zone.centerLat.toFixed(4)}, {zone.centerLng.toFixed(4)}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex justify-between text-[11px]">
                    <span className={isSelected ? "text-indigo-300" : "text-indigo-600 font-medium"}>
                      {zone.pincodes?.length || 0} Pincodes Mapped
                    </span>
                    <span className={isSelected ? "text-amber-300" : "text-slate-500"}>
                      {zone.agents?.length || 0} Agents
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Pincodes Matrix: 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          {activeZone ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-lg">{activeZone.name}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                      {activeZone.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{activeZone.description || "Operational sector hub."}</p>
                </div>

                <button
                  onClick={() => setShowPincodeModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  + Add Pincode
                </button>
              </div>

              {/* Pincodes Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Pincode</th>
                      <th className="py-2.5 px-3">Area Name</th>
                      <th className="py-2.5 px-3">City / State</th>
                      <th className="py-2.5 px-3">Geocode (Lat, Lng)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeZone.pincodes?.map((pin: any) => (
                      <tr key={pin.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">{pin.pincode}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{pin.areaName}</td>
                        <td className="py-3 px-3 text-slate-500">{pin.city}, {pin.state}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">Select a zone to view associated areas.</div>
          )}
        </div>
      </div>

      {/* Create Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Create Operational Zone</h3>
              <button onClick={() => setShowZoneModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. South Tech Corridor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unique Zone Code</label>
                <input
                  type="text"
                  required
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value)}
                  placeholder="e.g. ZONE-SOUTH-TECH"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  placeholder="Zone coverage area summary..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Center Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={centerLat}
                    onChange={(e) => setCenterLat(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Center Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={centerLng}
                    onChange={(e) => setCenterLng(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Pincode Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Map Area Pincode to Zone</h3>
              <button onClick={() => setShowPincodeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPincode} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign to Zone</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 110017"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Area / Locality Name</label>
                  <input
                    type="text"
                    required
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="e.g. Saket District Center"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPincodeModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
