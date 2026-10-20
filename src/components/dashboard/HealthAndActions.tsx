import Link from 'next/link';
import { ArrowUpRight, FileText, GitCompareArrows, Info, MapPinned, Play, type LucideIcon } from 'lucide-react';
import type { CityEnvironmentalData, DataStatus, EnvironmentalMetric, MetricCondition } from '../../lib/data/types';
import { useCitySelection } from './CitySelectionProvider';

interface HealthAndActionsProps {
  data: CityEnvironmentalData;
}

const actions: { title: string; description: string; href: string; icon: LucideIcon }[] = [
  { title: 'Run simulation', description: 'Test urban interventions', href: '/simulation', icon: Play },
  { title: 'Generate report', description: 'Review city indicators', href: '/city-report', icon: FileText },
  { title: 'Compare cities', description: 'Open benchmark view', href: '/compare-cities', icon: GitCompareArrows },
  { title: 'Explore risk map', description: 'Open the selected city map', href: '/dashboard#city-map', icon: MapPinned },
];

/** Condition palette reused from EnvironmentalMetricCard so the two panels read identically. */
const conditionTones: Record<MetricCondition, string> = {
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

const statusTones: Record<DataStatus, string> = {
  OBSERVED: 'text-teal-300 bg-teal-950/40',
  FORECAST: 'text-teal-300 bg-teal-950/40',
  MODELLED: 'text-sky-300 bg-sky-950/40',
  SIMULATED: 'text-violet-300 bg-violet-950/40',
  REPORTED: 'text-sky-300 bg-sky-950/40',
  HISTORICAL: 'text-amber-300 bg-amber-950/40',
  CACHED: 'text-slate-400 bg-slate-800/80',
  CONNECTED: 'text-slate-400 bg-slate-800/80',
  ERROR: 'text-amber-300 bg-amber-950/50',
  UNAVAILABLE: 'text-slate-400 bg-slate-800/70',
};

/** Human-readable, non-scoring label for a provider data type. */
const statusLabels: Record<DataStatus, string> = {
  OBSERVED: 'Observed',
  FORECAST: 'Forecast',
  MODELLED: 'Modelled',
  SIMULATED: 'Simulated',
  REPORTED: 'Reported',
  HISTORICAL: 'Historical',
  CACHED: 'Cached',
  CONNECTED: 'Connected',
  ERROR: 'Provider error',
  UNAVAILABLE: 'Unavailable',
};

function isUnavailable(metric: EnvironmentalMetric | undefined): boolean {
  return !metric || metric.status === 'UNAVAILABLE' || metric.status === 'ERROR';
}

/** Air quality carries the provider's own AQI class; every other row is badged by data type. */
function statusLabelFor(metric: EnvironmentalMetric | undefined, isAir: boolean): string {
  if (!metric) return 'Unavailable';
  if (isAir && metric.status !== 'ERROR' && metric.status !== 'UNAVAILABLE') return metric.condition;
  return statusLabels[metric.status];
}

interface ConditionRow {
  label: string;
  value: string;
  badge: string;
  badgeTone: string;
  note: string;
  available: boolean;
  source: string;
}

export default function HealthAndActions({ data }: HealthAndActionsProps) {
  const { measurementSystem } = useCitySelection();
  const { weather, city } = data;

  const metricById = (id: EnvironmentalMetric['id']) => data.metrics.find((metric) => metric.id === id);
  const airMetric = metricById('air');
  const floodMetric = metricById('flood');
  const waterMetric = metricById('water');
  const greenMetric = metricById('green');
  const transportMetric = metricById('noise');

  const apparentTemperature = weather.apparentTemperature;
  const heatAvailable = apparentTemperature != null && weather.status !== 'UNAVAILABLE' && weather.status !== 'ERROR';
  const heatValue = heatAvailable && apparentTemperature != null
    ? measurementSystem === 'Metric'
      ? `${apparentTemperature.toFixed(1)} °C apparent`
      : `${(apparentTemperature * 9 / 5 + 32).toFixed(1)} °F apparent`
    : 'Unavailable';

  const valueText = (metric: EnvironmentalMetric | undefined) =>
    metric && !isUnavailable(metric) ? `${metric.value} ${metric.unit}` : 'Unavailable';

  const reasonText = (metric: EnvironmentalMetric | undefined, fallback: string) =>
    metric?.error ?? metric?.subValue ?? fallback;

  const toneFor = (metric: EnvironmentalMetric | undefined, isAir: boolean) => {
    if (!metric) return statusTones.UNAVAILABLE;
    if (isAir && metric.status !== 'ERROR' && metric.status !== 'UNAVAILABLE') return conditionTones[metric.condition];
    return statusTones[metric.status];
  };

  const airUsesUsAqi = airMetric?.unit === 'US AQI';
  const airNote = isUnavailable(airMetric)
    ? reasonText(airMetric, 'The air-quality provider returned no validated reading for this city.')
    : airUsesUsAqi
      ? "Provider's own US AQI class (Good → Hazardous) · CAMS model output, not a station observation"
      : "Provider's own AQI class on its reported scale · not US AQI, not a station observation";

  const rows: ConditionRow[] = [
    {
      label: 'Air quality',
      value: valueText(airMetric),
      badge: statusLabelFor(airMetric, true),
      badgeTone: toneFor(airMetric, true),
      note: airNote,
      available: !isUnavailable(airMetric),
      source: airMetric?.source ?? 'Air-quality provider',
    },
    {
      label: 'Apparent temperature',
      value: heatValue,
      badge: heatAvailable ? 'Modelled' : statusLabels[weather.status],
      badgeTone: heatAvailable ? statusTones.MODELLED : statusTones[weather.status],
      note: heatAvailable
        ? 'Modelled apparent temperature — not heat index, not land-surface temperature'
        : (weather.error ?? 'The weather provider returned no validated value for this city.'),
      available: heatAvailable,
      source: weather.source,
    },
    {
      label: 'River discharge',
      value: valueText(floodMetric),
      badge: statusLabelFor(floodMetric, false),
      badgeTone: toneFor(floodMetric, false),
      note: isUnavailable(floodMetric)
        ? reasonText(floodMetric, 'The flood provider returned no validated value for this city.')
        : 'Modelled GloFAS river flow (m³/s) — not urban flood risk, runoff or observed discharge',
      available: !isUnavailable(floodMetric),
      source: floodMetric?.source ?? 'Flood provider',
    },
    {
      label: 'Drinking-water coverage',
      value: valueText(waterMetric),
      badge: statusLabelFor(waterMetric, false),
      badgeTone: toneFor(waterMetric, false),
      note: isUnavailable(waterMetric)
        ? reasonText(waterMetric, 'The World Bank provider returned no estimate for this country.')
        : 'Country-level annual estimate (% of population) — not a city measurement, water-quality result or compliance assessment',
      available: !isUnavailable(waterMetric),
      source: waterMetric?.source ?? 'World Bank · WHO/UNICEF JMP',
    },
    {
      label: 'Mapped vegetation',
      value: valueText(greenMetric),
      badge: statusLabelFor(greenMetric, false),
      badgeTone: toneFor(greenMetric, false),
      note: isUnavailable(greenMetric)
        ? reasonText(greenMetric, 'No mapped features were returned for this location.')
        : 'Count of mapped OSM vegetation/parks objects within 2 km — not canopy area or green coverage percentage',
      available: !isUnavailable(greenMetric),
      source: greenMetric?.source ?? 'OpenStreetMap',
    },
    {
      label: 'Mapped transport features',
      value: valueText(transportMetric),
      badge: statusLabelFor(transportMetric, false),
      badgeTone: toneFor(transportMetric, false),
      note: isUnavailable(transportMetric)
        ? reasonText(transportMetric, 'No mapped road or rail features were returned for this location.')
        : 'Count of mapped OSM road & rail ways within 2 km — not traffic volume, noise exposure or decibels',
      available: !isUnavailable(transportMetric),
      source: transportMetric?.source ?? 'OpenStreetMap',
    },
  ];

  // Deterministic summary rule (documented in the UI): an indicator counts as
  // available only when its provider returned a validated value, i.e. a status
  // other than UNAVAILABLE or ERROR. The count is a data-availability figure
  // only — it is not averaged, weighted, scored or turned into a grade.
  const availableCount = rows.filter((row) => row.available).length;
  const unavailableRows = rows.filter((row) => !row.available);
  const summaryText = availableCount === rows.length
    ? `All ${rows.length} indicators returned valid provider data for ${city.name}.`
    : `${availableCount} of ${rows.length} indicators returned valid provider data for ${city.name}.`;


  return (
    <div className="space-y-3">
      <section className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">Environmental conditions</p>
            <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{summaryText}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="group relative">
              <button
                type="button"
                aria-label="Why is there no overall environmental score?"
                className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 text-slate-500 transition hover:border-teal-700 hover:text-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/80"
              >
                <Info size={11} />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-6 z-10 w-64 rounded border border-slate-700 bg-[#081622] p-2 text-[8px] leading-relaxed text-slate-400 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
              >
                A single number would require a validated composite methodology — documented indicator weights, thresholds and scales. None is configured, so Enrealys reports each provider indicator separately instead of implying an overall environmental grade.
              </span>
            </span>
            <span className="rounded border border-slate-700/80 bg-slate-800/60 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-slate-300">Composite score not configured</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-slate-800 pt-3">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[9px] text-slate-500">{row.label}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${row.badgeTone}`}>{row.badge}</span>
              </div>
              <p className={`mt-0.5 truncate text-[10px] font-medium ${row.available ? 'text-slate-200' : 'text-slate-500'}`}>{row.value}</p>
              <p className="mt-0.5 text-[8px] leading-relaxed text-slate-600" title={row.note}>{row.note}</p>
              <p className="mt-0.5 truncate text-[8px] text-slate-700" title={row.source}>
                {row.source}{row.label === 'Apparent temperature' ? ` · ${weather.updated ?? 'provider time unavailable'}` : ''}
              </p>
            </div>
          ))}
        </div>
        {unavailableRows.length > 0 && (
          <p className="mt-3 text-[8px] leading-relaxed text-slate-600">
            Unavailable rows ({unavailableRows.map((row) => row.label).join(', ')}) mean the provider returned no validated value for this city — that is a data-availability gap, separate from the unconfigured composite score below.
          </p>
        )}
        <p className="mt-2 border-t border-slate-800 pt-2 text-[8px] leading-relaxed text-slate-600">
          Composite score not configured — withheld until source metrics and a validated methodology are available. Each indicator above is shown as its provider returned it, with its data type and caveat.
        </p>
      </section>

      <section className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
        <h2 className="mb-2.5 text-[10px] font-semibold text-slate-200">Quick actions</h2>
        <div className="space-y-1.5">
          {actions.map(({ title, description, href, icon: Icon }) => (
            <Link key={title} href={href} className="group flex items-center gap-2.5 rounded border border-slate-800/90 bg-[#081622]/65 px-2.5 py-2 transition hover:border-teal-800/80 hover:bg-teal-950/20">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-teal-900/50 bg-teal-950/45 text-teal-300"><Icon size={13} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-medium text-slate-200">{title}</span><span className="mt-0.5 block text-[8px] text-slate-500">{description}</span></span>
              <ArrowUpRight size={12} className="text-slate-600 transition group-hover:text-teal-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
