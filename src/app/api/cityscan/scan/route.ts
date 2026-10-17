/**
 * POST /api/cityscan/scan — trigger one city's Sentinel-2 L2A change scan.
 *
 * Access: open to everyone (no account required).
 *  - signed-in session with role owner|admin|analyst → persists to that
 *    organisation (viewer → 403);
 *  - anonymous (no session, no secret) → compute-only: the scan runs and the
 *    result is returned, but NOTHING is written to the database
 *    (`persisted: false`).
 * A non-interactive caller may instead pass
 * `x-cityscan-secret == CITYSCAN_CRON_SECRET`; that path persists only when
 * the cron actor env (SUPABASE_SERVICE_ROLE_KEY + CITYSCAN_CRON_ORG_ID) is
 * configured — otherwise the scan runs compute-only (`persisted: false`).
 *
 * Body: { cityId: string, orgId?: string, beforeId?: string, afterId?: string }
 * Response: plan §3 status enum. HTTP 200 for ACCEPTED / REJECTED_* /
 * NO_CLEAR_OBSERVATION; 500 for FAILED (body still carries the full payload).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  checkCronSecret,
  getAuthContext,
  resolveCronActor,
  type AuthContext,
} from '../lib/auth';
import {
  executeScan,
  type CityScanResponse,
  type ScanActor,
} from '../lib/pipeline';
import { createClient } from '@/lib/supabase/server';
import { cities } from '@/lib/data/cities';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const CONTRIBUTOR_ROLES = ['owner', 'admin', 'analyst'];

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isRecord(body) || typeof body.cityId !== 'string' || !body.cityId) {
    return Response.json({ error: 'Provide a valid cityId.' }, { status: 400 });
  }
  const cityId: string = body.cityId;
  const orgId = typeof body.orgId === 'string' ? body.orgId : null;

  // Secret guard: when the header is present it must match (otherwise 401/500
  // from checkCronSecret). Its absence is acceptable only if a session
  // authorises the caller below.
  let secretValid = false;
  if (request.headers.get('x-cityscan-secret') !== null) {
    const denied = checkCronSecret(request);
    if (denied) return denied;
    secretValid = true;
  }

  let session: AuthContext | null = null;
  try {
    session = await getAuthContext({ orgId });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  let actor: ScanActor | null = null;
  let supabase: SupabaseClient | null = null;

  if (session) {
    if (!CONTRIBUTOR_ROLES.includes(session.role)) {
      return Response.json(
        { error: 'Forbidden: viewer role cannot trigger scans.' },
        { status: 403 },
      );
    }
    actor = { userId: session.userId, orgId: session.orgId };
    supabase = await createClient();
  } else if (secretValid) {
    const cronContext = await resolveCronActor();
    actor = cronContext.actor;
    supabase = cronContext.supabase;
  } else {
    // Anonymous: anyone may run a scan, but nothing is persisted.
    // actor and supabase stay null → executeScan runs compute-only
    // (`persisted: false`) and returns the result without any database write.
  }

  if (!cities.some((entry) => entry.id === cityId)) {
    return Response.json({ error: `Unknown cityId: ${cityId}` }, { status: 404 });
  }

  const payload: CityScanResponse = await executeScan(
    {
      cityId,
      beforeId: typeof body.beforeId === 'string' ? body.beforeId : undefined,
      afterId: typeof body.afterId === 'string' ? body.afterId : undefined,
    },
    { actor, supabase, source: secretValid ? 'cron' : 'manual' },
  );

  return Response.json(payload, { status: payload.status === 'FAILED' ? 500 : 200 });
}