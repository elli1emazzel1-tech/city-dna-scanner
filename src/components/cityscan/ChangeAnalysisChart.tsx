'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { FindingSummary } from './cityscan-types';

interface ChangeAnalysisChartProps {
  finding: FindingSummary | null;
}

const COLORS = {
  loss: '#f87171',
  gain: '#34d399',
  water: '#60a5fa',
  urban: '#94a3b8',
};

export function ChangeAnalysisChart({ finding }: ChangeAnalysisChartProps) {
  const [unit, setUnit] = useState<'area' | 'pct'>('area');

  const vegLoss = finding?.vegetationLossHa ?? 0;
  const vegGain = finding?.vegetationGainHa ?? 0;
  const waterChange = ((finding?.waterGainHa ?? 0) - (finding?.waterLossHa ?? 0));
  const pixelArea = finding?.pixelAreaHa ?? 0;
  const vegBefore = finding?.vegetationAreaHaBefore ?? 0;
  const waterBefore = finding?.waterAreaHaBefore ?? 0;
  const urbanBefore = Math.max(0, pixelArea - vegBefore - waterBefore);

  const data = [
    { name: 'Vegetation loss', value: unit === 'area' ? vegLoss : vegBefore > 0 ? (vegLoss / vegBefore) * 100 : 0, color: COLORS.loss },
    { name: 'Vegetation gain', value: unit === 'area' ? vegGain : vegBefore > 0 ? (vegGain / vegBefore) * 100 : 0, color: COLORS.gain },
    { name: 'Water change', value: unit === 'area' ? Math.abs(waterChange) : waterBefore > 0 ? (Math.abs(waterChange) / waterBefore) * 100 : 0, color: COLORS.water },
    { name: 'Urban / bare', value: unit === 'area' ? urbanBefore : urbanBefore > 0 ? (urbanBefore / pixelArea) * 100 : 0, color: COLORS.urban },
  ];

  const maxValue = Math.max(...data.map((d) => d.value), 0.1);

  const hasData = Boolean(finding) && data.some((d) => d.value > 0);

  return (
    <section className="rounded-xl border border-[#1b3041] bg-[#0a1926] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#e8f0fe] flex items-center gap-2">
          <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Change Analysis
        </h2>
        <div className="flex items-center gap-2 rounded border border-slate-700 bg-[#071321]/50 px-1">
          <button
            type="button"
            onClick={() => setUnit('area')}
            className={`px-2 py-1 text-xs rounded transition-colors ${unit === 'area' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Area (ha)
          </button>
          <button
            type="button"
            onClick={() => setUnit('pct')}
            className={`px-2 py-1 text-xs rounded transition-colors ${unit === 'pct' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Percentage
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-center">
          <svg width={24} height={24} className="mb-2 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-xs text-slate-500">No change data available</p>
        </div>
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, bottom: 60, left: 10 }}>
              <defs>
                {data.map((d) => (
                  <linearGradient key={d.name} id={`grad-${d.name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={d.color} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={d.color} stopOpacity={0.35} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9bb8da' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                domain={[0, maxValue * 1.25]}
                axisLine={false}
                tickLine={false}
                hide
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#0f1f33', border: '1px solid #1b3041', color: '#e8f0fe', fontSize: 11 }}
                labelStyle={{ fill: '#9bb8da', fontSize: 10 }}
                itemStyle={{ color: '#e8f0fe', fontSize: 11 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize="28" background={{ radius: 4 }}>
                {data.map((d, idx) => (
                  <Cell key={`cell-${idx}`} fill={`url(#grad-${d.name})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}