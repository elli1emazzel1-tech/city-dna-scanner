'use client';

import { useCallback, useEffect, useState } from 'react';
import { cities } from '@/lib/data/cities';

type TestStatus = 'pending' | 'running' | 'pass' | 'fail';

interface TestState {
  name: string;
  status: TestStatus;
  message: string;
  detail?: string;
}

interface ObservationSummary {
  id: string;
  itemId: string;
  status: string;
  triggerSource: string;
  createdAt: string;
}

interface ScanResponse {
  status: string;
  cityId: string;
  persisted: boolean;
  findingId: string | null;
  observationId: string | null;
  rejectionReason: string | null;
  commonValidPct: number | null;
  error?: string;
}

interface PairsResponse {
  count: number;
  pairs: Array<{ id: string; beforeId: string | null; afterId: string | null }>;
}

interface CityScanTestProps {
  userEmail: string | null;
  userId: string | null;
  membership: { org_id: string; role: string; created_at: string } | null;
  membershipError: string | null;
}

const DEFAULT_CITY_ID = 'amsterdam';

function statusBadge(status: TestStatus) {
  const style: Record<TestStatus, string> = {
    pending: 'border-transparent/50 bg-[#0a1926] text-[#5b7a99]',
    running: 'border-[#2dd4bf]/50 bg-[#2dd4bf]/10 text-[#2dd4bf] animate-pulse',
    pass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
    fail: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
  };
  const label: Record<TestStatus, string> = {
    pending: 'PENDING',
    running: 'RUNNING',
    pass: 'PASS',
    fail: 'FAIL',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style[status]}`}>
      {label[status]}
    </span>
  );
}

export function CityScanTest({
  userEmail,
  userId,
  membership,
  membershipError,
}: CityScanTestProps) {
  const [tests, setTests] = useState<TestState[]>([
    { name: '1 · Organisation membership & role', status: 'pending', message: '' },
    { name: '2 · Authenticated API access', status: 'pending', message: '' },
    { name: '3 · Real CityScan execution', status: 'pending', message: '' },
    { name: '4 · Database persistence', status: 'pending', message: '' },
    { name: '5 · Dashboard data retrieval', status: 'pending', message: '' },
  ]);
  const [cityId] = useState<string>(DEFAULT_CITY_ID);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [apiPayload, setApiPayload] = useState<string | null>(null);
  const [scanInFlight, setScanInFlight] = useState(false);
  const [observationsCount, setObservationsCount] = useState<number | null>(null);
  const [pairsCount, setPairsCount] = useState<number | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const city = cities.find((c) => c.id === cityId);

  const t1Pass = Boolean(membership && !membershipError);
  // Test 1 result is derived from the session props; update via an effect —
  // calling setTests during render re-renders forever (React render-phase
  // update never converges with a fresh array each pass).
  useEffect(() => {
    setTests((prev) => {
      const next = [...prev];
      next[0] = {
        ...next[0],
        status: t1Pass ? 'pass' : 'fail',
        message: t1Pass
          ? `org_id=${membership?.org_id}, role=${membership?.role}`
          : membershipError || 'No organisation membership found for this user.',
      };
      return next;
    });
  }, [t1Pass, membership, membershipError]);

  const callApi = useCallback(
    async (path: string, init?: RequestInit): Promise<Response> =>
      fetch(path, { ...init, headers: { ...init?.headers, 'Content-Type': 'application/json' } }),
    [],
  );

  const runTest2 = useCallback(async () => {
    setTests((prev) => {
      const next = [...prev];
      next[1] = { ...next[1], status: 'running', message: '' };
      return next;
    });
    try {
      const res = await callApi(
        `/api/cityscan/observations?cityId=${encodeURIComponent(cityId)}&limit=1`,
      );
      if (res.ok) {
        const data = await res.json();
        setApiPayload(JSON.stringify(data, null, 2));
        setTests((prev) => {
          const next = [...prev];
          next[1] = {
            ...next[1],
            status: 'pass',
            message: `200 OK — ${data.count ?? 0} observation(s) returned`,
          };
          return next;
        });
      } else {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body.error) msg = body.error;
        } catch {}
        setTests((prev) => {
          const next = [...prev];
          next[1] = { ...next[1], status: 'fail', message: msg };
          return next;
        });
      }
    } catch (error) {
      setTests((prev) => {
        const next = [...prev];
        next[1] = {
          ...next[1],
          status: 'fail',
          message: error instanceof Error ? error.message : String(error),
        };
        return next;
      });
    }
  }, [cityId, callApi]);

  const runScan = useCallback(async () => {
    setScanInFlight(true);
    setScanResult(null);
    setScanError(null);
    setTests((prev) => {
      const next = [...prev];
      next[2] = { ...next[2], status: 'running', message: 'Scan in flight…' };
      return next;
    });
    try {
      const res = await callApi('/api/cityscan/scan', {
        method: 'POST',
        body: JSON.stringify({ cityId }),
      });
      const body = (await res.json()) as ScanResponse;
      if (res.ok) {
        setScanResult(body);
        setTests((prev) => {
          const next = [...prev];
          next[2] = {
            ...next[2],
            status: 'pass',
            message: `200 OK — status=${body.status}, persisted=${body.persisted}, findingId=${body.findingId ?? '—'}`,
          };
          return next;
        });
      } else {
        setTests((prev) => {
          const next = [...prev];
          next[2] = {
            ...next[2],
            status: 'fail',
            message: body.error ?? `HTTP ${res.status}`,
          };
          return next;
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setScanError(msg);
      setTests((prev) => {
        const next = [...prev];
        next[2] = { ...next[2], status: 'fail', message: msg };
        return next;
      });
    } finally {
      setScanInFlight(false);
    }
  }, [cityId, callApi]);

  const runTest4 = useCallback(async () => {
    setTests((prev) => {
      const next = [...prev];
      next[3] = { ...next[3], status: 'running', message: '' };
      return next;
    });
    try {
      const res = await callApi(
        `/api/cityscan/observations?cityId=${encodeURIComponent(cityId)}&limit=10`,
      );
      if (res.ok) {
        const data = await res.json() as { count: number; observations: ObservationSummary[] };
        const manualObs = data.observations.filter((o) => o.triggerSource === 'manual').length;
        setObservationsCount(data.count);
        const pass = data.count > 0;
        setTests((prev) => {
          const next = [...prev];
          next[3] = {
            ...next[3],
            status: pass ? 'pass' : 'fail',
            message: pass
              ? `${data.count} observation(s) persisted, ${manualObs} manual trigger(s)`
              : 'No observations found in database for this city/org',
          };
          return next;
        });
      } else {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body.error) msg = body.error;
        } catch {}
        setTests((prev) => {
          const next = [...prev];
          next[3] = { ...next[3], status: 'fail', message: msg };
          return next;
        });
      }
    } catch (error) {
      setTests((prev) => {
        const next = [...prev];
        next[3] = {
          ...next[3],
          status: 'fail',
          message: error instanceof Error ? error.message : String(error),
        };
        return next;
      });
    }
  }, [cityId, callApi]);

  const runTest5 = useCallback(async () => {
    setTests((prev) => {
      const next = [...prev];
      next[4] = { ...next[4], status: 'running', message: '' };
      return next;
    });
    try {
      const res = await callApi(`/api/cityscan/pairs?cityId=${encodeURIComponent(cityId)}`);
      if (res.ok) {
        const data = await res.json() as PairsResponse;
        setPairsCount(data.count);
        setTests((prev) => {
          const next = [...prev];
          next[4] = {
            ...next[4],
            status: 'pass',
            message: `${data.count} pair(s) found for ${cityId}`,
          };
          return next;
        });
      } else {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body.error) msg = body.error;
        } catch {}
        setTests((prev) => {
          const next = [...prev];
          next[4] = { ...next[4], status: 'fail', message: msg };
          return next;
        });
      }
    } catch (error) {
      setTests((prev) => {
        const next = [...prev];
        next[4] = {
          ...next[4],
          status: 'fail',
          message: error instanceof Error ? error.message : String(error),
        };
        return next;
      });
    }
  }, [cityId, callApi]);

  return (
    <main className="p-6 max-w-4xl mx-auto text-slate-200">
      <h1 className="text-lg font-semibold mb-6">CityScan Phase 4B — Integration Test</h1>

      <section className="mb-6 rounded-md border border-[#1b3041] bg-[#0a1926] p-4">
        <h2 className="text-sm font-semibold text-[#2dd4bf] mb-2">Signed-in session</h2>
        <dl className="grid grid-cols-2 gap-2 text-[12px] text-slate-400">
          <dt>User email</dt>
          <dd className="truncate">{userEmail ?? 'Not signed in'}</dd>
          <dt>User id</dt>
          <dd className="truncate font-mono">{userId ?? '—'}</dd>
          <dt>Organisation</dt>
          <dd className="truncate font-mono">{membership?.org_id ?? '—'}</dd>
          <dt>Role</dt>
          <dd className={membership?.role === 'viewer' ? 'text-rose-300' : 'text-emerald-300'}>
            {membership?.role ?? '—'}
          </dd>
          {membershipError && (
            <dd className="col-span-2 text-rose-300 text-[11px]">{membershipError}</dd>
          )}
        </dl>
      </section>

      <section className="space-y-3">
        {tests.map((test) => (
          <section key={test.name} className="rounded-md border p-3 bg-[#0a1926]">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold">{test.name}</h3>
              {statusBadge(test.status)}
            </div>
            <p className="text-xs text-slate-400 mb-2">{test.message}</p>
            {test.status === 'pending' && test.name.includes('API access') && (
              <button
                onClick={runTest2}
                disabled={scanInFlight}
                className="text-xs border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf] px-2 py-1 rounded hover:bg-[#2dd4bf]/20 disabled:opacity-50"
              >
                Run API access test
              </button>
            )}
            {test.status === 'pending' && test.name.includes('CityScan execution') && (
              <button
                onClick={runScan}
                disabled={scanInFlight || !city}
                className="text-xs border border-teal-500/30 bg-teal-500/10 text-teal-300 px-2 py-1 rounded hover:bg-teal-500/20 disabled:opacity-50"
              >
                {scanInFlight ? 'Scanning…' : `Run CityScan for ${city?.name ?? cityId}`}
              </button>
            )}
            {((test.status === 'pending' || test.status === 'fail') &&
              test.name.includes('Persistence')) && (
              <button
                onClick={runTest4}
                disabled={scanInFlight}
                className="text-xs border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf] px-2 py-1 rounded hover:bg-[#2dd4bf]/20 disabled:opacity-50"
              >
                Verify persistence
              </button>
            )}
            {((test.status === 'pending' || test.status === 'fail') &&
              test.name.includes('Dashboard')) && (
              <button
                onClick={runTest5}
                disabled={scanInFlight}
                className="text-xs border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf] px-2 py-1 rounded hover:bg-[#2dd4bf]/20 disabled:opacity-50"
              >
                Retrieve dashboard data
              </button>
            )}
          </section>
        ))}
      </section>

      {scanResult && (
        <section className="mt-6 rounded-md border border-[#1b3041] bg-[#0a1926] p-4">
          <h2 className="text-sm font-semibold text-teal-300 mb-2">Scan execution result</h2>
          <dl className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <dt>Status</dt>
            <dd className={scanResult.status === 'ACCEPTED' ? 'text-emerald-300' : 'text-slate-300'}>
              {scanResult.status}
            </dd>
            <dt>Persisted</dt>
            <dd>{scanResult.persisted ? 'Yes' : 'No'}</dd>
            <dt>Finding id</dt>
            <dd className="font-mono">{scanResult.findingId ?? '—'}</dd>
            <dt>Observation id</dt>
            <dd className="font-mono">{scanResult.observationId ?? '—'}</dd>
            <dt>Common valid %</dt>
            <dd>{scanResult.commonValidPct ?? '—'}</dd>
            {scanResult.rejectionReason && (
              <>
                <dt>Rejection reason</dt>
                <dd className="col-span-2 text-rose-300 text-[11px]">{scanResult.rejectionReason}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {scanError && (
        <section className="mt-4 rounded-md border border-rose-800/50 bg-rose-900/20 p-3">
          <p className="text-xs text-rose-300">Scan error: {scanError}</p>
        </section>
      )}

      {apiPayload && (
        <section className="mt-6 rounded-md border border-[#1b3041] bg-[#0a1926] p-3">
          <h2 className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Raw API response (test 2)
          </h2>
          <pre className="text-[10px] text-slate-400 overflow-x-auto">{apiPayload}</pre>
        </section>
      )}

      {(observationsCount !== null || pairsCount !== null) && (
        <section className="mt-6 grid grid-cols-2 gap-3">
          {observationsCount !== null && (
            <div className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Observations in DB</div>
              <div className="text-lg font-mono text-emerald-300">{observationsCount}</div>
            </div>
          )}
          {pairsCount !== null && (
            <div className="rounded-md border border-[#1b3041] bg-[#0a1926] p-3">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Dashboard pairs</div>
              <div className="text-lg font-mono text-emerald-300">{pairsCount}</div>
            </div>
          )}
        </section>
      )}

      <p className="mt-8 text-[10px] text-slate-600">
        Temporary integration test page. Reads work without an account (public
        accepted-scan views); the membership and scan tests need a signed-in
        organisation account. Scan execution calls the real POST /api/cityscan/scan
        endpoint and persists to Supabase.
      </p>
    </main>
  );
}
