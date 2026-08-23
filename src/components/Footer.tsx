import React from "react";
import Link from "next/link";
import { Truck, Shield, Clock, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-base">Last-Mile Tracker</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent Last-Mile Logistics Management Engine with dynamic rate cards, volumetric billing, smart dispatch, and immutable tracking history.
            </p>
          </div>

          {/* Core Highlights */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400" /> Volumetric Weight Engine</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> Intra/Inter Zone Detection</li>
              <li className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-indigo-400" /> Nearest Agent Auto-Assign</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-indigo-400" /> Immutable Status History</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Quick Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-white transition">Public Tracking</Link></li>
              <li><Link href="/customer" className="hover:text-white transition">Customer Dashboard</Link></li>
              <li><Link href="/agent" className="hover:text-white transition">Delivery Agent View</Link></li>
              <li><Link href="/admin/orders" className="hover:text-white transition">Admin Operations Console</Link></li>
            </ul>
          </div>

          {/* System Spec */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Technical Spec</h4>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-xs font-mono text-slate-400">
              <div>Next.js 14 App Router</div>
              <div>Prisma Relational ORM</div>
              <div>Formula: (L×B×H) ÷ 5000</div>
              <div>RBAC: Customer / Agent / Admin</div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Last-Mile Delivery Tracker. Production assignment submission.
        </div>
      </div>
    </footer>
  );
}
