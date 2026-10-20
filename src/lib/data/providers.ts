import { getSpatialTelemetry } from './spatialCache';
import { CurrentProviderError, fetchCurrentProviderPayload } from './openMeteoCurrent';
import {
  AIR_QUALITY_FRESHNESS_POLICY,
  isOptionalPollutantValue,
  validateProviderTimestamp,
  WEATHER_FRESHNESS_POLICY,
} from './providerTime';
import type {
  City,
  CityEnvironmentalData,
  Coordinates,
  EnvironmentalMetric,
  HistoricalTemperaturePoint,
  WeatherData,
} from './types';
import { searchGeocodedCities } from './cities';
import { classifyUsAqi, createUnavailableCityData, createUnavailableMetric } from './metrics';

export interface EnvironmentalDataProvider {
  getCityData(city: City, signal: AbortSignal): Promise<CityEnvironmentalData>;
}

interface WorldBankCoverageRecord {
  country: { id: string; value: string };
  date: string;
  value: number | null;
}

export interface WeatherProvider {
  getWeather(coordinates: Coordinates, signal: AbortSignal): Promise<WeatherData>;
}

function isWorldBankCoverageResponse(value: unknown): value is [unknown, WorldBankCoverageRecord[]] {
  if (!Array.isArray(value) || value.length < 2 || !isRecord(value[0]) || !Array.isArray(value[1])) return false;
  return value[1].every((record) => isRecord(record)
    && isRecord(record.country)
    && typeof record.country.id === 'string'
    && typeof record.country.value === 'string'
    && typeof record.date === 'string'
    && /^\d{4}$/.test(record.date)
    && (record.value === null || (isFiniteNumber(record.value) && record.value >= 0 && record.value <= 100)));
}

export interface AirQualityProvider {
  getAirQuality(coordinates: Coordinates, signal: AbortSignal): Promise<{
    air: EnvironmentalMetric;
    carbonMonoxide: EnvironmentalMetric;
  }>;
}

export interface GreenSpaceProvider {
  getMappedCityFeatures(coordinates: Coordinates, signal: AbortSignal): Promise<{
    vegetation: EnvironmentalMetric;
    infrastructure: EnvironmentalMetric;
  }>;
}

export interface FloodHydrologyProvider {
  getRiverDischarge(coordinates: Coordinates, signal: AbortSignal): Promise<EnvironmentalMetric>;
}

export interface WaterCoverageProvider {
  getNationalDrinkingWaterCoverage(countryCode: string, signal: AbortSignal): Promise<EnvironmentalMetric>;
}

export interface GeospatialProvider {
  searchCities(query: string, signal: AbortSignal): Promise<City[]>;
}

export interface HistoricalDataProvider {
  getDailyTemperature(
    coordinates: Coordinates,
    period: '7D' | '30D' | '1Y' | '5Y',
    signal: AbortSignal,
  ): Promise<HistoricalTemperaturePoint[]>;
}

interface CurrentWeatherResponse {
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    apparent_temperature: number;
    soil_moisture_0_to_7cm: number | null;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  timezone: string;
  utc_offset_seconds: number;
  latitude: number;
  longitude: number;
  current_units: {
    interval: string;
    temperature_2m: string;
    apparent_temperature: string;
    soil_moisture_0_to_7cm: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
  };
}

interface CurrentAirQualityResponse {
  current: {
    time: string;
    interval: number;
    us_aqi: number;
    pm2_5: number;
    pm10?: number | null;
    nitrogen_dioxide?: number | null;
    ozone?: number | null;
    sulphur_dioxide?: number | null;
    carbon_monoxide?: number | null;
  };
  timezone: string;
  utc_offset_seconds: number;
  latitude: number;
  longitude: number;
  current_units: {
    interval: string;
    us_aqi: string;
    pm2_5: string;
    pm10?: string;
    nitrogen_dioxide?: string;
    ozone?: string;
    sulphur_dioxide?: string;
    carbon_monoxide?: string;
  };
}

interface FloodDischargeResponse {
  daily: {
    time: string[];
    river_discharge: (number | null)[];
  };
  daily_units: { river_discharge: string };
  latitude: number;
  longitude: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isCurrentWeatherResponse(value: unknown): value is CurrentWeatherResponse {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.current_units)) return false;
  const current = value.current;
  return isTimestamp(current.time)
    && isFiniteNumber(current.interval)
    && current.interval > 0
    && current.interval <= 24 * 60 * 60
    && isFiniteNumber(current.temperature_2m)
    && isFiniteNumber(current.apparent_temperature)
    && (current.soil_moisture_0_to_7cm === null
      || (isFiniteNumber(current.soil_moisture_0_to_7cm)
        && current.soil_moisture_0_to_7cm >= 0
        && current.soil_moisture_0_to_7cm <= 1))
    && isFiniteNumber(current.relative_humidity_2m)
    && current.relative_humidity_2m >= 0
    && current.relative_humidity_2m <= 100
    && isFiniteNumber(current.wind_speed_10m)
    && current.wind_speed_10m >= 0
    && isFiniteNumber(current.weather_code)
    && typeof value.timezone === 'string'
    && value.timezone.length > 0
    && isFiniteNumber(value.utc_offset_seconds)
    && Math.abs(value.utc_offset_seconds) <= 14 * 60 * 60
    && isFiniteNumber(value.latitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && isFiniteNumber(value.longitude)
    && value.longitude >= -180
    && value.longitude <= 180
    && value.current_units.interval === 'seconds'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(current.time)
    && value.current_units.temperature_2m === '°C'
    && value.current_units.apparent_temperature === '°C'
    && value.current_units.soil_moisture_0_to_7cm === 'm³/m³'
    && value.current_units.relative_humidity_2m === '%'
    && value.current_units.wind_speed_10m === 'km/h';
}

function isCurrentAirQualityResponse(value: unknown): value is CurrentAirQualityResponse {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.current_units)) return false;
  const current = value.current;
  const currentUnits = value.current_units;
  const pollutantFields = ['pm10', 'nitrogen_dioxide', 'ozone', 'sulphur_dioxide', 'carbon_monoxide'] as const;
  return isTimestamp(current.time)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(current.time)
    && isFiniteNumber(current.interval)
    && current.interval > 0
    && current.interval <= 24 * 60 * 60
    && isFiniteNumber(current.us_aqi)
    && current.us_aqi >= 0
    && current.us_aqi <= 500
    && Number.isInteger(current.us_aqi)
    && isFiniteNumber(current.pm2_5)
    && current.pm2_5 >= 0
    && pollutantFields.every((key) => {
      const pollutant = current[key];
      const unit = currentUnits[key];
      return isOptionalPollutantValue(pollutant)
        && (pollutant === undefined || unit === undefined || ['μg/m³', 'µg/m³'].includes(String(unit)));
    })
    && typeof value.timezone === 'string'
    && value.timezone.length > 0
    && isFiniteNumber(value.utc_offset_seconds)
    && Math.abs(value.utc_offset_seconds) <= 14 * 60 * 60
    && isFiniteNumber(value.latitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && isFiniteNumber(value.longitude)
    && value.longitude >= -180
    && value.longitude <= 180
    && currentUnits.interval === 'seconds'
    && currentUnits.us_aqi === 'USAQI'
    && ['μg/m³', 'µg/m³'].includes(String(currentUnits.pm2_5))
    && pollutantFields.every((key) => {
      const pollutant = current[key];
      const unit = currentUnits[key];
      return pollutant === undefined || pollutant === null
        ? unit === undefined || ['μg/m³', 'µg/m³'].includes(String(unit))
        : ['μg/m³', 'µg/m³'].includes(String(unit));
    });
}

function isHistoricalResponse(value: unknown): value is {
  daily: { time: string[]; temperature_2m_mean: (number | null)[] };
  daily_units: { temperature_2m_mean: string };
} {
  if (!isRecord(value) || !isRecord(value.daily) || !isRecord(value.daily_units)) return false;
  return Array.isArray(value.daily.time)
    && value.daily.time.every((date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
    && Array.isArray(value.daily.temperature_2m_mean)
    && value.daily.temperature_2m_mean.length === value.daily.time.length
    && value.daily.temperature_2m_mean.every((temperature) => temperature === null || isFiniteNumber(temperature))
    && value.daily_units.temperature_2m_mean === '°C';
}

function isFloodDischargeResponse(value: unknown): value is FloodDischargeResponse {
  if (!isRecord(value) || !isRecord(value.daily) || !isRecord(value.daily_units)) return false;
  return isFiniteNumber(value.latitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && isFiniteNumber(value.longitude)
    && value.longitude >= -180
    && value.longitude <= 180
    && Array.isArray(value.daily.time)
    && value.daily.time.every((date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
    && Array.isArray(value.daily.river_discharge)
    && value.daily.river_discharge.length === value.daily.time.length
    && value.daily.river_discharge.every((discharge) => discharge === null || (isFiniteNumber(discharge) && discharge >= 0))
    && value.daily_units.river_discharge === 'm³/s';
}

function coordinatesAreValid({ latitude, longitude }: Coordinates) {
  return Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
}

function distanceInKm(a: Coordinates, b: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatProviderTime(time: string, timezone: string) {
  return `${time.replace('T', ' ')} ${timezone}`;
}

function weatherDescription(code: number) {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Weather code not classified';
}

async function fetchProviderJson(url: URL, signal: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(15_000);
  const requestSignal = AbortSignal.any([signal, timeout]);
  const response = await fetch(url, { signal: requestSignal, cache: 'default' });
  if (!response.ok) throw new Error(`Data provider returned HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}

/**
 * True when running in a browser (client bundle). Server-side renders and
 * Node/SSR contexts must not use relative URLs such as
 * `/api/environmental/current?...`, because `fetch` cannot parse them outside
 * a browser and throws `Failed to parse URL`.
 */
function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Loads Open-Meteo current conditions for a provider.
 *
 * In the browser we call the internal API route so the request stays
 * same-origin (and avoids CORS). On the server we call Open-Meteo directly,
 * because a relative URL is not resolvable there.
 */
async function fetchCurrentProviderJson(
  provider: 'weather' | 'air-quality',
  coordinates: Coordinates,
  signal: AbortSignal,
): Promise<{ payload: unknown; referenceTime: number }> {
  if (!isBrowserRuntime()) {
    let result: Awaited<ReturnType<typeof fetchCurrentProviderPayload>>;
    try {
      result = await fetchCurrentProviderPayload(provider, coordinates, signal);
    } catch (error) {
      if (error instanceof CurrentProviderError) {
        const label = provider === 'weather' ? 'Weather' : 'Air-quality';
        if (error.kind === 'stale-timestamp') {
          throw new Error(`${label} provider returned stale or future-dated conditions.`);
        }
        if (error.kind === 'http') {
          throw new Error(`${label} provider request failed (${error.message}).`);
        }
        if (error.kind === 'timeout') {
          throw new Error(`${label} provider request timed out.`);
        }
        throw new Error(`${label} provider request failed (${error.message}).`);
      }
      throw error;
    }
    return { payload: result.payload, referenceTime: result.referenceTime };
  }

  const params = new URLSearchParams({
    provider,
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
  });
  const timeout = AbortSignal.timeout(18_000);
  const response = await fetch(`/api/environmental/current?${params}`, {
    signal: AbortSignal.any([signal, timeout]),
    cache: 'no-store',
  });
  let result: unknown;
  try {
    result = await response.json() as unknown;
  } catch {
    throw new Error(`${provider === 'weather' ? 'Weather' : 'Air-quality'} provider returned an invalid response.`);
  }
  if (!isRecord(result)) throw new Error(`${provider === 'weather' ? 'Weather' : 'Air-quality'} provider returned an invalid response.`);
  if (!response.ok) {
    throw new Error(typeof result.error === 'string'
      ? result.error
      : `${provider === 'weather' ? 'Weather' : 'Air-quality'} provider request failed.`);
  }
  if (!('payload' in result) || typeof result.referenceTime !== 'string') {
    throw new Error(`${provider === 'weather' ? 'Weather' : 'Air-quality'} provider returned an invalid response.`);
  }
  const referenceTime = Date.parse(result.referenceTime);
  if (!Number.isFinite(referenceTime)) {
    throw new Error(`${provider === 'weather' ? 'Weather' : 'Air-quality'} provider returned no trustworthy response timestamp.`);
  }
  return { payload: result.payload, referenceTime };
}

export const openMeteoWeatherProvider: WeatherProvider = {
  async getWeather(coordinates, signal) {
    if (!coordinatesAreValid(coordinates)) throw new Error('City coordinates are outside valid latitude/longitude bounds.');
    const { payload, referenceTime } = await fetchCurrentProviderJson('weather', coordinates, signal);
    if (!isCurrentWeatherResponse(payload)) throw new Error('Weather provider returned missing or invalid current conditions.');
    if (!validateProviderTimestamp(
      payload.current.time,
      payload.timezone,
      payload.utc_offset_seconds,
      referenceTime,
      WEATHER_FRESHNESS_POLICY,
    ).valid) {
      throw new Error('Weather provider returned stale or future-dated conditions.');
    }
    if (distanceInKm(coordinates, { latitude: payload.latitude, longitude: payload.longitude }) > 35) {
      throw new Error('Weather provider returned a model grid point too far from the selected city.');
    }
    return {
      temperature: payload.current.temperature_2m,
      apparentTemperature: payload.current.apparent_temperature,
      soilMoisture: payload.current.soil_moisture_0_to_7cm,
      humidity: payload.current.relative_humidity_2m,
      windSpeed: payload.current.wind_speed_10m,
      condition: weatherDescription(payload.current.weather_code),
      status: 'MODELLED',
      source: 'Open-Meteo Forecast API · model-derived current conditions',
      updated: formatProviderTime(payload.current.time, payload.timezone),
      timezone: payload.timezone,
    };
  },
};

export const openMeteoAirQualityProvider: AirQualityProvider = {
  async getAirQuality(coordinates, signal) {
    if (!coordinatesAreValid(coordinates)) throw new Error('City coordinates are outside valid latitude/longitude bounds.');
    const { payload, referenceTime } = await fetchCurrentProviderJson('air-quality', coordinates, signal);
    if (!isCurrentAirQualityResponse(payload)) throw new Error('Air-quality provider returned missing or invalid AQI data.');
    const returnedCoordinates = { latitude: payload.latitude, longitude: payload.longitude };
    if (distanceInKm(coordinates, returnedCoordinates) > 35) {
      throw new Error('Air-quality provider returned a model grid point too far from the selected city.');
    }
    if (!validateProviderTimestamp(
      payload.current.time,
      payload.timezone,
      payload.utc_offset_seconds,
      referenceTime,
      AIR_QUALITY_FRESHNESS_POLICY,
    ).valid) {
      throw new Error('Air-quality provider returned stale or future-dated conditions.');
    }
    const carbonMonoxideValue = payload.current.carbon_monoxide;
    const pollutants: [string, number | null | undefined][] = [
      ['PM₁₀', payload.current.pm10],
      ['NO₂', payload.current.nitrogen_dioxide],
      ['O₃', payload.current.ozone],
      ['SO₂', payload.current.sulphur_dioxide],
      ['CO', carbonMonoxideValue],
    ];
    const pollutantSummary = pollutants
      .map(([label, value]) => `${label} ${typeof value === 'number' ? `${value.toFixed(1)} µg/m³` : 'unavailable'}`)
      .join(' · ');
    const carbonMonoxideMetric: EnvironmentalMetric = {
      id: 'carbon',
      label: 'Carbon monoxide (CO)',
      value: typeof carbonMonoxideValue === 'number' ? carbonMonoxideValue.toFixed(1) : 'Unavailable',
      unit: 'µg/m³',
      subValue: carbonMonoxideValue === undefined
        ? 'The provider omitted the carbon-monoxide field for this model time and grid point. CO is carbon monoxide, not carbon dioxide (CO₂) or greenhouse-gas emissions.'
        : carbonMonoxideValue === null
          ? 'The provider returned no carbon-monoxide concentration for this model time and grid point. CO is carbon monoxide, not carbon dioxide (CO₂) or greenhouse-gas emissions.'
        : `Modelled carbon-monoxide concentration at ${formatProviderTime(payload.current.time, payload.timezone)} and CAMS grid point ${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}. CO is not CO₂ or a grid carbon-intensity value.`,
      condition: typeof carbonMonoxideValue === 'number' ? 'Informational' : 'Unavailable',
      status: typeof carbonMonoxideValue === 'number' ? 'MODELLED' : 'UNAVAILABLE',
      source: 'Open-Meteo Air Quality API · CAMS global atmospheric model',
      updated: formatProviderTime(payload.current.time, payload.timezone),
    };
    return {
      air: {
        id: 'air',
        label: 'Air quality · provider US AQI',
        value: String(payload.current.us_aqi),
        unit: 'US AQI',
        subValue: `Provider overall US AQI · PM₂.₅ ${payload.current.pm2_5.toFixed(1)} µg/m³ · ${pollutantSummary}. Concentrations are modelled at the same provider timestamp; only the provider's overall AQI is reported because these values alone do not support regulatory pollutant-specific AQI calculations. CAMS grid point ${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}. The returned CO field is carbon monoxide, not CO₂.`,
        condition: classifyUsAqi(payload.current.us_aqi),
        status: 'MODELLED',
        source: 'Open-Meteo Air Quality API · CAMS global atmospheric model',
        updated: formatProviderTime(payload.current.time, payload.timezone),
      },
      carbonMonoxide: carbonMonoxideMetric,
    };
  },
};

export async function requestMappedVegetationFeatures(lat: number, lon: number) {
  const data = getSpatialTelemetry(lat, lon);
  return {
    status: 'CACHED' as const,
    count: data.vegetationCount,
    source: 'OpenStreetMap · Local Spatial Index',
    updated: data.updated,
  };
}

export async function requestMappedRoadFeatures(lat: number, lon: number) {
  const data = getSpatialTelemetry(lat, lon);
  return {
    status: 'CACHED' as const,
    count: data.roadCount,
    source: 'OpenStreetMap · Local Spatial Index',
    updated: data.updated,
  };
}

type LocalSpatialFeature =
  | Awaited<ReturnType<typeof requestMappedVegetationFeatures>>
  | Awaited<ReturnType<typeof requestMappedRoadFeatures>>;

function localSpatialMetric(
  id: 'green' | 'noise',
  cached: LocalSpatialFeature,
): EnvironmentalMetric {
  const metric = createUnavailableMetric(id);
  return {
    ...metric,
    value: cached.count.toLocaleString(),
    unit: id === 'green' ? 'OSM objects / 2 km radius' : 'OSM ways / 2 km radius',
    subValue: id === 'green'
      ? 'Parks and mapped vegetated land features near the city centre. Feature count only; not area, canopy cover, or a percentage.'
      : 'Mapped highway and railway way count near the city centre. Not road length, traffic, acoustic exposure, or a decibel measurement.',
    condition: 'Informational',
    status: cached.status,
    source: cached.source,
    updated: cached.updated,
  };
}

export const openStreetMapGreenSpaceProvider: GreenSpaceProvider = {
  async getMappedCityFeatures(coordinates, signal) {
    if (!coordinatesAreValid(coordinates)) throw new Error('City coordinates are outside valid latitude/longitude bounds.');
    if (signal.aborted) throw signal.reason;
    const [vegetation, infrastructure] = await Promise.all([
      requestMappedVegetationFeatures(coordinates.latitude, coordinates.longitude),
      requestMappedRoadFeatures(coordinates.latitude, coordinates.longitude),
    ]);
    if (signal.aborted) throw signal.reason;
    return {
      vegetation: localSpatialMetric('green', vegetation),
      infrastructure: localSpatialMetric('noise', infrastructure),
    };
  },
};

export const openMeteoGeospatialProvider: GeospatialProvider = {
  searchCities: searchGeocodedCities,
};

export const openMeteoHistoricalProvider: HistoricalDataProvider = {
  async getDailyTemperature(coordinates, period, signal) {
    if (!coordinatesAreValid(coordinates)) throw new Error('City coordinates are outside valid latitude/longitude bounds.');

    const durationDays: Record<typeof period, number> = { '7D': 7, '30D': 30, '1Y': 365, '5Y': 1826 };
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 5);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - durationDays[period] + 1);
    const date = (value: Date) => value.toISOString().slice(0, 10);

    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.search = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      start_date: date(start),
      end_date: date(end),
      daily: 'temperature_2m_mean',
      timezone: 'auto',
      temperature_unit: 'celsius',
    }).toString();
    const payload: unknown = await fetchProviderJson(url, signal);
    if (!isHistoricalResponse(payload)) throw new Error('Historical weather provider returned a malformed daily series.');

    return payload.daily.time.flatMap((day, index) => {
      const temperature = payload.daily.temperature_2m_mean[index];
      return temperature === null ? [] : [{ date: day, temperature }];
    });
  },
};

export const openMeteoFloodProvider: FloodHydrologyProvider = {
  async getRiverDischarge(coordinates, signal) {
    if (!coordinatesAreValid(coordinates)) throw new Error('City coordinates are outside valid latitude/longitude bounds.');
    const url = new URL('https://flood-api.open-meteo.com/v1/flood');
    url.search = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      daily: 'river_discharge',
      past_days: '2',
      forecast_days: '3',
      timezone: 'GMT',
    }).toString();
    const payload: unknown = await fetchProviderJson(url, signal);
    if (!isFloodDischargeResponse(payload)) {
      throw new Error('Open-Meteo Flood API returned missing or invalid river-discharge data.');
    }
    const modelCoordinates = { latitude: payload.latitude, longitude: payload.longitude };
    if (distanceInKm(coordinates, modelCoordinates) > 20) {
      throw new Error('GloFAS selected a river model point too far from the requested city location.');
    }
    const today = new Date().toISOString().slice(0, 10);
    const todayIndex = payload.daily.time.indexOf(today);
    if (todayIndex < 0 || payload.daily.river_discharge[todayIndex] === null) {
      throw new Error('GloFAS has no river-discharge value for the current UTC date at this location.');
    }
    const discharge = payload.daily.river_discharge[todayIndex];
    if (discharge === null) throw new Error('GloFAS returned no river-discharge value for today at this location.');
    return {
      id: 'flood',
      label: 'River discharge · GloFAS',
      value: discharge.toFixed(2),
      unit: 'm³/s',
      subValue: `Daily GloFAS model value for ${today} at the selected nearest river model point (${modelCoordinates.latitude.toFixed(3)}, ${modelCoordinates.longitude.toFixed(3)}). This is not urban runoff, observed flow, or a city flood-risk score.`,
      condition: 'Informational',
      status: 'MODELLED',
      source: 'Open-Meteo Flood API · GloFAS v4 river discharge',
      updated: `${today} (daily UTC model date)`,
    };
  },
};

const waterCoverageCache = new Map<string, { metric: EnvironmentalMetric; expiresAt: number }>();

export const worldBankWaterCoverageProvider: WaterCoverageProvider = {
  async getNationalDrinkingWaterCoverage(countryCode, signal) {
    const normalizedCode = countryCode.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCode)) throw new Error('A valid ISO alpha-2 country code is required for the national water-coverage lookup.');
    const cached = waterCoverageCache.get(normalizedCode);
    if (cached && cached.expiresAt > Date.now()) return cached.metric;

    const url = new URL(`https://api.worldbank.org/v2/country/${encodeURIComponent(normalizedCode)}/indicator/SH.H2O.SMDW.ZS`);
    url.search = new URLSearchParams({ format: 'json', date: '2000:2026', per_page: '100' }).toString();
    const payload: unknown = await fetchProviderJson(url, signal);
    if (!isWorldBankCoverageResponse(payload)) {
      throw new Error('World Bank returned malformed national drinking-water coverage data.');
    }
    const latest = payload[1]
      .filter((record) => record.country.id.toUpperCase() === normalizedCode && record.value !== null)
      .sort((a, b) => Number(b.date) - Number(a.date))[0];
    if (!latest || latest.value === null) {
      throw new Error(`No reported safely managed drinking-water coverage is available for ${normalizedCode}.`);
    }
    const metric: EnvironmentalMetric = {
      id: 'water',
      label: 'National drinking-water service coverage',
      value: latest.value.toFixed(1),
      unit: '% of population',
      subValue: `${latest.country.value}: population using safely managed drinking-water services, ${latest.date}. Country-wide annual estimate; not a city/municipal measurement, water-quality result, or compliance assessment.`,
      condition: 'Informational',
      status: 'HISTORICAL',
      source: 'World Bank · WHO/UNICEF Joint Monitoring Programme (SH.H2O.SMDW.ZS)',
      updated: latest.date,
    };
    waterCoverageCache.set(normalizedCode, { metric, expiresAt: Date.now() + 24 * 60 * 60_000 });
    return metric;
  },
};

export const openMeteoEnvironmentalProvider: EnvironmentalDataProvider = {
  async getCityData(city, signal) {
    const base = createUnavailableCityData(city);
    const [weatherResult, airResult, riverResult, waterResult] = await Promise.allSettled([
      openMeteoWeatherProvider.getWeather(city.coordinates, signal),
      openMeteoAirQualityProvider.getAirQuality(city.coordinates, signal),
      openMeteoFloodProvider.getRiverDischarge(city.coordinates, signal),
      worldBankWaterCoverageProvider.getNationalDrinkingWaterCoverage(city.countryCode, signal),
    ]);

    const weather = weatherResult.status === 'fulfilled'
      ? weatherResult.value
      : {
          ...base.weather,
          status: 'ERROR' as const,
          error: weatherResult.reason instanceof Error ? weatherResult.reason.message : 'Weather provider request failed.',
        };
    const metrics = base.metrics.map((metric) => {
      if (metric.id === 'air') {
        if (airResult.status === 'fulfilled') return airResult.value.air;
        const error = airResult.reason instanceof Error ? airResult.reason.message : 'Air-quality provider request failed.';
        return { ...metric, status: 'ERROR' as const, error, subValue: error };
      }
      if (metric.id === 'carbon') {
        if (airResult.status === 'fulfilled') return airResult.value.carbonMonoxide;
        const error = airResult.reason instanceof Error ? airResult.reason.message : 'Air-pollution provider request failed.';
        return { ...metric, status: 'ERROR' as const, error, subValue: error };
      }
      if (metric.id === 'flood') {
        if (riverResult.status === 'fulfilled') return riverResult.value;
        const error = riverResult.reason instanceof Error ? riverResult.reason.message : 'River-discharge provider request failed.';
        return { ...metric, status: 'ERROR' as const, error, subValue: error };
      }
      if (metric.id === 'water') {
        if (waterResult.status === 'fulfilled') return waterResult.value;
        const error = waterResult.reason instanceof Error ? waterResult.reason.message : 'Water-coverage provider request failed.';
        return { ...metric, status: 'ERROR' as const, error, subValue: error };
      }
      return metric;
    });

    return {
      ...base,
      weather,
      metrics: metrics.map((metric) => {
        if (metric.id !== 'flood' || riverResult.status !== 'fulfilled' || weatherResult.status !== 'fulfilled') return metric;
        return {
          ...metric,
          source: `${metric.source} + Open-Meteo Forecast API`,
          subValue: `${metric.subValue} Current modelled soil moisture at 0–7 cm: ${weatherResult.value.soilMoisture == null ? 'unavailable' : `${weatherResult.value.soilMoisture.toFixed(3)} m³/m³`} at ${weatherResult.value.updated ?? 'provider time unavailable'}. Soil moisture is not river discharge or a flood-risk score.`,
        };
      }),
    };
  },
};

export async function getCityEnvironmentalDataById(
  city: City,
  signal: AbortSignal,
): Promise<CityEnvironmentalData> {
  return openMeteoEnvironmentalProvider.getCityData(city, signal);
}
