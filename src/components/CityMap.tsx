"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function CityMap({ cityName, coordinates }: { cityName: string; coordinates?: [number, number] }) {
  const position: [number, number] = coordinates || [19.0760, 72.8777];

  return (
    <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-800/80 z-0 relative">
      <MapContainer
        center={position}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapController center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={position} icon={icon}>
          <Popup>
            <div className="text-slate-900 font-bold">
              {cityName} Environmental Node
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}