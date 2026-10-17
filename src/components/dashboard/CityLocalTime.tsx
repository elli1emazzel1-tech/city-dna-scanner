'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format(0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Live clock for the selected city, rendered in the city's own IANA timezone
 * (supplied by the weather provider). `Intl` applies DST rules automatically,
 * so the offset stays correct year-round. The second tick is client-only
 * (initial render shows a placeholder) to keep server/client markup in sync.
 */
export default function CityLocalTime({ timezone, isLoading = false }: { timezone?: string | null; isLoading?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  const valid = typeof timezone === 'string' && timezone.length > 0 && isValidTimezone(timezone);

  useEffect(() => {
    if (!valid || !timezone) return;
    const tick = () => setNow(new Date());
    // First tick is scheduled (not synchronous) to satisfy the
    // no-set-state-in-effect rule and to refresh instantly across city switches.
    const firstTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, [timezone, valid]);

  const zoneLabel = valid && timezone ? timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone : '';

  return (
    <span
      className="flex items-center gap-1.5 rounded border border-slate-800/90 bg-[#081622]/65 px-2 py-1 text-[9px] text-slate-400"
      title={valid ? `Local time zone: ${timezone}` : 'The provider did not return a usable timezone'}
    >
      <Clock size={11} className="text-teal-300" />
      {isLoading ? (
        'Local time loading'
      ) : !valid ? (
        'Local time unavailable'
      ) : (
        <>
          <span className="font-mono text-slate-200">
            {now === null
              ? '--:--:--'
              : new Intl.DateTimeFormat('en-GB', { timeZone: timezone as string, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now)}
          </span>
          <span className="text-slate-500">{zoneLabel}</span>
        </>
      )}
    </span>
  );
}