import {
  AIR_QUALITY_FRESHNESS_POLICY,
  readProviderJsonResponse,
  validateProviderTimestamp,
  WEATHER_FRESHNESS_POLICY,
} from './providerTime';
import type { ProviderFreshnessPolicy } from './providerTime';
import { isRecord } from './responseValidation';
import type { Coordinates } from './types';

export type CurrentProvider = 'weather' | 'air-quality';

export interface CurrentProviderConfig {
  endpoint: string;
  fields: string;
  requestedTimeRange: string;
  freshness: ProviderFreshnessPolicy;
  safeFailure: string;
  label: string;
  extraParams: Record<string, string>;
}

/**
 * Single source of truth for the Open-Meteo "current conditions" endpoints.
 * The API route and the server-side provider layer both build their requests
 * from this table so the two paths can never drift apart.
 */
export const CURRENT_PROVIDERS: Record<CurrentProvider, CurrentProviderConfig> = {
  weather: {
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    fields: 'temperature_2m,apparent_temperature,soil_moisture_0_to_7cm,relative_humidity_2m,wind_speed_10m,weather_code',
    requestedTimeRange: 'current conditions; 15-minute model interval; timezone=auto',
    freshness: WEATHER_FRESHNESS_POLICY,
    safeFailure: 'Weather provider data could not be verified.',
    label: 'Weather',
    extraParams: { temperature_unit: 'celsius', wind_speed_unit: 'kmh' },
  },
  'air-quality': {
    endpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    fields: 'us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide',
    requestedTimeRange: 'current conditions; 1-hour model interval; timezone=auto',
    freshness: AIR_QUALITY_FRESHNESS_POLICY,
    safeFailure: 'Air-quality provider data could not be verified.',
    label: 'Air-quality',
    extraParams: {},
  },
};

export type CurrentProviderFailureKind =
  | 'invalid-request'
  | 'timeout'
  | 'network'
  | 'http'
  | 'invalid-response'
  | 'stale-timestamp';

export interface CurrentProviderDiagnostics {
  provider: CurrentProvider;
  coordinates: Coordinates;
  requestedTimeRange: string;
  returnedTimestamp: string | null;
  validationReason: string;
  httpStatus: number | null;
  responseDate: string | null;
  ageSeconds: number | null;
}

/**
 * Error raised for every rejected current-conditions request. Carries a
 * machine-readable `kind` so callers can map it to their own response shape.
 */
export class CurrentProviderError extends Error {
  readonly kind: CurrentProviderFailureKind;
  readonly diagnostics: CurrentProviderDiagnostics;

  constructor(kind: CurrentProviderFailureKind, message: string, diagnostics: CurrentProviderDiagnostics) {
    super(message);
    this.name = 'CurrentProviderError';
    this.kind = kind;
    this.diagnostics = diagnostics;
  }
}

export function coordinatesAreValid({ latitude, longitude }: Coordinates): boolean {
  return Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
}

export function buildCurrentProviderUrl(provider: CurrentProvider, coordinates: Coordinates): URL {
  const config = CURRENT_PROVIDERS[provider];
  const url = new URL(config.endpoint);
  url.search = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: config.fields,
    timezone: 'auto',
    ...config.extraParams,
  }).toString();
  return url;
}

export interface CurrentProviderResult {
  payload: unknown;
  /** Epoch milliseconds of the upstream response, derived from the HTTP Date header. */
  referenceTime: number;
  referenceTimeIso: string;
  dateHeader: string | null;
  ageSeconds: number;
}

export interface FetchCurrentProviderOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;


/**
 * Fetches Open-Meteo current conditions directly from the upstream API and
 * validates the observation timestamp against the upstream response clock.
 *
 * This is usable from both the browser and Node/SSR because it never relies
 * on a relative URL. Server-side callers should use it directly; browser
 * callers may keep using the internal API route to stay same-origin.
 */
export async function fetchCurrentProviderPayload(
  provider: CurrentProvider,
  coordinates: Coordinates,
  signal: AbortSignal,
  options: FetchCurrentProviderOptions = {},
): Promise<CurrentProviderResult> {
  const config = CURRENT_PROVIDERS[provider];
  if (!coordinatesAreValid(coordinates)) {
    throw new CurrentProviderError(
      'invalid-request',
      'City coordinates are outside valid latitude/longitude bounds.',
      {
        provider,
        coordinates,
        requestedTimeRange: config.requestedTimeRange,
        returnedTimestamp: null,
        validationReason: 'invalid coordinates',
        httpStatus: null,
        responseDate: null,
        ageSeconds: null,
      },
    );
  }

  const url = buildCurrentProviderUrl(provider, coordinates);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new CurrentProviderError(
      timedOut ? 'timeout' : 'network',
      timedOut ? 'upstream request timed out' : 'upstream network request failed',
      {
        provider,
        coordinates,
        requestedTimeRange: config.requestedTimeRange,
        returnedTimestamp: null,
        validationReason: timedOut ? 'upstream request timed out' : 'upstream network request failed',
        httpStatus: null,
        responseDate: null,
        ageSeconds: null,
      },
    );
  }

  const result = await readProviderJsonResponse(upstream);
  if (!result.ok) {
    throw new CurrentProviderError(
      result.reason.startsWith('HTTP ') ? 'http' : 'invalid-response',
      result.reason,
      {
        provider,
        coordinates,
        requestedTimeRange: config.requestedTimeRange,
        returnedTimestamp: null,
        validationReason: result.reason,
        httpStatus: result.httpStatus,
        responseDate: result.dateHeader,
        ageSeconds: null,
      },
    );
  }


  const payload = result.payload;
  const current = isRecord(payload) && isRecord(payload.current) ? payload.current : null;
  const rawTime = current?.time;
  const time = typeof rawTime === 'string' ? rawTime : null;
  const timezone = isRecord(payload) ? payload.timezone : null;
  const utcOffsetSeconds = isRecord(payload) ? payload.utc_offset_seconds : null;
  const timestampCheck = typeof time === 'string'
    && typeof timezone === 'string'
    && typeof utcOffsetSeconds === 'number'
    ? validateProviderTimestamp(time, timezone, utcOffsetSeconds, result.referenceTime, config.freshness)
    : { valid: false, timestamp: null, reason: 'missing observation timestamp or timezone metadata' };

  const localClockSkewMs = Date.now() - result.referenceTime;
  if (Math.abs(localClockSkewMs) > 5 * 60_000) {
    console.warn('Server clock differs from the Open-Meteo response clock.', {
      provider,
      coordinates,
      requestedTimeRange: config.requestedTimeRange,
      returnedTimestamp: time,
      validationReason: `server clock differs from HTTP Date by ${Math.round(localClockSkewMs / 1000)} seconds`,
      httpStatus: upstream.status,
      responseDate: result.dateHeader,
      ageSeconds: result.ageSeconds,
    });
  }

  if (!timestampCheck.valid) {
    throw new CurrentProviderError(
      'stale-timestamp',
      'provider returned stale or future-dated conditions',
      {
        provider,
        coordinates,
        requestedTimeRange: config.requestedTimeRange,
        returnedTimestamp: time,
        validationReason: timestampCheck.reason,
        httpStatus: upstream.status,
        responseDate: result.dateHeader,
        ageSeconds: result.ageSeconds,
      },
    );
  }

  return {
    payload,
    referenceTime: result.referenceTime,
    referenceTimeIso: new Date(result.referenceTime).toISOString(),
    dateHeader: result.dateHeader,
    ageSeconds: result.ageSeconds,
  };
}

