"use client";

import CityMap from "@/components/CityMap";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import GlobeGraphic from "@/components/GlobeGraphic";
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
  Thermometer,
  Recycle,
  Sparkles,
  TrendingUp,
  Award,
  ShieldCheck,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [report, setReport] = useState<any>(null);

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
    <div className="min-h-screen bg-[#060914] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between bg-[#0B0F1A]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              DNA of a City
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">AI Environmental Health Scanner</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 border-r border-slate-800/60 p-4 bg-[#0B0F1A] flex-shrink-0 flex flex-col justify-between min-h-[calc(100vh-65px)]">
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
                      ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Globe & Branding Footer */}
          <div className="pt-4 px-2 space-y-3">
            <GlobeGraphic />
            <div className="p-4 rounded-2xl bg-[#070A14] border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-200 block">Every city has a DNA.</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">Let&apos;s decode it for a better tomorrow.</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0B0F1A] border border-slate-800/80 p-8 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none mix-blend-luminosity"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F1A] via-[#0B0F1A]/90 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 max-w-xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                AI Environmental Intelligence
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Intelligent Insights. <span className="text-emerald-400">Healthier Cities.</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                AI-powered environmental intelligence platform designed to build sustainable urban futures through live telemetry and deep predictive analytics.
              </p>
            </div>

            <form onSubmit={handleScan} className="relative z-10 flex items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search any city, e.g., London, Tokyo..."
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="bg-[#060914] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                {loading ? "Scanning..." : "Scan City"}
              </button>
            </form>
          </div>

          {/* Dynamic Tab Content */}
          {activeTab === "dashboard" && <ExactDashboardView report={report} />}
          {activeTab === "report" && <CityReportView report={report} />}
          {activeTab === "compare" && <CompareCitiesView report={report} />}
          {activeTab === "timeline" && <TimelineView report={report} />}
          {activeTab === "recommendations" && <RecommendationsView report={report} />}
          {activeTab === "saved" && <SavedReportsView />}
          {activeTab === "about" && <AboutView />}
        </main>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD VIEW ----------------

function ExactDashboardView({ report }: { report: any }) {
  const cityName = report?.cityName || "Mumbai, India";
  const overallScore = report?.overallScore ?? 74;
  const statusText = report?.overallStatus || "Good";

  const air = report?.metrics?.air?.score ?? 82;
  const water = report?.metrics?.water?.score ?? 88;
  const green = report?.metrics?.green?.score ?? 61;
  const climate = report?.metrics?.climate?.score ?? 68;
  const waste = report?.metrics?.waste?.score ?? 57;

  return (
    <div className="space-y-6">
      {/* Unified City Overview & Circular Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 flex flex-col justify-between space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Analysis Complete
            </div>
            <div className="text-xs text-slate-400 bg-[#070A14] px-3.5 py-1.5 rounded-xl border border-slate-800/80 font-mono">
              Report generated on Aug 13, 2026 • 10:50 PM
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left side: City Name */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">Your City</span>
              <h3 className="text-3xl font-black text-white tracking-tight">{cityName}</h3>
            </div>

            {/* Right side: Circular Health Index Score Card */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-[#070A14] border border-slate-800/80">
              <div className="relative flex items-center justify-center flex-shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#1E293B" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#10B981"
                    strokeWidth="6"
                    strokeDasharray={201}
                    strokeDashoffset={201 - (201 * overallScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-white block">{overallScore}</span>
                  <span className="text-[9px] text-slate-400 font-bold block">/100</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  City Health Index
                </span>
                <p className="text-sm font-bold text-emerald-400">{statusText}</p>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Mumbai is making progress in several areas, but faces environmental challenges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live City Telemetry Map Panel */}
        <div className="p-6 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Live City Telemetry
            </h4>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Live Map
            </span>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <CityMap cityName={cityName} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="bg-[#070A14] p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Monitoring Hubs</span>
              <span className="text-sm font-bold text-white">24</span>
            </div>
            <div className="bg-[#070A14] p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Active Sensors</span>
              <span className="text-sm font-bold text-emerald-400">128</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Overview Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Health Score Overview</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricOverviewCard icon={Wind} label="Air Quality" score={air} status="Improving ↗" trendColor="text-emerald-400" />
          <MetricOverviewCard icon={Droplets} label="Water Purity" score={water} status="Stable →" trendColor="text-emerald-400" />
          <MetricOverviewCard icon={Trees} label="Green Canopy" score={green} status="Declining ↘" trendColor="text-amber-400" />
          <MetricOverviewCard icon={Thermometer} label="Climate Risk" score={climate} status="Increasing ↗" trendColor="text-amber-400" />
          <MetricOverviewCard icon={Recycle} label="Waste Systems" score={waste} status="Needs improvement →" trendColor="text-amber-400" />
        </div>
      </div>

      {/* Three-Column Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h5 className="text-sm font-bold text-white">AI Diagnosis</h5>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your city has shown significant resilience in water networks and air filtration. However, urban canopy density remains below recommended regional baselines.
            </p>
            <ul className="space-y-2 pt-1">
              <li className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                Air purity index up by 12% since 2018
              </li>
              <li className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                Heat island intensity increasing in commercial districts
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h5 className="text-sm font-bold text-white">Historical Trend</h5>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">Decade View</span>
            </div>
            <div className="pt-4 pb-2">
              <div className="flex justify-between items-end h-28 px-2 border-b border-slate-800/80 relative">
                <TimelinePoint year="1990" score={45} height="h-10" />
                <TimelinePoint year="2000" score={52} height="h-14" />
                <TimelinePoint year="2010" score={60} height="h-16" />
                <TimelinePoint year="2020" score={68} height="h-20" isHighlighted />
                <TimelinePoint year="2030" score={74} height="h-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <h5 className="text-sm font-bold text-white">AI Recommendations</h5>
            </div>
            <div className="space-y-2.5 pt-1">
              <RecommendationRow text="Expand urban green cover in high-density zones." />
              <RecommendationRow text="Upgrade waste segregation and recycling systems." />
              <RecommendationRow text="Invest in rainwater harvesting and water treatment." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- COMPARE CITIES VIEW ----------------

function CompareCitiesView({ report }: { report: any }) {
  const customCityName = report?.cityName;
  const customScore = report?.overallScore ?? 74;

  const top10CleanestCities = [
    { rank: 1, name: "Reykjavik", country: "Iceland", score: 96, air: 99, water: 98, green: 95, climate: 94, waste: 94 },
    { rank: 2, name: "Zurich", country: "Switzerland", score: 94, air: 95, water: 98, green: 92, climate: 91, waste: 94 },
    { rank: 3, name: "Helsinki", country: "Finland", score: 93, air: 96, water: 95, green: 94, climate: 90, waste: 90 },
    { rank: 4, name: "Copenhagen", country: "Denmark", score: 92, air: 94, water: 95, green: 91, climate: 92, waste: 88 },
    { rank: 5, name: "Vienna", country: "Austria", score: 91, air: 92, water: 97, green: 90, climate: 88, waste: 88 },
    { rank: 6, name: "Stockholm", country: "Sweden", score: 90, air: 93, water: 94, green: 89, climate: 87, waste: 87 },
    { rank: 7, name: "Oslo", country: "Norway", score: 89, air: 91, water: 93, green: 88, climate: 86, waste: 87 },
    { rank: 8, name: "Singapore", country: "Singapore", score: 87, air: 85, water: 90, green: 91, climate: 83, waste: 96 },
    { rank: 9, name: "Tokyo", country: "Japan", score: 86, air: 88, water: 92, green: 82, climate: 84, waste: 84 },
    { rank: 10, name: "Vancouver", country: "Canada", score: 85, air: 89, water: 91, green: 85, climate: 80, waste: 80 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#0B0F1A] p-6 rounded-2xl border border-slate-800/80 space-y-2 shadow-xl">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl font-black text-white">Global Comparison • Top 10 Cleanest Cities</h3>
        </div>
        <p className="text-xs text-slate-400">
          Ranked globally based on verified environmental benchmarks including air purity, clean water access, urban canopy density, climate adaptability, and waste circularity.
        </p>
      </div>

      {customCityName && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Your Scanned City</span>
            <h4 className="text-base font-bold text-white">{customCityName}</h4>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400">{customScore}</span>
            <span className="text-xs text-slate-400"> / 100 Overall Index</span>
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold pl-2">Rank & City</th>
                <th className="pb-3 font-semibold">Health Index</th>
                <th className="pb-3 font-semibold">Air</th>
                <th className="pb-3 font-semibold">Water</th>
                <th className="pb-3 font-semibold">Green Space</th>
                <th className="pb-3 font-semibold">Climate</th>
                <th className="pb-3 font-semibold">Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-[12px]">
              {top10CleanestCities.map((c) => (
                <tr key={c.rank} className="text-slate-300 hover:bg-slate-800/20 transition">
                  <td className="py-3.5 pl-2 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                      #{c.rank}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{c.name}</span>
                      <span className="text-[10px] text-slate-500">{c.country}</span>
                    </div>
                  </td>
                  <td className="py-3.5 font-bold text-emerald-400">
                    <div className="flex items-center gap-2">
                      <span>{c.score} / 100</span>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div className="bg-emerald-400 h-full" style={{ width: `${c.score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">{c.air}</td>
                  <td className="py-3.5">{c.water}</td>
                  <td className="py-3.5">{c.green}</td>
                  <td className="py-3.5">{c.climate}</td>
                  <td className="py-3.5">{c.waste}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- OTHER VIEWS ----------------

function CityReportView({ report }: { report: any }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl">
      <h3 className="text-xl font-bold text-white">Comprehensive City Report</h3>
      <p className="text-xs text-slate-400">Detailed diagnostics and telemetry insights for {report?.cityName || "your selected city"}.</p>
    </div>
  );
}

function TimelineView({ report }: { report: any }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl">
      <h3 className="text-xl font-bold text-white">Historical Environmental Timeline</h3>
      <p className="text-xs text-slate-400">Decadal tracking of ecological metrics from 1990 to present.</p>
    </div>
  );
}

function RecommendationsView({ report }: { report: any }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl">
      <h3 className="text-xl font-bold text-white">Policy & Infrastructure Action Plan</h3>
      <p className="text-xs text-slate-400">AI-optimized municipal recommendations for sustainable urban development.</p>
    </div>
  );
}

function SavedReportsView() {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl">
      <h3 className="text-xl font-bold text-white">Saved City Reports</h3>
      <p className="text-xs text-slate-400">No reports bookmarked yet. Run a city scan to store profiles here.</p>
    </div>
  );
}

function AboutView() {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <h3 className="text-xl font-bold text-white">About DNA of a City</h3>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        DNA of a City is an advanced AI environmental health engine designed to evaluate municipal ecosystems, monitor climate vulnerabilities, and support data-driven urban planning.
      </p>
    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

function MetricOverviewCard({ icon: Icon, label, score, status, trendColor }: any) {
  return (
    <div className="p-4 rounded-2xl bg-[#0B0F1A] border border-slate-800/80 space-y-3 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="p-2 rounded-xl bg-slate-800/50 text-emerald-400">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <span className="text-xs text-slate-400 block font-medium">{label}</span>
        <p className="text-2xl font-black text-white mt-0.5">
          {score} <span className="text-xs font-normal text-slate-500">/100</span>
        </p>
        <span className={`text-[11px] font-semibold block mt-1 ${trendColor}`}>{status}</span>
      </div>
      <div className="pt-2 flex items-end gap-1 h-6">
        <div className="w-full bg-emerald-500/20 h-2 rounded-sm" />
        <div className="w-full bg-emerald-500/40 h-3 rounded-sm" />
        <div className="w-full bg-emerald-500/60 h-4 rounded-sm" />
        <div className="w-full bg-emerald-400 h-5 rounded-sm" />
      </div>
    </div>
  );
}

function TimelinePoint({ year, score, height, isHighlighted = false }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-[11px] font-bold ${isHighlighted ? "text-emerald-400" : "text-slate-400"}`}>
        {score}
      </span>
      <div className={`w-3 ${height} rounded-t-full ${isHighlighted ? "bg-emerald-400" : "bg-slate-700"}`} />
      <span className="text-[10px] text-slate-500 font-mono">{year}</span>
    </div>
  );
}

function RecommendationRow({ text }: { text: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#070A14] border border-slate-800/60 flex items-start gap-3">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
      <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}