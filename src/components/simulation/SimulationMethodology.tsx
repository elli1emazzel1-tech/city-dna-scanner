'use client';

import { useState } from 'react';
import { FlaskConical, ChevronDown, ShieldCheck } from 'lucide-react';
import { SIMULATION_MODEL_VERSION } from '../../lib/data/simulation';

export default function SimulationMethodology() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#1b3041] bg-[#0a1926]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <FlaskConical size={14} className="text-teal-300" />
          <span className="text-[12px] font-semibold text-slate-100">Simulation methodology</span>
        </span>
        <ChevronDown size={14} className={`text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-[#16293a] px-3.5 py-3 text-[10px] leading-relaxed text-slate-400">
          <p>
            <span className="font-medium text-slate-200">Model version:</span> <span className="font-mono text-teal-300">{SIMULATION_MODEL_VERSION}</span>. Every indicator shows a populated, transparent value labelled with its provenance — a <em>modelled scenario under your assumptions</em>, never a guaranteed prediction.
          </p>
          <p>
            <span className="font-medium text-slate-200">How a result is produced.</span> An indicator is projected from (1) a baseline value — the live provider reading when available, otherwise a documented city-independent reference midpoint (mirroring the LOCAL_SPATIAL_INDEX default-telemetry pattern), (2) a transparent proportional transform of your assumption onto that baseline, (3) consistent units, and (4) stated limitations. There are two projection tiers:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-slate-400">
            <li><span className="text-teal-300">SIMULATED</span> — a documented proportional transform applied to a <span className="text-slate-200">real, city-specific baseline</span>. Currently: vegetation cover (mapped OpenStreetMap feature count × green-expansion) and carbon-related proxy (measured CO × emissions-reduction), when a live baseline exists.</li>
            <li><span className="text-violet-300">INDICATIVE</span> — a transparent, baseline- or reference-anchored estimate used when no validated model connects the lever to the outcome (Air Quality, Flood risk) or when live telemetry is missing. It always carries its method and limitation and is <span className="text-slate-200">never</span> labelled SIMULATED or OBSERVED.</li>
          </ul>
          <p>
            <span className="font-medium text-slate-200">What is not a validated physical model.</span> Pollutant-specific Air Quality (AQI) and urban Flood Risk are shown as <span className="text-violet-300">INDICATIVE</span> proxies — not as predictions — because DNA · City does not connect a validated atmospheric chemical-transport model or urban flood-hazard model. Total tCO₂e emissions and surface temperature are not projected at all (no emissions-inventory or energy-balance baseline). River discharge (GloFAS) is upstream flow, not urban flood risk. A value is only marked UNAVAILABLE on a genuine engine failure; missing inputs fall back to a labelled reference midpoint rather than being left empty.
          </p>
          <p>
            <span className="font-medium text-slate-200">Data sources &amp; provenance.</span> Baselines come from Open-Meteo (Air Quality · CAMS model; Weather; Flood · GloFAS; Historical · ERA5) and OpenStreetMap feature tallies, plus World Bank/WHO national water coverage. Each is labelled OBSERVED, MODELLED, HISTORICAL, REPORTED, CACHED, or UNAVAILABLE according to its actual source. Provider timestamps and dataset years accompany the baseline indicators.
          </p>
          <p className="flex items-start gap-1.5 rounded border border-teal-900/60 bg-teal-950/20 px-2.5 py-2 text-slate-400">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-teal-400" />
            Scenario outputs never overwrite observed baseline measurements, and switching cities resets scenario state so one city&apos;s data cannot leak into another.
          </p>
        </div>
      )}
    </div>
  );
}
