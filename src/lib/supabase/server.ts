import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseKey, getSupabaseUrl } from './config';

/**
 * Server Supabase client for Server Components, Route Handlers and Server Actions.
 * The publishable/anon key is public; all data access is governed by Row Level
 * Security, so this client only ever sees the signed-in user's permitted rows.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl()!,
    getSupabaseKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // `setAll` was called from a Server Component, where cookies are read-only.
            // This is safe to ignore because middleware refreshes the session on every
            // request, keeping the auth cookies current.
          }
        },
      },
    },
  );
}
