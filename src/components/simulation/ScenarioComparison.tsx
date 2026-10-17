'use client';

import { useMemo, useState } from 'react';
import { GitCompare, Trash2, MapPin, Info } from 'lucide-react';
import type { LeverId, MetricId, ProjectedMetric, SavedScenario } from '../../lib/data/simulation';
import { getGoal, LEVERS } from '../../lib/data/simulation';
import { useScenarios, removeScenario } from './useScenarioStore';
import { StatusBadge, changeClass, formatChange, Card, projectionIsPopulated } from './simulationShared';

const HIGHER_IS_BETTER: Record<MetricId, boolean> = {
  carbon: false, air: false, green: true, flood: false, water: true, noise: false,
};

const COMPARE_METRICS: MetricId[] = ['carbon', 'air', 'green', 'flood'];

function changeCell(metric: ProjectedMetric | undefined) {
  if (!metric) return <span className="text-slate-600">—</span>;
  if (projectionIsPopulated(metric.status)) {
    return (
      <span className="inline-flex flex-col items-end">
        <span className={`font-mono text-[12px] font-semibold ${changeClass(metric.changePct, HIGHER_IS_BETTER[metric.metricId])}`}>{formatChange(metric.changePct)}</span>
        <span className="text-[8px] text-slate-500">{metric.projectedDisplay} {metric.unit}</span>
        <StatusBadge status={metric.status} />
      </span>
    );
  }
  return <StatusBadge status="UNAVAILABLE" />;
}

export default function ScenarioComparison() {
  const snapshot = useScenarios();
  const scenarios = snapshot.scenarios;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const activeScenarios: SavedScenario[] = useMemo(() => {
    const chosen = selectedIds.filter((id) => scenarios.some((scenario) => scenario.id === id));
    return (chosen.length ? chosen : scenarios.slice(0, 3).map((scenario) => scenario.id))
      .map((id) => scenarios.find((scenario) => scenario.id === id))
      .filter((scenario): scenario is SavedScenario => !!scenario)
      .slice(0, 3);
  }, [selectedIds, scenarios]);

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].slice(-3),
    );
  };

  return (
    <Card
      title="Compare Scenarios"
      subtitle="Compare up to three saved scenarios. Only indicators actually available in each scenario are compared."
      action={<GitCompare size={14} className="text-teal-300" />}
    >
      <div className="p-3">
        {snapshot.error && <p role="alert" className="mb-3 rounded border border-rose-900/70 bg-rose-950/20 px-3 py-2 text-[10px] text-rose-300">{snapshot.error}</p>}
        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-[#071523]/50 px-4 py-10 text-center">
            <GitCompare size={22} className="text-slate-600" />
            <p className="mt-2 text-[11px] font-medium text-slate-300">No saved scenarios to compare</p>
            <p className="mt-1 max-w-md text-[9px] leading-relaxed text-slate-500">
              Save two or more scenarios from the Scenario Simulation tab to compare their assumptions and projected indicators here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {scenarios.map((scenario) => {
                const active = activeScenarios.some((item) => item.id === scenario.id);
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => toggle(scenario.id)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${active ? 'border-teal-700/70 bg-teal-950/40' : 'border-[#1b3041] bg-[#071523]/60 hover:border-slate-600'}`}
                  >
                    <MapPin size={12} className={active ? 'text-teal-300' : 'text-slate-500'} />
                    <span>
                      <span className="block text-[11px] font-medium text-slate-200">{getGoal(scenario.goalId).label}</span>
                      <span className="block text-[8px] text-slate-500">{scenario.cityName} · {scenario.targetYear}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#16293a]">
                    <th className="py-2 pr-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Attribute</th>
                    {activeScenarios.map((scenario) => (
                      <th key={scenario.id} className="py-2 px-3 text-[9px] font-semibold text-slate-200">
                        {getGoal(scenario.goalId).label}
                        <span className="mt-0.5 block text-[8px] font-normal text-slate-500">{scenario.cityName} · {scenario.targetYear}</span>
                      </th>
                    ))}
                  </tr>
                </thead>


                <tbody className="text-[10px]">
                  <tr className="border-b border-slate-800/60">
                    <td className="py-2 pr-3 text-slate-500">City</td>
                    {activeScenarios.map((scenario) => (
                      <td key={scenario.id} className="py-2 px-3 text-slate-300">{scenario.cityName}, {scenario.country}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-800/60">
                    <td className="py-2 pr-3 text-slate-500">Intensity</td>
                    {activeScenarios.map((scenario) => (
                      <td key={scenario.id} className="py-2 px-3 capitalize text-slate-300">{scenario.assumptions.intensity}</td>
                    ))}
                  </tr>
                  {LEVERS.map((lever: { id: LeverId; label: string }) => (
                    <tr key={lever.id} className="border-b border-slate-800/40">
                      <td className="py-2 pr-3 text-slate-500">{lever.label}</td>
                      {activeScenarios.map((scenario) => (
                        <td key={scenario.id} className="py-2 px-3 font-mono text-slate-300">+{scenario.assumptions.levers[lever.id] ?? 0}%</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={activeScenarios.length + 1} className="pt-3 pb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Projected indicators</td>
                  </tr>
                  {COMPARE_METRICS.map((metricId) => {
                    const label = activeScenarios
                      .map((scenario) => scenario.projected.find((metric) => metric.metricId === metricId)?.label)
                      .find(Boolean) ?? metricId;
                    return (
                      <tr key={metricId} className="border-t border-slate-800/40">
                        <td className="py-2 pr-3 text-slate-400">{label}</td>
                        {activeScenarios.map((scenario) => (
                          <td key={scenario.id} className="py-2 px-3">
                            {changeCell(scenario.projected.find((metric) => metric.metricId === metricId))}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[8px] leading-relaxed text-slate-600">
              <Info size={11} className="mt-0.5 shrink-0" />
              Every indicator carries a populated projection — a real-baseline SIMULATED transform or a transparent INDICATIVE reference estimate, each labelled with its provenance. UNAVAILABLE appears only on a genuine engine failure.
            </p>

            <div className="mt-3 border-t border-[#16293a] pt-3">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Manage saved scenarios</p>
              <ul className="space-y-1.5">
                {scenarios.map((scenario) => (
                  <li key={scenario.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#071523]/60 px-2.5 py-1.5">
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-medium text-slate-200">{getGoal(scenario.goalId).label} · {scenario.cityName}</span>
                      <span className="block truncate text-[8px] text-slate-500">{new Date(scenario.createdAt).toLocaleString()} · {scenario.modelVersion}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeScenario(scenario.id)}
                      className="shrink-0 rounded p-1 text-slate-500 hover:bg-rose-950/40 hover:text-rose-300"
                      aria-label={`Delete scenario ${getGoal(scenario.goalId).label} for ${scenario.cityName}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

