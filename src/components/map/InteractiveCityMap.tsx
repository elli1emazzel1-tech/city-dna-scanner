'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { City, CityEnvironmentalData, MapLayer } from '../../lib/data/types';
import { extractMapTelemetry, getLayerColor, layerReading } from '../../lib/maps/layers';
import { Expand, Layers3, Minus, Plus, Satellite, Map as MapIcon } from 'lucide-react';

type Basemap = 'osm' | 'satellite';

interface InteractiveCityMapProps {
  city: City;
  layers: MapLayer[];
  onToggleLayer: (id: MapLayer['id']) => void;
  /** Live environmental data used to show per-layer readings in the panel. */
  data?: CityEnvironmentalData;
}

function CityMapViewport({ city }: { city: City }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([city.coordinates.latitude, city.coordinates.longitude], 12, { duration: 0.8 });
  }, [city.coordinates.latitude, city.coordinates.longitude, map]);
  return null;
}

function MapControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[500] flex flex-col overflow-hidden rounded-lg border border-slate-600 bg-[#071321]/90 shadow-lg">
      <button aria-label="Zoom in" onClick={() => map.zoomIn()} className="p-2 text-slate-100 hover:bg-slate-700"><Plus size={15} /></button>
      <button aria-label="Zoom out" onClick={() => map.zoomOut()} className="border-t border-slate-700 p-2 text-slate-100 hover:bg-slate-700"><Minus size={15} /></button>
    </div>
  );
}

/**
 * Minimal on-map indicators for enabled risk layers: a neat ring of small coloured
 * dots around the city centre, each revealing its live reading on hover. Deliberately
 * lightweight — no raster blobs or heavy gradients — so the basemap stays clean.
 */
function ActiveLayerMarkers({ city, layers, telemetry }: { city: City; layers: MapLayer[]; telemetry: ReturnType<typeof extractMapTelemetry> }) {
  const active = layers.filter((layer) => layer.enabled && layerReading(layer.id, telemetry) != null);
  if (active.length === 0) return null;

  const lat = city.coordinates.latitude;
  const lng = city.coordinates.longitude;
  const ringLat = 0.0026;
  const ringLng = ringLat / Math.max(0.2, Math.cos((lat * Math.PI) / 180));

  return (
    <>
      {active.map((layer, index) => {
        const reading = layerReading(layer.id, telemetry);
        if (!reading) return null;
        const angle = (index / active.length) * Math.PI * 2 - Math.PI / 2;
        const position: [number, number] = [lat + Math.sin(angle) * ringLat, lng + Math.cos(angle) * ringLng];
        return (
          <CircleMarker
            key={layer.id}
            center={position}
            radius={7}
            pathOptions={{ color: '#0b1725', fillColor: getLayerColor(layer.id), fillOpacity: 1, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <span className="font-medium">{layer.label}</span>
              <br />
              <span className="font-mono">{reading.value.toLocaleString()} {reading.unit}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

/**
 * Clean city map: Esri Satellite / OpenStreetMap basemaps with a city-centre marker,
 * zoom controls, fullscreen, basemap switcher, and a lightweight "Risk layers" panel
 * whose enabled layers appear as small colour-coded dots (with hover readings) rather
 * than heavy overlays.
 */
export default function InteractiveCityMap({ city, layers, onToggleLayer, data }: InteractiveCityMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [basemap, setBasemap] = useState<Basemap>('satellite');
  const [layersOpen, setLayersOpen] = useState(true);
  const [fullscreenError, setFullscreenError] = useState('');

  const telemetry = useMemo(() => extractMapTelemetry(data), [data]);

  const layerInfo = (id: MapLayer['id']): { available: boolean; display: string } => {
    const reading = layerReading(id, telemetry);
    return { available: reading != null, display: reading ? `${reading.value.toLocaleString()} ${reading.unit}` : 'No data' };
  };

  const openFullscreen = async () => {
    try {
      if (!wrapperRef.current) throw new Error('Map container is unavailable.');
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrapperRef.current.requestFullscreen();
      }
      setFullscreenError('');
    } catch (error) {
      console.error('Could not change map fullscreen mode.', error);
      setFullscreenError('Fullscreen is unavailable in this browser or permission context.');
    }
  };

  return (
    <div ref={wrapperRef} className="relative h-full min-h-[300px] overflow-hidden rounded-lg bg-[#0b1725]">
      <MapContainer
        center={[city.coordinates.latitude, city.coordinates.longitude]}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="h-full min-h-[300px] w-full"
      >
        <CityMapViewport city={city} />
        <MapControls />
        {basemap === 'osm' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            className="gis-basemap"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            className="gis-basemap"
          />
        )}
        <CircleMarker center={[city.coordinates.latitude, city.coordinates.longitude]} radius={4} pathOptions={{ color: '#c2fff0', fillColor: '#35c5a0', fillOpacity: 1, weight: 1.5 }}>
          <Popup>{city.name}, {city.country}<br />Geocoded/catalog city-centre coordinates · not a city boundary</Popup>
        </CircleMarker>
        <ActiveLayerMarkers city={city} layers={layers} telemetry={telemetry} />
      </MapContainer>

      <div className="absolute left-3 top-3 z-[500] max-w-[calc(100%-6rem)]">
        <button onClick={() => setLayersOpen(!layersOpen)} className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 shadow-lg backdrop-blur-md hover:bg-slate-800/80" aria-expanded={layersOpen}>
          <Layers3 size={14} className="text-teal-300" /> Risk layers
        </button>
        {layersOpen && (
          <div className="mt-2 w-[236px] rounded-lg border border-white/10 bg-slate-900/70 p-3 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-x-4 gap-y-1.5">
              {layers.map((layer) => {
                const info = layerInfo(layer.id);
                return (
                  <label key={layer.id} className={`flex items-center gap-2 text-[11px] ${info.available ? 'text-slate-300' : 'text-slate-600'}`} title={info.available ? layer.status : 'No live reading is available for this layer.'}>
                    <input type="checkbox" checked={layer.enabled} disabled={!info.available} onChange={() => onToggleLayer(layer.id)} className="accent-teal-400" />
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getLayerColor(layer.id) }} />
                    <span className="flex-1 truncate">{layer.label}</span>
                    <span className="shrink-0 font-mono text-[9px] text-slate-500">{info.display}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2.5 border-t border-white/10 pt-2 text-[8px] leading-relaxed text-slate-500">
              Enabled layers show a small colour-coded dot at the city centre; hover for the live reading.
            </p>
          </div>
        )}
      </div>

      <button onClick={openFullscreen} aria-label="Toggle fullscreen map" className="absolute right-3 top-3 z-[500] rounded-md border border-slate-700 bg-[#071321]/95 p-2 text-slate-100 hover:bg-slate-800">
        <Expand size={14} />
      </button>
      <div className="absolute right-3 top-12 z-[500] flex flex-col gap-1 rounded-md border border-slate-700 bg-[#071321]/95 p-1 shadow-lg" role="group" aria-label="Basemap">
        <button
          type="button"
          aria-pressed={basemap === 'osm'}
          onClick={() => setBasemap('osm')}
          title="Street map"
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] transition ${basemap === 'osm' ? 'bg-teal-950/70 text-teal-200' : 'text-slate-400 hover:text-slate-100'}`}
        >
          <MapIcon size={12} /> Map
        </button>
        <button
          type="button"
          aria-pressed={basemap === 'satellite'}
          onClick={() => setBasemap('satellite')}
          title="Esri World Imagery satellite"
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] transition ${basemap === 'satellite' ? 'bg-teal-950/70 text-teal-200' : 'text-slate-400 hover:text-slate-100'}`}
        >
          <Satellite size={12} /> Satellite
        </button>
      </div>
      {fullscreenError && <p role="alert" className="absolute right-3 top-12 z-[600] rounded border border-rose-900 bg-[#241314] px-2 py-1 text-[9px] text-rose-200">{fullscreenError}</p>}
    </div>
  );
}
