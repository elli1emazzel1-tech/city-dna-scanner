import { MapPinned, Radio } from 'lucide-react';
import type { CityEnvironmentalData } from '../../lib/data/types';

export default function QuickFacts({ data }: { data: CityEnvironmentalData }) {
  const availableMetrics = data.metrics.filter((metric) => metric.status !== 'UNAVAILABLE');
  return (
    <section className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3.5">
      <h2 className="text-[11px] font-semibold text-slate-200">Quick facts</h2>
      <p className="mt-1 text-[8px] text-slate-600">{data.city.name} · source-backed context only</p>
      <div className="mt-3 space-y-2.5">
        <Fact icon={MapPinned} label="City center" value={`${data.city.coordinates.latitude.toFixed(3)}, ${data.city.coordinates.longitude.toFixed(3)}`} />
        <div className="border-t border-slate-800 pt-2">
          <p className="mb-1.5 flex items-center gap-1 text-[8px] uppercase tracking-wide text-slate-500"><Radio size={11} className="text-teal-300" /> Connected indicators</p>
          {availableMetrics.length
            ? availableMetrics.map((metric) => <p key={metric.id} className="py-0.5 text-[9px] text-slate-300">{metric.label} <span className="text-teal-300">· {metric.status}</span></p>)
            : <p className="text-[9px] text-slate-500">No city indicators are currently available.</p>}
        </div>
      </div>
      <p className="mt-3 border-t border-slate-800 pt-2 text-[8px] text-slate-600">Population, area, canopy, emissions, noise, and hazard overlays are omitted until verified city-specific sources are connected.</p>
    </section>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof MapPinned; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon size={13} className="mt-0.5 shrink-0 text-slate-500" /><div className="min-w-0"><p className="text-[8px] text-slate-600">{label}</p><p className="mt-0.5 truncate text-[9px] text-slate-300">{value}</p></div></div>;
}
