import type { CityEnvironmentalData, MapLayer, MapLayerId } from '../data/types';

export const defaultMapLayers: MapLayer[] = [
  { id: 'heat', label: 'Heat Risk', enabled: true, status: 'MODELLED' },
  { id: 'flood', label: 'Flood Risk', enabled: false, status: 'MODELLED' },
  { id: 'air', label: 'Air Quality', enabled: true, status: 'MODELLED' },
  { id: 'green', label: 'Green Cover', enabled: true, status: 'CACHED' },
  { id: 'hazards', label: 'Hazard Reports', enabled: false, status: 'UNAVAILABLE' },
  { id: 'buildings', label: 'Buildings', enabled: false, status: 'CACHED' },
  { id: 'roads', label: 'Roads', enabled: false, status: 'CACHED' },
  { id: 'water', label: 'Water bodies', enabled: false, status: 'CACHED' },
];

export function setMapLayer(layers: MapLayer[], id: MapLayerId): MapLayer[] {
  return layers.map((layer) =>
    layer.id === id && layer.status !== 'UNAVAILABLE'
      ? { ...layer, enabled: !layer.enabled }
      : layer,
  );
}

export function getLayerColor(id: MapLayerId): string {
  switch (id) {
    case 'heat': return '#e89a49';
    case 'flood': return '#42b6d8';
    case 'air': return '#78c6ae';
    case 'green': return '#74b68b';
    case 'hazards': return '#e76f68';
    case 'buildings': return '#8d9bad';
    case 'roads': return '#c4b98c';
    case 'water': return '#4da5d3';
  }
}

/**
 * Real telemetry values that drive the point-based overlays (heat, air, flood).
 *
 * Heat, air and flood are single genuine provider readings, rendered as a compact
 * city-centre marker (not a spatial field). Green cover, roads, water and buildings
 * are instead drawn from real OpenStreetMap geometry (see lib/data/overpass.ts) at
 * actual coordinates — genuine mapped features, not interpolated surfaces.
 */
export interface MapTelemetry {
  /** Apparent temperature (°C) — Open-Meteo weather nowcast. */
  heat: number | null;
  /** River discharge (m³/s) — Open-Meteo GloFAS model. */
  flood: number | null;
  /** Air-quality proxy — US AQI (Open-Meteo/CAMS) or CO µg/m³. */
  air: number | null;
  /** Mapped vegetation feature count — local spatial index (OpenStreetMap). */
  green: number | null;
  /** Mapped road/rail feature count — local spatial index (OpenStreetMap). */
  roads: number | null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function metricNumber(
  data: CityEnvironmentalData,
  id: CityEnvironmentalData['metrics'][number]['id'],
): number | null {
  const metric = data.metrics.find((item) => item.id === id);
  if (!metric) return null;
  if (metric.status === 'UNAVAILABLE' || metric.status === 'ERROR') return null;
  const parsed = Number(metric.value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Extract the genuine telemetry values used to size each overlay. */
export function extractMapTelemetry(data: CityEnvironmentalData | undefined): MapTelemetry {
  if (!data) return { heat: null, flood: null, air: null, green: null, roads: null };
  const temp = data.weather.apparentTemperature ?? data.weather.temperature;
  return {
    heat: temp != null && Number.isFinite(temp) ? temp : null,
    flood: metricNumber(data, 'flood'),
    air: metricNumber(data, 'air') ?? metricNumber(data, 'carbon'),
    green: metricNumber(data, 'green'),
    roads: metricNumber(data, 'noise'),
  };
}

/** True only when a genuine telemetry value exists to visualise. */
export function layerHasData(id: MapLayerId, telemetry: MapTelemetry | undefined): boolean {
  if (!telemetry) return false;
  switch (id) {
    case 'heat': return telemetry.heat != null;
    case 'flood': return telemetry.flood != null;
    case 'air': return telemetry.air != null;
    case 'green': return telemetry.green != null;
    case 'roads': return telemetry.roads != null;
    default: return false; // water, buildings, hazards — no connected provider
  }
}

/**
 * Normalise a genuine telemetry value to 0–1 using documented, transparent
 * observation ranges (not a model). Ranges are stated in the UI legend note.
 */
export function normalizeLayerValue(id: MapLayerId, value: number): number {
  switch (id) {
    case 'heat': return clamp01(value / 45);        // apparent temperature 0–45 °C
    case 'flood': return clamp01(value / 500);      // river discharge 0–500 m³/s
    case 'air': return clamp01(value / 300);        // AQI / CO 0–300
    case 'green': return clamp01(value / 550);      // vegetation feature count 0–550
    case 'roads': return clamp01(value / 1200);     // road/rail feature count 0–1200
    default: return 0;
  }
}

/** Low-to-High intensity ramp used by the overlay legend bar. */
export const RISK_GRADIENT =
  'linear-gradient(90deg,#2f8f7a 0%,#6fbf73 26%,#d9c46a 55%,#e08a3c 78%,#d8564b 100%)';

/** Human-readable current reading for a layer, or null when unavailable. */
export function layerReading(
  id: MapLayerId,
  telemetry: MapTelemetry | undefined,
): { value: number; unit: string } | null {
  if (!telemetry) return null;
  switch (id) {
    case 'heat': return telemetry.heat != null ? { value: telemetry.heat, unit: '°C apparent' } : null;
    case 'flood': return telemetry.flood != null ? { value: telemetry.flood, unit: 'm³/s discharge' } : null;
    case 'air': return telemetry.air != null ? { value: telemetry.air, unit: 'AQI / CO' } : null;
    case 'green': return telemetry.green != null ? { value: telemetry.green, unit: 'veg. features' } : null;
    case 'roads': return telemetry.roads != null ? { value: telemetry.roads, unit: 'road features' } : null;
    default: return null;
  }
}
