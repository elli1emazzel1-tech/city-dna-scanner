/**
 * POST /api/cityscan/cron — Vercel Cron entrypoint (Sunday 06:00 UTC per
 * vercel.json). Protected by Vercel's `Authorization: Bearer <CRON_SECRET>`
 * header; manual callers may use `x-cityscan-secret` (missing/invalid → 401).
 *
 * Calls the shared scan pipeline directly (plan §7: "Calls POST
 * /api/cityscan/scan logic internally" — no HTTP hop, no session needed) for
 * each launch city, with per-city failure isolation: one city's error never
 * aborts another. Persistence requires the optional service-role actor env;
 * when unconfigured, summaries are computed with `persisted: false`
 * (Phase 4B graceful degradation — nothing is fabricated, nothing is stored).
 *
 * Time budget: cities are skipped (and honestly reported as such) once the
 * elapsed time risks the 300 s function limit.
 */

import { checkCronSecret, resolveCronActor } from '../lib/auth';
import { executeScan } from '../lib/pipeline';
import { cities } from '@/lib/data/cities';

export const maxDuration = 300;

// Launch cities per Phase 1 architecture (launch-city decision): London,
// Paris, Amsterdam, Berlin, Tokyo — reuse catalog ids.
const LAUNCH_CITY_IDS = ['london', 'paris', 'amsterdam', 'berlin', 'tokyo'];
// Leave headroom under the 300 s function limit for response overhead.
const TIME_BUDGET_MS = 240_000;

interface CronCityResult {
  cityId: string;
  status: string;
  persisted: boolean;
  findingId: string | null;
  commonValidPct: number | null;
  detail: string | null;
}

export async function POST(request: Request): Promise<Response> {
  const denied = checkCronSecret(request);
  if (denied) return denied;

  // Optional ?city=<id> narrows the run to one city. The default vercel.json
  // entry runs all launch cities sequentially (plan §7); a measured ~71 s per
  // city means the 240 s start-budget may skip the last city on slow days —
  // split into staggered single-city entries (architecture-approved alternative)
  // by giving each its own `?city=` path when full coverage is required.
  const requestedCity = new URL(request.url).searchParams.get('city');
  const cityIds = requestedCity ? [requestedCity] : LAUNCH_CITY_IDS;

  const cronContext = await resolveCronActor();
  const started = Date.now();
  const results: CronCityResult[] = [];

  for (const cityId of cityIds) {
    if (Date.now() - started > TIME_BUDGET_MS) {
      results.push({
        cityId,
        status: 'SKIPPED_TIME_BUDGET',
        persisted: false,
        findingId: null,
        commonValidPct: null,
        detail: `Skipped: the ${TIME_BUDGET_MS / 1000}s per-invocation time budget was exhausted before this city started.`,
      });
      continue;
    }

    if (!cities.some((entry) => entry.id === cityId)) {
      results.push({
        cityId,
        status: 'FAILED',
        persisted: false,
        findingId: null,
        commonValidPct: null,
        detail: 'Unknown cityId in the launch list.',
      });
      continue;
    }

    try {
      const payload = await executeScan(
        { cityId },
        { actor: cronContext.actor, supabase: cronContext.supabase, source: 'cron' },
      );
      results.push({
        cityId,
        status: payload.status,
        persisted: payload.persisted,
        findingId: payload.findingId,
        commonValidPct: payload.commonValidPct,
        detail: payload.rejectionReason
          ?? (payload.status === 'ACCEPTED'
            ? `Pair accepted at ${payload.commonValidPct}% common-valid pixels.`
            : null),
      });
    } catch (error) {
      // executeScan is designed not to throw; defence in depth so one city
      // can never abort the others (plan §7 failure isolation).
      const message = error instanceof Error ? error.message : String(error);
      console.error(`CityScan cron: ${cityId} failed unexpectedly:`, error);
      results.push({
        cityId,
        status: 'FAILED',
        persisted: false,
        findingId: null,
        commonValidPct: null,
        detail: message,
      });
    }
  }

  const failed = results.filter((entry) => entry.status === 'FAILED').length;
  const accepted = results.filter((entry) => entry.status === 'ACCEPTED').length;

  return Response.json({
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    persisted: Boolean(cronContext.actor && cronContext.supabase),
    persistenceNote: cronContext.note,
    total: results.length,
    accepted,
    failed,
    results,
  });
}

export async function GET(request: Request): Promise<Response> {
  return POST(request);
}