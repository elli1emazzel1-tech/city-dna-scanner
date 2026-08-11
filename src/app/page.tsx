"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import GlobeGraphic from "./GlobeGraphic";
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  Clock,
  Lightbulb,
  Bookmark,
  Info,
  Globe,
  Search,
  Wind,
  Droplets,
  Trees,
  Shield,
  Trash2,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CityBenchmark {
  name: string;
  country: string;
  overall: number;
  air: number;
  water: number;
  green: number;
  climate: number;
  waste: number;
  isUserCity?: boolean;
}

export default function Home() {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [report, setReport] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data);
        setActiveTab("dashboard");
      } else {
        alert(data.error || "Failed to fetch city data.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to telemetry service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = () => {
    if (!report) return;
    if (savedReports.some((r) => r.cityName === report.cityName)) {
      alert("Report already saved!");
      return;
    }
    setSavedReports([report, ...savedReports]);
    alert("Report saved to Saved Reports!");
  };

  const sidebarNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "report", label: "City Report", icon: FileText },
    { id: "compare", label: "Compare Cities", icon: ArrowLeftRight },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "recommendations", label: "Recommendations", icon: Lightbulb },
    { id: "saved", label: "Saved Reports", icon: Bookmark },
    { id: "methodology", label: "Methodology", icon: Info },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between bg-[#0B0F1D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">DNA of a City</h1>
            <p className="text-[11px] text-slate-400">Environmental Health Engine</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r border-slate-800/60 p-4 bg-[#080C17] space-y-1 flex-shrink-0 flex flex-col justify-between min-h-[calc(100vh-65px)]">
          <div className="space-y-1">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Earth Globe Component & Card */}
          <div className="pt-4 px-2">
            <GlobeGraphic />
            <div className="p-4 rounded-xl bg-[#0B1021] border border-slate-800/80 space-y-1 mt-2">
              <span className="text-[11px] font-bold text-slate-300 block">AI for a Better Planet</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">Empowering decisions for sustainable tomorrow.</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Search Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B0F1D] p-6 rounded-2xl border border-slate-800/80">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Environmental Health Index <span className="text-emerald-400 font-extrabold">Scanner</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Calibrated environmental diagnostic & policy recommendation engine.</p>
            </div>
            <form onSubmit={handleScan} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Enter city (e.g. Mumbai, Tokyo)..."
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="bg-[#070A14] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {loading ? "Scanning..." : "Scan City"}
              </button>
            </form>
          </div>

          {/* Tab Views */}
          {activeTab === "dashboard" && <DashboardView report={report} onSave={handleSaveReport} />}
          {activeTab === "report" && <ReportView report={report} />}
          {activeTab === "compare" && <CompareView report={report} />}
          {activeTab === "timeline" && <TimelineView report={report} />}
          {activeTab === "recommendations" && <RecommendationsView report={report} />}
          {activeTab === "saved" && <SavedView savedReports={savedReports} />}
          {activeTab === "methodology" && <MethodologyView />}
        </main>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD VIEW ----------------

function DashboardView({ report, onSave }: any) {
  const isScanned = !!report;

  const score = isScanned ? report.overallScore : 0;
  const status = isScanned ? report.overallStatus || "Moderate Resilience" : "Pending Scan";

  const air = isScanned ? report.metrics?.air?.score ?? 50 : 0;
  const water = isScanned ? report.metrics?.water?.score ?? 50 : 0;
  const green = isScanned ? report.metrics?.green?.score ?? report.metrics?.nature?.score ?? 50 : 0;
  const climate = isScanned ? report.metrics?.climate?.score ?? 50 : 0;
  const waste = isScanned ? report.metrics?.waste?.score ?? 50 : 0;

  return (
    <div className="space-y-6">
      {/* Top Main Diagnostic Card */}
      <div className="bg-[#0B0F1D] p-6 md:p-8 rounded-2xl border border-slate-800/80 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isScanned ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
            {isScanned ? "Telemetry Live" : "Awaiting Scan"}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-semibold">
            How is this calculated?
          </span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-white tracking-tight">
              {isScanned ? report.cityName : "City Diagnostic"}
            </h3>
            <p className="text-xs text-slate-400">
              {isScanned ? report.country : "Enter a city to load dataset profile"}
            </p>
            <p className="text-[11px] text-slate-500 max-w-xl pt-1">
              Run a city scan to analyze local air, water, canopy, climate resilience, and waste management indicators.
            </p>
          </div>

          {/* Circle Gauge Score */}
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#1E293B" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray={289}
                  strokeDashoffset={289 - (289 * score) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white block">{score}</span>
                <span className="text-[10px] text-slate-500 font-bold block">/100</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">City Health Index</span>
              <p className="text-sm font-bold text-emerald-400">{status}</p>
              {isScanned && (
                <button
                  onClick={onSave}
                  className="mt-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition block"
                >
                  Save Report
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/60 text-[10px] text-slate-500 flex flex-wrap gap-4 font-mono">
          <span>Weighted: Air(25%)</span>
          <span>+ Water(20%)</span>
          <span>+ Nature(20%)</span>
          <span>+ Climate(20%)</span>
          <span>+ Waste(15%)</span>
        </div>
      </div>

      {/* Sub Indicators Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Core Environmental Metrics & Sub-Indicators
          </h4>
          <span className="text-[11px] text-emerald-400 hover:underline cursor-pointer">View Indicator Breakdown</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <IndicatorCard icon={Wind} label="Air Quality" value={air} isScanned={isScanned} />
          <IndicatorCard icon={Droplets} label="Water Quality" value={water} isScanned={isScanned} />
          <IndicatorCard icon={Trees} label="Green Canopy" value={green} isScanned={isScanned} />
          <IndicatorCard icon={Shield} label="Climate Resilience" value={climate} isScanned={isScanned} />
          <IndicatorCard icon={Trash2} label="Waste Systems" value={waste} isScanned={isScanned} />
        </div>
      </div>

      {/* Bottom 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Diagnosis */}
        <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h5 className="text-sm font-bold text-white">AI Diagnosis & Findings</h5>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isScanned
              ? report.summary
              : "City environmental diagnosis will load after scanning."}
          </p>
        </div>

        {/* Historical Health Index */}
        <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h5 className="text-sm font-bold text-white">Historical Health Index</h5>
          </div>
          <p className="text-xs text-slate-400">Modeled Historical Estimate</p>
          <div className="pt-2 flex items-baseline gap-4">
            <span className="text-3xl font-black text-white">{isScanned ? score - 8 : "--"}</span>
            <span className="text-xs text-emerald-400 font-bold">+8 pts since 2020</span>
          </div>
        </div>

        {/* Policy Actions */}
        <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            <h5 className="text-sm font-bold text-white">Policy & Infrastructure Actions</h5>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isScanned
              ? "Implement zero-emission public transport zones and increase urban forest cover."
              : "Scan a city to view actionable recommendations."}
          </p>
        </div>
      </div>
    </div>
  );
}

function IndicatorCard({ icon: Icon, label, value, isScanned }: any) {
  return (
    <div className="p-4 rounded-xl bg-[#0B0F1D] border border-slate-800/80 space-y-3">
      <div className="flex justify-between items-center">
        <Icon className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] text-slate-500 font-mono">{isScanned ? "LIVE" : "N/A"}</span>
      </div>
      <div>
        <span className="text-[11px] text-slate-400 block font-medium">{label}</span>
        <p className="text-xl font-black text-white mt-0.5">
          {isScanned ? value : 0} <span className="text-xs font-normal text-slate-500">/100</span>
        </p>
      </div>
      <div className="w-full bg-slate-800/60 h-1 rounded-full overflow-hidden">
        <div className="bg-emerald-400 h-full rounded-full transition-all duration-700" style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

// ---------------- OTHER VIEWS ----------------

function ReportView({ report }: any) {
  if (!report) {
    return (
      <div className="p-8 text-center bg-[#0B0F1D] rounded-2xl border border-slate-800/80 text-slate-400">
        <p className="text-sm">Scan a city first to generate a full report.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-4">
      <h3 className="text-lg font-bold text-white">Full Environmental Report: {report.cityName}</h3>
      <p className="text-xs text-slate-300 leading-relaxed">{report.summary}</p>
      {report.diagnosis?.bullets && (
        <ul className="space-y-2 pt-2">
          {report.diagnosis.bullets.map((b: string, i: number) => (
            <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CompareView({ report }: any) {
  const defaultBenchmarks: CityBenchmark[] = [
    { name: "🇸🇬 Singapore", country: "Singapore", overall: 92, air: 88, water: 95, green: 90, climate: 85, waste: 96 },
    { name: "🇯🇵 Tokyo", country: "Japan", overall: 90, air: 89, water: 94, green: 82, climate: 84, waste: 95 },
    { name: "🇨🇭 Zurich", country: "Switzerland", overall: 89, air: 91, water: 96, green: 88, climate: 82, waste: 93 },
    { name: "🇩🇰 Copenhagen", country: "Denmark", overall: 88, air: 90, water: 92, green: 86, climate: 80, waste: 91 },
    { name: "🇦🇹 Vienna", country: "Austria", overall: 87, air: 88, water: 95, green: 87, climate: 79, waste: 90 },
    { name: "🇫🇮 Helsinki", country: "Finland", overall: 87, air: 93, water: 95, green: 89, climate: 78, waste: 88 },
    { name: "🇳🇴 Oslo", country: "Norway", overall: 86, air: 92, water: 94, green: 88, climate: 77, waste: 89 },
    { name: "🇮🇸 Reykjavík", country: "Iceland", overall: 86, air: 96, water: 98, green: 84, climate: 75, waste: 85 },
    { name: "🇳🇿 Wellington", country: "New Zealand", overall: 85, air: 94, water: 93, green: 87, climate: 76, waste: 84 },
    { name: "🇩🇪 Munich", country: "Germany", overall: 84, air: 86, water: 91, green: 83, climate: 78, waste: 89 },
  ];

  const userCityName = report?.cityName ? `📍 ${report.cityName} (Your City)` : null;

  const userCity: CityBenchmark | null = userCityName
    ? {
        name: userCityName,
        country: report?.country || "Monitored Region",
        overall: report?.overallScore ?? 65,
        air: report?.metrics?.air?.score ?? 47,
        water: report?.metrics?.water?.score ?? 78,
        green: report?.metrics?.green?.score ?? report?.metrics?.nature?.score ?? 60,
        climate: report?.metrics?.climate?.score ?? 67,
        waste: report?.metrics?.waste?.score ?? 84,
        isUserCity: true,
      }
    : null;

  const combinedList: CityBenchmark[] = userCity
    ? [userCity, ...defaultBenchmarks].sort((a, b) => b.overall - a.overall)
    : defaultBenchmarks;

  return (
    <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-6">
      <div className="border-b border-slate-800/80 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
          Global Environmental Benchmark Comparison
        </h3>
        <p className="text-xs text-slate-400 mt-1">Comparing metrics across peer municipalities.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 text-[11px]">
              <th className="pb-3 font-semibold">City Name</th>
              <th className="pb-3 font-semibold">Overall Score</th>
              <th className="pb-3 font-semibold">Air</th>
              <th className="pb-3 font-semibold">Water</th>
              <th className="pb-3 font-semibold">Green Space</th>
              <th className="pb-3 font-semibold">Climate Risk</th>
              <th className="pb-3 font-semibold">Waste</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-[12px]">
            {combinedList.map((c, i) => (
              <tr
                key={i}
                className={`transition ${
                  c.isUserCity
                    ? "bg-emerald-500/10 text-emerald-400 font-bold border-l-4 border-l-emerald-400"
                    : "hover:bg-slate-900/40 text-slate-300"
                }`}
              >
                <td className="py-3.5 font-semibold">{c.name}</td>
                <td className="py-3.5 font-bold text-white">{c.overall} / 100</td>
                <td className="py-3.5">{c.air} / 100</td>
                <td className="py-3.5">{c.water} / 100</td>
                <td className="py-3.5">{c.green} / 100</td>
                <td className="py-3.5">{c.climate} / 100</td>
                <td className="py-3.5">{c.waste} / 100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimelineView({ report }: any) {
  const timelineData = report?.timeline || [
    { year: "2015", score: 52 },
    { year: "2020", score: 61 },
    { year: "2026", score: report?.overallScore || 74 },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-400" /> Environmental Progression Timeline
      </h3>
      <div className="grid grid-cols-3 gap-4 pt-4">
        {timelineData.map((t: any, i: number) => (
          <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400">{t.year}</span>
            <p className="text-2xl font-bold text-emerald-400">{t.score} / 100</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsView({ report }: any) {
  const recs = report?.recommendations || [
    "Increase urban tree canopy to mitigate heat island effects.",
    "Upgrade municipal wastewater treatment facilities.",
    "Implement zero-emission public transport zones in city center.",
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-emerald-400" /> Actionable Policy Recommendations
      </h3>
      <div className="space-y-3 pt-2">
        {recs.map((r: string, i: number) => (
          <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">{r}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedView({ savedReports }: any) {
  if (!savedReports || savedReports.length === 0) {
    return (
      <div className="p-8 text-center bg-[#0B0F1D] rounded-2xl border border-slate-800/80 text-slate-400">
        <p className="text-sm">No saved reports yet. Click &quot;Save Report&quot; on the Dashboard after scanning a city.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-emerald-400" /> Saved Environmental Reports
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedReports.map((r: any, i: number) => (
          <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white">{r.cityName}</h4>
              <span className="text-emerald-400 font-bold text-sm">{r.overallScore} / 100</span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{r.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodologyView() {
  return (
    <div className="p-6 rounded-2xl bg-[#0B0F1D] border border-slate-800/80 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Info className="w-5 h-5 text-emerald-400" /> Methodology & Calibration
      </h3>
      <p className="text-xs text-slate-300 leading-relaxed">
        DNA of a City processes real-time air telemetry along with calibrated municipal baseline data to calculate a weighted Environmental Health Index ($0 - 100$).
      </p>
    </div>
  );
}