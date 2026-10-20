'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import ProfessionalDashboard from './dashboard/ProfessionalDashboard';
import DashboardShell from './dashboard/DashboardShell';
import { useCitySelection } from './dashboard/CitySelectionProvider';
import { useCityEnvironmentalData } from './dashboard/useCityEnvironmentalData';
import CityComparison from './dashboard/CityComparison';
import HistoricalTemperatureChart from './dashboard/HistoricalTemperatureChart';
import { defaultMapLayers, setMapLayer } from '../lib/maps/layers';
import { isOpenWeatherCityResult } from '../lib/data/openWeather';
import type { City, CityEnvironmentalData, EnvironmentalMetric, MapLayerId, WeatherData } from '../lib/data/types';

const InteractiveCityMap = dynamic(() => import('./map/InteractiveCityMap'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center rounded-lg bg-[#0b1725] text-xs text-slate-500">Loading geographic map…</div>,
});
import {
  Droplets,
  Sun,
  AlertCircle,
  MapPin,
  ShieldAlert,
  Globe,
  Search,
  Activity,
  Wind,
  Trees,
  Volume2,
  Flame,
  FileText,
  BookmarkCheck,
} from 'lucide-react';

interface CityMapProps {
  city: City;
  data?: CityEnvironmentalData;
}

const CityMap: React.FC<CityMapProps> = ({ city, data }) => {
  const [layers, setLayers] = useState(defaultMapLayers);
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-3 z-[600] rounded bg-[#071321]/90 px-2 py-1 text-[9px] text-slate-200">
        {city.name} · geocoded city centre
      </div>
      <InteractiveCityMap
        city={city}
        layers={layers}
        onToggleLayer={(id: MapLayerId) => setLayers((current) => setMapLayer(current, id))}
        data={data}
      />
    </div>
  );
};

interface HazardReport {
  id: string;
  cityId: string;
  type: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Submitted';
  reportedAt: string;
}

type DashboardSection =
  | 'dashboard'
  | 'report'
  | 'compare'
  | 'timeline'
  | 'recommendations'
  | 'saved'
  | 'about'
  | 'simulation'
  | 'alerts';

interface UrbanDashboardProps {
  section: DashboardSection;
  legacyMode?: boolean;
}

interface SavedReport {
  id: string;
  city: string;
  cityId: string;
  savedAt: string;
  vectors: CityProfile;
  weather?: WeatherData;
}

interface CityMetric {
  value: string;
  unit: string;
  detail: string;
  source: string;
  status: EnvironmentalMetric['status'];
  updated: string | null;
}

interface CityProfile {
  airQuality: CityMetric;
  waterQuality: CityMetric;
  greenCover: CityMetric;
  greenhouseGas: CityMetric;
  noise: CityMetric;
}

function isCityMetric(value: unknown): value is CityMetric {
  if (typeof value !== 'object' || value === null) return false;
  const metric = value as Record<string, unknown>;
  const validStatuses = ['OBSERVED', 'FORECAST', 'HISTORICAL', 'MODELLED', 'SIMULATED', 'REPORTED', 'CONNECTED', 'ERROR', 'UNAVAILABLE'];
  return typeof metric.value === 'string'
    && typeof metric.unit === 'string'
    && typeof metric.detail === 'string'
    && typeof metric.source === 'string'
    && typeof metric.status === 'string'
    && validStatuses.includes(metric.status)
    && (metric.updated === null || typeof metric.updated === 'string');
}

function isCityProfile(value: unknown): value is CityProfile {
  if (typeof value !== 'object' || value === null) return false;
  const profile = value as Record<string, unknown>;
  return isCityMetric(profile.airQuality)
    && isCityMetric(profile.waterQuality)
    && isCityMetric(profile.greenCover)
    && isCityMetric(profile.greenhouseGas)
    && isCityMetric(profile.noise);
}

function isWeatherData(value: unknown): value is WeatherData {
  if (typeof value !== 'object' || value === null) return false;
  const weather = value as Record<string, unknown>;
  const validStatuses = ['OBSERVED', 'FORECAST', 'HISTORICAL', 'MODELLED', 'SIMULATED', 'REPORTED', 'CONNECTED', 'ERROR', 'UNAVAILABLE'];
  return (weather.temperature === null || (typeof weather.temperature === 'number' && Number.isFinite(weather.temperature)))
    && (weather.apparentTemperature === undefined || weather.apparentTemperature === null || (typeof weather.apparentTemperature === 'number' && Number.isFinite(weather.apparentTemperature)))
    && (weather.soilMoisture === undefined || weather.soilMoisture === null || (typeof weather.soilMoisture === 'number' && Number.isFinite(weather.soilMoisture) && weather.soilMoisture >= 0 && weather.soilMoisture <= 1))
    && (weather.humidity === null || (typeof weather.humidity === 'number' && Number.isFinite(weather.humidity) && weather.humidity >= 0 && weather.humidity <= 100))
    && (weather.windSpeed === null || (typeof weather.windSpeed === 'number' && Number.isFinite(weather.windSpeed) && weather.windSpeed >= 0))
    && (weather.condition === null || typeof weather.condition === 'string')
    && typeof weather.status === 'string'
    && validStatuses.includes(weather.status)
    && typeof weather.source === 'string'
    && (weather.updated === null || typeof weather.updated === 'string')
    && (weather.error === undefined || typeof weather.error === 'string');
}

function isSavedReport(value: unknown): value is SavedReport {
  if (typeof value !== 'object' || value === null) return false;

  const report = value as Record<string, unknown>;
  return typeof report.id === 'string'
    && typeof report.city === 'string'
    && typeof report.cityId === 'string'
    && typeof report.savedAt === 'string'
    && Number.isFinite(Date.parse(report.savedAt))
    && isCityProfile(report.vectors)
    && (report.weather === undefined || isWeatherData(report.weather));
}

function isHazardReport(value: unknown): value is HazardReport {
  if (typeof value !== 'object' || value === null) return false;
  const report = value as Record<string, unknown>;
  return typeof report.id === 'string'
    && typeof report.cityId === 'string'
    && typeof report.type === 'string'
    && typeof report.location === 'string'
    && ['Low', 'Medium', 'High', 'Critical'].includes(String(report.severity))
    && report.status === 'Submitted'
    && typeof report.reportedAt === 'string'
    && Number.isFinite(Date.parse(report.reportedAt));
}

const savedReportsStorageKey = 'city-dna-saved-reports-v2';
const emptySavedReports: SavedReport[] = [];
interface SavedReportsSnapshot {
  reports: SavedReport[];
  error: string;
}
const emptySavedReportsSnapshot: SavedReportsSnapshot = { reports: emptySavedReports, error: '' };
const savedReportsListeners = new Set<() => void>();
let cachedSavedReportsRaw: string | null | undefined;
let cachedSavedReportsSnapshot = emptySavedReportsSnapshot;

function getSavedReportsSnapshot(): SavedReportsSnapshot {
  try {
    const rawReports = window.localStorage.getItem(savedReportsStorageKey);
    if (rawReports === cachedSavedReportsRaw) return cachedSavedReportsSnapshot;
    cachedSavedReportsRaw = rawReports;
    if (!rawReports) {
      cachedSavedReportsSnapshot = emptySavedReportsSnapshot;
      return cachedSavedReportsSnapshot;
    }
    const parsedReports: unknown = JSON.parse(rawReports);
    if (!Array.isArray(parsedReports)) throw new Error('Saved reports have an invalid format.');
    const reports = parsedReports.filter(isSavedReport);
    cachedSavedReportsSnapshot = {
      reports,
      error: reports.length === parsedReports.length ? '' : 'Some saved reports could not be read because their stored data is invalid.',
    };
  } catch (error) {
    console.error('Could not load saved city reports.', error);
    if (!cachedSavedReportsSnapshot.error) {
      cachedSavedReportsSnapshot = {
        reports: emptySavedReports,
        error: 'Saved reports could not be read from this browser.',
      };
    }
  }
  return cachedSavedReportsSnapshot;
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

function storeSavedReports(reports: SavedReport[]) {
  const serialized = JSON.stringify(reports);
  window.localStorage.setItem(savedReportsStorageKey, serialized);
  cachedSavedReportsRaw = serialized;
  cachedSavedReportsSnapshot = { reports, error: '' };
  notifySavedReportsChanged();
}

const hazardReportsStorageKey = 'city-dna-hazard-reports-v1';
const emptyHazardReports: HazardReport[] = [];
interface HazardReportsSnapshot {
  reports: HazardReport[];
  error: string;
}
const emptyHazardReportsSnapshot: HazardReportsSnapshot = { reports: emptyHazardReports, error: '' };
const hazardReportListeners = new Set<() => void>();
let cachedHazardReportsRaw: string | null | undefined;
let cachedHazardReportsSnapshot = emptyHazardReportsSnapshot;

function getHazardReportsSnapshot(): HazardReportsSnapshot {
  try {
    const rawReports = window.localStorage.getItem(hazardReportsStorageKey);
    if (rawReports === cachedHazardReportsRaw) return cachedHazardReportsSnapshot;
    cachedHazardReportsRaw = rawReports;
    if (!rawReports) {
      cachedHazardReportsSnapshot = emptyHazardReportsSnapshot;
      return cachedHazardReportsSnapshot;
    }
    const parsed: unknown = JSON.parse(rawReports);
    if (!Array.isArray(parsed)) throw new Error('Saved hazard reports have an invalid format.');
    const reports = parsed.filter(isHazardReport);
    cachedHazardReportsSnapshot = {
      reports,
      error: reports.length === parsed.length ? '' : 'Some hazard reports were ignored because their stored data is invalid.',
    };
  } catch (error) {
    console.error('Could not read hazard reports from browser storage.', error);
    if (!cachedHazardReportsSnapshot.error) {
      cachedHazardReportsSnapshot = {
        reports: emptyHazardReports,
        error: 'Hazard reports could not be read from this browser.',
      };
    }
  }
  return cachedHazardReportsSnapshot;
}

function subscribeToHazardReports(listener: () => void) {
  hazardReportListeners.add(listener);
  window.addEventListener('storage', listener);
  window.addEventListener('city-dna-hazards-change', listener);
  return () => {
    hazardReportListeners.delete(listener);
    window.removeEventListener('storage', listener);
    window.removeEventListener('city-dna-hazards-change', listener);
  };
}

function saveHazardReports(reports: HazardReport[]) {
  try {
    const serialized = JSON.stringify(reports);
    window.localStorage.setItem(hazardReportsStorageKey, serialized);
    cachedHazardReportsRaw = serialized;
    cachedHazardReportsSnapshot = { reports, error: '' };
    hazardReportListeners.forEach((listener) => listener());
    return true;
  } catch (error) {
    console.error('Could not save a hazard report in this browser.', error);
    return false;
  }
}

const savedVectorNames: { label: string; key: keyof CityProfile }[] = [
  { label: 'Air quality', key: 'airQuality' },
  { label: 'Water quality', key: 'waterQuality' },
  { label: 'Mapped vegetation features', key: 'greenCover' },
  { label: 'Greenhouse gases', key: 'greenhouseGas' },
  { label: 'Environmental noise', key: 'noise' },
];

function metricToSavedValue(metric: EnvironmentalMetric): CityMetric {
  return {
    value: metric.value,
    unit: metric.unit,
    detail: metric.error ?? metric.subValue,
    source: metric.source,
    status: metric.status,
    updated: metric.updated,
  };
}

function createCityProfile(data: CityEnvironmentalData): CityProfile {
  const find = (id: EnvironmentalMetric['id']) => {
    const metric = data.metrics.find((item) => item.id === id);
    if (!metric) throw new Error(`Missing normalized metric ${id}.`);
    return metricToSavedValue(metric);
  };
  return {
    airQuality: find('air'),
    waterQuality: find('water'),
    greenCover: find('green'),
    greenhouseGas: find('carbon'),
    noise: find('noise'),
  };
}

function LegacyDashboard({ section, embedded = false }: { section: DashboardSection; embedded?: boolean }) {
  const { city: globalCity, setCity: setGlobalCity, measurementSystem } = useCitySelection();
  const { data: cityData, isLoading: isProfileLoading } = useCityEnvironmentalData(globalCity);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [citySearchError, setCitySearchError] = useState<string>('');
  const selectedCity = globalCity.name;
  const countryCode = globalCity.countryCode;
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scanController = useRef<AbortController | null>(null);

  // These are scenario inputs only; no validated impact model is connected.
  const [treeCoverage, setTreeCoverage] = useState<number>(0);
  const [whiteRoof, setWhiteRoof] = useState<number>(0);
  const [industrialCap, setIndustrialCap] = useState<number>(0);

  const [newHazardType, setNewHazardType] = useState<string>('Illegal Dumping');
  const [newHazardLocation, setNewHazardLocation] = useState<string>('');
  const [newHazardSeverity, setNewHazardSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const hazardSnapshot = useSyncExternalStore(subscribeToHazardReports, getHazardReportsSnapshot, () => emptyHazardReportsSnapshot);
  const reports = hazardSnapshot.reports;
  const [hazardStorageError, setHazardStorageError] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const savedReportsSnapshot = useSyncExternalStore(
    subscribeToSavedReports,
    getSavedReportsSnapshot,
    () => emptySavedReportsSnapshot,
  );
  const savedReports = savedReportsSnapshot.reports;

  // These are hypothetical input values, not rainfall observations or drainage measurements.
  const [rainfall, setRainfall] = useState<number>(0);
  const [drainageCapacity, setDrainageCapacity] = useState<number>(0);

  const selectedCityProfile = isProfileLoading ? undefined : createCityProfile(cityData);
  const hasReportableData = cityData.weather.status !== 'UNAVAILABLE'
    || cityData.metrics.some((metric) => metric.status !== 'UNAVAILABLE');

  useEffect(() => () => scanController.current?.abort(), []);

  const handleCityScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setCitySearchError('Enter a city name to search.');
      return;
    }

    scanController.current?.abort();
    const controller = new AbortController();
    scanController.current = controller;
    setCitySearchError('');
    setIsScanning(true);
    try {
      const response = await fetch('/api/openweather/air-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: query }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        const message = typeof payload === 'object' && payload !== null
          && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : `City "${query}" was not recognized.`;
        setCitySearchError(response.status === 404 ? `City "${query}" was not recognized.` : message);
        return;
      }
      if (!isOpenWeatherCityResult(payload)) throw new Error('OpenWeather returned invalid city or air-quality data.');
      setGlobalCity(payload.city, payload.airQuality);
      setSearchQuery('');
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('City lookup failed in the report scan.', error);
      setCitySearchError(error instanceof Error ? error.message : 'City lookup failed. Please retry.');
    } finally {
      if (!controller.signal.aborted) setIsScanning(false);
    }
  };

  const handleAddHazard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHazardLocation.trim()) return;

    const newReport: HazardReport = {
      id: crypto.randomUUID(),
      cityId: globalCity.id,
      type: newHazardType,
      location: newHazardLocation,
      severity: newHazardSeverity,
      status: 'Submitted',
      reportedAt: new Date().toISOString(),
    };

    if (saveHazardReports([newReport, ...reports])) {
      setHazardStorageError('');
      setNewHazardLocation('');
    } else {
      setHazardStorageError('Hazard report could not be saved in this browser.');
    }
  };

  const cityReports = reports.filter((report) => report.cityId === globalCity.id);
  const filteredReports = activeFilter === 'All' 
    ? cityReports
    : cityReports.filter((report) => report.severity === activeFilter);

  const saveCityReport = () => {
    if (!selectedCityProfile || !hasReportableData) return;

    const savedReport: SavedReport = {
      id: crypto.randomUUID(),
      city: selectedCity,
      cityId: globalCity.id,
      savedAt: new Date().toISOString(),
      vectors: selectedCityProfile,
      weather: cityData.weather,
    };
    try {
      storeSavedReports([savedReport, ...savedReports]);
      setReportMessage(`Source snapshot saved for ${selectedCity}.`);
    } catch (error) {
      console.error('Could not save the city report.', error);
      setReportMessage('The report could not be saved in this browser.');
    }
  };

  const removeSavedReport = (reportId: string) => {
    try {
      const remaining = savedReports.filter((report) => report.id !== reportId);
      storeSavedReports(remaining);
      setReportMessage('Saved report removed.');
    } catch (error) {
      console.error('Could not remove the saved city report.', error);
      setReportMessage('The saved report could not be removed from this browser.');
    }
  };

  const exportCityReport = () => {
    try {
      const report = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        city: globalCity,
        weather: cityData.weather,
        metrics: cityData.metrics,
        note: 'Modelled current conditions are not station observations. UNAVAILABLE metrics have no connected source.',
      };

      const file = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dna-city-${globalCity.id}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setReportMessage(`JSON data export created for ${selectedCity}.`);
    } catch (error) {
      console.error('Could not export the city data report.', error);
      setReportMessage('The report export failed in this browser.');
    }
  };

  return (
    <div className={`${embedded ? 'bg-transparent text-slate-100' : 'min-h-screen bg-[#060911] text-slate-100 flex'} font-sans`}>

      {/* MAIN CONTENT AREA */}
      <main className={embedded ? 'space-y-5' : 'flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto'}>
        
        {/* TOP STATUS HEADER */}
        {!embedded && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#22FFAA]">Active Region:</span>
            <span className="text-white font-bold">{selectedCity ? `${selectedCity}${countryCode ? `, ${countryCode}` : ''}` : 'None Selected'}</span>
          </div>
          <div className="text-slate-400">
            {isProfileLoading ? 'Loading city-specific provider data' : 'Provider data status shown per indicator'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">No composite score or complete city inventory is available</span>
            {section === 'report' && selectedCity && (
              <button
                onClick={saveCityReport}
                className="flex items-center gap-1.5 rounded-xl border border-[#22FFAA]/30 bg-[#22FFAA]/10 px-3 py-1.5 text-[#22FFAA] transition hover:bg-[#22FFAA]/20"
              >
                <BookmarkCheck className="h-3.5 w-3.5" /> Save Report
              </button>
            )}
            <button 
              onClick={exportCityReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 text-[#22FFAA] hover:bg-[#22FFAA]/20 transition"
            >
              Export Audit
            </button>
          </div>
        </div>}

        {/* HERO SEARCH SECTION */}
        {(section === 'dashboard' || section === 'report' || section === 'compare') && (
        <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#22FFAA] uppercase tracking-wider block">Intelligent Insights. Healthier Cities.</span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">City environmental report</h1>
            <p className="text-xs text-slate-400">Review source-backed city indicators, explore location context, submit local hazard reports, and configure scenario inputs.</p>
          </div>

          <form onSubmit={handleCityScan} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                maxLength={120}
                placeholder="Search any city, e.g., Tokyo, London, Singapore..." 
                value={searchQuery}
                onChange={(e) => {
                  scanController.current?.abort();
                  scanController.current = null;
                  setIsScanning(false);
                  setSearchQuery(e.target.value);
                  setCitySearchError('');
                }}
                aria-invalid={Boolean(citySearchError)}
                aria-describedby={citySearchError ? 'city-search-error' : undefined}
                className="w-full bg-[#131B2E] border border-slate-800 text-xs text-white pl-10 pr-4 py-3 rounded-xl outline-none placeholder:text-slate-500 focus:border-[#22FFAA] transition"
              />
            </div>
            <button 
              type="submit"
              disabled={isScanning}
              className="px-6 py-3 rounded-xl bg-[#22FFAA] text-slate-950 font-bold text-xs hover:bg-[#1edb95] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScanning ? 'Searching…' : 'Find City'}
            </button>
          </form>
          {citySearchError && (
            <p id="city-search-error" role="alert" className="text-sm text-rose-400">
              {citySearchError}
            </p>
          )}
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
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                Provider-backed values and unavailable sources are identified per indicator
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
                  <span className="block text-[10px] leading-relaxed text-[#22FFAA]">{selectedCityProfile?.airQuality.source ?? 'Loading provider…'}</span>
                  <div className="mt-3 text-base font-bold leading-snug text-white">{selectedCityProfile ? `${selectedCityProfile.airQuality.value} ${selectedCityProfile.airQuality.unit}` : 'Loading…'}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{selectedCityProfile?.airQuality.detail}</p>
                </div>
                <div className="mt-4 border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                  {selectedCityProfile?.airQuality.status ?? 'LOADING'} · {selectedCityProfile?.airQuality.updated ?? 'Provider time unavailable'}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Water Quality</span>
                  <span className="block text-[10px] leading-relaxed text-cyan-300">{selectedCityProfile?.waterQuality.source ?? 'Loading provider…'}</span>
                  <div className="mt-3 text-base font-bold leading-snug text-white">{selectedCityProfile ? `${selectedCityProfile.waterQuality.value} ${selectedCityProfile.waterQuality.unit}` : 'Loading…'}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{selectedCityProfile?.waterQuality.detail}</p>
                </div>
                <div className="mt-4 border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                  {selectedCityProfile?.waterQuality.status ?? 'LOADING'} · {selectedCityProfile?.waterQuality.updated ?? 'Provider time unavailable'}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Trees className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Mapped Vegetation Features</span>
                  <span className="block text-[10px] leading-relaxed text-emerald-300">{selectedCityProfile?.greenCover.source ?? 'Loading provider…'}</span>
                  <div className="mt-3 text-base font-bold leading-snug text-white">{selectedCityProfile ? `${selectedCityProfile.greenCover.value} ${selectedCityProfile.greenCover.unit}` : 'Loading…'}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{selectedCityProfile?.greenCover.detail}</p>
                </div>
                <div className="mt-4 border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                  {selectedCityProfile?.greenCover.status ?? 'LOADING'} · {selectedCityProfile?.greenCover.updated ?? 'Provider time unavailable'}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Greenhouse Gas Emissions</span>
                  <span className="block text-[10px] leading-relaxed text-amber-300">{selectedCityProfile?.greenhouseGas.source ?? 'Loading provider…'}</span>
                  <div className="mt-3 text-base font-bold leading-snug text-white">{selectedCityProfile ? `${selectedCityProfile.greenhouseGas.value} ${selectedCityProfile.greenhouseGas.unit}` : 'Loading…'}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{selectedCityProfile?.greenhouseGas.detail}</p>
                </div>
                <div className="mt-4 border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                  {selectedCityProfile?.greenhouseGas.status ?? 'LOADING'} · {selectedCityProfile?.greenhouseGas.updated ?? 'Provider time unavailable'}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-mono">VECTOR</span>
                  </div>
                  <span className="text-xs text-slate-400 block mb-1">Environmental Noise</span>
                  <span className="block text-[10px] leading-relaxed text-rose-300">{selectedCityProfile?.noise.source ?? 'Loading provider…'}</span>
                  <div className="mt-3 text-base font-bold leading-snug text-white">{selectedCityProfile ? `${selectedCityProfile.noise.value} ${selectedCityProfile.noise.unit}` : 'Loading…'}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{selectedCityProfile?.noise.detail}</p>
                </div>
                <div className="mt-4 border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                  {selectedCityProfile?.noise.status ?? 'LOADING'} · {selectedCityProfile?.noise.updated ?? 'Provider time unavailable'}
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

        {section === 'report' && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={saveCityReport} disabled={isProfileLoading || !hasReportableData} className="rounded-xl border border-[#22FFAA]/30 bg-[#22FFAA]/10 px-3 py-2 text-xs text-[#22FFAA] disabled:cursor-not-allowed disabled:opacity-50">
              Save source snapshot
            </button>
            <button type="button" onClick={exportCityReport} disabled={isProfileLoading} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:cursor-not-allowed disabled:opacity-50">
              Export data JSON
            </button>
            {reportMessage && <p role="status" className="text-[10px] text-slate-400">{reportMessage}</p>}
          </div>
        )}

        {/* SECTION 2: THE 3 COMPETITION SOLUTION FEATURES (GRID) */}
        {(section === 'dashboard' || section === 'simulation' || section === 'alerts') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FEATURE 1: Urban Heat Island (UHI) Simulator */}
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Urban heat scenario inputs</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">INPUTS ONLY</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">Set hypothetical intervention assumptions. No validated urban-heat calculation is connected.</p>

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
                <span className="text-[11px] text-[#22FFAA] font-semibold block">Projected cooling impact</span>
                <span className="text-[10px] text-slate-400">No validated urban-heat model is connected</span>
              </div>
              <span className="text-sm font-semibold text-slate-400">Unavailable</span>
            </div>
          </div>

          {/* Local hazard submissions are not geocoded or shared with a municipal service. */}
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Local Hazard Register</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">BROWSER-LOCAL</span>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">Record a location description for this city. Reports are stored only in this browser and are not sent to authorities or placed on the map.</p>

              <div className="mb-3 rounded-xl border border-slate-800 bg-[#131B2E] px-3 py-4 text-xs text-slate-400">
                {cityReports.length} local submissions for {selectedCity}. No verified location coordinates are available.
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
                    Save Report
                  </button>
                </div>
              </form>
              {(hazardStorageError || hazardSnapshot.error) && <p role="alert" className="mb-3 text-[10px] text-rose-300">{hazardStorageError || hazardSnapshot.error}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-300">Submitted reports</span>
                <div className="flex gap-1 text-[10px] font-mono">
                  {['All', 'Low', 'Medium', 'High', 'Critical'].map((filter) => (
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
                        <span className="text-[10px] text-slate-400 block">{r.location} · Submitted {new Date(r.reportedAt).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded border border-slate-700 px-2 py-0.5 font-mono text-[10px] text-slate-400">LOCAL SUBMISSION</span>
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
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">NO MODEL CONNECTED</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">Set hypothetical scenario inputs only; current precipitation and city drainage measurements are not connected.</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Hypothetical rainfall rate</span>
                    <span className="font-mono text-cyan-400">{rainfall} mm/hr</span>
                  </div>
                  <input
                    type="range" min="0" max="60" value={rainfall}
                    onChange={(e) => setRainfall(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Assumed drainage capacity</span>
                    <span className="font-mono text-cyan-400">{drainageCapacity}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={drainageCapacity}
                    onChange={(e) => setDrainageCapacity(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-slate-400">
              <p className="text-xs font-semibold">Risk calculation unavailable</p>
              <p className="mt-1.5 text-[11px] leading-relaxed">Slider values are hypothetical inputs, not current rainfall or measured drainage capacity. No validated flood model or city hydrology data is connected, so no risk score or response recommendation is produced.</p>
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
                  <h3 className="text-white font-bold text-sm">City location map</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">OpenStreetMap · city-centre marker</span>
                </div>
              </div>
              <CityMap city={globalCity} data={cityData} />
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
              <span className="font-mono">{globalCity.coordinates.latitude.toFixed(4)}, {globalCity.coordinates.longitude.toFixed(4)}</span>
              <span>Environmental overlays unavailable without geographic datasets.</span>
            </div>
          </div>
          )}

          {section === 'recommendations' && (
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <ShieldAlert className="w-4 h-4 text-[#22FFAA]" />
                <h3 className="text-white font-bold text-sm">City recommendations</h3>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#131B2E] p-4 text-xs text-slate-400">
                No validated recommendation engine or city planning dataset is connected for {selectedCity}. The application will not invent interventions or impact estimates.
              </div>
            </div>
            <button type="button" onClick={exportCityReport} className="mt-5 w-full rounded-xl border border-slate-800 bg-slate-900 py-3 text-xs font-semibold text-white transition hover:bg-slate-800 shadow-md">Export source data JSON</button>
          </div>
          )}

        </div>
        )}

        {section === 'compare' && <CityComparison city={globalCity} data={cityData} />}

        {section === 'timeline' && <HistoricalTemperatureChart city={globalCity} initialPeriod="5Y" />}

        {section === 'saved' && (
          <section className="space-y-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#22FFAA]">Your library</span>
              <h1 className="mt-1 text-2xl font-extrabold text-white">Saved City Reports</h1>
              <p className="mt-2 text-sm text-slate-400">Reports you save from City Report are stored in this browser.</p>
            </div>
            {savedReportsSnapshot.error && <p role="alert" className="rounded border border-rose-900/70 bg-rose-950/20 px-3 py-2 text-[10px] text-rose-300">{savedReportsSnapshot.error}</p>}
            {savedReports.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {savedReports.map((report) => (
                  <article key={report.id} className="rounded-2xl border border-slate-800 bg-[#0B0F1A]/90 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-white">{report.city}</h2>
                        <p className="mt-1 text-xs text-slate-500">Saved {new Date(report.savedAt).toLocaleString()}</p>
                      </div>
                      <FileText className="h-4 w-4 text-[#22FFAA]" />
                    </div>
                    <dl className="mt-5 space-y-3 text-xs">
                      {report.weather && <div>
                        <dt className="text-slate-500">Weather</dt>
                        <dd className="mt-1 font-semibold text-white">
                          {report.weather.temperature === null
                            ? 'Unavailable'
                            : measurementSystem === 'Metric'
                              ? `${report.weather.temperature.toFixed(1)} °C`
                              : `${(report.weather.temperature * 9 / 5 + 32).toFixed(1)} °F`}
                          {report.weather.apparentTemperature == null
                            ? ''
                            : measurementSystem === 'Metric'
                              ? ` · ${report.weather.apparentTemperature.toFixed(1)} °C apparent`
                              : ` · ${(report.weather.apparentTemperature * 9 / 5 + 32).toFixed(1)} °F apparent`}
                          {report.weather.humidity === null ? '' : ` · ${report.weather.humidity}% humidity`}
                          {report.weather.windSpeed === null
                            ? ''
                            : measurementSystem === 'Metric'
                              ? ` · ${report.weather.windSpeed.toFixed(1)} km/h wind`
                              : ` · ${(report.weather.windSpeed / 1.609344).toFixed(1)} mph wind`}
                        </dd>
                        <dd className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                          {report.weather.source} · {report.weather.status} · {report.weather.updated ?? 'No provider time'}
                        </dd>
                      </div>}
                      {savedVectorNames.map(({ label, key }) => {
                        const metric = report.vectors[key];
                        return (
                        <div key={key}>
                          <dt className="text-slate-500">{label}</dt>
                          <dd className="mt-1 font-semibold text-white">{metric.value}</dd>
                          <dd className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                            {metric.source} · {metric.status} · {metric.updated ?? 'No provider time'} · {metric.detail}
                          </dd>
                        </div>
                        );
                      })}
                    </dl>
                    <button type="button" onClick={() => removeSavedReport(report.id)} className="mt-4 rounded border border-slate-700 px-3 py-1.5 text-[10px] text-slate-400 hover:border-rose-800 hover:text-rose-300">Delete snapshot</button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-[#0B0F1A]/90 p-10 text-center">
                <BookmarkCheck className="mx-auto h-9 w-9 text-slate-600" />
                <h2 className="mt-4 font-bold text-white">No saved reports yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Save a city snapshot from City Report when at least one connected provider has returned data.</p>
                <Link href="/city-report" className="mt-5 inline-flex rounded-xl bg-[#22FFAA] px-4 py-2.5 text-xs font-bold text-slate-950">Go to City Report</Link>
              </div>
            )}
          </section>
        )}

        {section === 'about' && (
          <section className="space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#22FFAA]">About this platform</span>
              <h1 className="mt-1 text-2xl font-extrabold text-white">Enrealys, at a glance</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">Enrealys brings provider-backed environmental context, city-centre mapping, and clearly scoped analytical tools into one workspace. Unsupported city indicators remain unavailable rather than being filled with sample values.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { title: 'Environmental report', text: 'Review modelled air-quality output and the explicit availability of other environmental vectors.' },
                { title: 'City comparison', text: 'Compare city-specific provider responses without synthetic health rankings.' },
                { title: 'Urban planning tools', text: 'Configure scenario inputs; validated impact calculations are not connected.' },
                { title: 'Recommendations', text: 'Recommendations remain unavailable until a validated city-planning engine and data are configured.' },
                { title: 'Historical outlook', text: 'Explore city-specific ERA5 daily temperature reanalysis for selected historical periods.' },
                { title: 'Saved reports', text: 'Keep city snapshots in this browser so they are available on your next visit.' },
              ].map(({ title, text }) => (
                <article key={title} className="rounded-2xl border border-slate-800 bg-[#0B0F1A]/90 p-5">
                  <h2 className="font-bold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
                </article>
              ))}
            </div>
            <p className="text-xs text-slate-500">Current external providers are Open-Meteo weather, air quality, geocoding, and historical reanalysis endpoints, plus OpenStreetMap community-mapped vegetation features.</p>
          </section>
        )}

      </main>
    </div>
  );
}

export default function UrbanDashboard({ section, legacyMode = false }: UrbanDashboardProps) {
  if (section === 'dashboard' && !legacyMode) return <ProfessionalDashboard />;

  return (
    <WorkspaceSection section={section}>
      <LegacyDashboard section={section} embedded />
    </WorkspaceSection>
  );
}

function WorkspaceSection({ section, children }: { section: DashboardSection; children: React.ReactNode }) {
  const { city, setCity } = useCitySelection();
  return (
    <DashboardShell city={city} onSelectCity={setCity}>
      <div className="professional-legacy-content" data-section={section}>{children}</div>
    </DashboardShell>
  );
}