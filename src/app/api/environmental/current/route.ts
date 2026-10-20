import { isRecord } from '../../../../lib/data/responseValidation';
import {
  AIR_QUALITY_FRESHNESS_POLICY,
  readProviderJsonResponse,
  validateProviderTimestamp,
  WEATHER_FRESHNESS_POLICY,
} from '../../../../lib/data/providerTime';

type Provider = 'weather' | 'air-quality';

const PROVIDERS: Record<Provider, {
  endpoint: string;
  fields: string;
  requestedTimeRange: string;
  freshness: typeof WEATHER_FRESHNESS_POLICY;
  safeFailure: string;
}> = {
  weather: {
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    fields: 'temperature_2m,apparent_temperature,soil_moisture_0_to_7cm,relative_humidity_2m,wind_speed_10m,weather_code',
    requestedTimeRange: 'current conditions; 15-minute model interval; timezone=auto',
    freshness: WEATHER_FRESHNESS_POLICY,
    safeFailure: 'Weather provider data could not be verified.',
  },
  'air-quality': {
    endpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    fields: 'us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide',
    requestedTimeRange: 'current conditions; 1-hour model interval; timezone=auto',
    freshness: AIR_QUALITY_FRESHNESS_POLICY,
    safeFailure: 'Air-quality provider data could not be verified.',
  },
};

function failureResponse(message: string, status = 502) {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const provider = params.get('provider');
  const latitude = Number(params.get('latitude'));
  const longitude = Number(params.get('longitude'));
  if ((provider !== 'weather' && provider !== 'air-quality')
    || !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180) {
    return failureResponse('A valid provider and city coordinate pair are required.', 400);
  }

  const config = PROVIDERS[provider];
  const coordinates = { latitude, longitude };
  const url = new URL(config.endpoint);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: config.fields,
    timezone: 'auto',
    ...(provider === 'weather' ? { temperature_unit: 'celsius', wind_speed_unit: 'kmh' } : {}),
  }).toString();

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
    });
  } catch (error) {
    const validationReason = error instanceof Error && error.name === 'TimeoutError'
      ? 'upstream request timed out'
      : 'upstream network request failed';
    console.error('Open-Meteo current conditions request failed.', {
      provider,
      coordinates,
      requestedTimeRange: config.requestedTimeRange,
      returnedTimestamp: null,
      validationReason,
      httpStatus: null,
    });
    return failureResponse(config.safeFailure);
  }

  const result = await readProviderJsonResponse(upstream);
  if (!result.ok) {
    console.error('Open-Meteo current conditions response rejected.', {
      provider,
      coordinates,
      requestedTimeRange: config.requestedTimeRange,
      returnedTimestamp: null,
      validationReason: result.reason,
      httpStatus: result.httpStatus,
      responseDate: result.dateHeader,
    });
    return failureResponse(result.reason.startsWith('HTTP ')
      ? `${provider === 'weather' ? 'Weather' : 'Air-quality'} provider request failed (${result.reason}).`
      : config.safeFailure);
  }

  const payload = result.payload;
  const current = isRecord(payload) && isRecord(payload.current) ? payload.current : null;
  const time = current?.time;
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
      returnedTimestamp: time ?? null,
      validationReason: `server clock differs from HTTP Date by ${Math.round(localClockSkewMs / 1000)} seconds`,
      httpStatus: upstream.status,
      responseDate: result.dateHeader,
      ageSeconds: result.ageSeconds,
    });
  }

  if (!timestampCheck.valid) {
    console.error('Open-Meteo current conditions failed timestamp validation.', {
      provider,
      coordinates,
      requestedTimeRange: config.requestedTimeRange,
      returnedTimestamp: time ?? null,
      validationReason: timestampCheck.reason,
      httpStatus: upstream.status,
      responseDate: result.dateHeader,
      ageSeconds: result.ageSeconds,
    });
    return failureResponse(provider === 'weather'
      ? 'Weather provider returned stale or future-dated conditions.'
      : 'Air-quality provider returned stale or future-dated conditions.');
  }

  return Response.json({
    payload,
    referenceTime: new Date(result.referenceTime).toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
