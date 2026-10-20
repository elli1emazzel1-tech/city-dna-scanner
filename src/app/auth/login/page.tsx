'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Waves } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const hasError = searchParams.get('error') != null;

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = async () => {
    setPending(true);
    setMessage('');
    if (!supabase) {
      setMessage('Sign-in is not configured yet.');
      setPending(false);
      return;
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setMessage(error.message);
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111b] px-4 text-slate-200">
      <section className="w-full max-w-sm rounded-xl border border-[#1b3041] bg-[#0a1926] p-6 shadow-2xl">
        <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Enrealys overview">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-teal-400/30 bg-teal-400/10 text-teal-300">
            <Waves size={17} strokeWidth={2.2} />
          </span>
          <span className="text-[13px] font-semibold tracking-wide text-slate-100">Enrealys</span>
        </Link>

        <h1 className="mt-5 text-[15px] font-semibold text-slate-100">Sign in to Enrealys</h1>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Sign in with your organisation account to save monitoring locations and access them across devices.
        </p>

        {!supabase ? (
          <div className="mt-5 rounded-md border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            Authentication is not configured yet. Add your Supabase URL and anon key to <span className="font-mono">.env.local</span> to enable sign-in.
          </div>
        ) : user ? (
          <div className="mt-5 space-y-3">
            <p className="rounded-md border border-teal-900/60 bg-teal-950/30 px-3 py-2 text-[11px] text-teal-200">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => router.push('/dashboard')} className="flex-1 rounded-md border border-teal-800/80 bg-teal-950/40 px-3 py-2 text-[11px] font-medium text-teal-200 hover:bg-teal-950/80">
                Continue to dashboard
              </button>
              <form action="/auth/signout" method="post" className="flex-1">
                <button type="submit" className="w-full rounded-md border border-slate-700 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-800">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <button type="button" onClick={signInWithGoogle} disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-[11px] font-medium text-slate-100 transition hover:bg-slate-800 disabled:opacity-60">
              <GoogleIcon />
              {pending ? 'Redirecting…' : 'Continue with Google'}
            </button>
            {hasError && <p role="alert" className="text-[10px] text-rose-300">Sign-in could not be completed. Please try again.</p>}
            {message && <p role="alert" className="text-[10px] text-rose-300">{message}</p>}
          </div>
        )}

        <p className="mt-5 text-[9px] leading-relaxed text-slate-600">
          Authentication is provided by Supabase. Continue without signing in to keep using the browser-local demo workspace.
        </p>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.1 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111b] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#1b3041] bg-[#0a1926] p-6 text-[11px] text-slate-500 shadow-2xl">
        Loading sign-in…
      </div>
    </main>
  );
}
