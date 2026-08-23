"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Navigation, Truck, Home } from "lucide-react";

interface LiveMapProps {
  pickupLat?: number;
  pickupLng?: number;
  pickupAddress?: string;
  dropLat?: number;
  dropLng?: number;
  dropAddress?: string;
  agentLat?: number;
  agentLng?: number;
  agentName?: string;
  vehicleType?: string;
}

export default function LiveMap({
  pickupLat = 28.6315,
  pickupLng = 77.2167,
  pickupAddress = "Pickup Point",
  dropLat = 28.5298,
  dropLng = 77.2711,
  dropAddress = "Drop Destination",
  agentLat,
  agentLng,
  agentName,
  vehicleType = "BIKE",
}: LiveMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  // Compute map bounds center
  const centerLat = agentLat ? (pickupLat + dropLat + agentLat) / 3 : (pickupLat + dropLat) / 2;
  const centerLng = agentLng ? (pickupLng + dropLng + agentLng) / 3 : (pickupLng + dropLng) / 2;

  // OpenStreetMap static or embedded interactive iframe / canvas view
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(
    pickupLng,
    dropLng,
    agentLng || pickupLng
  ) - 0.05}%2C${Math.min(pickupLat, dropLat, agentLat || pickupLat) - 0.05}%2C${Math.max(
    pickupLng,
    dropLng,
    agentLng || pickupLng
  ) + 0.05}%2C${Math.max(
    pickupLat,
    dropLat,
    agentLat || pickupLat
  ) + 0.05}&layer=mapnik`;

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
      {/* Map Header Status */}
      <div className="p-4 bg-slate-950/90 backdrop-blur border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Pickup: {pickupLat.toFixed(4)}, {pickupLng.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Drop: {dropLat.toFixed(4)}, {dropLng.toFixed(4)}</span>
          </div>
          {agentLat && agentLng && (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Agent: {agentName || "Courier"} ({agentLat.toFixed(4)}, {agentLng.toFixed(4)})</span>
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          Live Geo-Telemetry • OpenStreetMap Integration
        </div>
      </div>

      {/* Embedded Map Frame */}
      <div className="relative w-full h-80 bg-slate-800">
        {mapLoaded && (
          <iframe
            title="Live Route Map"
            src={osmUrl}
            className="w-full h-full border-0 opacity-80 hover:opacity-100 transition duration-300"
            loading="lazy"
          />
        )}

        {/* Overlay Waypoint Markers Card */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Pickup Address</div>
              <div className="text-white font-medium truncate max-w-xs">{pickupAddress}</div>
            </div>
          </div>

          <div className="hidden sm:block text-slate-600 font-mono">────────►</div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Delivery Address</div>
              <div className="text-white font-medium truncate max-w-xs">{dropAddress}</div>
            </div>
          </div>

          {agentName && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Active Agent</div>
                <div className="text-amber-200 font-medium">{agentName} ({vehicleType})</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
