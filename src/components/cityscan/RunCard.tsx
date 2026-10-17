'use client';

import { Loader2, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ScanRunResponse } from './cityscan-types';

function statusLabel(status: string): string {
  if (status === 'ACCEPTED') return 'Accepted finding';
  if (status === 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS') return 'Rejected — common pixels below quorum';
  if (status === 'NO_CLEAR_OBSERVATION') return 'No clear observation';
  return 'Failed';
}

export function RunCard({
  runInFlight,
  runStatus,
  runError,
  onRun,
}: {
  runInFlight: boolean;
  runStatus: ScanRunResponse | null;
  runError: string | null;
  onRun: () => void;
}) {
  if (runInFlight) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-[#9bb8da]">
        <Loader2 className="h-4 w-4 animate-spin text-[#2dd4bf]" />
        Running scan pipeline…
      </div>
    );
  }

  if (!runStatus) {
    if (!runError) return null;
    return (
      <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/5 p-4" role="alert">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-rose-400" />
          <span className="text-sm font-medium text-rose-300">Scan could not be run</span>
        </div>
        <p className="mt-2 text-sm text-[#c9d8e8]">{runError}</p>
      </div>
    );
  }

  return (
    <div
      className={`mt-4 rounded-md border p-4 ${
        runStatus.status === 'ACCEPTED'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : runStatus.status === 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS'
          ? 'border-amber-500/30 bg-amber-500/5'
          : runStatus.status === 'NO_CLEAR_OBSERVATION'
          ? 'border-slate-500/30 bg-slate-500/5'
          : 'border-rose-500/30 bg-rose-500/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {runStatus.status === 'ACCEPTED' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : runStatus.status === 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS' ? (
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        ) : runStatus.status === 'NO_CLEAR_OBSERVATION' ? (
          <Clock className="h-5 w-5 text-slate-400" />
        ) : (
          <XCircle className="h-5 w-5 text-rose-400" />
        )}
        <span className="text-sm font-medium">{statusLabel(runStatus.status)}</span>
      </div>
      <p className="mt-2 text-sm text-[#c9d8e8]">{runStatus.rejectionReason ?? 'Scan completed.'}</p>
      <div className="mt-3 flex gap-4 text-xs">
        <div className="flex justify-between">
          <span className="text-[#64748b]">Common valid</span>
          <span className="text-[#e8f0fe]">
            {runStatus.commonValidPixels ?? 0} of{' '}
            {runStatus.totalAoiPixels ?? 0} ({runStatus.commonValidPct ?? 0}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#64748b]">Quorum required</span>
          <span className="text-[#e8f0fe]">{runStatus.quorumRequiredPct}%</span>
        </div>
      </div>
      <button onClick={onRun} className="mt-3 text-xs text-[#2dd4bf] hover:underline">
        Run again
      </button>
    </div>
  );
}
