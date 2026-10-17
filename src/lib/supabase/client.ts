import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseKey, getSupabaseUrl, isSupabaseConfigured } from './config';

export { isSupabaseConfigured };

/**
 * Browser Supabase client (publishable/anon key — safe to expose; protected by RLS).
 * Returns null when Supabase is not configured, so components can render a safe
 * fallback instead of throwing during prerender.
 */
export function createClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

