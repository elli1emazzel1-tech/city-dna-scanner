'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Satellite,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Database,
  FileBarChart2,
  LayoutDashboard,
  MapPinned,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  Waves,
} from 'lucide-react';
import CitySearch from './CitySearch';
import WorkspaceSelector from './WorkspaceSelector';
import AuthButton from './AuthButton';
import type { City } from '../../lib/data/types';

interface DashboardShellProps {
  city: City;
  children: React.ReactNode;
  dataStatus?: string;
  onSelectCity: (city: City) => void;
}

const navigation = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Workspace', href: '/workspace', icon: Building2 },
  { label: 'City Analysis', href: '/city-report', icon: MapPinned },
  { label: 'City Scan', href: '/cityscan', icon: Satellite },
  { label: 'Simulation', href: '/simulation', icon: SlidersHorizontal },
  { label: 'Reports', href: '/saved-reports', icon: FileBarChart2 },
  { label: 'Compare Cities', href: '/compare-cities', icon: ChartNoAxesCombined },
  { label: 'Timeline', href: '/timeline', icon: TrendingUp },
  { label: 'Recommendations', href: '/recommendations', icon: ShieldAlert },
  { label: 'Data & Sources', href: '/data-sources', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings2 },
];

export default function DashboardShell({ city, children, dataStatus = 'SOURCE STATUS', onSelectCity }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#07111b] text-slate-200">
      <header className="fixed inset-x-0 top-0 z-[1000] flex h-[62px] items-center gap-4 border-b border-[#1a2c3a] bg-[#081521]/95 px-4 backdrop-blur sm:px-6">
        <Link href="/dashboard" className="flex w-[210px] shrink-0 items-center gap-3" aria-label="DNA City overview">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-teal-400/30 bg-teal-400/10 text-teal-300">
            <Waves size={17} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold tracking-wide text-slate-100">DNA <span className="text-teal-300">·</span> City</span>
            <span className="block text-[9px] tracking-wide text-slate-500">URBAN INTELLIGENCE ENGINE</span>
          </span>
        </Link>
        <CitySearch selectedCity={city} onSelect={onSelectCity} />
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-2 rounded border border-teal-900/60 bg-teal-950/30 px-2.5 py-1.5 text-[9px] font-medium tracking-wide text-teal-300 sm:flex">
            <i className="h-1.5 w-1.5 rounded-full bg-teal-400" /> {dataStatus}
          </span>
          <span className="hidden text-[9px] text-slate-500 lg:inline">No live sources connected</span>
          <Link href="/simulation" className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100" aria-label="Local hazard reports">
            <MapPinned size={16} />
          </Link>
          <AuthButton />
          <Link href="/settings" className="flex items-center gap-2 rounded p-1.5 hover:bg-slate-800" aria-label="Workspace settings">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-[10px] text-slate-200">DC</span>
            <span className="hidden text-left sm:block"><span className="block text-[10px] font-medium text-slate-200">City team</span><span className="block text-[9px] text-slate-500">Workspace</span></span>
            <ChevronDown size={13} className="hidden text-slate-500 sm:block" />
          </Link>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[62px] z-20 hidden w-[218px] flex-col border-r border-[#1a2c3a] bg-[#081521] lg:flex">
        <WorkspaceSelector />
        <nav className="flex-1 space-y-1 px-3 pb-5" aria-label="Main navigation">
          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">Workspace</p>
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href === '/dashboard' && pathname === '/');
            return (
              <Link key={label} href={href} aria-current={active ? 'page' : undefined} className={`flex h-9 items-center gap-3 rounded px-3 text-[11px] transition ${active ? 'border border-teal-900/70 bg-teal-950/40 text-teal-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}>
                <Icon size={15} strokeWidth={1.8} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#1a2c3a] px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-slate-400"><CircleHelp size={13} /> DNA · City</div>
          <p className="text-[9px] text-slate-600">Urban Intelligence Engine</p>
          <p className="mt-1 font-mono text-[9px] text-slate-600">Version 1.0.0 · Demo workspace</p>
        </div>
      </aside>

      <main className="min-h-screen pt-[62px] lg:pl-[218px]">
        <div className="border-b border-[#1a2c3a] bg-[#081521]/80 px-4 py-2.5 lg:hidden">
          <nav className="dashboard-nav-scroll flex gap-1 overflow-x-auto" aria-label="Mobile navigation">
            {navigation.map(({ label, href }) => (
              <Link key={label} href={href} className={`shrink-0 rounded px-3 py-2 text-[10px] ${pathname === href ? 'bg-teal-950/50 text-teal-300' : 'text-slate-400'}`}>{label}</Link>
            ))}
          </nav>
        </div>
        <div className="mx-auto max-w-[1680px] p-4 sm:p-5 xl:p-6">
          {dataStatus.startsWith('LOADING') && <div role="status" className="mb-3 flex items-center gap-2 text-[9px] text-slate-400"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" /> Loading city data…</div>}
          {children}
        </div>
      </main>
    </div>
  );
}
