'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { City, HistoricalTemperaturePoint } from '../../lib/data/types';
import { openMeteoHistoricalProvider } from '../../lib/data/providers';
import { useCitySelection } from './CitySelectionProvider';

const periods = ['7D', '30D', '1Y', '5Y'] as const;
type Period = (typeof periods)[number];
type HistoricalResult = { key: string; points: HistoricalTemperaturePoint[]; error: string };

export default function HistoricalTemperatureChart({ city, initialPeriod = '30D' }: { city: City; initialPeriod?: Period }) {
  const { measurementSystem } = useCitySelection();
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const requestKey = `${city.id}:${city.coordinates.latitude}:${city.coordinates.longitude}:${period}`;
  const [result, setResult] = useState<HistoricalResult | null>(null);
  const loading = result?.key !== requestKey;
  const points = result?.key === requestKey ? result.points : [];
  const error = result?.key === requestKey ? result.error : '';

  useEffect(() => {
    const controller = new AbortController();
    openMeteoHistoricalProvider.getDailyTemperature(city.coordinates, period, controller.signal)
      .then((values) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, points: values, error: '' });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        console.error(`Could not load historical temperature for ${city.name}.`, reason);
        setResult({
          key: requestKey,
          points: [],
          error: reason instanceof Error ? reason.message : 'Historical temperature data is unavailable.',
        });
      });
    return () => controller.abort();
  }, [city.coordinates, city.name, period, requestKey]);

  const samples = points.length > 60
    ? points.filter((_, index) => index % Math.ceil(points.length / 60) === 0 || index === points.length - 1)
    : points;
  const chartPoints = measurementSystem === 'Metric'
    ? samples
    : samples.map((point) => ({ ...point, temperature: point.temperature * 9 / 5 + 32 }));
  const temperatureUnit = measurementSystem === 'Metric' ? '°C' : '°F';

  return (
    <section className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold text-slate-200">Historical temperature</h2>
          <p className="mt-1 text-[8px] text-slate-600">{city.name} · daily ERA5 reanalysis · HISTORICAL</p>
        </div>
        <div className="flex rounded border border-slate-800 bg-[#081622] p-0.5">
          {periods.map((item) => (
            <button key={item} type="button" aria-pressed={period === item} onClick={() => setPeriod(item)} className={`rounded px-1.5 py-1 text-[8px] ${period === item ? 'bg-teal-950/60 text-teal-200' : 'text-slate-500 hover:text-slate-200'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      {loading
        ? <p role="status" className="mt-5 h-[145px] pt-10 text-center text-[10px] text-slate-500">Loading historical temperature series…</p>
        : error
          ? <p role="alert" className="mt-5 h-[145px] pt-8 text-center text-[10px] text-amber-300">{error}</p>
          : chartPoints.length === 0
            ? <p className="mt-5 h-[145px] pt-10 text-center text-[10px] text-slate-500">No historical temperature values are available for this city and period.</p>
            : <div className="mt-3 h-[145px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 6, right: 5, bottom: 0, left: -22 }}>
                  <CartesianGrid stroke="#1a2b39" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fill: '#70808d', fontSize: 8 }} axisLine={{ stroke: '#273a48' }} tickLine={false} />
                  <YAxis unit={temperatureUnit} domain={['auto', 'auto']} tick={{ fill: '#70808d', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={(value) => `Date: ${value}`} formatter={(value) => [`${value} ${temperatureUnit}`, 'Daily mean temperature']} contentStyle={{ background: '#0a1926', border: '1px solid #2a4051', borderRadius: 4, fontSize: 10 }} labelStyle={{ color: '#cbd5e1' }} />
                  <Line type="monotone" dataKey="temperature" name="Daily mean temperature" stroke="#e2ad5b" strokeWidth={1.8} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>}
      <p className="mt-2 text-[8px] text-slate-600">Source: Open-Meteo Historical Weather API (ERA5 reanalysis; not a station observation). Display: {temperatureUnit}. Window ends at the latest available archive date.</p>
    </section>
  );
}
