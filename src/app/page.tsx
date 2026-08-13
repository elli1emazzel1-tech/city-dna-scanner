import CityMap from "@/components/CityMap";
"use client";

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

        {/* Main Content Dashboard */}
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

          {/* Dashboard View */}
          {activeTab === "dashboard" && <ExactDashboardView report={report} />}
        </main>
      </div>
    </div>
  );
}

// ---------------- EXACT DESIGN MATCH DASHBOARD ----------------

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
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?q=80&w=1200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1226] via-[#0C1226]/80 to-transparent pointer-events-none" />

        {/* Left Header Content */}
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
            Report generated on Aug 8, 2026 • 10:30 PM
          </p>
        </div>

        {/* Right Gauge & Summary */}
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

      {/* 3. Three-Column Detailed Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: AI Diagnosis */}
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
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                Urban greenery is below recommended levels
              </li>
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                Recycling rate is lower than similar cities
              </li>
            </ul>
          </div>

          <button className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/50 flex items-center justify-center gap-2 transition">
            View Full Analysis <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Column 2: City Health Timeline */}
        <div className="p-6 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h5 className="text-sm font-bold text-white">City Health Timeline</h5>
            </div>

            {/* Simulated Line Chart Points */}
            <div className="pt-6 pb-2">
              <div className="flex justify-between items-end h-28 px-4 border-b border-slate-800/80 relative">
                <TimelinePoint year="2010" score={68} height="h-16" />
                <TimelinePoint year="2015" score={71} height="h-20" />
                <TimelinePoint year="2020" score={74} height="h-24" isHighlighted />
                <TimelinePoint year="2026" score={72} height="h-20" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#070A16] border border-slate-800/60 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">Status</span>
              <p className="text-xs font-semibold text-emerald-400">
                Improving, <span className="text-slate-400">but climate risks increasing</span>
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Top Recommendations */}
        <div className="p-6 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <h5 className="text-sm font-bold text-white">Top Recommendations</h5>
            </div>

            <div className="space-y-3 pt-1">
              <RecommendationRow
                number={1}
                text="Increase tree coverage in dense urban areas, especially in low-income neighborhoods."
              />
              <RecommendationRow
                number={2}
                text="Improve waste sorting and increase recycling rates through better infrastructure."
              />
              <RecommendationRow
                number={3}
                text="Expand cooling infrastructure and heat resilience programs."
              />
            </div>
          </div>

          <button className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/50 flex items-center justify-center gap-2 transition">
            View All Recommendations <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Compare Cities Table */}
      <div className="p-6 rounded-2xl bg-[#0B0F21] border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          <h5 className="text-sm font-bold text-white">Compare Cities</h5>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">City</th>
                <th className="pb-3 font-semibold">Overall Score</th>
                <th className="pb-3 font-semibold">Air</th>
                <th className="pb-3 font-semibold">Water</th>
                <th className="pb-3 font-semibold">Green Space</th>
                <th className="pb-3 font-semibold">Climate Risk</th>
                <th className="pb-3 font-semibold">Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-[12px]">
              <tr className="text-emerald-400 font-bold bg-emerald-500/5">
                <td className="py-3.5 pl-2">{cityName}</td>
                <td className="py-3.5 flex items-center gap-2">
                  <span>{overallScore} / 100</span>
                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: `${overallScore}%` }} />
                  </div>
                </td>
                <td className="py-3.5">{air} / 100</td>
                <td className="py-3.5">{water} / 100</td>
                <td className="py-3.5 text-amber-400">{green} / 100</td>
                <td className="py-3.5 text-amber-400">{climate} / 100</td>
                <td className="py-3.5 text-amber-400">{waste} / 100</td>
              </tr>
              <tr className="text-slate-300">
                <td className="py-3.5 pl-2 font-medium">London</td>
                <td className="py-3.5 flex items-center gap-2">
                  <span>78 / 100</span>
                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: "78%" }} />
                  </div>
                </td>
                <td className="py-3.5">85 / 100</td>
                <td className="py-3.5">90 / 100</td>
                <td className="py-3.5">72 / 100</td>
                <td className="py-3.5">65 / 100</td>
                <td className="py-3.5">60 / 100</td>
              </tr>
              <tr className="text-slate-300">
                <td className="py-3.5 pl-2 font-medium">Tokyo</td>
                <td className="py-3.5 flex items-center gap-2">
                  <span>81 / 100</span>
                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: "81%" }} />
                  </div>
                </td>
                <td className="py-3.5">89 / 100</td>
                <td className="py-3.5">92 / 100</td>
                <td className="py-3.5">80 / 100</td>
                <td className="py-3.5">63 / 100</td>
                <td className="py-3.5">65 / 100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

function MetricOverviewCard({
  icon: Icon,
  label,
  score,
  status,
  trendColor,
}: {
  icon: any;
  label: string;
  score: number;
  status: string;
  trendColor: string;
}) {
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

      {/* Mini Sparkline Visualization */}
      <div className="pt-2 flex items-end gap-1 h-6">
        <div className="w-full bg-emerald-500/20 h-2 rounded-sm" />
        <div className="w-full bg-emerald-500/40 h-3 rounded-sm" />
        <div className="w-full bg-emerald-500/60 h-4 rounded-sm" />
        <div className="w-full bg-emerald-400 h-5 rounded-sm" />
      </div>
    </div>
  );
}

function TimelinePoint({
  year,
  score,
  height,
  isHighlighted = false,
}: {
  year: string;
  score: number;
  height: string;
  isHighlighted?: boolean;
}) {
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

function RecommendationRow({ number, text }: { number: number; text: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#070A16] border border-slate-800/60 flex items-start gap-3">
      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}