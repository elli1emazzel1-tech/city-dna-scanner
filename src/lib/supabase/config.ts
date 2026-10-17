/**
 * Supabase connection settings resolved from environment variables.
 *
 * Prefers the newer NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and falls back to the
 * legacy NEXT_PUBLIC_SUPABASE_ANON_KEY for backward compatibility. Credentials are
 * never hardcoded — they come only from the (git-ignored) environment.
 *
 * The publishable/anon key is safe to expose to the browser: all data access is
 * governed by Row Level Security (see supabase/schema.sql).
 */

export function getSupabaseUrl(): string | undefined {
  // Server fallback: vercel.json maps the secret store to the server-only
  // SUPABASE_URL name. Browser bundles only inline NEXT_PUBLIC_* values, so
  // this fallback helps server routes / middleware / cron only. There is
  // deliberately NO service_role fallback for getSupabaseKey(): the browser
  // and user-scoped server clients must use the publishable/anon key so RLS
  // keeps governing every row.
  return process.env.NEXT_PUBLIC_SUPABASE_URL
    || process.env.SUPABASE_URL
    || undefined;
}

export function getSupabaseKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || undefined;
}

/** True only when both a URL and a key are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}
