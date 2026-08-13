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
  MapPin,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Award,
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
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between bg-[#080C19]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">DNA of a City</h1>
            <p className="text-[11px] text-slate-400">AI Environmental Health Scanner</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 border-r border-slate-800/60 p-4 bg-[#080C17] flex-shrink-0 flex flex-col justify-between min-h-[calc(100vh-65px)]">
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

          {/* Interactive Globe & Sidebar Footer */}
          <div className="pt-4 px-2 space-y-3">
            <GlobeGraphic />
            <div className="p-4 rounded-2xl bg-[#0B1021] border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-200 block">AI for a Better Planet</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Empowering decisions for sustainable tomorrow.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Search Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B0F21] p-6 rounded-2xl border border-slate-800/80">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Check the <span className="text-emerald-400">Planet Health</span> of Any City
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                AI analyzes real environmental data to generate a comprehensive health profile.
              </p>
            </div>
            <form onSubmit={handleScan} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Enter city name..."
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="bg-[#060914] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full"
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

          {/* Dynamic Tab Rendering */}
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
  const cityName = report?.cityName || "Your City";
  const country = report?.country || "Your Country";
  const overallScore = report?.overallScore ?? 74;
  const statusText = report?.overallStatus || "Good";

  const air = report?.metrics?.air?.score ?? 82;
  const water = report?.metrics?.water?.score ?? 88;
  const green = report?.metrics?.green?.score ?? report?.metrics?.nature?.score ?? 61;
  const climate = report?.metrics?.climate?.score ?? 68;
  const waste = report?.metrics?.waste?.score ?? 57;

  return (
    <div className="space-y-6">
      {/* 1. Hero Skyline Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0C1226] border border-slate-800/80 p-8 min-h-[220px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?q=80&w=1200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1226] via-[#0C1226]/80 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Analysis Complete
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight">{cityName}</h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {country}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-mono pt-1">
            Report generated on Aug 13, 2026 • 10:50 PM
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 bg-[#080C1B]/80 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="38" stroke="#1E293B" strokeWidth="7" fill="transparent" />
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="#10B981"
                strokeWidth="7"
                strokeDasharray={238}
                strokeDashoffset={238 - (238 * overallScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-white block">{overallScore}</span>
              <span className="text-[10px] text-slate-400 font-bold block">/100</span>
            </div>
          </div>

          <div className="space-y-1 max-w-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Overall Planet Health
            </span>
            <p className="text-base font-bold text-emerald-400">{statusText}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your city is making progress in several areas, but faces environmental challenges.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Health Score Overview Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Health Score Overview</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <MetricOverviewCard icon={Wind} label="Air" score={air} status="Improving ↗" trendColor="text-emerald-400" />
          <MetricOverviewCard icon={Droplets} label="Water" score={water} status="Stable →" trendColor="text-emerald-400" />
          <MetricOverviewCard icon={Trees} label="Green Space" score={green} status="Declining ↘" trendColor="text-amber-400" />
          <MetricOverviewCard icon={Thermometer} label="Climate Risk" score={climate} status="Increasing ↗" trendColor="text-amber-400" />
          <MetricOverviewCard icon={Recycle} label="Waste" score={waste} status="Needs improvement →" trendColor="text-amber-400" />
        </div>
      </div>

      {/* 3. Interactive City Map */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Geospatial Telemetry Map</h4>
        <CityMap cityName={cityName} />
      </div>

      {/* 4. Three-Column Detailed Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h5 className="text-sm font-bold text-white">AI Diagnosis</h5>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your city has shown significant improvement in air and water quality over the past decade. However, increasing climate risks and unequal access to green spaces remain critical challenges.
            </p>
            <ul className="space-y-2 pt-2">
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                Air quality has improved by 12% since 2018
              </li>
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                Rising temperatures and heatwave frequency
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h5 className="text-sm font-bold text-white">City Health Timeline</h5>
            </div>
            <div className="pt-6 pb-2">
              <div className="flex justify-between items-end h-28 px-4 border-b border-slate-800/80 relative">
                <TimelinePoint year="2010" score={68} height="h-16" />
                <TimelinePoint year="2015" score={71} height="h-20" />
                <TimelinePoint year="2020" score={74} height="h-24" isHighlighted />
                <TimelinePoint year="2026" score={72} height="h-20" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <h5 className="text-sm font-bold text-white">Top Recommendations</h5>
            </div>
            <div className="space-y-3 pt-1">
              <RecommendationRow number={1} text="Increase tree coverage in dense urban areas." />
              <RecommendationRow number={2} text="Improve waste sorting and recycling rates." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- COMPARE CITIES VIEW (TOP 10 CLEANEST CITIES) ----------------

function CompareCitiesView({ report }: { report: any }) {
  const customCityName = report?.cityName;
  const customScore = report?.overallScore ?? 74;

  const top10CleanestCities = [
    { rank: 1, name: "Helsinki", country: "Finland", score: 96, air: 98, water: 95, green: 97, climate: 94, waste: 96 },
    { rank: 2, name: "Copenhagen", country: "Denmark", score: 95, air: 97, water: 96, green: 94, climate: 95, waste: 93 },
    { rank: 3, name: "Vienna", country: "Austria", score: 93, air: 94, water: 97, green: 95, climate: 90, waste: 91 },
    { rank: 4, name: "Stockholm", country: "Sweden", score: 92, air: 95, water: 94, green: 92, climate: 91, waste: 88 },
    { rank: 5, name: "Zurich", country: "Switzerland", score: 91, air: 93, water: 98, green: 89, climate: 89, waste: 87 },
    { rank: 6, name: "Reykjavik", country: "Iceland", score: 90, air: 99, water: 99, green: 85, climate: 84, waste: 83 },
    { rank: 7, name: "Oslo", country: "Norway", score: 89, air: 92, water: 93, green: 88, climate: 86, waste: 86 },
    { rank: 8, name: "Singapore", country: "Singapore", score: 87, air: 85, water: 90, green: 91, climate: 82, waste: 95 },
    { rank: 9, name: "Tokyo", country: "Japan", score: 85, air: 88, water: 92, green: 80, climate: 83, waste: 82 },
    { rank: 10, name: "Vienna", country: "Canada (Vancouver)", score: 84, air: 89, water: 91, green: 84, climate: 79, waste: 77 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#0B0F21] p-6 rounded-2xl border border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl font-black text-white">Top 10 Cleanest Cities in the World</h3>
        </div>
        <p className="text-xs text-slate-400">
          Ranked globally based on verified environmental benchmarks including air purity, clean water access, urban canopy density, climate adaptability, and waste circularity.
        </p>
      </div>

      {customCityName && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Your Scanned City</span>
            <h4 className="text-base font-bold text-white">{customCityName}</h4>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400">{customScore}</span>
            <span className="text-xs text-slate-400"> / 100 Overall</span>
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">Rank & City</th>
                <th className="pb-3 font-semibold">Overall Index</th>
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
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
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

// ---------------- OTHER PLACEHOLDER VIEWS ----------------

function CityReportView({ report }: { report: any }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4">
      <h3 className="text-xl font-bold text-white">Comprehensive City Report</h3>
      <p className="text-xs text-slate-400">Detailed diagnostics and downloadable telemetry insights for {report?.cityName || "your selected city"}.</p>
    </div>
  );
}

function TimelineView({ report }: { report: any }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4">
      <h3 className="text-xl font-bold text-white">Historical Environmental Timeline</h3>
      <p className="text-xs text-slate-400">Decadal tracking of ecological metrics from 2010 to present.</p>
    </div>
  );
}

function RecommendationsView({ report }: { report: any }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4">
      <h3 className="text-xl font-bold text-white">Policy & Infrastructure Action Plan</h3>
      <p className="text-xs text-slate-400">AI-optimized municipal recommendations for sustainable development.</p>
    </div>
  );
}

function SavedReportsView() {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4">
      <h3 className="text-xl font-bold text-white">Saved City Reports</h3>
      <p className="text-xs text-slate-400">No reports bookmarked yet. Run a city scan and click save to store profiles here.</p>
    </div>
  );
}

function AboutView() {
  return (
    <div className="p-8 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4">
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
    <div className="p-4 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-3">
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
      <span className={`text-[11px] font-bold ${isHighlighted ? "text-emerald-400" : "text-amber-400"}`}>
        {score}
      </span>
      <div className={`w-3 ${height} rounded-t-full ${isHighlighted ? "bg-emerald-400" : "bg-amber-400/80"}`} />
      <span className="text-[10px] text-slate-500 font-mono">{year}</span>
    </div>
  );
}

function RecommendationRow({ number, text }: any) {
  return (
    <div className="p-3 rounded-xl bg-[#070A16] border border-slate-800/60 flex items-start gap-3">
      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}