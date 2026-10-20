'use client';

import { Download, Satellite, Scroll } from 'lucide-react';
import type { FindingSummary } from './cityscan-types';

interface ImageDetailsPanelProps {
  finding: FindingSummary | null;
  cityName: string;
  countryName: string;
  onDownloadReport: (finding: FindingSummary) => void;
}

export function ImageDetailsPanel({
  finding,
  cityName,
  countryName,
  onDownloadReport,
}: ImageDetailsPanelProps) {
  const f = finding;

  const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatPct = (value: number | null): string => (value !== null ? `${value.toFixed(1)}%` : '—');

  return (
    <section className="rounded-xl border border-[#1b3041] bg-[#0a1926] p-4 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scroll size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[#e8f0fe]">Image Details</h2>
        </div>
        {f && (
          <button
            type="button"
            onClick={() => onDownloadReport(f)}
            className="flex items-center gap-1.5 rounded border border-teal-500/30 bg-teal-500/5 px-2.5 py-1.5 text-xs font-medium text-teal-300 hover:bg-teal-500/10 transition-colors"
          >
            <Download size={14} /> Download Report
          </button>
        )}
      </div>

      {!f ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <Satellite size={32} className="mb-3 text-slate-600" />
          <h3 className="text-sm font-medium text-[#e8f0fe]">No image details available</h3>
          <p className="mt-1 text-xs text-slate-500">Select a scan from the history to view metadata.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">City</span>
              <span className="text-xs font-mono text-slate-400 text-right">{cityName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Country</span>
              <span className="text-xs font-mono text-slate-400 text-right">{countryName}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">MGRS Tile</span>
              <span className="text-xs font-mono text-slate-400 text-right">{f.tile ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Acquisition (After)</span>
              <span className="text-xs font-mono text-slate-400 text-right">{formatDate(f.afterAcquiredAt)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Processing Baseline</span>
              <span className="text-xs font-mono text-slate-400 text-right">{f.baselineAfter ?? f.baselineBefore ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Cloud Cover</span>
              <span className="text-xs font-mono text-slate-400 text-right">{formatPct(f.cloudCoverPctAfter ?? f.cloudCoverPctBefore)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Source</span>
              <span className="text-xs font-mono text-slate-400 text-right">Sentinel-2 L2A</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Provider</span>
              <span className="text-xs font-mono text-slate-400 text-right">Element 84 Earth Search</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#1b3041] bg-[#071321]/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Attribution</span>
              <span className="text-[10px] font-mono text-slate-400 text-right truncate">Contains modified Copernicus Sentinel data</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">License</span>
              <span className="text-xs font-mono text-slate-400 text-right">Copernicus free & open</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}