'use client';

import { useState } from 'react';
import { Check, Settings2 } from 'lucide-react';
import DashboardShell from './DashboardShell';
import { useCitySelection } from './CitySelectionProvider';

export default function SettingsPage() {
  const { city, setCity, measurementSystem, setMeasurementSystem } = useCitySelection();
  const [unitsDraft, setUnitsDraft] = useState<'Metric' | 'Imperial' | null>(null);
  const units = unitsDraft ?? measurementSystem;
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  return (
    <DashboardShell city={city} onSelectCity={setCity}>
      <section className="mx-auto max-w-3xl rounded-md border border-[#1b3041] bg-[#0a1926] p-4 sm:p-6">
        <div className="flex items-center gap-2"><Settings2 size={16} className="text-teal-300" /><h1 className="text-[14px] font-semibold text-slate-100">Workspace settings</h1></div>
        <p className="mt-2 text-[10px] text-slate-500">Preferences are stored in this browser and shared across application routes.</p>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-[10px] font-medium text-slate-300">Weather display units</span><select value={units} onChange={(event) => { setUnitsDraft(event.target.value as 'Metric' | 'Imperial'); setSaved(false); setSaveError(''); }} className="mt-1.5 block w-full max-w-sm rounded border border-slate-700 bg-[#081622] px-3 py-2 text-[10px] text-slate-200"><option>Metric</option><option>Imperial</option></select><span className="mt-1 block text-[9px] text-slate-600">Converts weather temperature, wind speed, and historical temperature display. Environmental indicators retain each provider&apos;s reported units.</span></label>
          <div className="rounded border border-slate-800 bg-[#081622] p-3"><p className="text-[10px] font-medium text-slate-300">Data handling</p><p className="mt-1 text-[9px] leading-relaxed text-slate-500">Environmental provider values are fetched from public Open-Meteo services where available. Saved city reports and hazard submissions remain in this browser.</p></div>
          <button onClick={() => { const success = setMeasurementSystem(units); setSaved(success); setSaveError(success ? '' : 'Preferences could not be saved in this browser.'); if (success) setUnitsDraft(null); }} className="rounded border border-teal-800/80 bg-teal-950/40 px-3 py-2 text-[10px] font-medium text-teal-200 hover:bg-teal-950/80">Save preferences</button>
          {saveError && <p role="alert" className="inline-flex pl-2 text-[9px] text-rose-300">{saveError}</p>}
          {saved && <p role="status" className="inline-flex items-center gap-1.5 pl-2 text-[9px] text-teal-300"><Check size={12} /> Preferences applied for this session.</p>}
        </div>
      </section>
    </DashboardShell>
  );
}
