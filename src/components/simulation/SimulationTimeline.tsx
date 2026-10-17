'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import type { ProjectedMetric } from '../../lib/data/simulation';
import { Card } from './simulationShared';

const SERIES_COLORS = ['#35c5a0', '#6aa9e0', '#c9a86a', '#c98a8a', '#8f7fd6'];

interface SimulationTimelineProps {
  metrics: ProjectedMetric[];
  targetYear: number;
  currentYear: number;
}

/** Normalise each projected metric to an index (baseline = 100 at "Now"). */
function buildTimelineData(metrics: ProjectedMetric[], targetYear: number, currentYear: number) {
  const simulated = metrics.filter(
    (metric) =>
      (metric.status === 'SIMULATED' || metric.status === 'INDICATIVE')
      && metric.baselineValue != null
      && metric.baselineValue > 0
      && metric.projectedValue != null,
  );
  const nowRow: Record<string, number | string> = { label: `${currentYear} (baseline)` };
  const futureRow: Record<string, number | string> = { label: String(targetYear) };
  for (const metric of simulated) {
    const index = ((metric.projectedValue as number) / (metric.baselineValue as number)) * 100;
    nowRow[metric.metricId] = 100;
    futureRow[metric.metricId] = Math.round(index * 10) / 10;
  }
  return { simulated, data: [nowRow, futureRow] };
}

export default function SimulationTimeline({ metrics, targetYear, currentYear }: SimulationTimelineProps) {
  const { simulated, data } = useMemo(
    () => buildTimelineData(metrics, targetYear, currentYear),
    [metrics, targetYear, currentYear],
  );

  return (
    <Card
      title="Environmental Performance Over Time"
      subtitle="Normalised index (baseline = 100). Dashed = scenario estimate to the target year; observed multi-year series are unavailable for these indicators."
      action={<LineChartIcon size={14} className="text-teal-300" />}
    >
      <div className="p-3">
        {simulated.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-[#071523]/50 px-4 text-center">
            <LineChartIcon size={22} className="text-slate-600" />
            <p className="mt-2 text-[11px] font-medium text-slate-300">No projected series available</p>
            <p className="mt-1 max-w-md text-[9px] leading-relaxed text-slate-500">
              A projection needs a current baseline to scale from. If a provider baseline cannot be loaded for this city, no scenario estimate is shown rather than fabricating one.
            </p>
          </div>
        ) : (
          <>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#1a2b39" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#70808d', fontSize: 9 }} axisLine={{ stroke: '#273a48' }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#70808d', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, name) => [`${value} (index)`, simulated.find((m) => m.metricId === name)?.label ?? String(name)]}
                    contentStyle={{ background: '#0a1926', border: '1px solid #2a4051', borderRadius: 6, fontSize: 10 }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  {simulated.map((metric, index) => (
                    <Line
                      key={metric.metricId}
                      type="linear"
                      dataKey={metric.metricId}
                      name={metric.label}
                      stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {simulated.map((metric, index) => (
                <li key={metric.metricId} className="flex items-center gap-1.5 text-[9px] text-slate-400">
                  <span className="h-0.5 w-4 rounded" style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />
                  {metric.label}
                  <span className="text-slate-600">· {metric.status === 'SIMULATED' ? 'SIMULATED' : 'INDICATIVE'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[8px] leading-relaxed text-slate-600">
              Index 100 = current baseline. Each projected point is a scenario estimate at the target year, not an observed or forecast trajectory: SIMULATED is a proportional transform on a real measured baseline; INDICATIVE is a transparent reference estimate where no validated model is connected. Observed historical series (e.g. ERA5 temperature) are on the Timeline page.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
