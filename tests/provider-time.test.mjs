import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AIR_QUALITY_FRESHNESS_POLICY,
  isOptionalPollutantValue,
  providerTimestampToEpoch,
  readProviderJsonResponse,
  validateProviderTimestamp,
  WEATHER_FRESHNESS_POLICY,
} from '../src/lib/data/providerTime.ts';

const providerResponseTime = Date.parse('2026-10-19T15:30:02Z');

test('converts Open-Meteo local timestamps with the returned timezone offset', () => {
  const result = providerTimestampToEpoch('2026-10-19T20:45', 'Asia/Kolkata', 19_800);
  assert.equal(result.valid, true);
  assert.equal(new Date(result.timestamp).toISOString(), '2026-10-19T15:15:00.000Z');
});

test('accepts Mumbai weather relative to the provider HTTP Date despite a skewed local clock', () => {
  const result = validateProviderTimestamp(
    '2026-10-19T20:45',
    'Asia/Kolkata',
    19_800,
    providerResponseTime,
    WEATHER_FRESHNESS_POLICY,
  );
  assert.equal(result.valid, true);

  const skewedLocalClock = Date.parse('2026-10-19T01:50:00Z');
  assert.equal(validateProviderTimestamp(
    '2026-10-19T20:45',
    'Asia/Kolkata',
    19_800,
    skewedLocalClock,
    WEATHER_FRESHNESS_POLICY,
  ).reason, 'observation timestamp is in the future');
});

test('accepts the hourly Mumbai air-quality observation using its own freshness window', () => {
  assert.equal(validateProviderTimestamp(
    '2026-10-19T20:30',
    'Asia/Kolkata',
    19_800,
    providerResponseTime,
    AIR_QUALITY_FRESHNESS_POLICY,
  ).valid, true);

  assert.equal(validateProviderTimestamp(
    '2026-10-19T08:30',
    'Asia/Kolkata',
    19_800,
    providerResponseTime,
    AIR_QUALITY_FRESHNESS_POLICY,
  ).reason, 'observation timestamp is stale');
});

test('rejects stale, future, invalid-calendar, and mismatched-timezone timestamps', () => {
  assert.equal(validateProviderTimestamp(
    '2026-10-19T11:45',
    'Asia/Kolkata',
    19_800,
    providerResponseTime,
    WEATHER_FRESHNESS_POLICY,
  ).reason, 'observation timestamp is stale');
  assert.equal(validateProviderTimestamp(
    '2026-10-19T21:30',
    'Asia/Kolkata',
    19_800,
    providerResponseTime,
    WEATHER_FRESHNESS_POLICY,
  ).reason, 'observation timestamp is in the future');
  assert.equal(providerTimestampToEpoch('2026-02-30T10:00', 'Asia/Kolkata', 19_800).valid, false);
  assert.equal(providerTimestampToEpoch('2026-10-19T20:45', 'Asia/Kolkata', 0).reason, 'timezone and UTC offset do not match');
});

test('applies daylight-saving timezone offsets to local timestamps', () => {
  const winter = providerTimestampToEpoch('2026-01-15T07:00', 'America/New_York', -18_000);
  const summer = providerTimestampToEpoch('2026-07-15T08:00', 'America/New_York', -14_400);
  assert.equal(new Date(winter.timestamp).toISOString(), '2026-01-15T12:00:00.000Z');
  assert.equal(new Date(summer.timestamp).toISOString(), '2026-07-15T12:00:00.000Z');
});

test('accepts absent or null secondary pollutant values without accepting invalid concentrations', () => {
  assert.equal(isOptionalPollutantValue(undefined), true);
  assert.equal(isOptionalPollutantValue(null), true);
  assert.equal(isOptionalPollutantValue(766), true);
  assert.equal(isOptionalPollutantValue(-1), false);
  assert.equal(isOptionalPollutantValue('766'), false);
});

test('reports provider HTTP errors and malformed responses with their status', async () => {
  const unavailable = await readProviderJsonResponse(new Response('upstream unavailable', { status: 503 }));
  assert.deepEqual(unavailable, {
    ok: false,
    httpStatus: 503,
    reason: 'HTTP 503',
    dateHeader: null,
  });

  const malformed = await readProviderJsonResponse(new Response('{', {
    status: 200,
    headers: { Date: 'Mon, 19 Oct 2026 15:30:02 GMT' },
  }));
  assert.equal(malformed.ok, false);
  assert.equal(malformed.reason, 'invalid JSON response');
});

test('accounts for cached response age when choosing the provider time reference', async () => {
  const result = await readProviderJsonResponse(new Response('{}', {
    status: 200,
    headers: {
      Date: 'Mon, 19 Oct 2026 15:30:02 GMT',
      Age: '120',
    },
  }));
  assert.equal(result.ok, true);
  assert.equal(result.referenceTime, Date.parse('2026-10-19T15:32:02Z'));
});

// Recorded from live Open-Meteo responses for Mumbai (19.076, 72.8777) via the
// production /api/environmental/current route on 2026-10-20T12:59:14Z.
// Weather:  current.time 2026-10-20T18:15 (interval 900s)  -> 12:45Z, age ~14 min.
// Air qual: current.time 2026-10-20T17:30 (interval 3600s) -> 12:00Z, age ~59 min;
//           us_aqi 284 (integer), carbon_monoxide 650 µg/m³.
const mumbaiReferenceTime = Date.parse('2026-10-20T12:59:14.000Z');

test('accepts the recorded Mumbai weather and air-quality provider responses', () => {
  const weather = validateProviderTimestamp(
    '2026-10-20T18:15',
    'Asia/Kolkata',
    19_800,
    mumbaiReferenceTime,
    WEATHER_FRESHNESS_POLICY,
  );
  assert.equal(weather.valid, true);
  assert.equal(new Date(weather.timestamp).toISOString(), '2026-10-20T12:45:00.000Z');

  const airQuality = validateProviderTimestamp(
    '2026-10-20T17:30',
    'Asia/Kolkata',
    19_800,
    mumbaiReferenceTime,
    AIR_QUALITY_FRESHNESS_POLICY,
  );
  assert.equal(airQuality.valid, true);
  assert.equal(new Date(airQuality.timestamp).toISOString(), '2026-10-20T12:00:00.000Z');

  // The recorded air-quality payload carried the optional CO pollutant.
  assert.equal(isOptionalPollutantValue(650), true);
});

test('still rejects stale and future Mumbai timestamps against the recorded reference', () => {
  assert.equal(validateProviderTimestamp(
    '2026-10-20T06:15',
    'Asia/Kolkata',
    19_800,
    mumbaiReferenceTime,
    WEATHER_FRESHNESS_POLICY,
  ).reason, 'observation timestamp is stale');
  assert.equal(validateProviderTimestamp(
    '2026-10-20T19:30',
    'Asia/Kolkata',
    19_800,
    mumbaiReferenceTime,
    WEATHER_FRESHNESS_POLICY,
  ).reason, 'observation timestamp is in the future');
  // An hourly air-quality observation older than the 6-hour CAMS window is stale.
  assert.equal(validateProviderTimestamp(
    '2026-10-20T06:30',
    'Asia/Kolkata',
    19_800,
    mumbaiReferenceTime,
    AIR_QUALITY_FRESHNESS_POLICY,
  ).reason, 'observation timestamp is stale');
});
