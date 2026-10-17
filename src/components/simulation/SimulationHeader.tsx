'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Info } from 'lucide-react';
import type { CityEnvironmentalData } from '../../lib/data/types';
import { StatusBadge, statusIsData } from './simulationShared';

interface SimulationHeaderProps {
  data: CityEnvironmentalData;
  isLoading: boolean;
}

function baselineStatusLabel(data: CityEnvironmentalData): { label: string; status: string } {
  const weather = data.weather;
  const metricsWithData = data.metrics.filter((metric) => statusIsData(metric.status));
  if (statusIsData(weather.status) || metricsWithData.length > 0) {
    // The strongest available provenance label, not a claim of "real-time".
    if (data.metrics.some((m) => m.status === 'OBSERVED')) return { label: 'OBSERVED', status: 'OBSERVED' };
    if (data.metrics.some((m) => m.status === 'MODELLED' || m.status === 'FORECAST')) return { label: 'MODELLED', status: 'MODELLED' };
    if (data.metrics.some((m) => m.status === 'CACHED' || m.status === 'CONNECTED')) return { label: 'CACHED', status: 'CACHED' };
    if (data.metrics.some((m) => m.status === 'HISTORICAL')) return { label: 'HISTORICAL', status: 'HISTORICAL' };
    return { label: 'REPORTED', status: 'REPORTED' };
  }
  return { label: 'UNAVAILABLE', status: 'UNAVAILABLE' };
}

export default function SimulationHeader({ data, isLoading }: SimulationHeaderProps) {
  const city = data.city;
  const baseline = baselineStatusLabel(data);

  return (
    <header className="relative overflow-hidden rounded-xl border border-[#1b3041] bg-[#0a1926]">
      {/* Clean map-style header treatment (no fabricated city photography). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(115deg, rgba(19,78,74,0.35), rgba(8,25,38,0) 45%), radial-gradient(circle at 78% 20%, rgba(45,212,191,0.14), transparent 42%)',
        }}
      />
      <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 rounded border border-slate-700/70 bg-[#071523]/70 px-2.5 py-1 text-[10px] text-slate-300 transition hover:border-teal-800 hover:text-teal-200"
          >
            <ArrowLeft size={12} /> Back to city
          </Link>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-teal-300" />
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-50">{city.name}</h1>
          </div>
          <p className="mt-0.5 pl-6 text-[11px] font-medium text-slate-400">{city.country} · {city.countryCode}</p>
          <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-slate-400">
            Explore how urban interventions <span className="text-slate-300">could</span> affect environmental conditions in {city.name}.
            Results are modelled scenarios under your assumptions — not predictions or guaranteed outcomes.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
          <div className="flex items-center gap-2 rounded-lg border border-[#1b3041] bg-[#071523]/80 px-3 py-2">
            <div className="text-right">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current baseline</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {isLoading ? 'Loading provider data…' : 'Provider-backed indicators'}
              </p>
            </div>
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-slate-800/70 px-2 py-1 text-[8px] font-semibold uppercase text-slate-400">
                <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" /> Loading
              </span>
            ) : (
              <StatusBadge status={baseline.status} />
            )}
          </div>
          <p className="inline-flex max-w-[240px] items-start gap-1.5 text-[9px] leading-relaxed text-slate-500">
            <Info size={11} className="mt-0.5 shrink-0 text-slate-600" />
            Baselines come from public providers (CAMS, ERA5, GloFAS, OpenStreetMap). Not a claim of real-time data.
          </p>
        </div>
      </div>
    </header>
  );
}
