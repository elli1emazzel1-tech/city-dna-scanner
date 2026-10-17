'use client';

import { Bookmark, Trash2, MapPin, HardDrive, CalendarClock } from 'lucide-react';
import type { SavedScenario } from '../../lib/data/simulation';
import { getGoal } from '../../lib/data/simulation';
import { useScenarios, removeScenario } from './useScenarioStore';
import { StatusBadge, Card, projectionIsPopulated } from './simulationShared';

function ScenarioCard({ scenario }: { scenario: SavedScenario }) {
  const modelled = scenario.projected.filter((metric) => projectionIsPopulated(metric.status));
  return (
    <article className="flex flex-col rounded-lg border border-[#1b3041] bg-[#071523]/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[12px] font-semibold text-slate-100">{getGoal(scenario.goalId).label}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-400">
            <MapPin size={11} className="text-teal-400" /> {scenario.cityName}, {scenario.country}
          </p>
        </div>
        <button
          type="button"
          onClick={() => removeScenario(scenario.id)}
          className="shrink-0 rounded p-1 text-slate-500 hover:bg-rose-950/40 hover:text-rose-300"
          aria-label={`Delete saved scenario for ${scenario.cityName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
        <div className="rounded border border-slate-800 bg-[#081622] px-2 py-1.5">
          <dt className="text-slate-500">Target year</dt>
          <dd className="font-mono text-slate-200">{scenario.targetYear}</dd>
        </div>
        <div className="rounded border border-slate-800 bg-[#081622] px-2 py-1.5">
          <dt className="text-slate-500">Intensity</dt>
          <dd className="capitalize text-slate-200">{scenario.assumptions.intensity}</dd>
        </div>
      </dl>

      <div className="mt-2">
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Projected indicators</p>
        {modelled.length === 0 ? (
          <p className="text-[9px] text-amber-300/90">No projected outputs (engine could not produce a value).</p>
        ) : (
          <ul className="space-y-1">
            {modelled.map((metric) => (
              <li key={metric.metricId} className="flex items-center justify-between gap-2 text-[9px]">
                <span className="truncate text-slate-400">{metric.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-teal-300">{metric.changePct != null ? `${metric.changePct > 0 ? '+' : ''}${metric.changePct.toFixed(0)}%` : '—'}</span>
                  <StatusBadge status={metric.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-800/70 pt-2 text-[8px] text-slate-600">
        <span className="inline-flex items-center gap-1"><CalendarClock size={10} /> {new Date(scenario.createdAt).toLocaleString()}</span>
        <span className="inline-flex items-center gap-1 font-mono"><HardDrive size={10} /> {scenario.modelVersion}</span>
      </div>
    </article>
  );
}

export default function SavedScenarios() {
  const snapshot = useScenarios();
  const scenarios = snapshot.scenarios;

  return (
    <Card
      title="Saved Scenarios"
      subtitle="Scenarios you saved during this browser session."
      action={
        <span className="inline-flex items-center gap-1.5 rounded border border-amber-900/60 bg-amber-950/30 px-2 py-1 text-[9px] text-amber-300">
          <HardDrive size={11} /> Local-only storage
        </span>
      }
    >
      <div className="p-3">
        {snapshot.error && <p role="alert" className="mb-3 rounded border border-rose-900/70 bg-rose-950/20 px-3 py-2 text-[10px] text-rose-300">{snapshot.error}</p>}
        <p className="mb-3 text-[9px] leading-relaxed text-slate-500">
          There is no backend, so saved scenarios persist only in this browser&apos;s local storage. Clearing site data will remove them, and they will not sync across devices.
        </p>
        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-[#071523]/50 px-4 py-10 text-center">
            <Bookmark size={22} className="text-slate-600" />
            <p className="mt-2 text-[11px] font-medium text-slate-300">No saved scenarios yet</p>
            <p className="mt-1 max-w-md text-[9px] leading-relaxed text-slate-500">
              Run a scenario and choose &ldquo;Save Scenario&rdquo; to store it locally for later comparison.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} />)}
          </div>
        )}
      </div>
    </Card>
  );
}
