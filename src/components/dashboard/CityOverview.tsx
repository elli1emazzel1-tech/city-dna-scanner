'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Droplets, MapPin, Sun, Thermometer, Users, Wind } from 'lucide-react';
import type { City, CityEnvironmentalData } from '../../lib/data/types';
import { getCityPopulation } from '../../lib/data/population';
import type { CityPopulation } from '../../lib/data/population';
import { useCitySelection } from './CitySelectionProvider';
import CityLocalTime from './CityLocalTime';
import HeroWorldMap from './HeroWorldMap';

/** Static module-level glyph: picks an icon from the condition string without creating components during render. */
function ConditionGlyph({ condition }: { condition: string | null }) {
  const className = 'shrink-0 text-sky-300';
  if (condition === 'Rain' || condition === 'Drizzle') return <CloudRain size={18} className={className} aria-hidden="true" />;
  if (condition === 'Snow') return <CloudSnow size={18} className={className} aria-hidden="true" />;
  if (condition === 'Thunderstorm') return <CloudLightning size={18} className={className} aria-hidden="true" />;
  if (condition === 'Fog') return <CloudFog size={18} className={className} aria-hidden="true" />;
  if (condition === 'Clear') return <Sun size={18} className={className} aria-hidden="true" />;
  return <CloudSun size={18} className={className} aria-hidden="true" />;
}

export default function CityOverview({ data, isLoading = false }: { data: CityEnvironmentalData; isLoading?: boolean }) {
  const { measurementSystem } = useCitySelection();
  const { city, weather } = data;
  const temperature = weather.temperature === null
    ? 'unavailable'
    : measurementSystem === 'Metric'
      ? `${weather.temperature.toFixed(1)}°C`
      : `${(weather.temperature * 9 / 5 + 32).toFixed(1)}°F`;
  const windSpeed = weather.windSpeed === null
    ? 'unavailable'
    : measurementSystem === 'Metric'
      ? `${weather.windSpeed.toFixed(1)} km/h`
      : `${(weather.windSpeed / 1.609344).toFixed(1)} mph`;
  const apparentTemperature = weather.apparentTemperature == null
    ? 'unavailable'
    : measurementSystem === 'Metric'
      ? `${weather.apparentTemperature.toFixed(1)}°C`
      : `${(weather.apparentTemperature * 9 / 5 + 32).toFixed(1)}°F`;
  return (
    <section className="relative overflow-hidden rounded-lg border border-[#1b3041] bg-[#0a1926]">
      <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(ellipse_at_65%_45%,rgba(27,104,112,0.23),transparent_68%)] md:block" />
      <div className="absolute inset-y-0 left-0 hidden w-[36%] bg-[radial-gradient(ellipse_at_28%_38%,rgba(21,84,94,0.26),transparent_70%)] md:block" />
      <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.78fr)_minmax(238px,0.58fr)] lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-teal-950/60 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-teal-300">City overview</span>
            <span className="rounded border border-slate-700/80 px-2 py-1 text-[8px] font-medium uppercase tracking-wide text-slate-400">
              {isLoading ? 'LOADING' : weather.status === 'UNAVAILABLE' ? 'WEATHER UNAVAILABLE' : weather.status}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-[30px]">{city.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
            <span>{city.country}</span>
            <span className="flex items-center gap-1 font-mono"><MapPin size={11} /> {city.coordinates.latitude.toFixed(4)}°, {city.coordinates.longitude.toFixed(4)}°</span>
          </div>
          <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-slate-400">
            City-centre modelled weather and environmental indicators with per-source provenance. Municipal water, emissions, noise, flood and satellite-derived city vegetation feeds are not connected.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <PopulationChip city={city} />
            <CityLocalTime timezone={weather.timezone} isLoading={isLoading} />
          </div>
        </div>
        <div className="min-w-0">
          <HeroWorldMap coordinates={city.coordinates} label={city.name} />
          <p className="mt-1.5 mx-auto max-w-[430px] text-right text-[8px] text-slate-600">Equirectangular projection · Natural Earth 1:110m outlines (public domain)</p>
        </div>
        <div className="min-w-0 rounded border border-slate-800/90 bg-[#081622]/75 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current weather</span>
            <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-slate-400">{measurementSystem}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ConditionGlyph condition={weather.condition} />
            <p className="text-2xl font-semibold tracking-tight text-slate-100">{isLoading ? '··' : temperature === 'unavailable' ? '—' : temperature}</p>
          </div>
          <p className="mt-0.5 text-[9px] text-slate-400">{isLoading ? 'Requesting provider data…' : weather.condition ?? 'Condition unavailable'}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            <Stat icon={<Thermometer size={11} className="text-orange-300" />} label="Feels" value={isLoading ? '…' : apparentTemperature} />
            <Stat icon={<Droplets size={11} className="text-sky-300" />} label="Humidity" value={isLoading ? '…' : weather.humidity === null ? 'unavailable' : `${weather.humidity}%`} />
            <Stat icon={<Wind size={11} className="text-sky-300" />} label="Wind" value={isLoading ? '…' : windSpeed} />
          </dl>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Fact label="Data provider" value={isLoading ? 'Request pending' : weather.source} />
            <Fact label="Updated" value={isLoading ? 'Pending' : weather.updated ?? 'Unavailable'} />
          </div>
          <p className="mt-2 text-right text-[8px] text-slate-600">Model-derived values, not station observations · {measurementSystem} display</p>
          {!isLoading && weather.error && <p role="status" className="mt-1 text-right text-[8px] text-amber-300">{weather.error}</p>}
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-slate-800/90 bg-[#081622]/65 px-2.5 py-2">
    <p className="text-[8px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 truncate text-[11px] font-medium text-slate-200" title={value}>{value}</p>
  </div>;
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800/70 bg-[#0a1926]/70 px-2 py-1.5">
      <dt className="flex items-center gap-1 text-[8px] uppercase tracking-wide text-slate-500">{icon}{label}</dt>
      <dd className="mt-0.5 truncate text-[10px] font-medium text-slate-200" title={value}>{value}</dd>
    </div>
  );
}

/**
 * Population chip backed by the Wikidata resolver. Only ever shows a
 * city-proper figure (see SETTLEMENT_CLASS_IDS in population.ts), together
 * with its reference year and a link to the exact claim as its source; when
 * no qualifying figure exists the chip says so rather than substituting a
 * metro or municipality number.
 */
function PopulationChip({ city }: { city: City }) {
  const [state, setState] = useState<{ cityId: string; status: 'READY' | 'UNAVAILABLE'; data: CityPopulation | null }>({ cityId: '', status: 'UNAVAILABLE', data: null });
  // Loading is derived (not set inside the effect) so city switches show the
  // pending state immediately without a synchronous setState in the effect body.
  const resolved = state.cityId === city.id ? state : null;

  useEffect(() => {
    let active = true;
    void getCityPopulation(city).then((value) => {
      if (!active) return;
      setState({ cityId: city.id, status: value ? 'READY' : 'UNAVAILABLE', data: value });
    });
    return () => { active = false; };
  }, [city]);

  if (!resolved) {
    return (
      <span className="flex items-center gap-1.5 rounded border border-slate-800/90 bg-[#081622]/65 px-2 py-1 text-[9px] text-slate-400">
        <Users size={11} className="text-teal-300" />
        Population loading
      </span>
    );
  }

  if (resolved.status === 'UNAVAILABLE' || !resolved.data) {
    return (
      <span
        className="flex items-center gap-1.5 rounded border border-slate-800/90 bg-[#081622]/65 px-2 py-1 text-[9px] text-slate-400"
        title="No qualifying city-proper population figure was found on Wikidata; no metro or municipality value is substituted."
      >
        <Users size={11} className="text-teal-300" />
        Population unavailable
      </span>
    );
  }

  const population = resolved.data;
  return (
    <span
      className="flex items-center gap-1.5 rounded border border-slate-800/90 bg-[#081622]/65 px-2 py-1 text-[9px] text-slate-400"
      title={`${population.entityLabel} · Wikidata population claim (P1082)`}
    >
      <Users size={11} className="text-teal-300" />
      <span className="flex flex-wrap items-center gap-1">
        <span>Population</span>
        <span className="font-mono text-slate-200">{new Intl.NumberFormat('en-US').format(population.figure)}</span>
        {population.year !== null && <span className="text-slate-500">({population.year})</span>}
        <a href={population.sourceUrl} target="_blank" rel="noreferrer" className="text-teal-400 underline-offset-2 hover:underline">Wikidata</a>
      </span>
    </span>
  );
}
