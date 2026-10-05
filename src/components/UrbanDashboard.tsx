'use client';

import Link from 'next/link';
import React, { useState, useSyncExternalStore } from 'react';
import { 
  Droplets, 
  Sun, 
  AlertCircle, 
  MapPin, 
  ShieldAlert, 
  Globe, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Navigation,
  Search,
  Activity,
  Wind,
  Trees,
  Volume2,
  Flame,
  LayoutDashboard,
  FileText,
  GitCompare,
  BookmarkCheck,
  Info
} from 'lucide-react';

interface CityMapProps {
  selectedCity: string;
  airQualityIndex: number;
}

const CityMap: React.FC<CityMapProps> = ({ selectedCity, airQualityIndex }) => (
  <div className="w-full h-64 rounded-2xl bg-[#131B2E] border border-slate-800 flex items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(#22FFAA_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
    <div className="text-center z-10">
      <span className="text-xs font-mono text-[#22FFAA] block mb-1">Active Sector: {selectedCity || "Awaiting City Input"}</span>
      <p className="text-sm font-bold text-white">Telemetry AQI Index: {selectedCity ? airQualityIndex : '--'}</p>
    </div>
  </div>
);

interface HazardReport {
  id: number;
  type: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Dispatched' | 'Resolved';
  date: string;
  coords: { x: string; y: string };
}

interface Recommendation {
  id: number;
  category: string;
  title: string;
  impact: string;
  status: string;
}

interface CleanCity {
  rank: number;
  city: string;
  country: string;
  score: number;
  change: string;
}

interface TimelineItem {
  year: string;
  score: string;
  height: string;
  isHighlighted?: boolean;
  isForecast?: boolean;
}

type DashboardSection =
  | 'dashboard'
  | 'report'
  | 'compare'
  | 'timeline'
  | 'recommendations'
  | 'saved'
  | 'about';

interface UrbanDashboardProps {
  section: DashboardSection;
}

interface SavedReport {
  id: number;
  city: string;
  savedAt: string;
  airQualityIndex: number;
  waterPurityScore: number;
  greenCanopyIndex: number;
  carbonEmissionRate: number;
}

function isSavedReport(value: unknown): value is SavedReport {
  if (typeof value !== 'object' || value === null) return false;

  const report = value as Record<string, unknown>;
  return typeof report.id === 'number'
    && typeof report.city === 'string'
    && typeof report.savedAt === 'string'
    && typeof report.airQualityIndex === 'number'
    && typeof report.waterPurityScore === 'number'
    && typeof report.greenCanopyIndex === 'number'
    && typeof report.carbonEmissionRate === 'number';
}

const savedReportsStorageKey = 'city-dna-saved-reports';
const emptySavedReports: SavedReport[] = [];
const savedReportsListeners = new Set<() => void>();
let cachedSavedReportsRaw: string | null | undefined;
let cachedSavedReports: SavedReport[] = emptySavedReports;

function getSavedReportsSnapshot(): SavedReport[] {
  const rawReports = window.localStorage.getItem(savedReportsStorageKey);
  if (rawReports === cachedSavedReportsRaw) return cachedSavedReports;

  cachedSavedReportsRaw = rawReports;
  if (!rawReports) {
    cachedSavedReports = emptySavedReports;
    return cachedSavedReports;
  }

  try {
    const parsedReports: unknown = JSON.parse(rawReports);
    cachedSavedReports = Array.isArray(parsedReports)
      ? parsedReports.filter(isSavedReport)
      : emptySavedReports;
  } catch (error) {
    console.error('Could not load saved city reports.', error);
    cachedSavedReports = emptySavedReports;
  }
  return cachedSavedReports;
}

function subscribeToSavedReports(listener: () => void) {
  savedReportsListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    savedReportsListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function notifySavedReportsChanged() {
  savedReportsListeners.forEach((listener) => listener());
}

const navigationItems: {
  id: DashboardSection;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'report', label: 'City Report', href: '/city-report', icon: FileText },
  { id: 'compare', label: 'Compare Cities', href: '/compare-cities', icon: GitCompare },
  { id: 'timeline', label: 'Timeline', href: '/timeline', icon: TrendingUp },
  { id: 'recommendations', label: 'Recommendations', href: '/recommendations', icon: ShieldAlert },
  { id: 'saved', label: 'Saved Reports', href: '/saved-reports', icon: BookmarkCheck },
  { id: 'about', label: 'About', href: '/about', icon: Info },
];

export default function UrbanDashboard({ section }: UrbanDashboardProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Vector Metrics States
  const [airQualityIndex, setAirQualityIndex] = useState<number>(47);
  const [waterPurityScore, setWaterPurityScore] = useState<number>(88);
  const [greenCanopyIndex, setGreenCanopyIndex] = useState<number>(34);
  const [carbonEmissionRate, setCarbonEmissionRate] = useState<number>(412);
  const [noisePollutionLevel, setNoisePollutionLevel] = useState<number>(62);

  // UHI Simulator States
  const [treeCoverage, setTreeCoverage] = useState<number>(25);
  const [whiteRoof, setWhiteRoof] = useState<number>(30);
  const [industrialCap, setIndustrialCap] = useState<number>(15);

  // Hazard Reporting State
  const [newHazardType, setNewHazardType] = useState<string>('Illegal Dumping');
  const [newHazardLocation, setNewHazardLocation] = useState<string>('');
  const [newHazardSeverity, setNewHazardSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  const [reports, setReports] = useState<HazardReport[]>([
    { id: 1, type: 'Illegal Dumping', location: 'District 4 Industrial Zone', severity: 'High', status: 'Pending', date: 'Aug 18, 2026', coords: { x: '45%', y: '60%' } },
    { id: 2, type: 'Clogged Drainage', location: 'Sector 7 Market', severity: 'Medium', status: 'In Progress', date: 'Aug 18, 2026', coords: { x: '72%', y: '30%' } },
  ]);
  const savedReports = useSyncExternalStore(
    subscribeToSavedReports,
    getSavedReportsSnapshot,
    () => emptySavedReports,
  );

  // Flood Predictor States
  const [rainfall, setRainfall] = useState<number>(15);
  const [drainageCapacity, setDrainageCapacity] = useState<number>(85);

  const [recommendations] = useState<Recommendation[]>([
    { id: 1, category: 'Energy', title: 'Expand smart-grid rooftop solar incentives in primary sector', impact: '+4.2% Efficiency', status: 'Ready' },
    { id: 2, category: 'Water', title: 'Deploy bio-filtration buffers near stormwater runoff canals', impact: '-12% Contaminants', status: 'In Progress' }
  ]);

  const [cleanestCities] = useState<CleanCity[]>([
    { rank: 1, city: 'Helsinki', country: 'Finland', score: 98.4, change: '+1.2%' },
    { rank: 2, city: 'Zürich', country: 'Switzerland', score: 97.9, change: '+0.8%' },
    { rank: 3, city: 'Reykjavík', country: 'Iceland', score: 96.5, change: '+1.5%' },
    { rank: 4, city: 'Vienna', country: 'Austria', score: 95.8, change: '+0.4%' },
    { rank: 5, city: 'Singapore', country: 'Singapore', score: 94.7, change: '+2.1%' }
  ]);

  const [timelineData] = useState<TimelineItem[]>([
    { year: '2018', score: '62.0', height: '60%' },
    { year: '2020', score: '68.4', height: '68%' },
    { year: '2022', score: '75.1', height: '75%' },
    { year: '2024', score: '82.9', height: '83%', isHighlighted: true },
    { year: '2026', score: '89.2', height: '89%' },
    { year: '2028', score: '93.5', height: '93%', isForecast: true },
    { year: '2030', score: '97.0', height: '97%', isForecast: true }
  ]);

  const handleCityScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsScanning(true);
    const query = searchQuery.trim();
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('mumbai') || lowerQuery.includes('delhi') || lowerQuery.includes('india')) {
      setCountryCode('IN');
    } else if (lowerQuery.includes('new york') || lowerQuery.includes('chicago') || lowerQuery.includes('usa')) {
      setCountryCode('US');
    } else if (lowerQuery.includes('london') || lowerQuery.includes('uk')) {
      setCountryCode('GB');
    } else if (lowerQuery.includes('tokyo') || lowerQuery.includes('japan')) {
      setCountryCode('JP');
    } else {
      setCountryCode('INT');
    }

    setTimeout(() => {
      setSelectedCity(query);
      setAirQualityIndex(Math.floor(Math.random() * 60) + 25);
      setWaterPurityScore(Math.floor(Math.random() * 25) + 75);
      setGreenCanopyIndex(Math.floor(Math.random() * 40) + 20);
      setCarbonEmissionRate(Math.floor(Math.random() * 200) + 300);
      setIsScanning(false);
      setSearchQuery('');
    }, 1200);
  };

  const handleAddHazard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHazardLocation.trim()) return;

    const randomX = `${Math.floor(Math.random() * 75 + 15)}%`;
    const randomY = `${Math.floor(Math.random() * 60 + 20)}%`;

    const newReport: HazardReport = {
      id: Date.now(),
      type: newHazardType,
      location: newHazardLocation,
      severity: newHazardSeverity,
      status: 'Pending',
      date: 'Aug 29, 2026',
      coords: { x: randomX, y: randomY }
    };

    setReports([newReport, ...reports]);
    setNewHazardLocation('');
  };

  const filteredReports = activeFilter === 'All' 
    ? reports 
    : reports.filter(r => r.status === activeFilter || r.severity === activeFilter);

  const saveCityReport = () => {
    if (!selectedCity) return;

    const savedReport: SavedReport = {
      id: Date.now(),
      city: selectedCity,
      savedAt: new Date().toLocaleDateString(),
      airQualityIndex,
      waterPurityScore,
      greenCanopyIndex,
      carbonEmissionRate,
    };
    try {
      window.localStorage.setItem(savedReportsStorageKey, JSON.stringify([savedReport, ...savedReports]));
      notifySavedReportsChanged();
    } catch (error) {
      console.error('Could not save the city report.', error);
      window.alert('The report could not be saved in this browser.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0B0F1A]/90 p-6 hidden lg:flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl bg-[#22FFAA]/20 border border-[#22FFAA]/40 flex items-center justify-center text-[#22FFAA]">
                <Globe className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white tracking-wider text-sm">DNA · City</span>
            </div>
            <span className="text-[10px] font-mono text-[#22FFAA] uppercase tracking-wider block pl-9">Urban Intelligence Engine</span>
          </div>

          <nav className="space-y-1">
            {navigationItems.map(({ id, label, href, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                aria-current={section === id ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${section === id ? 'bg-[#22FFAA]/10 text-[#22FFAA] border border-[#22FFAA]/20' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Neural Telemetry</span>
            <span className="text-[#22FFAA]">v4.6.2</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Nodes Active</span>
            <span className="font-mono text-white">2,410</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-[#22FFAA] h-full w-[99.9%]"></div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        
        {/* TOP STATUS HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#22FFAA]">Active Region:</span>
            <span className="text-white font-bold">{selectedCity ? `${selectedCity}${countryCode ? `, ${countryCode}` : ''}` : 'None Selected'}</span>
          </div>
          <div className="text-slate-400">
            {selectedCity ? 'All biological & geospatial sensors synchronized successfully' : 'Awaiting initialization via city scan'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Timestamp: Aug 29, 2026 - 23:05 UTC</span>
            {section === 'report' && selectedCity && (
              <button
                onClick={saveCityReport}
                className="flex items-center gap-1.5 rounded-xl border border-[#22FFAA]/30 bg-[#22FFAA]/10 px-3 py-1.5 text-[#22FFAA] transition hover:bg-[#22FFAA]/20"
              >
                <BookmarkCheck className="h-3.5 w-3.5" /> Save Report
              </button>
            )}
            <button 
              onClick={() => alert("Full audit report exported successfully.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 text-[#22FFAA] hover:bg-[#22FFAA]/20 transition"
            >
              Export Audit
            </button>
          </div>
        </div>

        <nav aria-label="Main navigation" className="lg:hidden flex gap-2 overflow-x-auto pb-1">
          {navigationItems.map(({ id, label, href }) => (
            <Link
              key={id}
              href={href}
              aria-current={section === id ? 'page' : undefined}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs ${section === id ? 'border-[#22FFAA]/30 bg-[#22FFAA]/10 text-[#22FFAA]' : 'border-slate-800 text-slate-400'}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* HERO SEARCH SECTION */}
        {(section === 'dashboard' || section === 'report' || section === 'compare') && (
        <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#22FFAA] uppercase tracking-wider block">Intelligent Insights. Healthier Cities.</span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Decode Cities with AI Intelligence</h1>
            <p className="text-xs text-slate-400">Analyze environmental health, simulate urban climate interventions, report civic hazards, and predict extreme weather patterns in real-time.</p>
          </div>

          <form onSubmit={handleCityScan} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search any city, e.g., Tokyo, London, Singapore..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131B2E] border border-slate-800 text-xs text-white pl-10 pr-4 py-3 rounded-xl outline-none placeholder:text-slate-500 focus:border-[#22FFAA] transition"
              />
            </div>
            <button 
              type="submit"
              disabled={isScanning}
              className="px-6 py-3 rounded-xl bg-[#22FFAA] text-slate-950 font-bold text-xs hover:bg-[#1edb95] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScanning ? 'Scanning...' : 'Scan City'}
            </button>
          </form>
        </div>
        )}

        {/* 5 CORE ECOLOGICAL VECTORS GRID */}
        {(section === 'dashboard' || section === 'report') && (selectedCity ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-[#22FFAA]" />
                5 Core Ecological Vectors · {selectedCity.toUpperCase()}
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                All Systems Normal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Wind className="w-4 h-4 text-[#22FFAA]" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Air Quality</span>
                  <div className="text-2xl font-extrabold text-white font-mono">{airQualityIndex} <span className="text-xs font-normal text-slate-400">AQI</span></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400">Improving ↗</span>
                  <div className="w-3 h-3 rounded-full bg-[#22FFAA]"></div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Water Purity</span>
                  <div className="text-2xl font-extrabold text-white font-mono">{waterPurityScore} <span className="text-xs font-normal text-slate-400">/100</span></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-cyan-400">Stable →</span>
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Trees className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Green Canopy Density</span>
                  <div className="text-2xl font-extrabold text-white font-mono">{greenCanopyIndex}%</div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target: 40%</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Carbon Output Rate</span>
                  <div className="text-2xl font-extrabold text-white font-mono">{carbonEmissionRate} <span className="text-xs font-normal text-slate-400">kt/mo</span></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-amber-400">-8.4% YoY</span>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Noise Pollution Level</span>
                  <div className="text-2xl font-extrabold text-white font-mono">{noisePollutionLevel} <span className="text-xs font-normal text-slate-400">dB</span></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-rose-400">Moderate</span>
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 text-center space-y-3 shadow-xl">
            <Globe className="w-10 h-10 text-slate-600 mx-auto animate-spin" style={{ animationDuration: '20s' }} />
            <h3 className="text-white font-bold text-sm">No City Initialized</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Please enter a city name in the search bar above to generate the live telemetry vector dashboard.</p>
          </div>
        ))}

        {/* SECTION 2: THE 3 COMPETITION SOLUTION FEATURES (GRID) */}
        {section === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FEATURE 1: Urban Heat Island (UHI) Simulator */}
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <h3 className="text-white font-bold text-sm">UHI Policy Simulator</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Interactive Sandbox</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">Simulate municipal interventions to mitigate peak summer urban temperatures in real time.</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Tree Canopy Coverage</span>
                    <span className="font-mono text-[#22FFAA]">{treeCoverage}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="80" value={treeCoverage} 
                    onChange={(e) => setTreeCoverage(Number(e.target.value))}
                    className="w-full accent-[#22FFAA] cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Cool / White Roof Adoption</span>
                    <span className="font-mono text-[#22FFAA]">{whiteRoof}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={whiteRoof} 
                    onChange={(e) => setWhiteRoof(Number(e.target.value))}
                    className="w-full accent-[#22FFAA] cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Industrial Heat Cap</span>
                    <span className="font-mono text-[#22FFAA]">{industrialCap}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="50" value={industrialCap} 
                    onChange={(e) => setIndustrialCap(Number(e.target.value))}
                    className="w-full accent-[#22FFAA] cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[11px] text-[#22FFAA] font-semibold block">Predicted Summer Cooling:</span>
                <span className="text-[10px] text-slate-400">Model verified via satellite telemetry</span>
              </div>
              <span className="text-lg font-extrabold text-white font-mono">
                -{(treeCoverage * 0.032 + whiteRoof * 0.018 + industrialCap * 0.025).toFixed(1)} °C
              </span>
            </div>
          </div>

          {/* FEATURE 2: Live Citizen Hazard Reporting & Crowdsourced Pin Map */}
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Citizen Hazard Pin Map</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Crowdsourced Vector</span>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">Log civic hazards to instantly plot coordinates onto the municipal grid overlay.</p>

              <div className="w-full h-32 rounded-2xl bg-[#131B2E] border border-slate-800 relative mb-3 overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:14px_14px] opacity-20"></div>
                
                {reports.map((r) => (
                  <div 
                    key={`map-pin-${r.id}`}
                    className="absolute group/pin cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    style={{ top: r.coords.y, left: r.coords.x }}
                  >
                    <span className={`absolute -inset-1 rounded-full animate-ping opacity-75 ${
                      r.severity === 'Critical' ? 'bg-rose-500' : r.severity === 'High' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></span>
                    <div className={`relative w-3.5 h-3.5 rounded-full border border-slate-900 shadow-md flex items-center justify-center ${
                      r.severity === 'Critical' ? 'bg-rose-500' : r.severity === 'High' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></div>
                    
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden group-hover/pin:flex flex-col bg-slate-950 text-white text-[10px] p-2 rounded-lg border border-slate-800 shadow-xl whitespace-nowrap z-30">
                      <span className="font-bold text-[#22FFAA]">{r.type}</span>
                      <span className="text-slate-300">{r.location}</span>
                      <span className="text-slate-400 font-mono text-[9px]">Severity: {r.severity}</span>
                    </div>
                  </div>
                ))}

                <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur border border-slate-800/80 px-2 py-1 rounded text-[9px] font-mono text-slate-300 flex items-center gap-1.5 z-10">
                  <Navigation className="w-3 h-3 text-[#22FFAA]" />
                  <span>{reports.length} Active Pins Mapped</span>
                </div>
              </div>

              <form onSubmit={handleAddHazard} className="space-y-2 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={newHazardType} 
                    onChange={(e) => setNewHazardType(e.target.value)}
                    className="w-full bg-[#131B2E] border border-slate-800 text-xs text-white p-2 rounded-xl outline-none focus:border-[#22FFAA] transition"
                  >
                    <option value="Illegal Dumping">Illegal Dumping</option>
                    <option value="Clogged Drainage">Clogged Drainage</option>
                    <option value="Toxic Smoke">Toxic Smoke</option>
                    <option value="Broken Water Pipe">Broken Water Pipe</option>
                  </select>

                  <select 
                    value={newHazardSeverity} 
                    onChange={(e) => setNewHazardSeverity(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
                    className="w-full bg-[#131B2E] border border-slate-800 text-xs text-white p-2 rounded-xl outline-none focus:border-[#22FFAA] transition"
                  >
                    <option value="Low">Severity: Low</option>
                    <option value="Medium">Severity: Medium</option>
                    <option value="High">Severity: High</option>
                    <option value="Critical">Severity: Critical</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter street name or sector..." 
                    value={newHazardLocation}
                    onChange={(e) => setNewHazardLocation(e.target.value)}
                    className="w-full bg-[#131B2E] border border-slate-800 text-xs text-white p-2.5 rounded-xl outline-none placeholder:text-slate-500 focus:border-[#22FFAA] transition"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#22FFAA] text-slate-950 font-semibold text-xs hover:bg-[#1edb95] transition whitespace-nowrap shadow-[0_0_15px_rgba(34,255,170,0.2)]"
                  >
                    Drop Pin
                  </button>
                </div>
              </form>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-300">Telemetry Incident Feed</span>
                <div className="flex gap-1 text-[10px] font-mono">
                  {['All', 'Pending', 'In Progress', 'Resolved'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-2 py-0.5 rounded transition ${
                        activeFilter === filter 
                          ? 'bg-[#22FFAA]/20 text-[#22FFAA] border border-[#22FFAA]/30' 
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500 font-mono">No reports found matching criteria.</div>
                ) : (
                  filteredReports.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-[#131B2E] border border-slate-800/70 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{r.type}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                            r.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            r.severity === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {r.severity}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{r.location} · {r.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] border flex items-center gap-1 ${
                          r.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          r.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {r.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                          {r.status === 'In Progress' && <Navigation className="w-3 h-3" />}
                          {r.status === 'Pending' && <Clock className="w-3 h-3" />}
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* FEATURE 3: Flash Flood & Stormwater Risk Predictor */}
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Flash Flood Predictor</h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Topography Model</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">Real-time stormwater capacity analysis based on precipitation rates.</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Precipitation Rate</span>
                    <span className="font-mono text-cyan-400">{rainfall} mm/hr</span>
                  </div>
                  <input 
                    type="range" min="2" max="60" value={rainfall} 
                    onChange={(e) => setRainfall(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Drainage Capacity</span>
                    <span className="font-mono text-cyan-400">{drainageCapacity}%</span>
                  </div>
                  <input 
                    type="range" min="30" max="100" value={drainageCapacity} 
                    onChange={(e) => setDrainageCapacity(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className={`mt-6 p-4 rounded-2xl border flex flex-col gap-1.5 shadow-inner ${
              rainfall > 35 || drainageCapacity < 50
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : rainfall > 20 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{rainfall > 35 ? 'Critical Flood Alert' : rainfall > 20 ? 'Moderate Caution' : 'Normal Drainage Status'}</span>
                <span className="font-mono">{rainfall > 35 ? 'Risk: 89%' : rainfall > 20 ? 'Risk: 44%' : 'Risk: 11%'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {rainfall > 35 
                  ? 'AI Action: Reroute low-elevation traffic & engage emergency pumps.' 
                  : 'Municipal stormwater networks operating safely within thresholds.'}
              </p>
            </div>
          </div>

        </div>
        )}

        {/* SECTION 3: GEOSPATIAL TELEMETRY MAP & AI RECOMMENDATIONS */}
        {(section === 'report' || section === 'recommendations') && (
        <div className="space-y-6">
          
          {section === 'report' && (
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#22FFAA]" />
                  <h3 className="text-white font-bold text-sm">Geospatial Telemetry Grid & Sector Radar</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs text-slate-400 font-mono">Live Sector Map</span>
                </div>
              </div>
              <CityMap selectedCity={selectedCity} airQualityIndex={airQualityIndex} />
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
              <span className="font-mono">Elevation: 12m ASL</span>
              <div className="flex gap-4">
                <span className="text-[#22FFAA]">● Thermal Layer</span>
                <span className="text-cyan-400">● Hydrology</span>
                <span className="text-amber-400">● Carbon Flux</span>
              </div>
            </div>
          </div>
          )}

          {section === 'recommendations' && (
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <ShieldAlert className="w-4 h-4 text-[#22FFAA]" />
                <h3 className="text-white font-bold text-sm">AI Urban Recommendations</h3>
              </div>

              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800/70 text-xs space-y-1 hover:border-[#22FFAA]/30 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#22FFAA] bg-[#22FFAA]/10 px-2 py-0.5 rounded">{rec.category}</span>
                      <span className="text-[10px] font-mono text-slate-400">{rec.status}</span>
                    </div>
                    <strong className="text-white block">{rec.title}</strong>
                    <p className="text-[11px] text-slate-400">Expected Impact: <span className="text-emerald-400 font-semibold">{rec.impact}</span></p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => alert("Full AI Audit report generated and queued for export.")}
              className="w-full mt-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-md"
            >
              Export Full AI Audit
            </button>
          </div>
          )}

        </div>
        )}

        {/* SECTION 4: GLOBAL TOP 10 CLEANEST CITIES TABLE */}
        {section === 'compare' && (
        <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#22FFAA]" />
                Global Top 10 Cleanest Cities Benchmark
              </h3>
              <p className="text-xs text-slate-400">Real-time international ranking based on multi-vector biological telemetry.</p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              Updated Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Telemetry Score</th>
                  <th className="py-3 px-4 text-right">YoY Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {cleanestCities.map((item) => (
                  <tr key={item.rank} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#22FFAA]">#{item.rank}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{item.city}</td>
                    <td className="py-3.5 px-4 text-slate-400">{item.country}</td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">{item.score} / 100</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400">{item.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* SECTION 5: DECADE VIEW HISTORICAL TIMELINE */}
        {section === 'timeline' && (
        <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#22FFAA]" />
                Decade View · Historical & Predictive Urban Timeline
              </h3>
              <p className="text-xs text-slate-400">Tracking environmental evolution and future AI projections from 2018 to 2030.</p>
            </div>
            <span className="text-xs font-mono text-[#22FFAA] bg-[#22FFAA]/10 border border-[#22FFAA]/20 px-3 py-1 rounded-xl">
              AI Forecast Model Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 pt-4">
            {timelineData.map((t, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between ${
                t.isHighlighted 
                  ? 'bg-[#22FFAA]/10 border-[#22FFAA]/40 shadow-[0_0_20px_rgba(34,255,170,0.1)]' 
                  : t.isForecast 
                  ? 'bg-slate-900/40 border-slate-800/80 border-dashed' 
                  : 'bg-[#131B2E] border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-slate-400">{t.year}</span>
                  {t.isForecast && <span className="text-[9px] font-mono text-[#22FFAA]">Est.</span>}
                </div>
                <div className="my-2">
                  <div className="text-xl font-extrabold text-white font-mono">{t.score}</div>
                  <span className="text-[10px] text-slate-400">Health Score</span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full ${t.isForecast ? 'bg-[#22FFAA]/60' : 'bg-[#22FFAA]'}`} style={{ width: t.height }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {section === 'saved' && (
          <section className="space-y-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#22FFAA]">Your library</span>
              <h1 className="mt-1 text-2xl font-extrabold text-white">Saved City Reports</h1>
              <p className="mt-2 text-sm text-slate-400">Reports you save from City Report are stored in this browser.</p>
            </div>
            {savedReports.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {savedReports.map((report) => (
                  <article key={report.id} className="rounded-2xl border border-slate-800 bg-[#0B0F1A]/90 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-white">{report.city}</h2>
                        <p className="mt-1 text-xs text-slate-500">Saved {report.savedAt}</p>
                      </div>
                      <FileText className="h-4 w-4 text-[#22FFAA]" />
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                      <div><dt className="text-slate-500">Air quality</dt><dd className="mt-1 font-mono text-white">{report.airQualityIndex} AQI</dd></div>
                      <div><dt className="text-slate-500">Water purity</dt><dd className="mt-1 font-mono text-white">{report.waterPurityScore}/100</dd></div>
                      <div><dt className="text-slate-500">Green canopy</dt><dd className="mt-1 font-mono text-white">{report.greenCanopyIndex}%</dd></div>
                      <div><dt className="text-slate-500">Carbon output</dt><dd className="mt-1 font-mono text-white">{report.carbonEmissionRate} kt/mo</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-[#0B0F1A]/90 p-10 text-center">
                <BookmarkCheck className="mx-auto h-9 w-9 text-slate-600" />
                <h2 className="mt-4 font-bold text-white">No saved reports yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Scan a city in City Report, then save its environmental snapshot to find it here later.</p>
                <Link href="/city-report" className="mt-5 inline-flex rounded-xl bg-[#22FFAA] px-4 py-2.5 text-xs font-bold text-slate-950">Go to City Report</Link>
              </div>
            )}
          </section>
        )}

        {section === 'about' && (
          <section className="space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#22FFAA]">About this platform</span>
              <h1 className="mt-1 text-2xl font-extrabold text-white">City DNA, at a glance</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">City DNA brings environmental indicators and practical urban planning tools together in one workspace, helping teams explore city health, compare benchmarks, and consider potential interventions.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { title: 'Environmental report', text: 'Review air, water, canopy, carbon, and noise indicators alongside a geospatial sector view.' },
                { title: 'City benchmarks', text: 'Compare clean-city benchmark scores and year-over-year movement in one ranked view.' },
                { title: 'Urban planning tools', text: 'Explore heat-mitigation, citizen hazard reporting, and stormwater risk scenarios.' },
                { title: 'Recommendations', text: 'Review suggested energy and water actions with their expected impact.' },
                { title: 'Historical outlook', text: 'Follow the illustrative health-score timeline and its future projections.' },
                { title: 'Saved reports', text: 'Keep city snapshots in this browser so they are available on your next visit.' },
              ].map(({ title, text }) => (
                <article key={title} className="rounded-2xl border border-slate-800 bg-[#0B0F1A]/90 p-5">
                  <h2 className="font-bold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
                </article>
              ))}
            </div>
            <p className="text-xs text-slate-500">Displayed scan values are illustrative demo data and should not be used as official environmental measurements.</p>
          </section>
        )}

      </main>
    </div>
  );
}