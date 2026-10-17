import { createClient } from '@/lib/supabase/server';
import { CityScanTest } from '@/components/cityscan/CityScanTest';

export default async function CityScanTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public-first: no redirect to /auth/login. The page renders for anonymous
  // visitors too; only the membership/scan tests need a signed-in account.
  let membership: { org_id: string; role: string; created_at: string } | null = null;
  let membershipError: string | null = user
    ? null
    : 'No signed-in session. Sign in to run the organisation tests.';

  if (user) {
    const { data, error } = await supabase
      .from('memberships')
      .select('org_id, role, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    membership = data ?? null;
    membershipError = error?.message ?? null;
  }

  return (
    <CityScanTest
      userEmail={user?.email ?? null}
      userId={user?.id ?? null}
      membership={membership}
      membershipError={membershipError}
    />
  );
}
