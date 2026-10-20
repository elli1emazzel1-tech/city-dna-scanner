export interface ProviderTimestampValidation {
  valid: boolean;
  timestamp: number | null;
  reason: string;
}

export interface ProviderFreshnessPolicy {
  maxAgeMs: number;
  futureToleranceMs: number;
}

export const WEATHER_FRESHNESS_POLICY: ProviderFreshnessPolicy = {
  maxAgeMs: 3 * 60 * 60_000,
  futureToleranceMs: 15 * 60_000,
};

export const AIR_QUALITY_FRESHNESS_POLICY: ProviderFreshnessPolicy = {
  maxAgeMs: 6 * 60 * 60_000,
  futureToleranceMs: 15 * 60_000,
};

function timezoneOffsetAt(timestamp: number, timezone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(timestamp));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const localAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );
    return (localAsUtc - Math.floor(timestamp / 60_000) * 60_000) / 1000;
  } catch {
    return null;
  }
}

export function providerTimestampToEpoch(
  time: string,
  timezone: string,
  utcOffsetSeconds: number,
): ProviderTimestampValidation {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(time);
  if (!match) return { valid: false, timestamp: null, reason: 'invalid local timestamp format' };
  if (!Number.isInteger(utcOffsetSeconds) || Math.abs(utcOffsetSeconds) > 14 * 60 * 60) {
    return { valid: false, timestamp: null, reason: 'invalid UTC offset' };
  }

  const [, year, month, day, hour, minute] = match;
  const localAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (new Date(localAsUtc).toISOString().slice(0, 16) !== time) {
    return { valid: false, timestamp: null, reason: 'invalid calendar timestamp' };
  }

  const timestamp = localAsUtc - utcOffsetSeconds * 1000;
  const actualOffset = timezoneOffsetAt(timestamp, timezone);
  if (actualOffset === null) {
    return { valid: false, timestamp: null, reason: 'invalid IANA timezone' };
  }
  if (actualOffset !== utcOffsetSeconds) {
    return { valid: false, timestamp, reason: 'timezone and UTC offset do not match' };
  }
  return { valid: true, timestamp, reason: 'valid local timestamp and timezone offset' };
}

export function validateProviderTimestamp(
  time: string,
  timezone: string,
  utcOffsetSeconds: number,
  referenceTime: number,
  policy: ProviderFreshnessPolicy,
): ProviderTimestampValidation {
  const parsed = providerTimestampToEpoch(time, timezone, utcOffsetSeconds);
  if (!parsed.valid || parsed.timestamp === null) return parsed;
  if (!Number.isFinite(referenceTime)) {
    return { ...parsed, valid: false, reason: 'missing trustworthy provider response time' };
  }

  const ageMs = referenceTime - parsed.timestamp;
  if (ageMs < -policy.futureToleranceMs) {
    return { ...parsed, valid: false, reason: 'observation timestamp is in the future' };
  }
  if (ageMs > policy.maxAgeMs) {
    return { ...parsed, valid: false, reason: 'observation timestamp is stale' };
  }
  return parsed;
}

export function isOptionalPollutantValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

export type ProviderJsonResponse =
  | { ok: true; payload: unknown; referenceTime: number; dateHeader: string; ageSeconds: number }
  | { ok: false; httpStatus: number; reason: string; dateHeader: string | null };

export async function readProviderJsonResponse(response: Response): Promise<ProviderJsonResponse> {
  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      reason: `HTTP ${response.status}`,
      dateHeader: response.headers.get('date'),
    };
  }

  const dateHeader = response.headers.get('date');
  const responseTime = dateHeader ? Date.parse(dateHeader) : Number.NaN;
  if (dateHeader === null || !Number.isFinite(responseTime)) {
    return {
      ok: false,
      httpStatus: response.status,
      reason: 'missing or invalid HTTP Date header',
      dateHeader,
    };
  }

  const rawAge = response.headers.get('age');
  const ageSeconds = rawAge === null ? 0 : Number(rawAge);
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) {
    return {
      ok: false,
      httpStatus: response.status,
      reason: 'invalid HTTP Age header',
      dateHeader,
    };
  }

  try {
    return {
      ok: true,
      payload: await response.json() as unknown,
      referenceTime: responseTime + ageSeconds * 1000,
      dateHeader,
      ageSeconds,
    };
  } catch {
    return {
      ok: false,
      httpStatus: response.status,
      reason: 'invalid JSON response',
      dateHeader,
    };
  }
}
