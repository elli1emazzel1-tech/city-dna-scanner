"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut } from "lucide-react";

export default function CityMap({ cityName }: { cityName: string }) {
  const [zoom, setZoom] = useState(1);
  const [activePin, setActivePin] = useState("Central Hub (Live)");

  const pins = [
    { name: "Central Hub (Live)", x: "50%", y: "45%", aq2: "47 AQI", status: "Moderate" },
    { name: "Industrial Zone", x: "72%", y: "30%", aq2: "82 AQI", status: "Heavy" },
    { name: "Coastal Sector", x: "28%", y: "65%", aq2: "32 AQI", status: "Good" },
    { name: "Green Canopy Park", x: "60%", y: "70%", aq2: "24 AQI", status: "Optimal" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" /> Geospatial Telemetry Map • {cityName}
        </h4>
        <div className="flex items-center gap-1.5 bg-[#0B0F21] border border-slate-800/80 rounded-xl p-1">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 1.5))} 
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.8))} 
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-[#070A16] border border-slate-800/80 flex items-center justify-center">
        {/* Simulated Map Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px] transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        />

        {/* Abstract Map Roads / Geographic Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" style={{ transform: `scale(${zoom})` }}>
          <path d="M 0 100 Q 200 50 400 180 T 800 120" stroke="#10B981" strokeWidth="2" fill="none" />
          <path d="M 100 0 Q 250 200 300 320 T 700 300" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <circle cx="50%" cy="45%" r="120" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" fill="none" />
        </svg>

        {/* Interactive Pins */}
        <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transition: 'transform 0.3s ease' }}>
          {pins.map((pin) => {
            const isSelected = activePin === pin.name;
            return (
              <div
                key={pin.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: pin.x, top: pin.y }}
                onClick={() => setActivePin(pin.name)}
              >
                <div className={`relative flex items-center justify-center p-2 rounded-full transition ${isSelected ? 'bg-emerald-500/30 ring-2 ring-emerald-400' : 'bg-slate-800/80 hover:bg-slate-700'}`}>
                  <Navigation className={`w-4 h-4 ${isSelected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>

                {/* Tooltip Card */}
                <div className="absolute left-6 top-0 bg-[#0B0F21] border border-slate-700/80 shadow-2xl rounded-xl p-2.5 text-xs whitespace-nowrap z-30 opacity-90 group-hover:opacity-100">
                  <p className="font-bold text-white">{pin.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">Air Index: {pin.aq2} • {pin.status}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Overlay Badge */}
        <div className="absolute bottom-4 left-4 bg-[#0B0F21]/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Station: <strong className="text-white">{activePin}</strong></span>
        </div>
      </div>
    </div>
  );
}