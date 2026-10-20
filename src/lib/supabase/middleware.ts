import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseKey, getSupabaseUrl, isSupabaseConfigured } from './config';

/**
 * Refreshes the Supabase auth session on every matched request and forwards the
 * (possibly refreshed) cookies to the browser.
 *
 * NOTE: This intentionally does NOT redirect unauthenticated users. The existing
 * dashboard/workspace remain fully accessible so current functionality and demo data
 * are preserved. Route protection can be enabled here once real onboarding lands.
 *
 * When Supabase credentials are missing (env not configured), the request passes
 * through untouched instead of throwing, so public pages never 500.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured() || !getSupabaseUrl() || !getSupabaseKey()) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    getSupabaseUrl()!,
    getSupabaseKey()!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  // IMPORTANT: call getUser() to validate/refresh the token. Do not run code between
  // createServerClient and getUser() that could race the session refresh.
  await supabase.auth.getUser();

  return supabaseResponse;
}
