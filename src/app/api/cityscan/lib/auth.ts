/**
 * CityScan route auth utilities.
 *
 * getAuthContext/requireAuth wrap the cookie-based server client from
 * `src/lib/supabase/server.ts` and resolve the signed-in user's organisation
 * membership (org_id + role; oldest membership first for multi-org users).
 * checkCronSecret guards the Vercel cron entrypoint (plan §3: missing/invalid
 * secret → 401). resolveCronActor builds the optional service-role
 * persistence context (SUPABASE_SERVICE_ROLE_KEY + CITYSCAN_CRON_ORG_ID, both
 * server-only) so cron scans can write without a browser session; unconfigured
 * → compute-only (persisted: false).
 */
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseUrl } from '@/lib/supabase/config';

export interface AuthContext {
  userId: string;
  orgId: string;
  role: string;
}

export interface ScanActor {
  userId: string;
  orgId: string;
}

function reject(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/**
 * Session → membership context. Returns null only when there is no session;
 * throws a 403 Response when a session exists but lacks the requested org
 * membership (or any membership). Callers that need a 401 use requireAuth.
 */
export async function getAuthContext(options: { orgId?: string | null } = {}): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  let query = supabase
    .from('memberships')
    .select('org_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (options.orgId) query = query.eq('org_id', options.orgId);

  const { data, error } = await query.limit(1);
  if (error) {
    console.error('CityScan membership lookup failed:', error);
    throw reject(500, 'Membership lookup failed.');
  }
  if (!data || data.length === 0) {
    throw reject(403, options.orgId
      ? 'Forbidden: not a member of the requested organisation.'
      : 'No organisation membership.');
  }
  return { userId: user.id, orgId: data[0].org_id, role: data[0].role };
}

/** Like getAuthContext, but 401 when there is no session (read routes). */
export async function requireAuth(options: { orgId?: string | null } = {}): Promise<AuthContext> {
  const context = await getAuthContext(options);
  if (!context) throw reject(401, 'Unauthorized');
  return context;
}

// ---------------------------------------------------------------------------
// Public-first read access (Phase 4C)
// ---------------------------------------------------------------------------

/**
 * Read-route access decision.
 *  - `org`:    signed-in user WITH an organisation membership → org-scoped
 *              reads of the base tables (existing RLS policies unchanged).
 *  - `public`: no session, or a session without the requested membership →
 *              reads of the cityscan_public_* views only (accepted scan rows,
 *              explicit column allowlist, no org identifiers). Browsing never
 *              requires an account.
 */
export type CityScanReadAccess =
  | { kind: 'org'; userId: string; orgId: string; role: string }
  | { kind: 'public'; userId: string | null };

/**
 * Resolves how a read request may be served. Never throws and never rejects
 * for missing sessions or missing memberships — public browsing is the
 * default. Membership lookup failures degrade to public reads (never widens
 * access beyond the public views).
 */
export async function resolveReadAccess(
  options: { orgId?: string | null } = {},
): Promise<CityScanReadAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: 'public', userId: null };

  let query = supabase
    .from('memberships')
    .select('org_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (options.orgId) query = query.eq('org_id', options.orgId);

  const { data, error } = await query.limit(1);
  if (error) {
    console.error('CityScan membership lookup failed, falling back to public reads:', error);
    return { kind: 'public', userId: user.id };
  }
  if (!data || data.length === 0) return { kind: 'public', userId: user.id };
  return { kind: 'org', userId: user.id, orgId: data[0].org_id, role: data[0].role };
}

/**
 * True when a query failed because the cityscan_public_* views do not exist
 * yet — i.e. supabase/migrations/cityscan_public_views.sql has not been
 * applied on this deployment. PostgREST reports a missing relation as
 * PGRST205; a direct SQL path would report 42P01.
 */
export function publicViewsMissing(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === 'PGRST205' || error.code === '42P01') return true;
  return /cityscan_public_/.test(error.message ?? '');
}

/**
 * Response for reads on a deployment where the public views are not
 * applied yet. 401 routes the dashboard to its setup panel, which surfaces
 * the hint (apply the migration to enable reads).
 */
export function publicDataUnavailable(): Response {
  return Response.json(
    {
      error: 'Public CityScan data is not enabled on this deployment yet.',
      hint: 'Apply supabase/migrations/cityscan_public_views.sql to enable CityScan reads.',
    },
    { status: 401 },
  );
}

/** Cron secret guard. Returns null when valid, else a ready 401/500 Response. */
export function checkCronSecret(request: Request): Response | null {
  const secret = process.env.CITYSCAN_CRON_SECRET;
  if (!secret) return reject(500, 'Cron secret not configured (set CITYSCAN_CRON_SECRET).');
  const provided = request.headers.get('x-cityscan-secret');
  if (!provided || provided !== secret) {
    return reject(401, 'Unauthorized: missing or invalid cron secret.');
  }
  return null;
}

export interface CronActorContext {
  supabase: SupabaseClient | null;
  actor: ScanActor | null;
  note: string | null;
}

/**
 * Optional cron persistence context (server-only env, never shipped to the
 * browser): SUPABASE_SERVICE_ROLE_KEY + CITYSCAN_CRON_ORG_ID. `created_by` is
 * attributed to the org's earliest owner/admin membership (deterministic —
 * memberships.created_at asc). Missing env or failed lookup → compute-only
 * context with an explanatory note (Phase 4B graceful degradation).
 */
export async function resolveCronActor(): Promise<CronActorContext> {
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const orgId = process.env.CITYSCAN_CRON_ORG_ID;

  if (!url || !serviceKey || !orgId) {
    return {
      supabase: null,
      actor: null,
      note: 'Cron persistence not configured (SUPABASE_SERVICE_ROLE_KEY / CITYSCAN_CRON_ORG_ID unset); summaries computed but not stored.',
    };
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from('memberships')
    .select('user_id')
    .eq('org_id', orgId)
    .in('role', ['owner', 'admin'])
    .order('created_at', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    const detail = error
      ? error.message
      : `no owner/admin membership in CITYSCAN_CRON_ORG_ID ${orgId}`;
    console.error(`CityScan cron actor resolution failed: ${detail}`);
    return { supabase: null, actor: null, note: `Cron persistence unavailable: ${detail}` };
  }

  return { supabase: admin, actor: { userId: data[0].user_id, orgId }, note: null };
}