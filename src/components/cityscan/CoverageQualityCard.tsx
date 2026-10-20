'use client';

import { CheckCircle2, Database, ShieldCheck } from 'lucide-react';
import type { FindingSummary } from './cityscan-types';

interface CoverageQualityCardProps {
  finding: FindingSummary | null;
  totalAoiPixels: number | null;
  validPixels: number | null;
}

export function CoverageQualityCard({ finding, totalAoiPixels, validPixels }: CoverageQualityCardProps) {
  const hasData = Boolean(finding);
  const commonValidPct = finding?.commonValidPct ?? null;
  const quorum = finding?.quorumRequiredPct ?? 70;
  const meetsQuorum = commonValidPct !== null && commonValidPct >= quorum;

  return (
    <section className="rounded-xl border border-[#1b3041] bg-[#0a1926] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#e8f0fe] flex items-center gap-2">
          <Database size={16} className="text-teal-300" />
          Coverage & Quality
        </h2>
        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
          meetsQuorum ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
        }`}>
          {meetsQuorum ? 'Meets quorum' : 'Below quorum'}
        </span>
      </div>

      {!hasData ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-center">
          <ShieldCheck size={24} className="mb-2 text-slate-600" />
          <p className="text-xs text-slate-500">No coverage data available</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Valid pixels</span>
              <span className="text-xs font-mono text-slate-400">of total</span>
            </div>
            <span className="text-lg font-mono font-bold text-[#e8f0fe]">{validPixels?.toLocaleString() ?? '—'}</span>
          </div>
          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Total AOI pixels</span>
              <span className="text-xs font-mono text-slate-400">scan window</span>
            </div>
            <span className="text-lg font-mono font-bold text-[#e8f0fe]">{totalAoiPixels?.toLocaleString() ?? '—'}</span>
          </div>
          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Coverage</span>
              <span className="text-xs font-mono text-slate-400">of AOI</span>
            </div>
            <span className="text-lg font-mono font-bold text-[#e8f0fe]">{commonValidPct?.toFixed(1) ?? '—'}%</span>
          </div>
          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Quorum threshold</span>
              <span className="text-xs font-mono text-slate-400">configured</span>
            </div>
            <span className="text-lg font-mono font-bold text-[#e8f0fe]">{quorum}%</span>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-[#1b3041] bg-[#071321]/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className={meetsQuorum ? 'text-emerald-400' : 'text-slate-500'} />
            <span className="text-xs font-medium text-[#e8f0fe]">
              Common valid-pixel coverage {commonValidPct?.toFixed(1) ?? '—'}%
              {commonValidPct !== null ? ` vs ${quorum}% quorum` : ''}
            </span>
          </div>
          <p className={`text-xs ${meetsQuorum ? 'text-emerald-300' : 'text-slate-400'}`}>
            {meetsQuorum
              ? 'Valid pixels meet the quorum requirement — change detection results are published.'
              : 'Valid pixels below quorum — change detection was rejected for insufficient common valid data.'}
          </p>
        </div>
        </>
      )}
    </section>
  );
}