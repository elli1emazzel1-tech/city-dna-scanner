'use client';

import { Activity, Flame } from 'lucide-react';
import type { FindingSummary } from './cityscan-types';

interface EnvironmentalIndicesCardsProps {
  finding: FindingSummary | null;
}

function pctChange(before: number | null, after: number | null): string {
  if (before === null || after === null || before === 0) return '—';
  const delta = ((after - before) / Math.abs(before)) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

function deltaClass(before: number | null, after: number | null): string {
  if (before === null || after === null || before === 0) return 'text-slate-500';
  const delta = after - before;
  return delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-500';
}

function miniSparkline(values: number[]): string {
  if (values.length < 2) return 'M0 20 Q10 20 20 20';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = 20 / (values.length - 1);
  const points = values.map((v, i) => {
    const y = 20 - ((v - min) / range) * 12;
    return `${i * step} ${y}`;
  });
  return `M${points.join(' ')}`;
}

export function EnvironmentalIndicesCards({ finding }: EnvironmentalIndicesCardsProps) {
  const ndviBefore = finding?.ndviMeanBefore ?? null;
  const ndviAfter = finding?.ndviMeanAfter ?? null;
  const ndwiBefore = finding?.ndwiMeanBefore ?? null;
  const ndwiAfter = finding?.ndwiMeanAfter ?? null;

  const ndviChange = pctChange(ndviBefore, ndviAfter);
  const ndwiChange = pctChange(ndwiBefore, ndwiAfter);

  const ndviDelta = ndviBefore !== null && ndviAfter !== null ? (ndviAfter - ndviBefore).toFixed(3) : '—';
  const ndwiDelta = ndwiBefore !== null && ndwiAfter !== null ? (ndwiAfter - ndwiBefore).toFixed(3) : '—';

  // Generate simple sparkline from before/after with midpoint
  const ndviLine = ndviBefore !== null && ndviAfter !== null
    ? miniSparkline([ndviBefore, (ndviBefore + ndviAfter) / 2, ndviAfter])
    : 'M0 20 Q10 20 20 20';
  const ndwiLine = ndwiBefore !== null && ndwiAfter !== null
    ? miniSparkline([ndwiBefore, (ndwiBefore + ndwiAfter) / 2, ndwiAfter])
    : 'M0 20 Q10 20 20 20';

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[#1b3041] bg-[#0a1926] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-emerald-400" />
            <span className="text-xs font-semibold text-[#e8f0fe] uppercase tracking-wider">NDVI</span>
          </div>
          <span className="text-xs text-slate-500">Vegetation health</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-mono font-bold text-[#e8f0fe]">
            {ndviAfter !== null ? ndviAfter.toFixed(2) : '—'}
          </span>
          {ndviBefore !== null && ndviAfter !== null ? (
            <span className={`text-xs font-medium ${deltaClass(ndviBefore, ndviAfter)}`}>
              {(ndviAfter - ndviBefore) >= 0 ? '+' : ''}{ndviDelta} ({ndviChange})
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
          <span>Before: {ndviBefore !== null ? ndviBefore.toFixed(2) : '—'}</span>
          <span>After: {ndviAfter !== null ? ndviAfter.toFixed(2) : '—'}</span>
        </div>
        <div className="h-16 w-full flex items-end gap-1">
          <svg className="w-full h-full text-emerald-400/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 20">
            <path d={ndviLine} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          NDVI = (B08 − B04) / (B08 + B04) · computed on common valid pixels
        </p>
      </div>

      <div className="rounded-xl border border-[#1b3041] bg-[#0a1926] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <span className="text-xs font-semibold text-[#e8f0fe] uppercase tracking-wider">NDWI</span>
          </div>
          <span className="text-xs text-slate-500">Water content</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-mono font-bold text-[#e8f0fe]">
            {ndwiAfter !== null ? ndwiAfter.toFixed(2) : '—'}
          </span>
          {ndwiBefore !== null && ndwiAfter !== null ? (
            <span className={`text-xs font-medium ${deltaClass(ndwiBefore, ndwiAfter)}`}>
              {(ndwiAfter - ndwiBefore) >= 0 ? '+' : ''}{ndwiDelta} ({ndwiChange})
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
          <span>Before: {ndwiBefore !== null ? ndwiBefore.toFixed(2) : '—'}</span>
          <span>After: {ndwiAfter !== null ? ndwiAfter.toFixed(2) : '—'}</span>
        </div>
        <div className="h-16 w-full flex items-end gap-1">
          <svg className="w-full h-full text-blue-400/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 20">
            <path d={ndwiLine} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          NDWI = (B03 − B08) / (B03 + B08) · computed on common valid pixels
        </p>
      </div>
    </section>
  );
}