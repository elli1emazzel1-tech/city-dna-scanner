'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/** Header auth control: sign in, or show the signed-in user with a sign-out action. */
export default function AuthButton() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

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

  if (!supabase) {
    return (
      <Link href="/auth/login" className="flex items-center gap-1.5 rounded p-1.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-100">
        <LogIn size={14} /> <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  if (!user) {
    return (
      <Link href="/auth/login" className="flex items-center gap-1.5 rounded p-1.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-100">
        <LogIn size={14} /> <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[140px] truncate text-[10px] text-slate-400 lg:inline">{user.email}</span>
      <form action="/auth/signout" method="post">
        <button type="submit" aria-label="Sign out" title="Sign out" className="flex items-center gap-1.5 rounded p-1.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-100">
          <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}

