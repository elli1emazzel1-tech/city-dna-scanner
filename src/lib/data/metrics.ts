import type {
  City,
  CityEnvironmentalData,
  EnvironmentalMetric,
  MetricCondition,
} from './types';

const unavailableMetrics: Pick<EnvironmentalMetric, 'id' | 'label' | 'unit' | 'source'>[] = [
  { id: 'air', label: 'Air quality', unit: 'US AQI', source: 'Open-Meteo Air Quality API · CAMS model' },
  { id: 'water', label: 'National drinking-water coverage', unit: '% of population', source: 'World Bank · WHO/UNICEF Joint Monitoring Programme' },
  { id: 'green', label: 'Mapped vegetation features', unit: 'OSM objects / 2 km radius', source: 'OpenStreetMap · Overpass API' },
  { id: 'carbon', label: 'Carbon monoxide (CO)', unit: 'µg/m³', source: 'Open-Meteo Air Quality API · CAMS model' },
  { id: 'noise', label: 'Mapped road & rail features', unit: 'OSM ways / 2 km radius', source: 'OpenStreetMap · Overpass API' },
  { id: 'flood', label: 'River discharge', unit: 'm³/s', source: 'Open-Meteo Flood API · GloFAS model' },
];

export function createUnavailableMetric(
  id: EnvironmentalMetric['id'],
  error?: string,
): EnvironmentalMetric {
  const definition = unavailableMetrics.find((item) => item.id === id);
  if (!definition) throw new Error(`Unknown environmental metric: ${id}`);
  return {
    ...definition,
    value: 'Unavailable',
    subValue: error ?? (id === 'green'
      ? 'No mapped features returned for this location.'
      : id === 'flood'
        ? 'No validated river-discharge value is available.'
        : id === 'water'
          ? 'No country-level drinking-water coverage estimate was returned.'
          : id === 'noise'
            ? 'No mapped road or railway features returned.'
            : 'No validated city-specific reading is available.'),
    condition: 'Unavailable',
    status: error ? 'ERROR' : 'UNAVAILABLE',
    updated: null,
    ...(error ? { error } : {}),
  };
}

export function createUnavailableCityData(city: City): CityEnvironmentalData {
  return {
    city,
    weather: {
      temperature: null,
      apparentTemperature: null,
      humidity: null,
      windSpeed: null,
      condition: null,
      status: 'UNAVAILABLE',
      source: 'Open-Meteo Weather API',
      updated: null,
    },
    metrics: unavailableMetrics.map(({ id }) => createUnavailableMetric(id)),
    healthScore: null,
  };
}

export function classifyUsAqi(value: number): MetricCondition {
  if (!Number.isInteger(value) || value < 0 || value > 500) return 'Unavailable';
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 150) return 'Unhealthy for sensitive groups';
  if (value <= 200) return 'Unhealthy';
  if (value <= 300) return 'Very unhealthy';
  return 'Hazardous';
}
