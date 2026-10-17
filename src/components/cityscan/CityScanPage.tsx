'use client';

import { useEffect, useCallback, useState } from 'react';
import type { SVGProps } from 'react';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { cities } from '@/lib/data/cities';
import type { City } from '@/lib/data/types';
import { createClient } from '@/lib/supabase/client';
import { useCitySelection } from '@/components/dashboard/CitySelectionProvider';
import {
  isLaunchCityId,
  type LaunchCityId,
  type ObservationSummary,
  type PairsResponse,
  type ObservationsResponse,
  type FindingSummary,
  type ScanRunResponse,
  type CityScanError,
} from './cityscan-types';
import { RunCard } from './RunCard';

/** CityScan is scoped to the five launch cities (placeholder geography). */
const launchCities = cities.filter((city) => isLaunchCityId(city.id));

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffM = Math.round(diffMs / 60000);
  if (diffM < 1) return 'just now';
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.round(diffMs / 3600000);
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return 'yesterday';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dayOfYear(iso: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

function CityScanPage() {
  const [state, setState] = useState<{
    pairs: FindingSummary[];
    observations: ObservationSummary[];
    detail: { kind: 'finding' | 'observation'; id: string } | null;
    selectedCity: City;
    runStatus: ScanRunResponse | null;
    runError: string | null;
    fatalError: CityScanError | null;
    loading: boolean;
    runInFlight: boolean;
  }>(() => {
    const active = (Array.isArray(cities) ? cities : []).find((city) => city.id === 'amsterdam') ?? cities[0];
    return {
      pairs: [],
      observations: [],
      detail: null,
      selectedCity: active,
      runStatus: null,
      runError: null,
      fatalError: null,
      loading: true,
      runInFlight: false,
    };
  });

  const { city: shellCity, setCity: setShellCity } = useCitySelection();
  // Optional session: when a signed-in org member visits, POST /scan persists
  // into their organisation and reads are org-scoped. Anonymous visitors get
  // the public views for reads and compute-only scan results.
  const [hasSession, setHasSession] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<LaunchCityId>(() =>
    isLaunchCityId(shellCity.id) ? shellCity.id : 'amsterdam',
  );

  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? state.selectedCity;

  // Keep the scan target in step with the shared header city when the header
  // city is one of the five launch cities (the target must stay a launch city).
  useEffect(() => {
    if (isLaunchCityId(shellCity.id) && shellCity.id !== selectedCityId) {
      setSelectedCityId(shellCity.id);
    }
  }, [shellCity.id, selectedCityId]);

  // Optional session check: only decides whether scan results can be saved
  // into the visitor's organisation and whether reads are org-scoped. It
  // never gates browsing or running a scan — anonymous visitors get public
  // reads and compute-only results.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) setHasSession(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const errors: CityScanError[] = [];
    let pairs: FindingSummary[] = [];
    let observations: ObservationSummary[] = [];
    try {
      const response = await api<PairsResponse>(`/api/cityscan/pairs?cityId=${encodeURIComponent(selectedCityId)}`);
      pairs = response.pairs ?? [];
    } catch (error) {
      errors.push(error as CityScanError);
    }
    try {
      const response = await api<ObservationsResponse>(`/api/cityscan/observations?cityId=${encodeURIComponent(selectedCityId)}&limit=200`);
      observations = response.observations ?? [];
    } catch (error) {
      errors.push(error as CityScanError);
    }
    if (errors.length > 0) throw errors[0];
    return { pairs, observations };
  }, [selectedCityId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await refresh();
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            pairs: result.pairs,
            observations: result.observations,
            detail: null,
            loading: false,
            fatalError: null,
            runStatus: null,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            fatalError: error as CityScanError,
          }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const runScan = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, runInFlight: true, runError: null, runStatus: null }));
    try {
      const response = await api<ScanRunResponse>('/api/cityscan/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: selectedCityId }),
      });
      setState((prev) => ({ ...prev, runStatus: response, runInFlight: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, runInFlight: false, runError: (error as CityScanError).message }));
      return;
    }
    try {
      const result = await refresh();
      setState((prev) => ({ ...prev, pairs: result.pairs, observations: result.observations }));
    } catch {
      /* the scan result is already on screen; the history refresh can wait */
    }
  }, [selectedCityId, refresh]);

  const selectCity = (id: LaunchCityId) => {
    if (id === selectedCityId) return;
    setSelectedCityId(id);
    const next = cities.find((city) => city.id === id);
    if (next) setShellCity(next);
    setState((prev) => ({ ...prev, loading: true, fatalError: null, detail: null }));
  };

  const selectPair = (pair: FindingSummary) => {
    setState((prev) => ({ ...prev, detail: { kind: 'finding', id: pair.id } }));
  };

  const selectObservation = (observation: ObservationSummary) => {
    setState((prev) => ({ ...prev, detail: { kind: 'observation', id: observation.id } }));
  };

  return (
    <div className="text-[#e8f0fe]">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#e8f0fe]">City Scan</h1>
          </div>
        </header>

        <section className="mt-6 rounded-xl border border-[#1b3041] bg-[#0f1f33] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label htmlFor="cityscan-city" className="text-sm font-medium text-[#9bb8da]">
                Target city
              </label>
              <select
                id="cityscan-city"
                value={selectedCityId}
                onChange={(event) => selectCity(event.target.value as LaunchCityId)}
                className="rounded-md border border-[#1b3041] bg-[#0a1926] px-3 py-2 text-sm text-[#e8f0fe] outline-none focus:border-[#2dd4bf] transition-colors"
              >
                {launchCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.country})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void runScan()}
                disabled={state.runInFlight}
                className="inline-flex items-center gap-2 rounded-md bg-[#2dd4bf] px-4 py-2 text-sm font-medium text-[#0a1926] hover:brightness-110 transition-colors disabled:opacity-50"
              >
                {state.runInFlight ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Run scan
                  </>
                )}
              </button>
              <span className="text-xs text-[#64748b]">
                {hasSession ? 'Results save to your organisation.' : 'No account needed — results are computed for this session only.'}
              </span>
            </div>
          </div>

          <RunCard
            runInFlight={state.runInFlight}
            runStatus={state.runStatus}
            runError={state.runError}
            onRun={() => void runScan()}
          />
        </section>

        {state.fatalError ? (
          state.fatalError.status === 401 ? (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4" role="alert">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <h2 className="text-sm font-medium text-amber-300">CityScan data is not set up yet</h2>
                  <p className="mt-1 text-sm text-[#c9d8e8]">
                    {state.fatalError.message || 'CityScan read access is not configured on this deployment yet.'}
                  </p>
                  {state.fatalError.hint ? (
                    <p className="mt-2 text-xs text-[#9bb8da]">{state.fatalError.hint}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : state.fatalError.status === 403 ? (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4" role="alert">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <h2 className="text-sm font-medium text-amber-300">Access restricted</h2>
                  <p className="mt-1 text-sm text-[#c9d8e8]">
                    {state.fatalError.message || 'Your account does not have organisation membership for CityScan.'}
                  </p>
                  {state.fatalError.hint ? (
                    <p className="mt-2 text-xs text-[#9bb8da]">{state.fatalError.hint}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4" role="alert">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <div className="flex-1">
                  <h2 className="text-sm font-medium text-rose-300">CityScan data unavailable</h2>
                  <p className="mt-1 text-sm text-[#c9d8e8]">{state.fatalError.message}</p>
                  {state.fatalError.hint ? (
                    <p className="mt-2 text-xs text-[#9bb8da]">{state.fatalError.hint}</p>
                  ) : null}
                </div>
              </div>
            </div>
          )
        ) : null}

        {!state.fatalError && (
          <div className="mt-4 grid gap-5 lg:grid-cols-5">
            <EvidencePanel
              city={selectedCity}
              pairs={state.pairs}
              observations={state.observations}
              onSelectPair={selectPair}
              onSelectObservation={selectObservation}
            />


        </div>
 )}
  </div>
  );
}
function EvidenceEpoch({
  label,
  itemId,
  acquiredAt,
  tile,
  cloudCoverPct,
  baseline,
  season,
  dayOfYear,
  date,
}: {
  label: string;
  itemId: string | null;
  acquiredAt: string | null;
  tile: string | null;
  cloudCoverPct: number | null;
  baseline: string | null;
  season: string;
  dayOfYear: number | null;
  date: string;
}) {
  return (
    <div className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3">
      <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
        <span className="font-medium text-[#e8f0fe]">{label}</span>
        <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[10px] text-[#9bb8da]">
          {season} · DOY {dayOfYear ?? '—'}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-[#e8f0fe]">{date}</p>
      <p className="text-xs text-[#9bb8da]">
        {itemId ? <>STAC item: <code>{shortId(itemId)}</code></> : 'No STAC item available'}
        {tile ? <> · Tile {tile}</> : null}
      </p>
      <p className="text-xs text-[#9bb8da]">
        Cloud cover: {cloudCoverPct ?? '—'}% · Baseline: {baseline ?? '—'}
      </p>
    </div>
  );
}
function EvidenceEpochGrid({ finding }: { finding: FindingSummary }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <EvidenceEpoch
        label="Before"
        itemId={finding.beforeId}
        acquiredAt={finding.beforeAcquiredAt}
        tile={finding.tile}
        cloudCoverPct={finding.cloudCoverPctBefore}
        baseline={finding.baselineBefore}
        season={seasonLabel(finding.beforeAcquiredAt)}
        dayOfYear={dayOfYear(finding.beforeAcquiredAt)}
        date={formatDate(finding.beforeAcquiredAt)}
      />
      <EvidenceEpoch
        label="After"
        itemId={finding.afterId}
        acquiredAt={finding.afterAcquiredAt}
        tile={finding.tile}
        cloudCoverPct={finding.cloudCoverPctAfter}
        baseline={finding.baselineAfter}
        season={seasonLabel(finding.afterAcquiredAt)}
        dayOfYear={dayOfYear(finding.afterAcquiredAt)}
        date={formatDate(finding.afterAcquiredAt)}
      />
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-[#64748b]">{label}</span>
      <span className="text-sm font-medium text-[#e8f0fe]">{value}</span>
    </div>
  );
}
function EvidencePanel({ city, pairs, observations, onSelectPair, onSelectObservation }: {
  city: City;
  pairs: FindingSummary[];
  observations: ObservationSummary[];
  onSelectPair: (pair: FindingSummary) => void;
  onSelectObservation: (observation: ObservationSummary) => void;
}) {
  const [detail, setDetail] = useState<{ kind: 'finding' | 'observation'; id: string } | null>(null);
  const latestAcceptedPair = pairs[0] ?? null;

  if (observations.length === 0 && pairs.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[#e8f0fe]">Scan history</h2>
        </div>
        <p className="mt-2 text-sm text-[#9bb8da]">No scan history for {city.name} yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#e8f0fe]">Scan history</h2>
        <span className="text-xs text-[#64748b]">{observations.length} row{observations.length !== 1 ? 's' : ''}</span>
      </div>

      <ul className="mt-3 space-y-2">
        {observations.map((observation) => {
          return (
            <li
              key={observation.id}
              className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3 cursor-pointer transition-colors hover:bg-[#16263c] focus-within:ring-2 focus-within:ring-[#2dd4bf]/40"
              onClick={() => onSelectObservation(observation)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(observation.status)}`}>
                  {STATUS_LABELS[observation.status] ?? observation.status}
                </span>
                <span className="text-xs text-[#64748b]">{triggerLabel(observation.triggerSource)}</span>
                <span className="text-xs text-[#9bb8da]">{formatDateTime(observation.acquiredAt)}</span>
                {observation.tile ? <span className="text-xs text-[#9bb8da]">Tile {observation.tile}</span> : null}
                {observation.platform ? <span className="text-xs text-[#9bb8da]">{observation.platform}</span> : null}
                <span className="text-xs text-[#64748b]">{shortId(observation.itemId)}</span>
                <span className="text-xs text-[#64748b]">
                  {observation.commonValidPct !== null ? `${observation.commonValidPct}%` : '—'}
                </span>
                {observation.rejectionReason ? (
                  <span className="text-xs text-amber-300 max-w-xs truncate" title={observation.rejectionReason}>
                    {observation.rejectionReason}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {latestAcceptedPair ? (
        <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Latest accepted pair</span>
          </div>
          <p className="mt-1 text-xs text-[#9bb8da]">
            Pair {latestAcceptedPair.beforeId} → {latestAcceptedPair.afterId} · acquired {formatDate(latestAcceptedPair.afterAcquiredAt)}
          </p>
          <button
            onClick={() => onSelectPair(latestAcceptedPair)}
            className="mt-2 text-xs text-[#2dd4bf] hover:underline"
          >
            Open evidence card
          </button>
        </div>
      ) : null}
    </div>
  );
}
function HistoryPanel({
  items,
  onSelect,
  selected,
}: {
  items: FindingSummary[];
  onSelect: (pair: FindingSummary) => void;
  selected: { id: string } | null;
}) {
  if (items.length === 0) return null;
  return (
    <div className="col-span-5 mt-3 overflow-x-auto">
      <ul className="flex gap-3 whitespace-x-pre-wrap">
        {items.map((pair) => (
          <li key={pair.id}>
            <button
              onClick={() => onSelect(pair)}
              className={`text-xs border border-[#1b3041] bg-[#0f1f33] px-3 py-2 text-left hover:bg-[#17304a] transition-colors ${
                selected?.id === pair.id ? 'bg-[#17304a] ring-1 ring-[#2dd4bf]' : ''
              }`}
            >
              <span className="font-medium text-[#e8f0fe]">
                {pair.beforeId} → {pair.afterId} · {pair.id}
              </span>
              <span className="block text-xs text-[#9bb8da] mt-0.5">
                {pair.beforeId} → {pair.afterId} · acquired {formatDate(pair.afterAcquiredAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArrowLeft({ ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function ndviDelta(finding: FindingSummary): string {
  if (finding.ndviMeanBefore === null || finding.ndviMeanAfter === null) return '—';
  const delta = finding.ndviMeanAfter - finding.ndviMeanBefore;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`;
}
function ndwiDelta(finding: FindingSummary): string {
  if (finding.ndwiMeanBefore === null || finding.ndwiMeanAfter === null) return '—';
  const delta = finding.ndwiMeanAfter - finding.ndwiMeanBefore;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`;
}
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let hint: string | undefined;
    try {
      const body = (await response.json()) as Record<string, unknown>;
      if (typeof body.error === 'string') message = body.error;
      if (typeof body.hint === 'string') hint = body.hint;
    } catch {
      /* non-JSON error body */
    }
    throw { status: response.status, message, hint } as CityScanError;
  }
  return (await response.json()) as T;
}
function haString(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(3)} ha`;
}

function seasonLabel(iso: string | null): string {
  const day = dayOfYear(iso);
  if (day === null) return '—';
  const month = new Date(iso!).getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

function shortId(value: string | null): string {
  if (!value) return '—';
  return value.length > 14 ? `${value.slice(0, 12)}…` : value;
}

function statusClass(status: string): string {
  if (status === 'ACCEPTED') return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30';
  if (status === 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS') return 'bg-amber-500/15 text-amber-300 ring-amber-500/30';
  if (status === 'NO_CLEAR_OBSERVATION') return 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
  if (status === 'FAILED') return 'bg-rose-500/15 text-rose-300 ring-rose-500/30';
  return 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
}

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Accepted finding',
  REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS: 'Rejected — common pixels below quorum',
  NO_CLEAR_OBSERVATION: 'No clear observation',
  FAILED: 'Failed',
};

function triggerLabel(source: string): string {
  if (source === 'cron') return 'System · weekly cron';
  return 'Manual';
}

export default CityScanPage;
