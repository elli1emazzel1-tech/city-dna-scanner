import Link from 'next/link';
import { ArrowUpRight, FileText, GitCompareArrows, MapPinned, Play, type LucideIcon } from 'lucide-react';
import type { CityEnvironmentalData } from '../../lib/data/types';
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

export default function HealthAndActions({ data }: HealthAndActionsProps) {
  const { measurementSystem } = useCitySelection();
  const ring = 2 * Math.PI * 25;
  const greenMetric = data.metrics.find((metric) => metric.id === 'green');
  const apparentTemperature = data.weather.apparentTemperature;
  const heatValue = apparentTemperature == null
    ? 'Unavailable'
    : measurementSystem === 'Metric'
      ? `${apparentTemperature.toFixed(1)} °C apparent`
      : `${(apparentTemperature * 9 / 5 + 32).toFixed(1)} °F apparent`;
  const riverDischarge = data.metrics.find((metric) => metric.id === 'flood');
  const riverFlowValue = riverDischarge
    && riverDischarge.status !== 'UNAVAILABLE'
    && riverDischarge.status !== 'ERROR'
    ? `${riverDischarge.value} ${riverDischarge.unit}`
    : riverDischarge?.condition ?? 'Unavailable';
  const waterMetric = data.metrics.find((metric) => metric.id === 'water');
  const waterCoverage = waterMetric && waterMetric.status !== 'UNAVAILABLE' && waterMetric.status !== 'ERROR'
    ? `${waterMetric.value} ${waterMetric.unit}`
    : waterMetric?.condition ?? 'Unavailable';
  const infrastructureMetric = data.metrics.find((metric) => metric.id === 'noise');
  const infrastructureCount = infrastructureMetric && infrastructureMetric.status !== 'UNAVAILABLE' && infrastructureMetric.status !== 'ERROR'
    ? `${infrastructureMetric.value} ${infrastructureMetric.unit}`
    : infrastructureMetric?.condition ?? 'Unavailable';
  const contributors = [
    { label: 'Air quality', value: data.metrics.find((metric) => metric.id === 'air')?.condition ?? '—' },
    { label: 'Heat · apparent temperature', value: heatValue },
    { label: 'River discharge', value: riverFlowValue },
    { label: 'National drinking-water coverage', value: waterCoverage },
    { label: 'Mapped vegetation', value: greenMetric && greenMetric.status !== 'UNAVAILABLE' ? `${greenMetric.value} ${greenMetric.unit}` : 'Unavailable' },
    { label: 'Mapped transport features', value: infrastructureCount },
  ];

  return (
    <div className="space-y-3">
      <section className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">Environmental health</p>
            <p className="mt-1 text-[9px] text-slate-500">No validated composite health score is configured</p>
          </div>
          <span className="rounded bg-teal-950/70 px-2 py-1 text-[9px] font-semibold text-teal-300">Overall</span>
        </div>
        <div className="my-3 flex items-center justify-center gap-4">
          <span className="text-2xl font-semibold text-slate-500">Unavailable</span>
          <svg width="66" height="66" viewBox="0 0 66 66" role="img" aria-label="Environmental health score unavailable">
            <circle cx="33" cy="33" r="25" fill="none" stroke="#203342" strokeWidth="6" strokeDasharray={ring} strokeDashoffset="0" />
            <text x="33" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="600">N/A</text>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-800 pt-3">
          {contributors.map((item) => <div key={item.label} className="flex justify-between gap-2 text-[9px]"><span className="text-slate-500">{item.label}</span><span className="text-slate-300">{item.value}</span></div>)}
        </div>
        {apparentTemperature != null && <p className="mt-2 text-[8px] leading-relaxed text-slate-600">Heat input is MODELLED apparent temperature, not heat index or land-surface temperature · {data.weather.source} · {data.weather.updated ?? 'provider time unavailable'}.</p>}
        <p className="mt-3 text-[8px] leading-relaxed text-slate-600">Composite scoring is withheld until source metrics and a validated method are available.</p>
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
