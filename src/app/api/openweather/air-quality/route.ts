import type { City, EnvironmentalMetric } from '../../../../lib/data/types';

interface OpenWeatherGeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface OpenWeatherAirResponse {
  list: {
    main: { aqi: number };
    components: Record<string, number>;
    dt: number;
  }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGeocodingResult(value: unknown): value is OpenWeatherGeocodingResult {
  return isRecord(value)
    && typeof value.name === 'string'
    && value.name.length > 0
    && typeof value.country === 'string'
    && /^[A-Z]{2}$/.test(value.country)
    && typeof value.lat === 'number'
    && Number.isFinite(value.lat)
    && value.lat >= -90
    && value.lat <= 90
    && typeof value.lon === 'number'
    && Number.isFinite(value.lon)
    && value.lon >= -180
    && value.lon <= 180
    && (value.state === undefined || typeof value.state === 'string');
}

function isAirResponse(value: unknown): value is OpenWeatherAirResponse {
  if (!isRecord(value) || !Array.isArray(value.list) || value.list.length === 0) return false;
  const reading = value.list[0];
  if (!isRecord(reading) || !isRecord(reading.main) || !isRecord(reading.components)) return false;
  return Number.isInteger(reading.main.aqi)
    && typeof reading.main.aqi === 'number'
    && reading.main.aqi >= 1
    && reading.main.aqi <= 5
    && Number.isSafeInteger(reading.dt)
    && (reading.dt as number) > 0
    && Object.values(reading.components).every((component) =>
      typeof component === 'number' && Number.isFinite(component) && component >= 0);
}

function slug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function pollutantSummary(components: Record<string, number>) {
  const labels: Record<string, string> = {
    co: 'CO',
    no: 'NO',
    no2: 'NO₂',
    o3: 'O₃',
    so2: 'SO₂',
    pm2_5: 'PM₂.₅',
    pm10: 'PM₁₀',
    nh3: 'NH₃',
  };
  return Object.entries(labels)
    .map(([key, label]) => `${label} ${components[key] === undefined ? 'unavailable' : `${components[key].toFixed(2)} µg/m³`}`)
    .join(' · ');
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Provide a valid city name.' }, { status: 400 });
  }
  if (!isRecord(body) || typeof body.city !== 'string' || body.city.trim().length < 2 || body.city.length > 120) {
    return Response.json({ error: 'Provide a city name between 2 and 120 characters.' }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'OpenWeather is not configured. Set OPENWEATHER_API_KEY on the server.' }, { status: 503 });
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]);
  const geoUrl = new URL('https://api.openweathermap.org/geo/1.0/direct');
  geoUrl.search = new URLSearchParams({ q: body.city.trim(), limit: '1', appid: apiKey }).toString();

  try {
    const geoResponse = await fetch(geoUrl, { signal, cache: 'no-store' });
    if (!geoResponse.ok) {
      return Response.json({ error: `OpenWeather geocoding failed (HTTP ${geoResponse.status}).` }, { status: 502 });
    }
    const geocoded: unknown = await geoResponse.json();
    if (!Array.isArray(geocoded) || !geocoded[0] || !isGeocodingResult(geocoded[0])) {
      return Response.json({ error: `City "${body.city.trim()}" was not recognized.` }, { status: 404 });
    }

    const match = geocoded[0];
    const airUrl = new URL('https://api.openweathermap.org/data/2.5/air_pollution');
    airUrl.search = new URLSearchParams({
      lat: String(match.lat),
      lon: String(match.lon),
      appid: apiKey,
    }).toString();
    const airResponse = await fetch(airUrl, { signal, cache: 'no-store' });
    if (!airResponse.ok) {
      return Response.json({ error: `OpenWeather air-pollution lookup failed (HTTP ${airResponse.status}).` }, { status: 502 });
    }
    const airPayload: unknown = await airResponse.json();
    if (!isAirResponse(airPayload)) {
      return Response.json({ error: 'OpenWeather returned invalid or missing air-pollution data.' }, { status: 502 });
    }

    const reading = airPayload.list[0];
    const readingAgeMs = Date.now() - reading.dt * 1000;
    if (readingAgeMs < -15 * 60_000 || readingAgeMs > 6 * 60 * 60_000) {
      return Response.json({ error: 'OpenWeather returned stale or future-dated air-pollution data.' }, { status: 502 });
    }
    const city: City = {
      id: `openweather-${slug(match.name)}-${match.country.toLowerCase()}-${match.lat.toFixed(3)}-${match.lon.toFixed(3)}`,
      name: match.name,
      country: match.state ? `${match.state}, ${match.country}` : match.country,
      countryCode: match.country,
      coordinates: { latitude: match.lat, longitude: match.lon },
    };
    const airQuality: EnvironmentalMetric = {
      id: 'air',
      label: 'Air pollution · OpenWeather AQI',
      value: String(reading.main.aqi),
      unit: 'AQI (1–5)',
      subValue: `Provider-reported scale: 1 good, 2 fair, 3 moderate, 4 poor, 5 very poor. ${pollutantSummary(reading.components)}. Data time ${new Date(reading.dt * 1000).toISOString()}. This is not US AQI.`,
      condition: 'Informational',
      status: 'REPORTED',
      source: 'OpenWeather Air Pollution API · provider AQI and component values',
      updated: new Date(reading.dt * 1000).toISOString(),
    };
    return Response.json({ city, airQuality });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error('OpenWeather city/air-quality lookup failed.', error);
    const message = error instanceof DOMException && error.name === 'TimeoutError'
      ? 'OpenWeather lookup timed out. Please retry.'
      : 'OpenWeather lookup could not be completed. Please retry.';
    return Response.json({ error: message }, { status: 502 });
  }
}
