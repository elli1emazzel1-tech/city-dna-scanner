'use client';

import { useState } from 'react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';

/**
 * Sidebar workspace selector. Lets users switch between organisation profiles and
 * see how many facilities each profile monitors. The active choice persists in
 * localStorage via WorkspaceProvider.
 */
export default function WorkspaceSelector() {
  const { organisations, organisation, setActiveOrganisation } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const select = (id: string) => {
    const ok = setActiveOrganisation(id);
    setError(ok ? '' : 'Could not switch workspace in this browser.');
    if (ok) setOpen(false);
  };

  return (
    <div className="relative px-3 pb-3">
      <p className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">Organisation</p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center gap-2 rounded-md border border-[#1b3041] bg-[#0a1926] px-2.5 py-2 text-left hover:border-teal-800/70"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-teal-400/30 bg-teal-400/10 text-teal-300">
          <Building2 size={13} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium text-slate-100">{organisation.name}</span>
          <span className="block truncate text-[9px] text-slate-500">{organisation.facilities.length} facilities · {organisation.region}</span>
        </span>
        <ChevronsUpDown size={13} className="shrink-0 text-slate-500" />
      </button>

      {open && (
        <ul role="listbox" className="absolute left-3 right-3 top-full z-[1100] mt-1 max-h-64 overflow-auto rounded-md border border-[#1b3041] bg-[#0a1926] p-1 shadow-2xl">
          {organisations.map((item) => {
            const active = item.id === organisation.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => select(item.id)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] ${active ? 'bg-teal-950/50 text-teal-200' : 'text-slate-300 hover:bg-slate-800/60'}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.name}</span>
                    <span className="block truncate text-[9px] text-slate-500">{item.industry} · {item.facilities.length} facilities</span>
                  </span>
                  {active && <Check size={13} className="shrink-0 text-teal-300" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p role="alert" className="mt-1 px-1 text-[9px] text-rose-300">{error}</p>}
    </div>
  );
}
