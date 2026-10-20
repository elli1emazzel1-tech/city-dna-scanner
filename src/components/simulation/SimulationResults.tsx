'use client';

import { Cloud, Wind, Trees, Waves, MinusCircle, TrendingDown, TrendingUp, Lightbulb, Bookmark, Download, Loader2 } from 'lucide-react';
import type { City } from '../../lib/data/types';
import type { MetricId, ProjectedMetric, ScenarioOutput } from '../../lib/data/simulation';
import { StatusBadge, changeClass, formatChange, projectionIsPopulated } from './simulationShared';

const ICONS: Record<MetricId, typeof Wind> = {
  carbon: Cloud,
  air: Wind,
  green: Trees,
  flood: Waves,
  water: Waves,
  noise: Wind,
};

const HIGHER_IS_BETTER: Record<MetricId, boolean> = {
  carbon: false,
  air: false,
  green: true,
  flood: false,
  water: true,
  noise: false,
};

function ResultRow({ metric }: { metric: ProjectedMetric }) {
  const Icon = ICONS[metric.metricId];
  const populated = projectionIsPopulated(metric.status);
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-[#16293a] bg-[#071523]/60 px-2.5 py-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${populated ? 'border-teal-700/50 bg-teal-950/40 text-teal-300' : 'border-slate-700 bg-slate-800/50 text-slate-500'}`}>
        <Icon size={14} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium text-slate-200">{metric.label}</p>
        <p className="truncate text-[8px] text-slate-500">
          {populated ? `${metric.projectedDisplay} ${metric.unit}` : 'No projection available'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {populated ? (
          <span className={`inline-flex items-center gap-1 font-mono text-[12px] font-semibold ${changeClass(metric.changePct, HIGHER_IS_BETTER[metric.metricId])}`}>
            {metric.changePct != null && metric.changePct < 0 ? <TrendingDown size={12} /> : metric.changePct != null && metric.changePct > 0 ? <TrendingUp size={12} /> : <MinusCircle size={12} />}
            {formatChange(metric.changePct)}
          </span>
        ) : null}
        <StatusBadge status={metric.status} />
      </div>
    </li>
  );
}


interface SimulationResultsProps {
  city: City;
  output: ScenarioOutput;
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDownload: () => void;
}

export default function SimulationResults({ city, output, isLoading, isSaving, onSave, onDownload }: SimulationResultsProps) {
  const { summary, insights, targetYear } = output;

  return (
    <aside className="flex flex-col gap-3">
      <section className="rounded-xl border border-[#1b3041] bg-[#0a1926]">
        <header className="flex items-center gap-2 border-b border-[#16293a] px-3.5 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-teal-700/50 bg-teal-950/40 text-teal-300">
            <Lightbulb size={14} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[12px] font-semibold text-slate-100">Simulation Results</h2>
            <p className="truncate text-[9px] text-slate-500">{city.name} · {targetYear} vs baseline</p>
          </div>
        </header>

        <div className="p-3">
          <div className="rounded-lg border border-[#16293a] bg-[#071523]/60 p-3 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Scenario Summary</p>
            {isLoading ? (
              <p className="mt-2 text-[10px] text-slate-400">Loading baselines…</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className="rounded-md border border-teal-900/60 bg-teal-950/30 px-1 py-2">
                  <p className="text-lg font-semibold text-teal-300">{summary.improved}</p>
                  <p className="text-[8px] text-slate-500">Improved</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-800/40 px-1 py-2">
                  <p className="text-lg font-semibold text-slate-300">{summary.unchanged}</p>
                  <p className="text-[8px] text-slate-500">Unchanged</p>
                </div>
                <div className="rounded-md border border-amber-900/60 bg-amber-950/20 px-1 py-2">
                  <p className="text-lg font-semibold text-amber-300">{summary.unavailable}</p>
                  <p className="text-[8px] text-slate-500">Unavailable</p>
                </div>
              </div>
            )}
            <p className="mt-2 text-[8px] leading-relaxed text-slate-600">
              No single overall score is shown — Enrealys has no validated aggregation methodology. Counts cover every indicator: live-baseline SIMULATED transforms and transparent INDICATIVE reference estimates.
            </p>
          </div>

          <h3 className="mb-2 mt-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">Indicator changes</h3>
          <ul className="space-y-1.5">
            {output.metrics.map((metric) => <ResultRow key={metric.metricId} metric={metric} />)}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-[#1b3041] bg-[#0a1926]">
        <header className="flex items-center gap-2 border-b border-[#16293a] px-3.5 py-2.5">
          <Lightbulb size={13} className="text-amber-300" />
          <h2 className="text-[12px] font-semibold text-slate-100">Key Insights</h2>
        </header>
        <ul className="space-y-2 p-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-[#16293a] px-3.5 py-2 text-[8px] leading-relaxed text-slate-600">
          Each insight is traceable to a simulation output. No generic sustainability claims are made.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || isLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-3 py-2.5 text-[12px] font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
          Save Scenario
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-[#0e2230] px-3 py-2.5 text-[12px] font-medium text-slate-200 transition hover:border-teal-700 hover:text-teal-200"
        >
          <Download size={14} />
          Download Report
        </button>
        <p className="text-center text-[8px] text-slate-600">Saved scenarios are stored locally in this browser only.</p>
      </div>
    </aside>
  );
}
