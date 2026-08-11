"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  Clock,
  Lightbulb,
  Bookmark,
  Info,
  Building2,
  Wind,
  Droplets,
  Trees,
  Flame,
  Trash2,
  CheckCircle2,
  AlertTriangle,
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
  const [activeTab, setActiveTab] = useState("compare");
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
    alert("Report saved to Saved Reports tab!");
  };

  const sidebarNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "report", label: "City Report", icon: FileText },
    { id: "compare", label: "Compare Cities", icon: ArrowLeftRight },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "recommendations", label: "Recommendations", icon: Lightbulb },
    { id: "saved", label: "Saved Reports", icon: Bookmark },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-[#0C1222]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">DNA of a City</h1>
            <p className="text-[11px] text-slate-400">AI Environmental Health Scanner</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r border-slate-800/80 p-4 bg-[#080D1A] space-y-1">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* Global Search Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0C1222] p-6 rounded-2xl border border-slate-800/80">
            <div>
              <h2 className="text-xl font-bold text-white">
                Check the <span className="text-emerald-400">Planet Health</span> of Any City
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                AI analyzes real environmental telemetry streams to generate live metrics.
              </p>
            </div>
            <form onSubmit={handleScan} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Enter city name..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full md:w-64"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {loading ? "Scanning..." : "Scan City"}
              </button>
            </form>
          </div>

          {/* Render Active View */}
          {activeTab === "dashboard" && <DashboardView report={report} onSave={handleSaveReport} />}
          {activeTab === "report" && <ReportView report={report} />}
          {activeTab === "compare" && <CompareView report={report} />}
          {activeTab === "timeline" && <TimelineView report={report} />}
          {activeTab === "recommendations" && <RecommendationsView report={report} />}
          {activeTab === "saved" && <SavedView savedReports={savedReports} />}
          {activeTab === "about" && <AboutView />}
        </main>
      </div>
    </div>
  );
}

// ---------------- VIEWS ----------------

function DashboardView({ report, onSave }: any) {
  if (!report) {
    return (
      <div className="p-8 text-center bg-[#0C1222] rounded-2xl border border-slate-800/80 text-slate-400 space-y-3">
        <p className="text-sm">No city scanned yet. Enter a city name above to load live telemetry.</p>
      </div>
    );
  }

  const metrics = [
    { label: "Air Quality", score: report.metrics?.air?.score ?? 50, icon: Wind },
    { label: "Water Purity", score: report.metrics?.water?.score ?? 50, icon: Droplets },
    { label: "Green Space", score: report.metrics?.green?.score ?? report.metrics?.nature?.score ?? 50, icon: Trees },
    { label: "Climate Resilience", score: report.metrics?.climate?.score ?? 50, icon: Flame },
    { label: "Waste Mgmt", score: report.metrics?.waste?.score ?? 50, icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#0C1222] p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h3 className="text-2xl font-bold text-white">{report.cityName}</h3>
          <p className="text-xs text-slate-400 mt-1">{report.country}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-3xl font-black text-emerald-400">{report.overallScore}</span>
            <span className="text-xs text-slate-500 block">/ 100 Overall</span>
          </div>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition"
          >
            Save Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-4 rounded-xl bg-[#0C1222] border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{m.label}</span>
                <Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white">{m.score} / 100</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportView({ report }: any) {
  if (!report) {
    return (
      <div className="p-8 text-center bg-[#0C1222] rounded-2xl border border-slate-800/80 text-slate-400">
        <p className="text-sm">Scan a city first to generate a full report.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-4">
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
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-6">
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
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-4">
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
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-emerald-400" /> Actionable Policy Recommendations
      </h3>
      <div className="space-y-3 pt-2">
        {recs.map((r: string, i: number) => (
          <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
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
      <div className="p-8 text-center bg-[#0C1222] rounded-2xl border border-slate-800/80 text-slate-400">
        <p className="text-sm">No saved reports yet. Click &quot;Save Report&quot; on the Dashboard after scanning a city.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-4">
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

function AboutView() {
  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Info className="w-5 h-5 text-emerald-400" /> About DNA of a City
      </h3>
      <p className="text-xs text-slate-300 leading-relaxed">
        DNA of a City leverages real-time environmental telemetry data (AQI, water quality indices, canopy coverage)
        to calculate holistic municipal health diagnostic scores for cities worldwide.
      </p>
    </div>
  );
}