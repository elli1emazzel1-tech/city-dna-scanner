import type { EnvironmentalMetric } from '../../lib/data/types';
import { getPrimarySourceForMetric } from '../../lib/data/sourceCatalog';

const conditionColors: Record<EnvironmentalMetric['condition'], string> = {
  Good: 'text-emerald-300 bg-emerald-950/50',
  Moderate: 'text-amber-300 bg-amber-950/40',
  'Unhealthy for sensitive groups': 'text-orange-300 bg-orange-950/40',
  Unhealthy: 'text-rose-300 bg-rose-950/40',
  'Very unhealthy': 'text-rose-300 bg-rose-950/50',
  Hazardous: 'text-red-200 bg-red-950/60',
  High: 'text-rose-300 bg-rose-950/40',
  Elevated: 'text-amber-300 bg-amber-950/40',
  Stable: 'text-cyan-300 bg-cyan-950/40',
  Informational: 'text-sky-300 bg-sky-950/40',
  Unavailable: 'text-slate-400 bg-slate-800/70',
};

export default function EnvironmentalMetricCard({ metric, isLoading = false }: { metric: EnvironmentalMetric; isLoading?: boolean }) {
  const sourceInfo = getPrimarySourceForMetric(metric.id);
  return (
    <article className="min-w-0 rounded-md border border-[#1b3041] bg-[#0a1926] p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[10px] font-medium text-slate-400">{metric.label}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${conditionColors[isLoading ? 'Unavailable' : metric.condition]}`}>{isLoading ? 'Loading' : metric.condition}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`truncate text-xl font-semibold tracking-tight ${isLoading || metric.status === 'UNAVAILABLE' || metric.status === 'ERROR' ? 'text-slate-500' : 'text-slate-100'}`}>{isLoading ? 'Loading…' : metric.value}</span>
        <span className="shrink-0 text-[9px] text-slate-500">{metric.unit}</span>
      </div>
      <div className="mt-0.5 line-clamp-2 break-words text-[9px] leading-relaxed text-slate-500">{isLoading ? 'Requesting provider data…' : metric.subValue}</div>
      {!isLoading && metric.error && <p role="status" className="mt-1 text-[8px] leading-relaxed text-amber-300">{metric.error}</p>}
      <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-800/80 pt-2 text-[8px] text-slate-500">
        {sourceInfo ? (
          <a
            href={sourceInfo.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate text-slate-500 underline-offset-2 hover:text-teal-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/80"
            title={`${metric.source} — open the official source in a new tab`}
          >{metric.source}</a>
        ) : (
          <span className="min-w-0 truncate" title={metric.source}>{metric.source}</span>
        )}
        <span className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${metric.status === 'ERROR' ? 'bg-amber-950/50 text-amber-300' : 'bg-slate-800/80 text-slate-400'}`}>{isLoading ? 'LOADING' : metric.status === 'ERROR' ? 'PROVIDER ERROR' : metric.status}</span>
      </div>
      <div className="mt-1 text-[8px] text-slate-600">Updated: {isLoading ? 'Pending' : metric.updated ?? 'Unavailable'}</div>
    </article>
  );
}
