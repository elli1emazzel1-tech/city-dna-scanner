import type { OpenWeatherCityResult } from './types';

export function isOpenWeatherCityResult(value: unknown): value is OpenWeatherCityResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  if (typeof result.city !== 'object' || result.city === null || typeof result.airQuality !== 'object' || result.airQuality === null) return false;
  const city = result.city as Record<string, unknown>;
  const metric = result.airQuality as Record<string, unknown>;
  if (typeof city.coordinates !== 'object' || city.coordinates === null) return false;
  const coordinates = city.coordinates as Record<string, unknown>;
  return typeof city.id === 'string'
    && typeof city.name === 'string'
    && typeof city.country === 'string'
    && typeof city.countryCode === 'string'
    && typeof coordinates.latitude === 'number'
    && Number.isFinite(coordinates.latitude)
    && coordinates.latitude >= -90
    && coordinates.latitude <= 90
    && typeof coordinates.longitude === 'number'
    && Number.isFinite(coordinates.longitude)
    && coordinates.longitude >= -180
    && coordinates.longitude <= 180
    && metric.id === 'air'
    && typeof metric.value === 'string'
    && /^[1-5]$/.test(metric.value)
    && metric.unit === 'AQI (1–5)'
    && typeof metric.subValue === 'string'
    && typeof metric.source === 'string'
    && metric.status === 'REPORTED'
    && metric.condition === 'Informational'
    && (metric.updated === null || (typeof metric.updated === 'string' && Number.isFinite(Date.parse(metric.updated))));
}
