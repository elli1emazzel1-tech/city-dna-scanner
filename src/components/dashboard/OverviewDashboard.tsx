'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Radio } from 'lucide-react';
import type { CityEnvironmentalData, MapLayerId, SimulationScenario } from '../../lib/data/types';
import { defaultMapLayers } from '../../lib/maps/layers';
import CityOverview from './CityOverview';
import DashboardShell from './DashboardShell';
import EnvironmentalMetricCard from './EnvironmentalMetricCard';
import HistoricalTemperatureChart from './HistoricalTemperatureChart';
import HealthAndActions from './HealthAndActions';
import QuickFacts from './QuickFacts';

const InteractiveCityMap = dynamic(() => import('../map/InteractiveCityMap'), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-slate-800 bg-[#0b1725] text-xs text-slate-500">Loading geographic map…</div>,
});

interface OverviewDashboardProps {
  data: CityEnvironmentalData;
  onSelectCity: (city: CityEnvironmentalData['city']) => void;
  dataStatus: string;
  isLoading: boolean;
  isGreenLoading: boolean;
}

export default function OverviewDashboard({ data, onSelectCity, dataStatus, isLoading, isGreenLoading }: OverviewDashboardProps) {
  const [layers, setLayers] = useState(defaultMapLayers);
  const [scenario, setScenario] = useState<SimulationScenario>({
    treeCanopyIncrease: 0,
    coolRoofAdoption: 0,
    drainageCapacityIncrease: 0,
  });
  const metrics = data.metrics;
  const availableMetrics = metrics.filter((metric) => metric.status !== 'UNAVAILABLE');
  const toggleLayer = (id: MapLayerId) => {
    setLayers((current) => current.map((layer) =>
      layer.id === id && layer.status !== 'UNAVAILABLE' && id !== 'roads'
        ? { ...layer, enabled: !layer.enabled }
        : layer,
    ));
  };

  return (
    <DashboardShell city={data.city} dataStatus={dataStatus} onSelectCity={onSelectCity}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-300">Urban environmental intelligence</p>
            <p className="mt-1 text-[9px] text-slate-500">DATA <span className="text-slate-700">→</span> UNDERSTAND <span className="text-slate-700">→</span> SIMULATE <span className="text-slate-700">→</span> DECIDE <span className="text-slate-700">→</span> MONITOR</p>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-slate-500"><Radio size={12} className="text-teal-400" /> {isLoading ? 'Loading provider data…' : `${availableMetrics.length} provider-backed indicator${availableMetrics.length === 1 ? '' : 's'} · ${metrics.length - availableMetrics.length} unavailable`}</div>
        </div>

        <CityOverview data={data} isLoading={isLoading} />

        <section aria-label={`${data.city.name} environmental metrics`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">Environmental indicators</h2>
            <span className="text-[8px] text-slate-600">River flow is modelled discharge, not urban flood risk; unsupported indicators remain unavailable</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-6">
            {metrics.map((metric) => <EnvironmentalMetricCard key={metric.id} metric={metric} isLoading={isLoading || ((metric.id === 'green' || metric.id === 'noise') && isGreenLoading)} />)}
          </div>
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(240px,0.9fr)_minmax(220px,0.78fr)]">
          <section id="city-map" className="overflow-hidden rounded-md border border-[#1b3041] bg-[#0a1926]">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b3041] px-3.5 py-2.5">
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /><h2 className="text-[11px] font-semibold text-slate-200">City map <span className="font-normal text-slate-500">· {data.city.name}</span></h2></div>
              <span className="text-[8px] text-slate-500">OpenStreetMap base · city-centre marker only</span>
            </header>
            <div className="h-[320px] p-2 sm:h-[390px]">
              <InteractiveCityMap city={data.city} layers={layers} onToggleLayer={toggleLayer} data={data} />
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-md border border-[#1b3041] bg-[#0a1926]">
              <header className="flex items-center justify-between border-b border-[#1b3041] px-3.5 py-2.5">
                <h2 className="text-[11px] font-semibold text-slate-200">Top issues & insights</h2>
                <Link href="/city-report" className="text-[9px] text-teal-300 hover:text-teal-200">City analysis <ArrowRight size={10} className="ml-1 inline" /></Link>
              </header>
              <div className="space-y-1 px-2.5 py-2">
                {availableMetrics.length
                  ? availableMetrics.map((metric) => (
                    <article key={metric.id} className="border-b border-slate-800/60 py-2 last:border-0">
                      <p className="text-[10px] font-medium text-slate-200">{metric.label} <span className="text-slate-500">· {metric.condition} · {metric.status}</span></p>
                      <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{metric.value} {metric.unit} · {metric.source} · {metric.updated ?? 'time unavailable'}</p>
                    </article>
                  ))
                  : <p className="py-3 text-[9px] text-slate-500">No city-specific indicators are currently available.</p>}
              </div>
            </section>

            <section className="rounded-md border border-[#1b3041] bg-[#0a1926]">
              <header className="flex items-center justify-between border-b border-[#1b3041] px-3.5 py-2.5">
                <h2 className="text-[11px] font-semibold text-slate-200">Recent activity</h2>
                <Link href="/simulation" className="text-[9px] text-teal-300 hover:text-teal-200">View all <ArrowRight size={10} className="ml-1 inline" /></Link>
              </header>
              <div className="space-y-2.5 px-3.5 py-3">
                <p className="py-2 text-[9px] leading-relaxed text-slate-500">No operational activity feed is connected. User-submitted hazard records are stored locally on the Alerts page.</p>
              </div>
              <p className="border-t border-slate-800 px-3.5 py-2 text-[8px] text-slate-600">No fabricated activity events are shown.</p>
            </section>
          </div>
          <HealthAndActions data={data} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_0.82fr]">
          <HistoricalTemperatureChart city={data.city} />
          <SimulationPanel scenario={scenario} onChange={setScenario} />
          <QuickFacts data={data} />
        </div>

        <section className="flex flex-col gap-3 rounded-md border border-[#1b3041] bg-[#0a1926] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-[12px] font-semibold text-slate-100">Smarter decisions. Healthier cities.</h2><p className="mt-1 text-[9px] text-slate-500">Turn complex urban environmental data into clear, actionable intelligence. Pilot and reporting workflows can connect to verified data sources.</p></div>
          <div className="flex shrink-0 gap-2"><Link href="/about" className="rounded border border-slate-700 px-3 py-2 text-[9px] text-slate-300 hover:border-teal-800 hover:text-teal-200">About Enrealys</Link><Link href="/city-report" className="rounded border border-teal-800/70 bg-teal-950/40 px-3 py-2 text-[9px] font-medium text-teal-200 hover:bg-teal-950/70">Generate report</Link></div>
        </section>
      </div>
    </DashboardShell>
  );
}

function SimulationPanel({ scenario, onChange }: { scenario: SimulationScenario; onChange: (value: SimulationScenario) => void }) {
  const controls: { key: keyof SimulationScenario; label: string; max: number }[] = [
    { key: 'treeCanopyIncrease', label: 'Tree canopy', max: 30 },
    { key: 'coolRoofAdoption', label: 'Cool roofs', max: 40 },
    { key: 'drainageCapacityIncrease', label: 'Drainage capacity', max: 40 },
  ];
  return (
    <section className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
      <div className="flex items-start justify-between gap-2"><div><h2 className="text-[11px] font-semibold text-slate-200">Climate scenario inputs</h2><p className="mt-1 text-[8px] text-slate-500">What if we change the city?</p></div><span className="rounded bg-slate-800 px-1.5 py-1 text-[8px] font-semibold text-slate-400">NO MODEL CONNECTED</span></div>
      <div className="mt-3 space-y-3">
        {controls.map(({ key, label, max }) => <label key={key} className="block">
          <span className="mb-1 flex justify-between text-[9px] text-slate-400"><span>{label}</span><span className="font-mono text-teal-300">+{scenario[key]}%</span></span>
          <input type="range" min="0" max={max} value={scenario[key]} onChange={(event) => onChange({ ...scenario, [key]: Number(event.target.value) })} className="h-1 w-full cursor-pointer accent-teal-400" />
        </label>)}
      </div>
      <div className="mt-3 rounded border border-slate-800 bg-[#081622] p-2.5">
        <p className="text-[8px] font-medium uppercase tracking-wide text-slate-500">Scenario inputs only</p>
        <p className="mt-2 text-[9px] leading-relaxed text-slate-400">No validated city-specific climate model is connected. These controls do not calculate or predict environmental impacts.</p>
      </div>
      <p className="mt-2.5 text-[8px] text-slate-600">Simulation execution is unavailable until a validated model and input datasets are configured.</p>
    </section>
  );
}
