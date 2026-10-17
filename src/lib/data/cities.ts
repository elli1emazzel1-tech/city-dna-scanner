import type { City } from './types';

export const cities: City[] = [
  { id: 'mumbai', name: 'Mumbai', country: 'India', countryCode: 'IN', coordinates: { latitude: 19.076, longitude: 72.878 } },
  { id: 'london', name: 'London', country: 'United Kingdom', countryCode: 'GB', coordinates: { latitude: 51.5072, longitude: -0.1276 } },
  { id: 'paris', name: 'Paris', country: 'France', countryCode: 'FR', coordinates: { latitude: 48.8566, longitude: 2.3522 } },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', countryCode: 'JP', coordinates: { latitude: 35.6762, longitude: 139.6503 } },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', coordinates: { latitude: 52.3676, longitude: 4.9041 } },
  { id: 'berlin', name: 'Berlin', country: 'Germany', countryCode: 'DE', coordinates: { latitude: 52.52, longitude: 13.405 } },
  { id: 'new-york', name: 'New York', country: 'United States', countryCode: 'US', coordinates: { latitude: 40.7128, longitude: -74.006 } },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', countryCode: 'SG', coordinates: { latitude: 1.3521, longitude: 103.8198 } },
  { id: 'delhi', name: 'Delhi', country: 'India', countryCode: 'IN', coordinates: { latitude: 28.6139, longitude: 77.209 } },
  { id: 'bengaluru', name: 'Bengaluru', country: 'India', countryCode: 'IN', coordinates: { latitude: 12.9716, longitude: 77.5946 } },
  { id: 'chicago', name: 'Chicago', country: 'United States', countryCode: 'US', coordinates: { latitude: 41.8781, longitude: -87.6298 } },
  { id: 'los-angeles', name: 'Los Angeles', country: 'United States', countryCode: 'US', coordinates: { latitude: 34.0522, longitude: -118.2437 } },
  { id: 'san-francisco', name: 'San Francisco', country: 'United States', countryCode: 'US', coordinates: { latitude: 37.7749, longitude: -122.4194 } },
  { id: 'zurich', name: 'Zürich', country: 'Switzerland', countryCode: 'CH', coordinates: { latitude: 47.3769, longitude: 8.5417 } },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', countryCode: 'IS', coordinates: { latitude: 64.1466, longitude: -21.9426 } },
  { id: 'vienna', name: 'Vienna', country: 'Austria', countryCode: 'AT', coordinates: { latitude: 48.2082, longitude: 16.3738 } },
  { id: 'toronto', name: 'Toronto', country: 'Canada', countryCode: 'CA', coordinates: { latitude: 43.6532, longitude: -79.3832 } },
  { id: 'sydney', name: 'Sydney', country: 'Australia', countryCode: 'AU', coordinates: { latitude: -33.8688, longitude: 151.2093 } },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', coordinates: { latitude: 25.2048, longitude: 55.2708 } },
  { id: 'helsinki', name: 'Helsinki', country: 'Finland', countryCode: 'FI', coordinates: { latitude: 60.1699, longitude: 24.9384 } },
];

function normalizeCityName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function searchKnownCities(query: string): City[] {
  const normalizedQuery = normalizeCityName(query);
  if (!normalizedQuery) return [];
  return cities.filter((city) =>
    normalizeCityName(`${city.name} ${city.country}`).includes(normalizedQuery),
  ).slice(0, 5);
}

interface OpenMeteoGeocodingResult {
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGeocodingResult(value: unknown): value is OpenMeteoGeocodingResult {
  if (!isRecord(value)) return false;
  return typeof value.name === 'string'
    && typeof value.country === 'string'
    && typeof value.country_code === 'string'
    && typeof value.latitude === 'number'
    && Number.isFinite(value.latitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && typeof value.longitude === 'number'
    && Number.isFinite(value.longitude)
    && value.longitude >= -180
    && value.longitude <= 180;
}

export async function searchGeocodedCities(query: string, signal: AbortSignal): Promise<City[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];
  if (cleanQuery.length > 120) throw new Error('City search must be 120 characters or fewer.');

  const params = new URLSearchParams({ name: cleanQuery, count: '7', language: 'en', format: 'json' });
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal: requestSignal });
  if (!response.ok) throw new Error(`City lookup failed (${response.status}).`);

  const payload: unknown = await response.json();
  if (!isRecord(payload) || (payload.results !== undefined && !Array.isArray(payload.results))) {
    throw new Error('City lookup returned an invalid response.');
  }

  const rawResults: unknown[] = Array.isArray(payload.results) ? payload.results : [];
  if (!rawResults.every(isGeocodingResult)) throw new Error('City lookup returned malformed city records.');
  const results = rawResults;
  const indexedCities = new Map(cities.map((city) => [`${normalizeCityName(city.name)}-${city.countryCode.toUpperCase()}`, city]));

  return results.map((result) => {
    const countryCode = result.country_code.toUpperCase();
    const knownCity = indexedCities.get(`${normalizeCityName(result.name)}-${countryCode}`);
    const id = `geocoded-${countryCode}-${normalizeCityName(result.name)}-${result.latitude}-${result.longitude}`;
    return {
      id,
      name: knownCity?.name ?? result.name,
      country: knownCity?.country ?? result.country,
      countryCode,
      coordinates: { latitude: result.latitude, longitude: result.longitude },
    };
  });
}
