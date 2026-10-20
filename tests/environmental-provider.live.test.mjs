/**
 * Server-side regression test for the environmental provider layer.
 *
 * The provider module used to call the internal `/api/environmental/current`
 * route with a RELATIVE url. That works in the browser but throws
 * `Failed to parse URL` under Node/SSR, which turned weather, air quality and
 * CO into ERROR metrics on the server.
 *
 * These assertions run the REAL provider code in a Node (non-browser) runtime
 * against the REAL Open-Meteo upstream, with no mocks, so the server path is
 * covered end to end.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { getCityEnvironmentalDataById } from '../src/lib/data/providers.ts';

const MUMBAI = {
  id: 'mumbai',
  name: 'Mumbai',
  country: 'India',
  countryCode: 'IN',
  coordinates: { latitude: 19.076, longitude: 72.8777 },
};

const REQUEST_TIMEOUT_MS = 60_000;

function findMetric(metrics, id) {
  const metric = metrics.find((candidate) => candidate.id === id);
  assert.ok(metric, `metric "${id}" is missing`);
  return metric;
}

test('server-side provider resolves weather without a relative-URL failure', async () => {
  const data = await getCityEnvironmentalDataById(MUMBAI, AbortSignal.timeout(REQUEST_TIMEOUT_MS));

  assert.notEqual(data.weather.status, 'ERROR', `weather failed: ${data.weather.error}`);
  assert.equal(data.weather.status, 'MODELLED');
  assert.equal(typeof data.weather.temperature, 'number');
  assert.ok(data.weather.temperature > -100 && data.weather.temperature < 70, 'implausible temperature');
  assert.equal(data.weather.error, undefined);
});

test('server-side provider resolves air quality and carbon monoxide', async () => {
  const data = await getCityEnvironmentalDataById(MUMBAI, AbortSignal.timeout(REQUEST_TIMEOUT_MS));

  const air = findMetric(data.metrics, 'air');
  assert.notEqual(air.status, 'ERROR', `air quality failed: ${air.error}`);
  assert.equal(air.status, 'MODELLED');
  assert.ok(Number.isFinite(Number(air.value)), `air quality is not numeric: ${air.value}`);
  assert.ok(Number(air.value) >= 0 && Number(air.value) <= 500, `implausible US AQI: ${air.value}`);

  const carbon = findMetric(data.metrics, 'carbon');
  assert.notEqual(carbon.status, 'ERROR', `carbon monoxide failed: ${carbon.error}`);
  assert.equal(carbon.status, 'MODELLED');
  assert.ok(Number.isFinite(Number(carbon.value)), `carbon monoxide is not numeric: ${carbon.value}`);
  assert.ok(Number(carbon.value) >= 0, `implausible CO value: ${carbon.value}`);
});

test('server-side provider never reports a relative-URL parse error', async () => {
  const data = await getCityEnvironmentalDataById(MUMBAI, AbortSignal.timeout(REQUEST_TIMEOUT_MS));

  const errors = [
    data.weather.error,
    ...data.metrics.map((metric) => metric.error),
  ].filter((error) => typeof error === 'string');

  for (const error of errors) {
    assert.ok(
      !/Failed to parse URL/i.test(error),
      `provider used a relative url on the server: ${error}`,
    );
  }
});
