import type { ReactNode } from 'react';
import type { DataStatus } from '../../lib/data/types';
import type { ProjectionStatus } from '../../lib/data/simulation';

/** Map any data/projection status to a tailwind badge style. */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'SIMULATED':
      return 'bg-teal-950/60 text-teal-300 border border-teal-800/70';
    case 'INDICATIVE':
      return 'bg-violet-950/50 text-violet-300 border border-violet-900/70';
    case 'MODELLED':
    case 'FORECAST':
      return 'bg-sky-950/50 text-sky-300 border border-sky-900/70';
    case 'HISTORICAL':
    case 'CACHED':
      return 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/70';
    case 'OBSERVED':
      return 'bg-emerald-950/50 text-emerald-300 border border-emerald-900/70';
    case 'REPORTED':
    case 'CONNECTED':
      return 'bg-slate-800 text-slate-300 border border-slate-700';
    case 'ERROR':
      return 'bg-amber-950/50 text-amber-300 border border-amber-900/70';
    case 'UNAVAILABLE':
    default:
      return 'bg-slate-800/70 text-slate-500 border border-slate-700';
  }
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${statusBadgeClass(status)} ${className}`}>
      {status === 'ERROR' ? 'PROVIDER ERROR' : status}
    </span>
  );
}

/** Colour a change value: teal when favourable, rose when unfavourable, slate when neutral. */
export function changeClass(changePct: number | null, higherIsBetter: boolean): string {
  if (changePct == null || changePct === 0) return 'text-slate-400';
  const favourable = higherIsBetter ? changePct > 0 : changePct < 0;
  return favourable ? 'text-teal-300' : 'text-rose-300';
}

export function formatChange(changePct: number | null): string {
  if (changePct == null) return '—';
  const sign = changePct > 0 ? '+' : '';
  return `${sign}${changePct.toFixed(0)}%`;
}

export function projectionLabel(status: ProjectionStatus): string {
  return status;
}

/** A projection is "populated" when it carries a defensible value: a validated SIMULATED transform or a transparent INDICATIVE estimate. Only a genuine engine failure is UNAVAILABLE. */
export function projectionIsPopulated(status: ProjectionStatus): boolean {
  return status === 'SIMULATED' || status === 'INDICATIVE';
}

export function Card({
  children,
  className = '',
  title,
  action,
  subtitle,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-[#1b3041] bg-[#0a1926] ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-[#16293a] px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="truncate text-[12px] font-semibold text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function statusIsData(status: DataStatus | undefined): boolean {
  return !!status && status !== 'UNAVAILABLE' && status !== 'ERROR';
}
