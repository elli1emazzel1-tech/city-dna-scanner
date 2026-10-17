'use client';

import { Activity, ArrowUpRight, ExternalLink, Flame, Leaf, Radio, Droplets, type LucideIcon } from 'lucide-react';
import DashboardShell from './DashboardShell';
import { useCitySelection } from './CitySelectionProvider';
import type { EnvironmentalMetric } from '../../lib/data/types';
import { useCityEnvironmentalData } from './useCityEnvironmentalData';

const metricIcons: Record<EnvironmentalMetric['id'], LucideIcon> = {
  air: Activity,
  water: Droplets,
  green: Leaf,
  carbon: Flame,
  noise: Radio,
  flood: Droplets,
};

const metricNotes: Record<EnvironmentalMetric['id'], string> = {
  air: 'Open-Meteo exposes modelled concentrations globally; pollutant-specific AQI needs pollutant-specific averaging periods and is not inferred from one hourly value.',
  water: 'World Bank indicator SH.H2O.SMDW.ZS from the WHO/UNICEF Joint Monitoring Programme. Country-wide annual estimate of safely managed drinking-water service access, not city water quality or regulatory compliance.',
  green: 'OpenStreetMap community-mapped parks and vegetated land-use features within 2 km of the selected city centre. This is a feature count, not measured green area, canopy cover, or a percentage. ESA WorldCover is globally available at 10 m for 2020/2021 as public COG files, but accurate city coverage requires a defined administrative boundary and raster processing. The two vintages use different algorithm versions and should not be treated as a direct change series.',
  carbon: 'CAMS carbon-monoxide concentration (CO) is modelled pollution, not carbon dioxide (CO₂), greenhouse-gas emissions, or electricity-grid carbon intensity.',
  noise: 'OpenStreetMap highway and railway way counts within 2 km. This inventory proxy is not road length, traffic, spatial acoustic exposure, or a decibel measurement; coverage varies with community mapping.',
  flood: 'Open-Meteo Flood API provides GloFAS v4 modelled daily discharge for a nearby river cell (documented as the largest river in an approximately 5 km area). Open-Meteo Weather adds current modelled 0–7 cm soil moisture. These values have different times/resolutions and are not observed flow, runoff, or urban/pluvial flood risk.',
};

export default function DataSourcesPage() {
  const { city, setCity } = useCitySelection();
  const { data, isLoading, isGreenLoading } = useCityEnvironmentalData(city);
  return (
    <DashboardShell city={city} onSelectCity={setCity}>
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-300">Data governance</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-100">Data & sources</h1>
          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-slate-400">Provider state, source, model/observation time, and failures are reported per indicator. Missing city datasets remain unavailable; they are not replaced with sample values.</p>
        </header>
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.metrics.map((metric) => {
            const Icon = metricIcons[metric.id];
            return (
              <article key={metric.id} className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2"><span className="rounded border border-slate-800 bg-[#081622] p-1.5 text-teal-300"><Icon size={14} /></span><h2 className="text-[11px] font-medium text-slate-200">{metric.label}</h2></div>
                  <span className={`rounded px-1.5 py-1 text-[8px] font-semibold ${metric.status === 'ERROR' ? 'bg-amber-950/50 text-amber-300' : metric.status === 'UNAVAILABLE' ? 'bg-slate-800 text-slate-400' : 'bg-teal-950/50 text-teal-300'}`}>{isLoading || ((metric.id === 'green' || metric.id === 'noise') && isGreenLoading) ? 'LOADING' : metric.status === 'ERROR' ? 'PROVIDER ERROR' : metric.status}</span>
                </div>
                <dl className="mt-3 space-y-2 text-[9px]">
                  <div><dt className="text-slate-600">Provider</dt><dd className="mt-0.5 text-slate-300">{metric.source}</dd></div>
                  <div><dt className="text-slate-600">Selected city value</dt><dd className="mt-0.5 text-slate-300">{isLoading || ((metric.id === 'green' || metric.id === 'noise') && isGreenLoading) ? 'Looking up provider data…' : `${metric.value} ${metric.unit}`}</dd></div>
                  <div><dt className="text-slate-600">Provider time</dt><dd className="mt-0.5 text-slate-400">{isGreenLoading && (metric.id === 'green' || metric.id === 'noise') ? 'Pending' : metric.updated ?? 'Not available'}</dd></div>
                  <div><dt className="text-slate-600">Coverage / interpretation</dt><dd className="mt-0.5 leading-relaxed text-slate-400">{metric.subValue}</dd></div>
                </dl>
                <p className="mt-3 border-t border-slate-800 pt-2 text-[8px] leading-relaxed text-slate-600">{metric.error ?? metricNotes[metric.id]}</p>
              </article>
            );
          })}
        </section>
        <footer className="flex items-start gap-2 rounded-md border border-slate-800 bg-[#091722] p-3 text-[9px] leading-relaxed text-slate-500">
          <ExternalLink size={13} className="mt-0.5 shrink-0 text-slate-600" />
          Weather, air quality, carbon-monoxide concentration, and GloFAS discharge use Open-Meteo/CAMS model output. World Bank drinking-water coverage is national and historical; OSM transport counts are not noise data. CO is not CO₂ or grid-carbon intensity. Open-Meteo free API terms are non-commercial; commercial deployments need an appropriate subscription.
          <ArrowUpRight size={12} className="mt-0.5 shrink-0" />
        </footer>
      </div>
    </DashboardShell>
  );
}
