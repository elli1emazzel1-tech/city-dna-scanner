'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, Clock, Loader2 } from 'lucide-react';
import type { ObservationSummary } from './cityscan-types';

interface RecentScansTableProps {
  observations: ObservationSummary[];
  cityName: string;
  onSelectObservation: (observation: ObservationSummary) => void;
  onViewAll: () => void;
  loading?: boolean;
}

export function RecentScansTable({
  observations,
  cityName,
  onSelectObservation,
  onViewAll,
  loading = false,
}: RecentScansTableProps) {
  const [sortDesc, setSortDesc] = useState(true);

  const sorted = useMemo(() => {
    return [...observations].sort((a, b) => {
      const da = new Date(a.acquiredAt ?? 0).getTime();
      const db = new Date(b.acquiredAt ?? 0).getTime();
      return sortDesc ? db - da : da - db;
    });
  }, [observations, sortDesc]);

  const statusLabel = (status: string): string => {
    if (status === 'ACCEPTED') return 'Completed';
    if (status === 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS') return 'Rejected — quorum';
    if (status === 'NO_CLEAR_OBSERVATION') return 'No clear observation';
    return 'Failed';
  };

  const statusClass = (status: string): string => {
    if (status === 'ACCEPTED') return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30';
    if (status === 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS') return 'bg-amber-500/15 text-amber-300 ring-amber-500/30';
    if (status === 'NO_CLEAR_OBSERVATION') return 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
    return 'bg-rose-500/15 text-rose-300 ring-rose-500/30';
  };

  return (
    <section className="rounded-xl border border-[#1b3041] bg-[#0a1926] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[#e8f0fe]">Recent Scans</h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-teal-300 hover:text-teal-400 underline underline-offset-4 flex items-center gap-1"
        >
          View all →
        </button>
      </div>

      {loading ? (
        <div className="h-[200px] flex flex-col items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-teal-300 mb-2" />
          <p className="text-xs text-slate-500">Loading scan history…</p>
        </div>
      ) : observations.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-500">No scan history for {cityName} yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setSortDesc((prev) => !prev)}
                    className="hover:text-teal-300 transition-colors"
                    aria-label={sortDesc ? 'Sort oldest first' : 'Sort newest first'}
                  >
                    Date {sortDesc ? '↓' : '↑'}
                  </button>
                </th>
                <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">City</th>
                <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Vegetation Change</th>
                <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Coverage</th>
                <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 5).map((observation) => (
                <tr
                  key={observation.id}
                  onClick={() => onSelectObservation(observation)}
                  className="border-b border-slate-700/10 hover:bg-[#122640]/50 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 text-xs">
                    <span className="text-slate-300">{new Date(observation.acquiredAt ?? 0).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <br />
                    <span className="text-[10px] text-slate-500">{new Date(observation.acquiredAt ?? 0).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC</span>
                  </td>
                  <td className="py-2.5 text-xs text-slate-300">{cityName}</td>
                  <td className="py-2.5 text-xs">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass(observation.status)}`}>
                      {statusLabel(observation.status)}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-slate-300">
                    {observation.commonValidPct !== null ? `${observation.commonValidPct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2.5 text-xs text-right text-slate-400">
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}