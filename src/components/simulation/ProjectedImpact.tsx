'use client';

import { Cloud, Wind, Trees, Waves, AlertTriangle, FlaskConical } from 'lucide-react';
import type { MetricId } from '../../lib/data/simulation';
import type { ProjectedMetric } from '../../lib/data/simulation';
import { StatusBadge, changeClass, formatChange, Card, projectionIsPopulated } from './simulationShared';

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

function ImpactCard({ metric, targetYear }: { metric: ProjectedMetric; targetYear: number }) {
  const Icon = ICONS[metric.metricId];
  const populated = projectionIsPopulated(metric.status);
  return (
    <article className={`flex flex-col rounded-lg border p-3 ${populated ? 'border-teal-900/60 bg-[#071f1c]/40' : 'border-[#1b3041] bg-[#071523]/60'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${populated ? 'border-teal-700/60 bg-teal-950/50 text-teal-300' : 'border-slate-700 bg-slate-800/60 text-slate-500'}`}>
            <Icon size={14} strokeWidth={1.9} />
          </span>
          <span className="truncate text-[11px] font-medium text-slate-200">{metric.label}</span>
        </div>
        <StatusBadge status={metric.status} />
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        {populated ? (
          <>
            <span className={`text-2xl font-semibold tracking-tight ${changeClass(metric.changePct, HIGHER_IS_BETTER[metric.metricId])}`}>
              {formatChange(metric.changePct)}
            </span>
            <span className="text-[9px] text-slate-500">projected change</span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-300/90">
            <AlertTriangle size={13} /> Simulation unavailable
          </span>
        )}
      </div>

      <dl className="mt-2 space-y-1 text-[9px]">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Baseline</dt>
          <dd className="truncate font-mono text-slate-300">{metric.baselineDisplay} <span className="text-slate-600">{metric.baselineValue != null ? metric.unit : ''}</span></dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Scenario · {targetYear}</dt>
          <dd className="truncate font-mono text-slate-300">{metric.projectedDisplay}</dd>
        </div>
      </dl>

      <div className="mt-2 flex items-center gap-1.5 border-t border-slate-800/70 pt-2 text-[8px] text-slate-600">
        <FlaskConical size={10} className="shrink-0" />
        <p className="line-clamp-2 leading-relaxed" title={metric.method}>{metric.method}</p>
      </div>
      <p className="mt-1 line-clamp-2 text-[8px] leading-relaxed text-slate-600" title={metric.limitation}>
        Limitation: {metric.limitation}
      </p>
    </article>
  );
}

export default function ProjectedImpact({ metrics, targetYear }: { metrics: ProjectedMetric[]; targetYear: number }) {
  const modelledCount = metrics.filter((metric) => projectionIsPopulated(metric.status)).length;
  return (
    <Card
      title="Projected Impact"
      subtitle="Estimated change compared with the current situation. Modelled scenario outputs, not predictions."
      action={
        <span className="rounded bg-slate-800 px-2 py-1 text-[9px] font-mono text-slate-400">
          Target {targetYear} · {modelledCount}/{metrics.length} modelled
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => (
          <ImpactCard key={metric.metricId} metric={metric} targetYear={targetYear} />
        ))}
      </div>
    </Card>
  );
}
