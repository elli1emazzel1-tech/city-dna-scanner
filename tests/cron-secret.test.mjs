import assert from 'node:assert/strict';
import test from 'node:test';
import { isCronRequestAuthorized } from '../src/app/api/cityscan/lib/cronSecret.ts';

const secret = 'a-test-secret-used-only-by-this-test';

test('accepts Vercel Cron bearer authorization', () => {
  const request = new Request('https://example.test/api/cityscan/cron', {
    headers: { Authorization: `Bearer ${secret}` },
  });
  assert.equal(isCronRequestAuthorized(request, secret), true);
});

test('retains the manual CityScan secret header', () => {
  const request = new Request('https://example.test/api/cityscan/cron', {
    headers: { 'x-cityscan-secret': secret },
  });
  assert.equal(isCronRequestAuthorized(request, secret), true);
});

test('rejects missing, malformed, and incorrect authorization', () => {
  const missing = new Request('https://example.test/api/cityscan/cron');
  const malformed = new Request('https://example.test/api/cityscan/cron', {
    headers: { Authorization: `Basic ${secret}` },
  });
  const incorrect = new Request('https://example.test/api/cityscan/cron', {
    headers: { Authorization: 'Bearer not-the-secret' },
  });
  assert.equal(isCronRequestAuthorized(missing, secret), false);
  assert.equal(isCronRequestAuthorized(malformed, secret), false);
  assert.equal(isCronRequestAuthorized(incorrect, secret), false);
});

test('does not fall back to the legacy header when Authorization is present but invalid', () => {
  const request = new Request('https://example.test/api/cityscan/cron', {
    headers: {
      Authorization: 'Basic invalid',
      'x-cityscan-secret': secret,
    },
  });
  assert.equal(isCronRequestAuthorized(request, secret), false);
});
