"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Truck,
  MapPin,
  Power,
  CheckCircle2,
  AlertCircle,
  Compass,
  Phone,
  Package,
  Layers,
  Star,
} from "lucide-react";

export default function AdminAgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [agents, setAgents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAgentsAndZones = async () => {
    setLoading(true);
    try {
      const [agRes, znRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/zones"),
      ]);
      if (agRes.ok) {
        const agData = await agRes.json();
        setAgents(agData.agents || []);
      }
      if (znRes.ok) {
        const znData = await znRes.json();
        setZones(znData.zones || []);
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
        fetchAgentsAndZones();
      }
    }
  }, [user, authLoading]);

  const toggleAgentAvailability = async (agentId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          isAvailable: !currentStatus,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Agent availability toggled.`);
        await fetchAgentsAndZones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateAgentZone = async (agentId: string, operatingZoneId: string) => {
    try {
      const res = await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          operatingZoneId: operatingZoneId || null,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Agent operating zone re-assigned.`);
        await fetchAgentsAndZones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-400" />
            Fleet Dispatch Monitoring
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Delivery Fleet & Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time agent availability, load balancing, vehicle types, and live GPS coordinate monitor
          </p>
        </div>

        <button onClick={fetchAgentsAndZones} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition">
          ↻ Refresh Fleet
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

      {/* Agents Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-500">Loading delivery fleet telemetry...</div>
        ) : agents.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-500">No delivery agents registered yet.</div>
        ) : (
          agents.map((agent) => {
            const hasActiveOrders = (agent.assignedOrders?.length || 0) > 0;

            return (
              <div
                key={agent.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-indigo-200 transition"
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-black text-sm">
                      {agent.user?.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{agent.user?.name}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {agent.user?.phone}
                      </div>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {agent.rating.toFixed(1)}
                  </span>
                </div>

                {/* Vehicle & Zone Info */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {agent.vehicleType} • {agent.vehicleNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operating Zone:</span>
                    <span className="font-medium text-indigo-700">
                      {agent.operatingZone?.name || "All Zones (General)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <span className="font-mono text-slate-700">
                      {agent.currentLatitude.toFixed(4)}, {agent.currentLongitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Capacity & Load Bar */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Current Active Load</span>
                    <span className="text-indigo-600 font-mono">
                      {agent.currentActiveLoad} / {agent.maxCapacity} Active
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        agent.currentActiveLoad >= agent.maxCapacity
                          ? "bg-rose-500"
                          : agent.currentActiveLoad > 0
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (agent.currentActiveLoad / agent.maxCapacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Active Deliveries Quick List */}
                {hasActiveOrders && (
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Orders:</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.assignedOrders.map((o: any) => (
                        <Link
                          key={o.id}
                          href={`/track/${o.trackingNumber}`}
                          className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10px] border border-indigo-200"
                        >
                          #{o.trackingNumber} ({o.status})
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleAgentAvailability(agent.id, agent.isAvailable)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      agent.isAvailable
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{agent.isAvailable ? "Online" : "Offline"}</span>
                  </button>

                  <select
                    value={agent.operatingZoneId || ""}
                    onChange={(e) => updateAgentZone(agent.id, e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none"
                  >
                    <option value="">No Specific Zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
