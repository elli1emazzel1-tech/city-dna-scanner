'use client';

import { useMemo, useState } from 'react';
import { cities } from '../../lib/data/cities';
import type { City, CityEnvironmentalData } from '../../lib/data/types';
import { useCityEnvironmentalData } from './useCityEnvironmentalData';
import { useCitySelection } from './CitySelectionProvider';

export default function CityComparison({ city, data }: { city: City; data: CityEnvironmentalData }) {
  const candidates = useMemo(() => cities.filter((item) => item.id !== city.id), [city.id]);
  const [comparisonId, setComparisonId] = useState(candidates[0]?.id ?? '');
  const comparisonCity = candidates.find((item) => item.id === comparisonId) ?? candidates[0];
  const comparison = useCityEnvironmentalData(comparisonCity ?? city);
  const { measurementSystem } = useCitySelection();

  const formatTemperature = (value: number | null) => {
    if (value === null) return 'Unavailable';
    if (measurementSystem === 'Metric') return `${value.toFixed(1)} °C`;
    return `${(value * 9 / 5 + 32).toFixed(1)} °F`;
  };

  if (!comparisonCity) {
    return <p className="text-sm text-slate-400">Add another city before comparing.</p>;
  }

  return (
    <section className="rounded-md border border-[#1b3041] bg-[#0a1926] p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-wide text-slate-100">City comparison</h1>
          <p className="mt-1 text-[10px] text-slate-400">Compare same-source air-quality and weather data. Unavailable indicators are not scored or ranked.</p>
        </div>
        <label className="text-[9px] text-slate-400">
          Compare with
          <select value={comparisonCity.id} onChange={(event) => setComparisonId(event.target.value)} className="ml-2 rounded border border-slate-700 bg-[#081622] px-2 py-1.5 text-slate-200">
            {candidates.map((item) => <option key={item.id} value={item.id}>{item.name}, {item.country}</option>)}
          </select>
        </label>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-[10px]">
          <thead><tr className="border-b border-slate-800 text-slate-500">
            <th className="py-2 pr-3 font-medium">Indicator</th>
            <th className="px-3 py-2 font-medium">{city.name}</th>
            <th className="px-3 py-2 font-medium">{comparisonCity.name}</th>
          </tr></thead>
          <tbody>
            {data.metrics.map((metric) => {
              const other = comparison.data.metrics.find((item) => item.id === metric.id);
              return <tr key={metric.id} className="border-b border-slate-800/70 align-top">
                <th className="py-3 pr-3 font-medium text-slate-300">{metric.label}</th>
                <td className="px-3 py-3 text-slate-300">{metric.value} {metric.unit}<p className="mt-1 text-[8px] text-slate-500">{metric.status} · {metric.source}</p><p className="mt-0.5 text-[8px] text-slate-600">Provider time: {metric.updated ?? 'Not available'}</p></td>
                <td className="px-3 py-3 text-slate-300">{comparison.isLoading ? 'Loading…' : `${other?.value ?? 'Unavailable'} ${other?.unit ?? ''}`}<p className="mt-1 text-[8px] text-slate-500">{comparison.isLoading ? '' : `${other?.status ?? 'UNAVAILABLE'} · ${other?.source ?? 'No source'}`}</p><p className="mt-0.5 text-[8px] text-slate-600">{comparison.isLoading ? '' : `Provider time: ${other?.updated ?? 'Not available'}`}</p></td>
              </tr>;
            })}
            <tr className="align-top">
              <th className="py-3 pr-3 font-medium text-slate-300">Air temperature</th>
              <td className="px-3 py-3 text-slate-300">{formatTemperature(data.weather.temperature)}<p className="mt-1 text-[8px] text-slate-500">{data.weather.status} · {data.weather.source}</p><p className="mt-0.5 text-[8px] text-slate-600">Provider time: {data.weather.updated ?? 'Not available'}</p></td>
              <td className="px-3 py-3 text-slate-300">{comparison.isLoading ? 'Loading…' : formatTemperature(comparison.data.weather.temperature)}<p className="mt-1 text-[8px] text-slate-500">{comparison.isLoading ? '' : `${comparison.data.weather.status} · ${comparison.data.weather.source}`}</p><p className="mt-0.5 text-[8px] text-slate-600">{comparison.isLoading ? '' : `Provider time: ${comparison.data.weather.updated ?? 'Not available'}`}</p></td>
            </tr>
            <tr className="align-top">
              <th className="py-3 pr-3 font-medium text-slate-300">Apparent temperature</th>
              <td className="px-3 py-3 text-slate-300">{formatTemperature(data.weather.apparentTemperature ?? null)}<p className="mt-1 text-[8px] text-slate-500">{data.weather.status} · model-derived; not heat index</p><p className="mt-0.5 text-[8px] text-slate-600">Provider time: {data.weather.updated ?? 'Not available'}</p></td>
              <td className="px-3 py-3 text-slate-300">{comparison.isLoading ? 'Loading…' : formatTemperature(comparison.data.weather.apparentTemperature ?? null)}<p className="mt-1 text-[8px] text-slate-500">{comparison.isLoading ? '' : `${comparison.data.weather.status} · model-derived; not heat index`}</p><p className="mt-0.5 text-[8px] text-slate-600">{comparison.isLoading ? '' : `Provider time: ${comparison.data.weather.updated ?? 'Not available'}`}</p></td>
            </tr>
          </tbody>
        </table>
      </div>
      {comparison.data.metrics.some((metric) => metric.error) && <p role="status" className="mt-3 text-[9px] text-amber-300">{comparison.data.metrics.find((metric) => metric.error)?.error}</p>}
    </section>
  );
}
