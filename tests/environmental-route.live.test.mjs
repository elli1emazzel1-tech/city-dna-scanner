/**
 * End-to-end reproduction of the Mumbai weather / air-quality / CO path.
 *
 * Exercises the REAL `/api/environmental/current` route handler and the REAL
 * provider modules (no mocks) so a regression in either layer surfaces here.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { GET as environmentalCurrentRoute } from '../src/app/api/environmental/current/route.ts';

const MUMBAI = { latitude: 19.076, longitude: 72.8777 };

function routeUrl(provider, coordinates = MUMBAI) {
  const params = new URLSearchParams({
    provider,
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
  });
  return `http://localhost/api/environmental/current?${params}`;
}

async function callRoute(provider) {
  const response = await environmentalCurrentRoute(
    new Request(routeUrl(provider), { signal: AbortSignal.timeout(30_000) }),
  );
  const body = await response.json();
  return { status: response.status, body };
}

test('weather route returns a verified Mumbai payload', async () => {
  const { status, body } = await callRoute('weather');
  assert.equal(status, 200, `weather route failed: ${JSON.stringify(body)}`);
  assert.ok(body.payload?.current?.time, 'weather payload has no current.time');
  assert.equal(body.payload.timezone, 'Asia/Kolkata');
  assert.equal(body.payload.current_units.temperature_2m, '°C');
});

test('air-quality route returns a verified Mumbai payload with CO', async () => {
  const { status, body } = await callRoute('air-quality');
  assert.equal(status, 200, `air-quality route failed: ${JSON.stringify(body)}`);
  assert.ok(body.payload?.current?.time, 'air-quality payload has no current.time');
  assert.equal(body.payload.timezone, 'Asia/Kolkata');
  assert.ok(
    ['μg/m³', 'µg/m³'].includes(body.payload.current_units.carbon_monoxide),
    `unexpected CO unit: ${body.payload.current_units.carbon_monoxide}`,
  );
});
