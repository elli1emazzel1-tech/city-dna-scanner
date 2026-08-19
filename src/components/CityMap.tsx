"use client";

import React, { useState } from "react";
import { MapPin, Compass, Layers, Zap, Eye } from "lucide-react";

interface CityMapProps {
  selectedCity: string;
  airQualityIndex: number;
}

export default function CityMap({ selectedCity, airQualityIndex }: CityMapProps) {
  const [activeLayer, setActiveLayer] = useState<"thermal" | "hydrology" | "carbon">("thermal");
  const [isRadarActive, setIsRadarActive] = useState<boolean>(true);

  return (
    <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#22FFAA]" />
            <h3 className="text-white font-bold text-sm">Geospatial Telemetry Grid & Sector Radar</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRadarActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span className="text-xs text-slate-400 font-mono">Live Sector Map</span>
          </div>
        </div>
        
        {/* Simulated Telemetry Map Box */}
        <div className="w-full h-72 rounded-2xl bg-[#131B2E] border border-slate-800/80 relative flex items-center justify-center overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#22FFAA_1px,transparent_1px)] [background-size:20px_20px] opacity-15"></div>
          
          {/* Radar Scanning Ring Effect */}
          {isRadarActive && (
            <div className="absolute w-48 h-48 rounded-full border border-[#22FFAA]/20 animate-ping pointer-events-none"></div>
          )}
          
          {/* Map Hotspots based on active layer */}
          {activeLayer === "thermal" && (
            <div className="absolute top-12 left-20 px-3 py-1.5 rounded-xl bg-[#0B0F1A]/90 border border-[#22FFAA]/30 text-[10px] font-mono text-[#22FFAA] shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22FFAA] animate-pulse"></span>
              {selectedCity} Thermal Hub: {airQualityIndex} AQI
            </div>
          )}

          {activeLayer === "hydrology" && (
            <div className="absolute bottom-16 left-24 px-3 py-1.5 rounded-xl bg-[#0B0F1A]/90 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Water Basin & Drainage: Optimal
            </div>
          )}

          {activeLayer === "carbon" && (
            <div className="absolute top-16 right-20 px-3 py-1.5 rounded-xl bg-[#0B0F1A]/90 border border-amber-500/30 text-[10px] font-mono text-amber-400 shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Carbon Flux Emission Node: Active
            </div>
          )}

          <div className="text-center z-10 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 flex items-center justify-center mx-auto text-[#22FFAA] shadow-[0_0_20px_rgba(34,255,170,0.2)]">
              <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '15s' }} />
            </div>
            <p className="text-xs text-slate-200 font-semibold">Autonomous Sensor Grid Synchronized</p>
            <span className="text-[10px] text-slate-400 font-mono block">Active Layer: {activeLayer.toUpperCase()} · 1,420 Active Nodes</span>
          </div>
        </div>
      </div>

      {/* Map Interactive Controls Footer */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-800/60 text-xs gap-3">
        <span className="font-mono text-slate-400">Elevation: 12m ASL</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveLayer("thermal")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] transition ${activeLayer === 'thermal' ? 'bg-[#22FFAA]/20 text-[#22FFAA] border border-[#22FFAA]/40' : 'text-slate-400 hover:text-white bg-slate-900'}`}
          >
            Thermal
          </button>
          <button 
            onClick={() => setActiveLayer("hydrology")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] transition ${activeLayer === 'hydrology' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white bg-slate-900'}`}
          >
            Hydrology
          </button>
          <button 
            onClick={() => setActiveLayer("carbon")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] transition ${activeLayer === 'carbon' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white bg-slate-900'}`}
          >
            Carbon Flux
          </button>
        </div>
      </div>
    </div>
  );
}