import { cities } from './cities';
import type { City, CityEnvironmentalData } from './types';

/**
 * Organisation Workspace — local (demo) data model.
 *
 * DNA · City has no backend, so organisation profiles, members and monitored
 * facilities are LOCAL DEMO DATA defined here (clearly labelled in the UI). Only the
 * user's *active organisation selection* is persisted to localStorage. Facility risk
 * indicators are derived from the SAME live environmental telemetry used elsewhere
 * (Open-Meteo weather / air-quality / flood) for the facility's city — never invented.
 */

export type MemberRole = 'Owner' | 'Admin' | 'Analyst' | 'Viewer';

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
}

export type FacilityKind = 'Office' | 'Data Centre' | 'Warehouse' | 'Manufacturing' | 'Retail';

export interface Facility {
  id: string;
  name: string;
  kind: FacilityKind;
  cityId: string;
  /** Facility coordinates — a small offset from the mapped city centre. */
  coordinates: { latitude: number; longitude: number };
  criticality: 'Low' | 'Medium' | 'High';
}

export interface Organisation {
  id: string;
  name: string;
  industry: string;
  region: string;
  members: WorkspaceMember[];
  facilities: Facility[];
}

function facility(
  id: string,
  name: string,
  kind: FacilityKind,
  cityId: string,
  criticality: Facility['criticality'],
  offsetLat: number,
  offsetLng: number,
): Facility {
  const city = cities.find((item) => item.id === cityId);
  const base = city?.coordinates ?? { latitude: 0, longitude: 0 };
  return {
    id,
    name,
    kind,
    cityId,
    criticality,
    coordinates: {
      latitude: Number((base.latitude + offsetLat).toFixed(4)),
      longitude: Number((base.longitude + offsetLng).toFixed(4)),
    },
  };
}

export const ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  Owner: ['Manage workspace', 'Manage members', 'Manage facilities', 'Run simulations', 'Export reports'],
  Admin: ['Manage members', 'Manage facilities', 'Run simulations', 'Export reports'],
  Analyst: ['View facilities', 'Run simulations', 'Export reports'],
  Viewer: ['View facilities', 'View reports'],
};

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Unknown';

/** Read a numeric metric value from live environmental data, or null when unavailable. */
export function metricValue(data: CityEnvironmentalData, id: CityEnvironmentalData['metrics'][number]['id']): number | null {
  const metric = data.metrics.find((item) => item.id === id);
  if (!metric || metric.status === 'UNAVAILABLE' || metric.status === 'ERROR') return null;
  const parsed = Number(metric.value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Documented thresholds — transparent heuristics over real provider values, not a model. */
export function heatRisk(apparentC: number | null): RiskLevel {
  if (apparentC == null) return 'Unknown';
  if (apparentC >= 38) return 'High';
  if (apparentC >= 30) return 'Moderate';
  return 'Low';
}

export function airRisk(aqi: number | null): RiskLevel {
  if (aqi == null) return 'Unknown';
  if (aqi >= 150) return 'High';
  if (aqi >= 100) return 'Moderate';
  return 'Low';
}

export function floodRisk(discharge: number | null): RiskLevel {
  if (discharge == null) return 'Unknown';
  if (discharge >= 300) return 'High';
  if (discharge >= 120) return 'Moderate';
  return 'Low';
}

/** Overall facility risk = the worst of the three indicator levels. */
export function overallRisk(levels: RiskLevel[]): RiskLevel {
  const order: RiskLevel[] = ['Unknown', 'Low', 'Moderate', 'High'];
  return levels.reduce<RiskLevel>((worst, level) => (order.indexOf(level) > order.indexOf(worst) ? level : worst), 'Unknown');
}

export function getOrganisationById(id: string): Organisation | undefined {
  return organisations.find((organisation) => organisation.id === id);
}

export function getCityById(id: string): City | undefined {
  return cities.find((city) => city.id === id);
}

/** Local demo organisations. Not real companies; illustrative only. */
export const organisations: Organisation[] = [
  {
    id: 'meridian-logistics',
    name: 'Meridian Logistics',
    industry: 'Freight & Logistics',
    region: 'EMEA · APAC',
    members: [
      { id: 'm1', name: 'A. Okafor', email: 'a.okafor@meridian.example', role: 'Owner' },
      { id: 'm2', name: 'L. Fontaine', email: 'l.fontaine@meridian.example', role: 'Admin' },
      { id: 'm3', name: 'R. Sharma', email: 'r.sharma@meridian.example', role: 'Analyst' },
      { id: 'm4', name: 'K. Tan', email: 'k.tan@meridian.example', role: 'Viewer' },
    ],
    facilities: [
      facility('f1', 'Mumbai Distribution Hub', 'Warehouse', 'mumbai', 'High', 0.02, 0.03),
      facility('f2', 'Singapore Port Office', 'Office', 'singapore', 'Medium', -0.015, 0.02),
      facility('f3', 'Rotterdam Depot', 'Warehouse', 'amsterdam', 'Medium', 0.03, -0.02),
      facility('f4', 'Dubai Freight Terminal', 'Warehouse', 'dubai', 'High', 0.01, 0.04),
    ],
  },
  {
    id: 'northwind-energy',
    name: 'Northwind Energy',
    industry: 'Renewable Energy',
    region: 'Europe',
    members: [
      { id: 'm1', name: 'S. Bergström', email: 's.bergstrom@northwind.example', role: 'Owner' },
      { id: 'm2', name: 'M. Weber', email: 'm.weber@northwind.example', role: 'Admin' },
      { id: 'm3', name: 'J. Novak', email: 'j.novak@northwind.example', role: 'Analyst' },
    ],
    facilities: [
      facility('f1', 'Berlin Operations Centre', 'Office', 'berlin', 'Medium', 0.01, 0.02),
      facility('f2', 'North Sea Control Room', 'Office', 'amsterdam', 'High', 0.04, 0.01),
      facility('f3', 'Vienna Grid Station', 'Manufacturing', 'vienna', 'High', -0.02, 0.02),
      facility('f4', 'Zürich R&D Lab', 'Office', 'zurich', 'Low', 0.015, -0.015),
    ],
  },
  {
    id: 'atlas-retail-group',
    name: 'Atlas Retail Group',
    industry: 'Retail',
    region: 'Americas',
    members: [
      { id: 'm1', name: 'D. Castillo', email: 'd.castillo@atlas.example', role: 'Owner' },
      { id: 'm2', name: 'P. Nguyen', email: 'p.nguyen@atlas.example', role: 'Admin' },
      { id: 'm3', name: 'T. Brooks', email: 't.brooks@atlas.example', role: 'Analyst' },
      { id: 'm4', name: 'E. Marsh', email: 'e.marsh@atlas.example', role: 'Viewer' },
      { id: 'm5', name: 'C. Diaz', email: 'c.diaz@atlas.example', role: 'Viewer' },
    ],
    facilities: [
      facility('f1', 'New York Flagship Store', 'Retail', 'new-york', 'High', 0.01, 0.01),
      facility('f2', 'Chicago Data Centre', 'Data Centre', 'chicago', 'High', 0.02, -0.02),
      facility('f3', 'Los Angeles Warehouse', 'Warehouse', 'los-angeles', 'Medium', -0.02, 0.03),
      facility('f4', 'San Francisco Office', 'Office', 'san-francisco', 'Low', 0.015, 0.02),
      facility('f5', 'Toronto Regional Hub', 'Office', 'toronto', 'Medium', 0.01, -0.01),
    ],
  },
];
