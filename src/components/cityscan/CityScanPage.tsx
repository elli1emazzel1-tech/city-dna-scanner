'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronDown,
  Clock,
  FileText,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Satellite,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { cities, searchKnownCities } from '@/lib/data/cities';
import { openMeteoGeospatialProvider } from '@/lib/data/providers';
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
import { SatelliteComparisonPanel } from './SatelliteComparisonPanel';
import { ScanSummaryCard } from './ScanSummaryCard';
import { ChangeAnalysisChart } from './ChangeAnalysisChart';
import { EnvironmentalIndicesCards } from './EnvironmentalIndicesCards';
import { CoverageQualityCard } from './CoverageQualityCard';
import { RecentScansTable } from './RecentScansTable';
import { ImageDetailsPanel } from './ImageDetailsPanel';

const navTabs = [
  { label: 'Overview', href: '/cityscan', icon: LayoutDashboard },
  { label: 'Scans', href: '/cityscan/scans', icon: FileText },
  { label: 'WatchZones', href: '/cityscan/watchzones', icon: MapIcon },
  { label: 'Reports', href: '/cityscan/reports', icon: FileText },
  { label: 'Settings', href: '/cityscan/settings', icon: Settings },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function haString(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(3) + ' ha';
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init });
  if (!response.ok) {
    let message = 'Request failed (' + response.status + ')';
    let hint: string | undefined;
    try {
      const body = (await response.json()) as Record<string, unknown>;
      if (typeof body.error === 'string') message = body.error;
      if (typeof body.hint === 'string') hint = body.hint;
    } catch { /* non-JSON error body */ }
    throw { status: response.status, message, hint } as CityScanError;
  }
  return (await response.json()) as T;
}

export default function CityScanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<{
    pairs: FindingSummary[];
    observations: ObservationSummary[];
    selectedFinding: FindingSummary | null;
    selectedObservation: ObservationSummary | null;
    selectedCity: City;
    runStatus: ScanRunResponse | null;
    runError: string | null;
    fatalError: CityScanError | null;
    loading: boolean;
    runInFlight: boolean;
    downloadLoading: boolean;
  }>(() => {
    const active = cities.find((city) => city.id === 'amsterdam') ?? cities[0];
    return {
      pairs: [],
      observations: [],
      selectedFinding: null,
      selectedObservation: null,
      selectedCity: active,
      runStatus: null,
      runError: null,
      fatalError: null,
      loading: true,
      runInFlight: false,
      downloadLoading: false,
    };
  });

  const { city: shellCity, setCity: setShellCity } = useCitySelection();
  const [hasSession, setHasSession] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<LaunchCityId | string>(() =>
    isLaunchCityId(shellCity.id) ? shellCity.id : 'amsterdam',
  );
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [citySearchOpen, setCitySearchOpen] = useState(false);

  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? state.selectedCity;

  // Keep the scan target in step with the shared header city when it is a
  // launch city (the scan pipeline only accepts the configured catalog cities).
  useEffect(() => {
    if (isLaunchCityId(shellCity.id) && shellCity.id !== selectedCityId) {
      setSelectedCityId(shellCity.id);
    }
  }, [shellCity.id, selectedCityId]);

  // Optional session check: only decides whether scan results can be saved into
  // the visitor's organisation. It never gates browsing or running a scan.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) setHasSession(true);
    });
    return () => { active = false; };
  }, []);

  // Real city search: debounced Open-Meteo geocoding merged with the local
  // catalog. Any resolved location can be selected; the scan pipeline itself
  // only accepts the configured catalog cities (see isCatalogCity below).
  const searchAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const query = citySearchQuery.trim();
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const timer = window.setTimeout(() => {
      openMeteoGeospatialProvider
        .searchCities(query, controller.signal)
        .then((remote) => {
          if (controller.signal.aborted) return;
          const known = searchKnownCities(query);
          const merged = Array.from(
            new Map<string, City>(
              [...remote, ...known].map((c) => [
                `${c.name.toLocaleLowerCase()}-${c.countryCode}`,
                c,
              ]),
            ).values(),
          ).slice(0, 7);
          setCitySuggestions(merged);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error('City geocoding lookup failed.', error);
          setCitySuggestions(searchKnownCities(query));
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [citySearchQuery]);

  const refresh = useCallback(async () => {
    const errors: CityScanError[] = [];
    let pairs: FindingSummary[] = [];
    let observations: ObservationSummary[] = [];
    try {
      const response = await api<PairsResponse>(
        '/api/cityscan/pairs?cityId=' + encodeURIComponent(selectedCityId),
      );
      pairs = response.pairs ?? [];
    } catch (error) {
      errors.push(error as CityScanError);
    }
    try {
      const response = await api<ObservationsResponse>(
        '/api/cityscan/observations?cityId=' + encodeURIComponent(selectedCityId) + '&limit=200',
      );
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
            loading: false,
            fatalError: null,
            runStatus: null,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, fatalError: error as CityScanError }));
        }
      }
    })();
    return () => { cancelled = true; };
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
      try {
        const result = await refresh();
        setState((prev) => ({ ...prev, pairs: result.pairs, observations: result.observations }));
      } catch { /* the scan result is already on screen; the history refresh can wait */ }
    } catch (error) {
      setState((prev) => ({ ...prev, runInFlight: false, runError: (error as CityScanError).message }));
    }
  }, [selectedCityId, refresh]);

  const selectCity = (id: LaunchCityId | string) => {
    if (id === selectedCityId) return;
    setSelectedCityId(id);
    const next = cities.find((city) => city.id === id);
    if (next) setShellCity(next);
    setState((prev) => ({
      ...prev,
      loading: true,
      fatalError: null,
      selectedFinding: null,
      selectedObservation: null,
    }));
    setCitySearchOpen(false);
    setCitySearchQuery('');
  };

  const selectObservation = (observation: ObservationSummary) => {
    // Link the clicked history row to its accepted finding (if one exists).
    // Rejected / no-clear observations have no finding, so the panels switch
    // to their honest empty state instead of showing a different scan's data.
    const match =
      state.pairs.find(
        (pair) => pair.afterId === observation.itemId || pair.beforeId === observation.itemId,
      ) ?? null;
    setState((prev) => ({
      ...prev,
      selectedObservation: observation,
      selectedFinding: match,
    }));
  };

  const reload = useCallback(async () => {
    try {
      const result = await refresh();
      setState((prev) => ({
        ...prev,
        pairs: result.pairs,
        observations: result.observations,
        fatalError: null,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, fatalError: error as CityScanError }));
    }
  }, [refresh]);

  const handleDownloadReport = (finding: FindingSummary) => {
    setState((prev) => ({ ...prev, downloadLoading: true }));
    void api<{
      id: string; beforeAcquiredAt: string | null; afterAcquiredAt: string | null;
      tile: string | null; cloudCoverPctBefore: number | null; cloudCoverPctAfter: number | null;
      baselineBefore: string | null; baselineAfter: string | null;
      vegetationLossHa: number | null; vegetationGainHa: number | null;
      waterGainHa: number | null; waterLossHa: number | null;
      commonValidPct: number | null; quorumRequiredPct: number | null;
      methodVersion: string | null;
    }>(
      '/api/cityscan/findings?cityId=' + encodeURIComponent(selectedCityId)
        + '&pairId=' + encodeURIComponent(finding.id),
    ).then((detail) => {
      const report = [
        '# CityScan Evidence Report',
        '',
        '**City:** ' + selectedCity.name + ', ' + selectedCity.country,
        '**Scan ID:** ' + detail.id,
        '**Generated:** ' + new Date().toISOString(),
        '',
        '## Imagery',
        '- Before: ' + formatDate(detail.beforeAcquiredAt),
        '- After: ' + formatDate(detail.afterAcquiredAt),
        '- MGRS Tile: ' + (detail.tile ?? '—'),
        '- Processing Baseline: ' + (detail.baselineAfter ?? detail.baselineBefore ?? '—'),
        '- Cloud Cover: ' + (detail.cloudCoverPctAfter ?? detail.cloudCoverPctBefore ?? '—') + '%',
        '',
        '## Change Detection',
        '- Vegetation Loss: ' + haString(detail.vegetationLossHa),
        '- Vegetation Gain: ' + haString(detail.vegetationGainHa),
        '- Water Gain: ' + haString(detail.waterGainHa),
        '- Water Loss: ' + haString(detail.waterLossHa),
        '- Net Vegetation Change: ' + haString(((detail.vegetationLossHa ?? 0) - (detail.vegetationGainHa ?? 0))),
        '',
        '## Quality',
        '- Common Valid Pixels: ' + (detail.commonValidPct?.toFixed(1) ?? '—') + '%',
        '- Quorum Required: ' + (detail.quorumRequiredPct ?? 70) + '%',
        '- Method Version: ' + (detail.methodVersion ?? '—'),
        '',
        '## Attribution',
        'Contains modified Copernicus Sentinel data [2026] · Element 84 Earth Search',
      ].join('\n');

      const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cityscan-' + selectedCity.id + '-' + detail.id + '.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState((prev) => ({ ...prev, downloadLoading: false }));
    }).catch((error) => {
      console.error('Failed to download report:', error);
      setState((prev) => ({
        ...prev,
        downloadLoading: false,
        runError: 'Failed to generate report. Please try again.',
      }));
    });
  };

  const latestFinding = state.pairs[0] ?? null;
  const latestObservation = state.observations[0] ?? null;
  // A clicked history row wins over "latest": rejected / no-clear scans have no
  // finding, so their selection renders the panels' empty states rather than
  // silently showing a different (accepted) scan's numbers.
  const activeFinding = state.selectedObservation ? state.selectedFinding : latestFinding;
  const activeObservation =
    state.selectedObservation
    ?? (activeFinding
      ? state.observations.find((o) => o.itemId === activeFinding.afterId) ?? null
      : null)
    ?? latestObservation;
  // The scan pipeline accepts any configured catalog city (src/lib/data/cities.ts);
  // locations resolved only via geocoding have no catalog id, so scanning them
  // is not possible and the limitation is surfaced instead of faking data.
  const isCatalogCity = cities.some((entry) => entry.id === selectedCityId);

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100">
      <header className="fixed inset-x-0 top-0 z-[1000] border-b border-[#1a2c3a] bg-[#081521]/90 backdrop-blur-md">
        <div className="flex h-[56px] items-center gap-4 border-b border-[#1a2c3a] bg-[#081521]/90 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Satellite size={16} strokeWidth={2} className="text-teal-300" />
            <span className="text-sm font-semibold tracking-tight text-[#e8f0fe]">
              City<span className="text-teal-300">Scan</span>
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700 mx-3"></div>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="global-search"
                value={citySearchQuery}
                onChange={(e) => {
                  setCitySearchQuery(e.target.value);
                  setCitySearchOpen(e.target.value.trim().length >= 2);
                }}
                placeholder="Search cities, regions, or WatchZones…"
                className="h-9 w-full rounded-md border border-[#1c3042] bg-[#071523] pl-10 pr-3 text-xs text-slate-100 outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20"
              />
            </div>
            {citySearchOpen && citySearchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-1 z-[1100] overflow-hidden rounded-md border border-[#24384a] bg-[#071523] shadow-2xl">
                {citySuggestions.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => selectCity(city.id)}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-teal-400/10"
                  >
                    <MapPin size={14} className="text-teal-300" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-slate-100">{city.name}</span>
                      <span className="block truncate text-[10px] text-slate-500">{city.country}</span>
                    </span>
                    <span className="ml-auto font-mono text-[9px] text-slate-600">{city.countryCode}</span>
                  </button>
                ))}
                {citySuggestions.length === 0 && (
                  <p className="px-3.5 py-3 text-[11px] text-slate-400">No matching city.</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-teal-300 transition-colors" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button type="button" className="flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/5 px-2.5 py-1 text-teal-300 hover:bg-teal-400/10 transition-colors" aria-label="User profile">
              <div className="h-6 w-6 rounded-full bg-teal-400/20 flex items-center justify-center text-xs font-bold text-teal-400 border border-teal-400/30">ED</div>
              <span className="text-xs font-medium text-slate-200 hidden sm:block">Emma D</span>
              <User size={14} className="text-teal-300 ml-1" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-[#1a2c3a] bg-[#07111b] px-4 sm:px-6 py-2">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-teal-300">
            <ArrowRight size={12} className="text-slate-600" />
            Back to dashboard
          </Link>
          <div className="h-3 w-px bg-slate-700 mx-3"></div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-teal-300" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#e8f0fe]">{selectedCity.name}</span>
              <span className="text-[10px] text-slate-500">{selectedCity.country}</span>
            </div>
            <button
              type="button"
              onClick={() => setCitySearchOpen(true)}
              className="ml-1 p-1 text-slate-500 hover:text-teal-300"
              aria-label="Change city"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="h-3 w-px bg-slate-700 mx-3"></div>
          <div className="flex items-center gap-2 rounded border border-slate-700/50 bg-[#0a1926] px-2 py-1">
            <Clock size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-400">Next scan</span>
            <span className="text-xs font-medium text-teal-300">In 4 days</span>
            <span className="text-[10px] text-slate-500">Sun 02:00 UTC</span>
          </div>
          {!isCatalogCity && (
            <span className="text-[10px] text-amber-300">
              The scan pipeline only supports the configured catalog cities — this location shows empty states until it is added.
            </span>
          )}
          <button
            type="button"
            onClick={() => void runScan()}
            disabled={state.runInFlight || !isCatalogCity}
            title={
              !isCatalogCity
                ? 'Scanning requires a catalog city.'
                : hasSession
                  ? 'Results save to your organisation.'
                  : 'No account needed — results are computed for this session only.'
            }
            className="ml-auto inline-flex items-center gap-2 rounded-md bg-teal-500/90 px-3 py-1.5 text-xs font-medium text-[#04211c] hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {state.runInFlight ? 'Scanning…' : 'Run scan'}
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-[#1a2c3a] bg-[#07111b] px-4 sm:px-6 overflow-x-auto pb-1">
          {navTabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={
                  'flex h-8 items-center gap-2 px-3 text-[11px] font-medium transition-colors '
                  + (active
                    ? 'bg-teal-950/40 text-teal-300 border-b-2 border-teal-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40')
                }
              >
                <tab.icon size={13} strokeWidth={1.6} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="pt-[168px] px-4 sm:px-6 pb-8">
        <div className="mx-auto max-w-[1680px]">

          {state.fatalError ? (
            <div
              className={`rounded-xl border p-4 mb-6 ${
                state.fatalError.status === 401 || state.fatalError.status === 403
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-rose-500/30 bg-rose-500/5'
              }`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-300">
                    {state.fatalError.status === 401
                      ? 'CityScan data is not set up yet'
                      : state.fatalError.status === 403
                        ? 'Access restricted'
                        : 'CityScan data unavailable'}
                  </h3>
                  <p className="mt-1 text-sm text-[#c9d8e8]">{state.fatalError.message}</p>
                  {state.fatalError.hint && (
                    <p className="mt-2 text-xs text-[#9bb8da]">{state.fatalError.hint}</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {!state.fatalError && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <SatelliteComparisonPanel
                  finding={activeFinding}
                />
                <div className="grid gap-6 lg:grid-cols-2">
                  <ChangeAnalysisChart
                    finding={activeFinding}
                  />
                  <CoverageQualityCard
                    finding={activeFinding}
                    totalAoiPixels={activeObservation?.totalAoiPixels ?? null}
                    validPixels={activeObservation?.validPixels ?? null}
                  />
                </div>
                <EnvironmentalIndicesCards
                  finding={activeFinding}
                />
                <RecentScansTable
                  observations={state.observations}
                  cityName={selectedCity.name}
                  onSelectObservation={selectObservation}
                  onViewAll={() => router.push('/cityscan/scans?cityId=' + selectedCityId)}
                  loading={state.loading}
                />
              </div>
              <div className="lg:col-span-4 flex flex-col gap-6">
                <ScanSummaryCard
                  finding={activeFinding}
                  observationsCount={state.observations.length}
                  onRefresh={() => void reload()}
                />
                <ImageDetailsPanel
                  finding={activeFinding}
                  cityName={selectedCity.name}
                  countryName={selectedCity.country}
                  onDownloadReport={handleDownloadReport}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {state.runInFlight || state.runError || state.runStatus ? (
        <div className="fixed bottom-4 right-4 z-[500] w-[420px] rounded-xl border border-[#1b3041] bg-[#0a1926] p-4 shadow-2xl">
          <RunCard
            runInFlight={state.runInFlight}
            runStatus={state.runStatus}
            runError={state.runError}
            onRun={() => void runScan()}
          />
        </div>
      ) : null}
    </div>
  );
}
