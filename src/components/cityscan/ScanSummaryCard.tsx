'use client';

import { Droplets, Leaf, LayoutGrid, RefreshCw, ShieldAlert } from 'lucide-react';
import type { FindingSummary } from './cityscan-types';

interface ScanSummaryCardProps {
  finding: FindingSummary | null;
  observationsCount: number;
  onRefresh?: () => void;
}

export function ScanSummaryCard({ finding, observationsCount, onRefresh }: ScanSummaryCardProps) {
  const vegLoss = finding?.vegetationLossHa ?? 0;
  const vegGain = finding?.vegetationGainHa ?? 0;
  const netVegHa = vegLoss - vegGain;
  const netVegPct = finding?.vegetationAreaHaBefore
    ? ((-(netVegHa)) / finding.vegetationAreaHaBefore) * 100
    : 0;

  const waterGain = finding?.waterGainHa ?? 0;
  const waterLoss = finding?.waterLossHa ?? 0;
  const netWaterHa = waterGain - waterLoss;

  const urbanBareHa = (finding?.pixelAreaHa ?? 0) - ((finding?.vegetationAreaHaBefore ?? 0) + (finding?.waterAreaHaBefore ?? 0));

  return (
    <section className="flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#e8f0fe] flex items-center gap-2">
          <ShieldAlert size={16} className="text-teal-300" />
          Scan Summary
        </h2>
        {finding && onRefresh && (
          <button type="button" onClick={onRefresh} className="text-xs text-teal-300 hover:text-teal-400 underline underline-offset-4">
            <RefreshCw size={12} className="mr-1" /> Refresh
          </button>
        )}
      </div>

      {!finding ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <ShieldAlert size={32} className="mb-3 text-slate-600" />
          <h3 className="text-sm font-medium text-[#e8f0fe]">No change data available</h3>
          <p className="mt-1 text-xs text-slate-500">Run a scan or select a scan from history to view the summary.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 rounded-lg border border-[#1b3041] bg-[#0f1f33] p-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-rose-400" />
                <span className="text-xs font-medium text-[#e8f0fe]">
                  {netVegHa > 0 ? 'Net vegetation loss' : netVegHa < 0 ? 'Net vegetation gain' : 'No net vegetation change'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{observationsCount} observations compared</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-bold text-[#e8f0fe]">{netVegHa.toFixed(1)} ha</span>
              <p className="mt-0.5 text-xs text-slate-500">Net vegetation change (loss)</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#1b3041] bg-[#0f1f33] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Overall green cover change</span>
                <span className="text-xs font-mono text-rose-400">{netVegPct >= 0 ? '+' : ''}{netVegPct.toFixed(1)}%</span>
              </div>
              <span className="text-lg font-mono font-bold text-[#e8f0fe]">{netVegHa.toFixed(1)} ha</span>
            </div>
            <div className="rounded-lg border border-[#1b3041] bg-[#0f1f33] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Valid pixel coverage</span>
                <span className="text-xs font-mono text-teal-300">{finding.commonValidPct?.toFixed(1) ?? '—'}%</span>
              </div>
              <span className="text-lg font-mono font-bold text-[#e8f0fe]">{finding.commonValidPct?.toFixed(1) ?? '—'}%</span>
            </div>
            <div className="rounded-lg border border-[#1b3041] bg-[#0f1f33] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Observations compared</span>
                <span className="text-xs font-mono text-teal-300">{observationsCount}</span>
              </div>
              <span className="text-lg font-mono font-bold text-[#e8f0fe]">{observationsCount}</span>
            </div>
            <div className="rounded-lg border border-[#1b3041] bg-[#0f1f33] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Quorum threshold</span>
                <span className="text-xs font-mono text-slate-400">{finding.quorumRequiredPct ?? 70}%</span>
              </div>
              <span className="text-lg font-mono font-bold text-[#e8f0fe]">{finding.quorumRequiredPct ?? 70}%</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#1b3041] bg-[#0f1f33] p-3">
            <div className="flex items-center gap-2 mb-3">
              <Leaf size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-[#e8f0fe] uppercase tracking-wider">Key Changes</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-rose-400">
                    <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span className="text-slate-300">Vegetation loss</span>
                </div>
                <span className="font-mono text-rose-400">−{vegLoss.toFixed(1)} ha</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-emerald-400">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-slate-300">Vegetation gain</span>
                </div>
                <span className="font-mono text-emerald-400">+{vegGain.toFixed(1)} ha</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Droplets size={12} className="text-blue-400" />
                  <span className="text-slate-300">Water area change</span>
                </div>
                <span className={`font-mono ${netWaterHa >= 0 ? 'text-teal-400' : 'text-blue-400'}`}>
                  {netWaterHa >= 0 ? '+' : '−'}{Math.abs(netWaterHa).toFixed(1)} ha
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={12} className="text-slate-400" />
                  <span className="text-slate-300">Urban/bare land change</span>
                </div>
                <span className="font-mono text-slate-400">{urbanBareHa.toFixed(1)} ha</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}