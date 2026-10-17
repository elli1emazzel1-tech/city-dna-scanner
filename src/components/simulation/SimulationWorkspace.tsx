'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal, GitCompare, Bookmark } from 'lucide-react';
import type { City, CityEnvironmentalData } from '../../lib/data/types';
import {
  computeScenario,
  createDefaultAssumptions,
  getGoal,
  buildSavedScenario,
  SIMULATION_MODEL_VERSION,
  type GoalId,
  type ScenarioAssumptions,
} from '../../lib/data/simulation';
import DashboardShell from '../dashboard/DashboardShell';
import SimulationHeader from './SimulationHeader';
import SimulationGoals from './SimulationGoals';
import ScenarioParameters from './ScenarioParameters';
import SimulationMapPanel from './SimulationMapPanel';
import ProjectedImpact from './ProjectedImpact';
import SimulationTimeline from './SimulationTimeline';
import SimulationResults from './SimulationResults';
import SimulationMethodology from './SimulationMethodology';
import ScenarioComparison from './ScenarioComparison';
import SavedScenarios from './SavedScenarios';
import { storeScenario } from './useScenarioStore';

type TabId = 'scenario' | 'compare' | 'saved';

const TABS: { id: TabId; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: 'scenario', label: 'Scenario Simulation', icon: SlidersHorizontal },
  { id: 'compare', label: 'Compare Scenarios', icon: GitCompare },
  { id: 'saved', label: 'Saved Scenarios', icon: Bookmark },
];

interface SimulationWorkspaceProps {
  data: CityEnvironmentalData;
  onSelectCity: (city: City) => void;
  dataStatus: string;
  isLoading: boolean;
}

export default function SimulationWorkspace({ data, onSelectCity, dataStatus, isLoading }: SimulationWorkspaceProps) {
  const city = data.city;
  const [activeTab, setActiveTab] = useState<TabId>('scenario');
  const [goalId, setGoalId] = useState<GoalId>('more-green');
  const [assumptions, setAssumptions] = useState<ScenarioAssumptions>(createDefaultAssumptions);
  const [mapView, setMapView] = useState<'baseline' | 'simulation'>('baseline');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset scenario state whenever the selected city changes so one city's data
  // (assumptions, baselines, results) can never leak into another. This uses the
  // documented "adjust state during render" pattern rather than an effect.
  const [activeCityId, setActiveCityId] = useState(city.id);
  if (activeCityId !== city.id) {
    setActiveCityId(city.id);
    setGoalId('more-green');
    setAssumptions(createDefaultAssumptions());
    setMapView('baseline');
    setMessage('');
  }

  const goal = getGoal(goalId);
  const output = useMemo(() => computeScenario(data, assumptions), [data, assumptions]);
  const currentYear = new Date().getFullYear();

  const handleSave = () => {
    if (isLoading) return;
    setIsSaving(true);
    try {
      const scenario = buildSavedScenario(city, goalId, assumptions, data, output);
      const ok = storeScenario(scenario);
      setMessage(ok ? `Scenario saved locally for ${city.name}.` : 'The scenario could not be saved in this browser.');
    } catch (error) {
      console.error('Could not save scenario.', error);
      setMessage('The scenario could not be saved in this browser.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    try {
      const report = {
        schemaVersion: 1,
        reportType: 'scenario-simulation',
        generatedAt: new Date().toISOString(),
        modelVersion: SIMULATION_MODEL_VERSION,
        city,
        goal: { id: goalId, label: goal.label },
        assumptions,
        targetYear: assumptions.targetYear,
        baseline: output.metrics.map((metric) => ({
          metric: metric.label,
          baseline: metric.baselineDisplay,
          unit: metric.unit,
          source: metric.baselineSource,
          status: metric.baselineStatus,
        })),
        projected: output.metrics.map((metric) => ({
          metric: metric.label,
          status: metric.status,
          projected: metric.projectedDisplay,
          changePercent: metric.changePct,
          method: metric.method,
          limitation: metric.limitation,
        })),
        summary: output.summary,
        insights: output.insights,
        disclaimer:
          'Modelled scenario outputs are estimates under the stated assumptions, not predictions or guaranteed outcomes. Indicators marked UNAVAILABLE have no connected validated model or required input and are intentionally not estimated.',
      };
      const file = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dna-city-scenario-${city.id}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`Scenario report created for ${city.name}.`);
    } catch (error) {
      console.error('Could not export scenario report.', error);
      setMessage('The report export failed in this browser.');
    }
  };

  return (
    <DashboardShell city={city} dataStatus={dataStatus} onSelectCity={onSelectCity}>
      <div className="space-y-4">
        <SimulationHeader data={data} isLoading={isLoading} />

        <nav className="flex flex-wrap gap-1 rounded-xl border border-[#1b3041] bg-[#0a1926] p-1" aria-label="Simulation views">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                activeTab === id ? 'bg-teal-950/60 text-teal-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>

        {message && (
          <p role="status" className="rounded-lg border border-teal-900/60 bg-teal-950/30 px-3 py-2 text-[10px] text-teal-200">{message}</p>
        )}

        {activeTab === 'scenario' && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,320px)]">
            <div className="flex flex-col gap-4">
              <SimulationGoals goalId={goalId} onChange={setGoalId} />
              <ScenarioParameters goal={goal} assumptions={assumptions} onChange={setAssumptions} />
            </div>
            <div className="flex flex-col gap-4">
              <SimulationMapPanel city={city} data={data} output={output} view={mapView} onViewChange={setMapView} />
              <ProjectedImpact metrics={output.metrics} targetYear={assumptions.targetYear} />
              <SimulationTimeline metrics={output.metrics} targetYear={assumptions.targetYear} currentYear={currentYear} />
            </div>
            <SimulationResults
              city={city}
              output={output}
              isLoading={isLoading}
              isSaving={isSaving}
              onSave={handleSave}
              onDownload={handleDownload}
            />
          </div>
        )}

        {activeTab === 'scenario' && <SimulationMethodology />}
        {activeTab === 'compare' && <ScenarioComparison />}
        {activeTab === 'saved' && <SavedScenarios />}
      </div>
    </DashboardShell>
  );
}

