'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Map as MapIcon, Layers, Leaf } from 'lucide-react';
import type { City, MapLayer, MapLayerId, CityEnvironmentalData } from '../../lib/data/types';
import type { ScenarioOutput } from '../../lib/data/simulation';
import { defaultMapLayers } from '../../lib/maps/layers';
import { StatusBadge } from './simulationShared';

const InteractiveCityMap = dynamic(() => import('../map/InteractiveCityMap'), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-slate-800 bg-[#0b1725] text-xs text-slate-500">Loading geographic map…</div>,
});

interface SimulationMapPanelProps {
  city: City;
  data: CityEnvironmentalData;
  output: ScenarioOutput;
  view: 'baseline' | 'simulation';
  onViewChange: (view: 'baseline' | 'simulation') => void;
}

export default function SimulationMapPanel({ city, data, output, view, onViewChange }: SimulationMapPanelProps) {
  const [layers, setLayers] = useState<MapLayer[]>(defaultMapLayers);
  const [is3D, setIs3D] = useState(false);

  const toggleLayer = (id: MapLayerId) => {
    setLayers((current) => current.map((layer) =>
      layer.id === id && layer.status !== 'UNAVAILABLE' && id !== 'roads'
        ? { ...layer, enabled: !layer.enabled }
        : layer,
    ));
  };

  const simulatedMetrics = output.metrics.filter((metric) => metric.status === 'SIMULATED');

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-[#1b3041] bg-[#0a1926]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#16293a] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <MapIcon size={14} className="text-teal-300" />
          <h2 className="text-[12px] font-semibold text-slate-100">City map</h2>
          <span className="hidden text-[9px] text-slate-500 sm:inline">· {city.name} centre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-slate-700 bg-[#071523] p-0.5" role="group" aria-label="Map view mode">
            <button
              type="button"
              aria-pressed={view === 'baseline'}
              onClick={() => onViewChange('baseline')}
              className={`rounded px-2.5 py-1 text-[10px] transition ${view === 'baseline' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-200'}`}
            >
              Baseline
            </button>
            <button
              type="button"
              aria-pressed={view === 'simulation'}
              onClick={() => onViewChange('simulation')}
              className={`rounded px-2.5 py-1 text-[10px] transition ${view === 'simulation' ? 'bg-teal-950/70 text-teal-200' : 'text-slate-500 hover:text-slate-200'}`}
            >
              Simulation
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-slate-700/70 bg-[#071523] p-0.5" role="group" aria-label="Map perspective">
            <button
              type="button"
              aria-pressed={!is3D}
              onClick={() => setIs3D(false)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] transition ${!is3D ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-200'}`}
            >
              <MapIcon size={11} /> 2D
            </button>
            <button
              type="button"
              aria-pressed={is3D}
              onClick={() => setIs3D(true)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] transition ${is3D ? 'bg-teal-950/70 text-teal-200' : 'text-slate-500 hover:text-slate-200'}`}
            >
              <Box size={11} /> 3D
            </button>
          </div>
        </div>
      </header>

      <div className="relative min-h-[340px] flex-1 overflow-hidden [perspective:1400px]">
        <div
          className={`h-full w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] ${is3D ? '[transform:rotateX(42deg)_scale(1.18)]' : ''}`}
        >
          <InteractiveCityMap city={city} layers={layers} onToggleLayer={toggleLayer} data={data} />
        </div>

        {view === 'simulation' && (
          <div className="pointer-events-none absolute right-3 top-14 z-[500] max-w-[240px] rounded-md border border-teal-900/70 bg-[#071523]/95 p-2.5 shadow-xl">
            <div className="flex items-center gap-1.5">
              <Leaf size={12} className="text-teal-300" />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-teal-200">Simulation readout</span>
            </div>
            {simulatedMetrics.length === 0 ? (
              <p className="mt-1.5 text-[9px] leading-relaxed text-slate-400">
                No modelled indicator has a connected baseline for {city.name} yet.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {simulatedMetrics.map((metric) => (
                  <li key={metric.metricId} className="flex items-center justify-between gap-2 text-[9px]">
                    <span className="truncate text-slate-300">{metric.label}</span>
                    <span className="shrink-0 font-mono text-teal-300">
                      {metric.changePct != null ? `${metric.changePct > 0 ? '+' : ''}${metric.changePct.toFixed(0)}%` : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1.5 text-[8px] leading-relaxed text-slate-500">
              Modelled proxy change at the city centre by {output.targetYear}. No spatial heat, flood, or 3D overlay is drawn — no connected source.
            </p>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#16293a] px-3 py-2 text-[9px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Layers size={11} className="text-slate-600" />
          Base map: OpenStreetMap. {is3D ? '3D is a tilted perspective view of the 2D basemap — no extruded building geometry.' : 'Environmental overlay layers remain disabled where no geographic provider is connected.'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          Baseline status: <StatusBadge status={view === 'simulation' ? 'SIMULATED' : (data.weather.status || 'UNAVAILABLE')} />
        </span>
      </footer>
    </section>
  );
}
