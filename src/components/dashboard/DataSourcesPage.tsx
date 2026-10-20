'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ChevronDown, Clock3, Database, Info, XCircle } from 'lucide-react';
import DashboardShell from './DashboardShell';
import { useCitySelection } from './CitySelectionProvider';
import { useCityEnvironmentalData } from './useCityEnvironmentalData';
import { getCityPopulation } from '../../lib/data/population';
import type { CityPopulation } from '../../lib/data/population';
import {
  CATALOGUE_ROWS,
  dataSources,
  getDataSource,
  isSourceAvailable,
  latestProviderTimestamp,
  resolveCatalogueRow,
  resolveSourceStatus,
} from '../../lib/data/sourceCatalog';
import type { SourceStatus, SourceStatusContext } from '../../lib/data/sourceCatalog';

const statusAppearance: Record<SourceStatus, { label: string; className: string }> = {
  AVAILABLE: { label: 'Available', className: 'border-teal-900/70 bg-teal-950/50 text-teal-300' },
  CONFIGURED: { label: 'Configured', className: 'border-sky-900/60 bg-sky-950/40 text-sky-300' },
  STATIC: { label: 'Static asset', className: 'border-slate-700/80 bg-slate-800/60 text-slate-300' },
  DEGRADED: { label: 'Provider error', className: 'border-amber-900/60 bg-amber-950/50 text-amber-300' },
  UNAVAILABLE: { label: 'Unavailable', className: 'border-rose-900/60 bg-rose-950/40 text-rose-300' },
};

const focusClasses = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/80';

function StatusPill({ status, pending = false }: { status: SourceStatus; pending?: boolean }) {
  if (pending) {
    return <span className="shrink-0 rounded border border-slate-700/80 bg-slate-800/60 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-400">Checking</span>;
  }
  const appearance = statusAppearance[status];
  return <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${appearance.className}`}>{appearance.label}</span>;
}

function SummaryTile({ label, value, icon, valueClassName = 'text-[15px] font-semibold tracking-tight text-slate-100' }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md border border-[#1b3041] bg-[#0a1926] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[8px] font-medium uppercase tracking-wide text-slate-500">{icon}{label}</div>
      <p className={`mt-1 leading-snug ${valueClassName}`}>{value}</p>
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] uppercase tracking-wide text-slate-600">{label}</dt>
      <dd className="mt-0.5 text-[9px] leading-relaxed text-slate-300">{children}</dd>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-1 text-slate-400">{children}</div>
    </div>
  );
}

export default function DataSourcesPage() {
  const { city, setCity } = useCitySelection();
  const { data, isLoading, isGreenLoading } = useCityEnvironmentalData(city);
  const [populationState, setPopulationState] = useState<{ cityId: string; value: CityPopulation | null } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Loading is derived (city id mismatch) rather than set inside the effect,
  // so city switches show the pending state without a synchronous setState.
  const population = populationState?.cityId === city.id ? populationState.value : undefined;

  useEffect(() => {
    let active = true;
    getCityPopulation(city).then((value) => {
      if (active) setPopulationState({ cityId: city.id, value });
    });
    return () => { active = false; };
  }, [city]);

  const ctx: SourceStatusContext = useMemo(() => ({ data, population }), [data, population]);
  const cityDataPending = isLoading || isGreenLoading;
  const resolvedSources = dataSources.map((source) => ({ source, resolved: resolveSourceStatus(source, ctx) }));
  const availableCount = resolvedSources.filter((entry) => isSourceAvailable(entry.resolved.status)).length;
  const unavailableCount = resolvedSources.length - availableCount;
  const lastRefresh = latestProviderTimestamp(data);

  const isPending = (hasCityDependency: boolean, status: SourceStatus) =>
    cityDataPending && hasCityDependency && (status === 'UNAVAILABLE' || status === 'DEGRADED');

  return (
    <DashboardShell city={city} onSelectCity={setCity}>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-[#1a2c3a] pb-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-300">Data provenance &amp; transparency</p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-100">Data &amp; Sources</h1>
          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-slate-400">
            Explore the datasets, providers, methodologies, and update cycles powering Enrealys&rsquo; environmental intelligence.
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile label="Total configured sources" value={String(resolvedSources.length)} icon={<Database size={11} className="text-teal-300" aria-hidden="true" />} />
            <SummaryTile label="Currently available" value={String(availableCount)} icon={<CheckCircle2 size={11} className="text-teal-300" aria-hidden="true" />} valueClassName="text-[15px] font-semibold tracking-tight text-teal-200" />
            <SummaryTile label="Unavailable" value={String(unavailableCount)} icon={<XCircle size={11} className="text-amber-300" aria-hidden="true" />} valueClassName={`text-[15px] font-semibold tracking-tight ${unavailableCount > 0 ? 'text-amber-300' : 'text-slate-100'}`} />
            <SummaryTile
              label={`Last successful data refresh · ${city.name}`}
              value={cityDataPending && !lastRefresh ? 'Awaiting provider response…' : lastRefresh ?? 'No provider timestamp available'}
              icon={<Clock3 size={11} className="text-teal-300" aria-hidden="true" />}
              valueClassName="font-mono text-[10px] font-medium leading-relaxed text-slate-200"
            />
          </dl>
          <p className="mt-2 text-[8px] leading-relaxed text-slate-600">
            Counts and refresh timestamps are derived from the live provider responses for the selected city — nothing on this page is hard-coded.
          </p>
        </header>
        <section aria-labelledby="source-directory-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="source-directory-heading" className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-300">Data source directory</h2>
              <p className="mt-1 text-[9px] text-slate-500">Every provider Enrealys actually connects to, with availability derived from the latest responses for {city.name}.</p>
            </div>
            <span className="text-[8px] text-slate-600">{availableCount} available · {unavailableCount} unavailable</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {resolvedSources.map(({ source, resolved }) => {
              const expanded = expandedId === source.id;
              const pending = isPending(source.metricIds.length > 0 || Boolean(source.providesCurrentWeather), resolved.status);
              const dependentRows = CATALOGUE_ROWS.filter((row) => row.sourceId === source.id);
              return (
                <article key={source.id} className="flex min-w-0 flex-col rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <a href={source.websiteUrl} target="_blank" rel="noopener noreferrer" className={`text-[11px] font-semibold text-slate-100 underline-offset-2 hover:text-teal-200 hover:underline ${focusClasses}`}>
                        {source.name}
                      </a>
                      <p className="mt-0.5 truncate text-[9px] text-slate-500" title={source.provider}>{source.provider}</p>
                    </div>
                    <StatusPill status={resolved.status} pending={pending} />
                  </div>
                  <p className="mt-2 text-[9px] leading-relaxed text-slate-400">{source.description}</p>
                  <dl className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-3">
                    <MetaItem label="Category">{source.category}</MetaItem>
                    <MetaItem label="Indicators supplied">{source.indicators.join(' · ')}</MetaItem>
                    <MetaItem label="Geographic coverage">{source.coverage}</MetaItem>
                    <MetaItem label="Data type">{source.dataKinds.join(' · ')}</MetaItem>
                    <MetaItem label="Latest available">{pending ? 'Pending' : resolved.latest ?? 'No fixed timestamp'}</MetaItem>
                    <MetaItem label="Refresh cycle">{source.refresh}</MetaItem>
                  </dl>
                  <p className="mt-2 text-[8px] leading-relaxed text-slate-600">{pending ? 'Waiting for the latest provider response for the selected city…' : resolved.detail}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
                    <a href={source.docsUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 rounded border border-teal-800/70 bg-teal-950/40 px-2.5 py-1.5 text-[9px] font-medium text-teal-200 transition hover:bg-teal-950/70 ${focusClasses}`}>
                      Visit official source <ArrowUpRight size={11} aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : source.id)}
                      aria-expanded={expanded}
                      className={`ml-auto inline-flex items-center gap-1 rounded border border-slate-800 px-2 py-1.5 text-[9px] text-slate-400 transition hover:border-slate-700 hover:text-slate-200 ${focusClasses}`}
                    >
                      Details
                      <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                  </div>
                  {expanded && (
                    <div className="mt-3 space-y-2 rounded border border-slate-800 bg-[#081622] p-3 text-[9px] leading-relaxed">
                      <DetailBlock title="Dependent indicators">
                        {dependentRows.length
                          ? <ul className="list-disc space-y-0.5 pl-4">{dependentRows.map((row) => <li key={row.indicator}>{row.indicator}</li>)}</ul>
                          : <span>None — this integration is not currently supplying any dashboard indicator.</span>}
                      </DetailBlock>
                      <DetailBlock title="What the measurements represent">{source.measurements}</DetailBlock>
                      <DetailBlock title="Known limitations">{source.limitations}</DetailBlock>
                      <DetailBlock title="Data provenance &amp; licensing">{source.attribution}</DetailBlock>
                      <a href={source.docsUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-teal-300 underline-offset-2 hover:text-teal-200 hover:underline ${focusClasses}`}>
                        Official documentation &amp; methodology <ArrowUpRight size={11} aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <section aria-labelledby="catalogue-heading">
          <div className="mb-3">
            <h2 id="catalogue-heading" className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-300">Indicator data catalogue</h2>
            <p className="mt-1 text-[9px] text-slate-500">How each dashboard indicator maps back to its original data source. Provider names link to the official source.</p>
          </div>
          <div className="overflow-x-auto rounded-md border border-[#1b3041]">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1b3041] bg-[#081622] text-[8px] uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-3 py-2 font-semibold">Indicator</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Provider</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Data type</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Latest update</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Availability</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Official source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {CATALOGUE_ROWS.map((row) => {
                  const source = getDataSource(row.sourceId);
                  const { latest, status } = resolveCatalogueRow(row, ctx);
                  const pending = isPending(Boolean(row.usesWeather || row.metricId), status);
                  return (
                    <tr key={row.indicator} className="bg-[#0a1926] text-[9px] text-slate-300 transition hover:bg-[#0c1d2c]">
                      <th scope="row" className="px-3 py-2 font-medium text-slate-200">{row.indicator}</th>
                      <td className="px-3 py-2">
                        <a href={source.docsUrl} target="_blank" rel="noopener noreferrer" className={`text-teal-300 underline-offset-2 hover:text-teal-200 hover:underline ${focusClasses}`}>{source.name}</a>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{row.dataType}</td>
                      <td className="px-3 py-2 font-mono text-[8px] leading-relaxed text-slate-400">{pending ? 'Pending' : latest}</td>
                      <td className="px-3 py-2"><StatusPill status={status} pending={pending} /></td>
                      <td className="px-3 py-2">
                        <a href={source.websiteUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-teal-300 underline-offset-2 hover:text-teal-200 hover:underline ${focusClasses}`}>
                          Visit <ArrowUpRight size={10} aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section aria-labelledby="transparency-heading" className="rounded-md border border-[#1b3041] bg-[#0a1926] p-4">
          <div className="flex items-center gap-2">
            <Info size={13} className="text-teal-300" aria-hidden="true" />
            <h2 id="transparency-heading" className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-300">How to read this data</h2>
          </div>
          <p className="mt-3 max-w-4xl text-[10px] leading-relaxed text-slate-400">
            Enrealys combines observed, modelled, historical, and cached datasets. Data availability, geographic coverage, and update frequency vary by provider. Modelled values should not be interpreted as direct station observations.
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { term: 'Live / near-real-time', definition: 'Current values re-requested each time a city view loads — weather, air quality and river discharge.', accent: 'border-l-teal-400/70' },
              { term: 'Modelled', definition: 'Simulated by numerical weather, atmospheric or hydrological models rather than measured at a station.', accent: 'border-l-sky-400/70' },
              { term: 'Historical', definition: 'Past periods: ERA5 reanalysis series and annual national estimates published after the fact.', accent: 'border-l-amber-300/60' },
              { term: 'Cached', definition: 'Stored snapshots served without a live provider request, such as the local OpenStreetMap feature index.', accent: 'border-l-slate-400/60' },
              { term: 'Unavailable', definition: 'No validated value was returned or the integration is not configured — never replaced with sample data.', accent: 'border-l-rose-400/60' },
            ].map((item) => (
              <div key={item.term} className={`rounded border border-slate-800 border-l-2 bg-[#081622]/70 px-2.5 py-2 ${item.accent}`}>
                <dt className="text-[9px] font-semibold text-slate-200">{item.term}</dt>
                <dd className="mt-1 text-[8px] leading-relaxed text-slate-500">{item.definition}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-slate-800 pt-3 text-[9px] leading-relaxed text-slate-500">
            Country-level statistics (for example national drinking-water coverage) are wide annual national estimates and must not be interpreted as municipal measurements. When a provider returns no validated value for a city, Enrealys shows it as unavailable instead of substituting sample data.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
