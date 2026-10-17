'use client';

import { Factory, Wind, Trees, Droplets, Thermometer, Scale, ChevronRight, Check } from 'lucide-react';
import type { GoalIconKey, GoalId } from '../../lib/data/simulation';
import { GOALS } from '../../lib/data/simulation';
import { Card } from './simulationShared';

const ICONS: Record<GoalIconKey, typeof Factory> = {
  factory: Factory,
  wind: Wind,
  trees: Trees,
  droplets: Droplets,
  thermometer: Thermometer,
  scale: Scale,
};

interface SimulationGoalsProps {
  goalId: GoalId;
  onChange: (goalId: GoalId) => void;
}

export default function SimulationGoals({ goalId, onChange }: SimulationGoalsProps) {
  return (
    <Card
      title="1. Choose a goal"
      subtitle="Select what you want to improve. This changes the relevant intervention controls."
    >
      <ul className="space-y-2 p-3">
        {GOALS.map((goal) => {
          const Icon = ICONS[goal.icon];
          const active = goal.id === goalId;
          return (
            <li key={goal.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(goal.id)}
                className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-teal-700/70 bg-teal-950/40'
                    : 'border-[#1b3041] bg-[#071523]/60 hover:border-slate-600 hover:bg-[#0c2130]'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                    active ? 'border-teal-600/60 bg-teal-900/40 text-teal-300' : 'border-slate-700 bg-slate-800/60 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[12px] font-medium ${active ? 'text-teal-100' : 'text-slate-200'}`}>{goal.label}</span>
                  <span className="block truncate text-[9px] text-slate-500">{goal.description}</span>
                </span>
                {active
                  ? <Check size={15} className="shrink-0 text-teal-300" />
                  : <ChevronRight size={15} className="shrink-0 text-slate-600 group-hover:text-slate-400" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
