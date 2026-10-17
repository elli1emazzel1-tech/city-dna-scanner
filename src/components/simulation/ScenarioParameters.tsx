'use client';

import { Info, AlertTriangle, Target } from 'lucide-react';
import type { GoalDefinition, IntensityId, LeverDefinition, ScenarioAssumptions } from '../../lib/data/simulation';
import { INTENSITY_FACTOR, getLever } from '../../lib/data/simulation';
import { Card } from './simulationShared';

interface ScenarioParametersProps {
  goal: GoalDefinition;
  assumptions: ScenarioAssumptions;
  onChange: (assumptions: ScenarioAssumptions) => void;
}

const INTENSITY_ORDER: IntensityId[] = ['low', 'medium', 'high'];
const INTENSITY_LABELS: Record<IntensityId, string> = { low: 'Low', medium: 'Medium', high: 'High' };

function LeverControl({
  lever,
  value,
  onValueChange,
}: {
  lever: LeverDefinition;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const hasModel = lever.affects.length > 0;
  return (
    <div className="rounded-lg border border-[#1b3041] bg-[#071523]/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <label htmlFor={`lever-${lever.id}`} className="min-w-0 text-[11px] font-medium text-slate-200">
          {lever.label}
        </label>
        <span className="shrink-0 font-mono text-[11px] text-teal-300">+{value}{lever.unit}</span>
      </div>
      <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{lever.description}</p>
      <input
        id={`lever-${lever.id}`}
        type="range"
        min={lever.min}
        max={lever.max}
        step={lever.step}
        value={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="mt-2 h-1 w-full cursor-pointer accent-teal-400"
      />
      <div className="mt-1 flex justify-between text-[8px] font-mono text-slate-600">
        <span>{lever.min}{lever.unit}</span>
        <span>{lever.max}{lever.unit}</span>
      </div>
      <div className="mt-2 flex items-start gap-1.5 rounded border border-slate-800 bg-[#081622] px-2 py-1.5">
        {hasModel
          ? <Info size={11} className="mt-0.5 shrink-0 text-teal-500/80" />
          : <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-500/80" />}
        <p className="text-[8px] leading-relaxed text-slate-500">
          <span className={hasModel ? 'text-teal-300/90' : 'text-amber-300/90'}>
            {hasModel ? 'Assumption · produces a modelled proxy output' : 'Assumption only · no connected model affects an output'}
          </span>
          {' — '}{lever.assumptionNote}
        </p>
      </div>
    </div>
  );
}

export default function ScenarioParameters({ goal, assumptions, onChange }: ScenarioParametersProps) {
  const setLever = (id: keyof ScenarioAssumptions['levers'], value: number) => {
    onChange({ ...assumptions, levers: { ...assumptions.levers, [id]: value } });
  };

  const relevantLevers = goal.leverIds.map(getLever);

  return (
    <Card
      title="2. Set parameters"
      subtitle="Adjust the intensity of your intervention. These sliders are scenario assumptions, not measured conditions."
    >
      <div className="space-y-3 p-3">
        {relevantLevers.map((lever) => (
          <LeverControl
            key={lever.id}
            lever={lever}
            value={assumptions.levers[lever.id]}
            onValueChange={(value) => setLever(lever.id, value)}
          />
        ))}

        <div className="rounded-lg border border-[#1b3041] bg-[#071523]/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-200">Intervention intensity</span>
            <span className="font-mono text-[10px] text-teal-300">×{INTENSITY_FACTOR[assumptions.intensity].toFixed(1)}</span>
          </div>
          <p className="mt-1 text-[9px] text-slate-500">Scales the magnitude of any produced proxy output.</p>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-md border border-slate-800 bg-[#081622] p-0.5">
            {INTENSITY_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={assumptions.intensity === id}
                onClick={() => onChange({ ...assumptions, intensity: id })}
                className={`rounded px-2 py-1.5 text-[10px] transition ${
                  assumptions.intensity === id ? 'bg-teal-950/70 text-teal-200' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {INTENSITY_LABELS[id]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#1b3041] bg-[#071523]/60 p-3">
          <div className="flex items-center gap-2">
            <Target size={13} className="text-teal-400" />
            <label htmlFor="target-year" className="text-[11px] font-medium text-slate-200">Target year</label>
          </div>
          <p className="mt-1 text-[9px] text-slate-500">Projection horizon. A steady-state assumption by this year — not a year-by-year trajectory.</p>
          <input
            id="target-year"
            type="number"
            min={new Date().getFullYear()}
            max={new Date().getFullYear() + 40}
            step={1}
            value={assumptions.targetYear}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) onChange({ ...assumptions, targetYear: parsed });
            }}
            className="mt-2 w-28 rounded border border-slate-700 bg-[#081622] px-2 py-1.5 font-mono text-[12px] text-slate-100 outline-none focus:border-teal-600"
          />
        </div>
      </div>
    </Card>
  );
}
