'use client';

import { Building2, Factory, Landmark, MapPin, ShieldCheck, UserCog, Users, Warehouse, type LucideIcon } from 'lucide-react';
import DashboardShell from './DashboardShell';
import { useCitySelection } from './CitySelectionProvider';
import { useWorkspace } from './WorkspaceProvider';
import { useCityEnvironmentalData } from './useCityEnvironmentalData';
import {
  airRisk,
  floodRisk,
  getCityById,
  heatRisk,
  metricValue,
  overallRisk,
  ROLE_PERMISSIONS,
  type Facility,
  type RiskLevel,
} from '../../lib/data/workspace';
import type { City } from '../../lib/data/types';

const FACILITY_ICONS: Record<Facility['kind'], LucideIcon> = {
  Office: Building2,
  'Data Centre': Landmark,
  Warehouse: Warehouse,
  Manufacturing: Factory,
  Retail: Building2,
};

const RISK_STYLE: Record<RiskLevel, string> = {
  Low: 'border-teal-800/70 bg-teal-950/40 text-teal-300',
  Moderate: 'border-amber-800/70 bg-amber-950/40 text-amber-300',
  High: 'border-rose-800/70 bg-rose-950/40 text-rose-300',
  Unknown: 'border-slate-700 bg-slate-800/40 text-slate-400',
};

function RiskBadge({ level, status }: { level: RiskLevel; status: string }) {
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${RISK_STYLE[level]}`}>{level}</span>
      <span className="font-mono text-[7px] uppercase tracking-wide text-slate-600">{status}</span>
    </span>
  );
}

/** Live risk indicators for a single facility, derived from its city's environmental data. */
function FacilityRiskCells({ facility }: { facility: Facility }) {
  const city: City | undefined = getCityById(facility.cityId);
  const { data, isLoading } = useCityEnvironmentalData(city ?? ({ id: facility.cityId, name: facility.cityId, country: '', countryCode: '', coordinates: facility.coordinates } as City));

  if (!city || isLoading) {
    return (
      <>
        <td className="px-3 py-2"><RiskBadge level="Unknown" status="loading" /></td>
        <td className="px-3 py-2"><RiskBadge level="Unknown" status="loading" /></td>
        <td className="px-3 py-2"><RiskBadge level="Unknown" status="loading" /></td>
        <td className="px-3 py-2"><RiskBadge level="Unknown" status="loading" /></td>
      </>
    );
  }

  const apparent = data.weather.apparentTemperature ?? data.weather.temperature;
  const heat = heatRisk(apparent);
  const heatStatus = data.weather.status;
  const air = airRisk(metricValue(data, 'air'));
  const airStatus = data.metrics.find((metric) => metric.id === 'air')?.status ?? 'UNAVAILABLE';
  const flood = floodRisk(metricValue(data, 'flood'));
  const floodStatus = data.metrics.find((metric) => metric.id === 'flood')?.status ?? 'UNAVAILABLE';
  const overall = overallRisk([heat, air, flood]);

  return (
    <>
      <td className="px-3 py-2"><RiskBadge level={heat} status={heatStatus} /></td>
      <td className="px-3 py-2"><RiskBadge level={air} status={airStatus} /></td>
      <td className="px-3 py-2"><RiskBadge level={flood} status={floodStatus} /></td>
      <td className="px-3 py-2"><RiskBadge level={overall} status="derived" /></td>
    </>
  );
}

export default function WorkspacePage() {
  const { city, setCity } = useCitySelection();
  const { organisation } = useWorkspace();

  return (
    <DashboardShell city={city} onSelectCity={setCity}>
      <div className="space-y-4">
        <header className="rounded-md border border-[#1b3041] bg-[#0a1926] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-teal-400/30 bg-teal-400/10 text-teal-300">
                <Building2 size={20} />
              </span>
              <div>
                <h1 className="text-[15px] font-semibold text-slate-100">{organisation.name}</h1>
                <p className="text-[10px] text-slate-500">{organisation.industry} · {organisation.region}</p>
              </div>
            </div>
            <div className="flex gap-4 text-[10px]">
              <div><span className="block text-slate-500">Facilities</span><span className="font-mono text-[13px] text-slate-200">{organisation.facilities.length}</span></div>
              <div><span className="block text-slate-500">Members</span><span className="font-mono text-[13px] text-slate-200">{organisation.members.length}</span></div>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 rounded border border-slate-800 bg-[#081622] px-2.5 py-2 text-[9px] leading-relaxed text-slate-500">
            <UserCog size={12} className="mt-0.5 shrink-0 text-slate-600" />
            Organisation profiles, members and facilities are local demo data stored in this browser (no backend). Risk indicators are live values from the same Open-Meteo providers used across DNA · City.
          </p>
        </header>

        <section className="rounded-md border border-[#1b3041] bg-[#0a1926]">
          <div className="flex items-center gap-2 border-b border-[#1b3041] px-4 py-3">
            <Users size={15} className="text-teal-300" />
            <h2 className="text-[12px] font-semibold text-slate-100">Members &amp; permissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-800/60 text-[9px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-medium">Member</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {organisation.members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-800/40">
                    <td className="px-4 py-2">
                      <span className="block font-medium text-slate-200">{member.name}</span>
                      <span className="block text-slate-500">{member.email}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-[9px] text-slate-300">
                        <ShieldCheck size={11} className="text-teal-400" /> {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-400">{ROLE_PERMISSIONS[member.role].join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        <section className="rounded-md border border-[#1b3041] bg-[#0a1926]">
          <div className="flex items-center gap-2 border-b border-[#1b3041] px-4 py-3">
            <MapPin size={15} className="text-teal-300" />
            <h2 className="text-[12px] font-semibold text-slate-100">Monitored facilities</h2>
            <span className="ml-auto text-[9px] text-slate-500">Live risk · Heat / Air / Flood</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-800/60 text-[9px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-medium">Facility</th>
                  <th className="px-3 py-2 font-medium">City</th>
                  <th className="px-3 py-2 font-medium">Criticality</th>
                  <th className="px-3 py-2 font-medium">Heat</th>
                  <th className="px-3 py-2 font-medium">Air</th>
                  <th className="px-3 py-2 font-medium">Flood</th>
                  <th className="px-3 py-2 font-medium">Overall</th>
                </tr>
              </thead>
              <tbody>
                {organisation.facilities.map((item) => {
                  const Icon = FACILITY_ICONS[item.kind];
                  const facilityCity = getCityById(item.cityId);
                  return (
                    <tr key={item.id} className="border-b border-slate-800/40">
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2 font-medium text-slate-200"><Icon size={13} className="text-slate-500" /> {item.name}</span>
                        <span className="block pl-5 text-slate-500">{item.kind}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{facilityCity ? `${facilityCity.name}, ${facilityCity.country}` : item.cityId}</td>
                      <td className="px-3 py-2 text-slate-400">{item.criticality}</td>
                      <FacilityRiskCells facility={item} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[#1b3041] px-4 py-2.5 text-[8px] leading-relaxed text-slate-600">
            Risk levels are transparent thresholds over live provider values (Heat: apparent temp ≥30/38 °C · Air: US AQI ≥100/150 · Flood: GloFAS discharge ≥120/300 m³/s). Status shows each provider&apos;s provenance; “Unknown” means no live value was returned.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}


