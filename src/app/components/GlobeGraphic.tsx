"use client";

import React from "react";

export default function GlobeGraphic() {
  return (
    <div className="relative w-full h-44 flex items-center justify-center my-2 overflow-hidden">
      <svg
        viewBox="0 0 200 200"
        className="w-40 h-40 animate-[spin_20s_linear_infinite]"
      >
        <defs>
          {/* Radial Outer Glow */}
          <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#1E40AF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>

          {/* Earth Body Gradient */}
          <radialGradient id="earthBody" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Outer Glow Ring */}
        <circle cx="100" cy="100" r="95" fill="url(#globeGlow)" />

        {/* Earth Globe Base */}
        <circle cx="100" cy="100" r="75" fill="url(#earthBody)" stroke="#1E3A8A" strokeWidth="1.5" />

        {/* Latitudinal Lines */}
        <ellipse cx="100" cy="100" rx="75" ry="25" fill="none" stroke="#1E3A8A" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" />
        <ellipse cx="100" cy="100" rx="75" ry="50" fill="none" stroke="#1E3A8A" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" />
        <line x1="25" y1="100" x2="175" y2="100" stroke="#1E3A8A" strokeWidth="1" opacity="0.5" />

        {/* Continents & Grid Dots */}
        <g fill="#3B82F6" opacity="0.7">
          <circle cx="70" cy="65" r="3" />
          <circle cx="82" cy="60" r="2.5" />
          <circle cx="75" cy="72" r="2" />
          <circle cx="115" cy="58" r="3" />
          <circle cx="125" cy="62" r="2.5" />
          <circle cx="85" cy="115" r="3" />
          <circle cx="90" cy="128" r="2.5" />
          <circle cx="120" cy="105" r="3.5" />
          <circle cx="125" cy="120" r="2" />
          <circle cx="145" cy="75" r="3" />
          <circle cx="155" cy="82" r="2" />
          <circle cx="140" cy="125" r="2.5" />
        </g>

        {/* Glowing Gold City Nodes */}
        <g fill="#F59E0B">
          <circle cx="70" cy="65" r="2" className="animate-ping" />
          <circle cx="115" cy="58" r="2" />
          <circle cx="120" cy="105" r="2" />
          <circle cx="145" cy="75" r="2" className="animate-ping" />
        </g>
      </svg>
    </div>
  );
}