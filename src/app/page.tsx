"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  Search,
  ArrowRight,
  ShieldCheck,
  Calculator,
  MapPin,
  Clock,
  RotateCcw,
  Zap,
  CheckCircle2,
  Package,
  Layers,
} from "lucide-react";
import RateCalculatorCard from "@/components/RateCalculatorCard";

export default function LandingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const router = useRouter();

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim().toUpperCase()}`);
    }
  };

  const sampleTrackings = [
    { num: "LMD-2026-10001", label: "Delivered (Intra-Zone B2C)" },
    { num: "LMD-2026-10002", label: "Out for Delivery (COD Active)" },
    { num: "LMD-2026-10003", label: "Failed (Ready to Reschedule)" },
    { num: "LMD-2026-10004", label: "Placed (B2B Bulk Freight)" },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Production Last-Mile Delivery Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Intelligent Dispatch, <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
              Dynamic Rates & Live Tracking
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Enterprise-grade last-mile logistics engine featuring volumetric billing, geometric zone detection, nearest-agent auto-assignment, and customer failure recovery.
          </p>

          {/* Quick Track Search Input */}
          <div className="max-w-xl mx-auto pt-2">
            <form onSubmit={handleTrackSubmit} className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-slate-800/90 border border-slate-700 p-1.5">
              <div className="pl-4 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter Tracking Number (e.g. LMD-2026-10002)..."
                className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Track</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Sample Tracking Badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Try Sample Orders:</span>
              {sampleTrackings.map((sample) => (
                <button
                  key={sample.num}
                  type="button"
                  onClick={() => router.push(`/track/${sample.num}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 font-mono text-[11px] transition"
                >
                  {sample.num} ({sample.label.split(" ")[0]})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Role Navigation Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Role Portals</h2>
          <p className="text-2xl font-bold text-slate-900">Explore Dedicated Workspaces</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Portal */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Customer Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Calculate live quotes, book B2B/B2C shipments, view step-by-step tracking timelines, and reschedule failed deliveries seamlessly.
              </p>
            </div>
            <Link
              href="/customer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-3 border-t border-slate-100"
            >
              <span>Enter Customer Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Delivery Agent Portal */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Delivery Agent Mobile App</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Mobile-first driver workdeck with availability toggle, simulated GPS telemetry, pickup/delivery status updates, and failed attempt reason logging.
              </p>
            </div>
            <Link
              href="/agent"
              className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 hover:text-amber-700 pt-3 border-t border-slate-100"
            >
              <span>Launch Driver Workdeck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Admin Console */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Admin Operations Console</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Master dashboard for order management, intelligent 1-click auto-assignment, dynamic rate card configuration, zone/pincode matrices, and status overrides.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-3 border-t border-slate-100"
            >
              <span>Open Operations Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Rate Calculator Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Real-time Quotation</h2>
          <p className="text-2xl font-bold text-slate-900">Test The Dynamic Rate Calculation Engine</p>
          <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1">
            See how volumetric dimensions, zone scopes, and COD surcharges are calculated automatically with no hardcoded rates.
          </p>
        </div>

        <RateCalculatorCard />
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800">
          <div className="max-w-3xl mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Technical Design</h2>
            <p className="text-3xl font-black tracking-tight text-white">Built for High-Scale Last-Mile Logistics</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-white text-base">Volumetric Weight Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies standard (L×B×H)/5000 volumetric logic and bills on max(actual, volumetric). Protects revenue on bulky, low-density cargo.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-white text-base">Dynamic Rate Cards</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero hardcoding. Admins configure Intra/Inter zone base rates, incremental per-kg rates, and COD surcharges separately for B2B vs B2C.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-white text-base">Nearest Agent Auto-Assign</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates Haversine distance, prioritizes operating zones, filters active capacities, and balances delivery loads across available fleet.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="font-bold text-white text-base">Immutable Event Log</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Event-sourced status transitions recorded with non-destructive timestamps, actor IDs, roles, geo-coordinates, and override notes.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                05
              </div>
              <h3 className="font-bold text-white text-base">Failure Recovery & Reschedule</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Flags delivery failure with mandatory reason codes, frees driver capacity, alerts customer via email/SMS, and automatically reassigns on reschedule.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                06
              </div>
              <h3 className="font-bold text-white text-base">Multi-Channel Notifications</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configurable SMTP and SMS alert engine with in-app simulation logs and customer email delivery notices.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
