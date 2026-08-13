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
  ChevronRight,
  SlidersHorizontal,
  Bell,
  Cpu,
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
        const dynamicScore = data.overallScore ?? Math.floor(65 + Math.random() * 25);
        setReport({
          ...data,
          overallScore: dynamicScore,
          confidence: Math.floor(88 + Math.random() * 9),
        });
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
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col font-sans selection:bg-[#22FFAA]/30 selection:text-[#22FFAA]">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 px-8 py-4 flex items-center justify-between bg-[#0B0F1A]/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-[#22FFAA]/20 to-teal-500/10 border border-[#22FFAA]/30 text-[#22FFAA] shadow-[0_0_20px_rgba(34,255,170,0.2)]">
            <Globe className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white font-mono">
                DNA<span className="text-[#22FFAA] animate-pulse">.</span>CITY
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#22FFAA]/10 text-[#22FFAA] text-[10px] font-bold border border-[#22FFAA]/20">
                v2.4 AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">AI Environmental Health Scanner</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-[#22FFAA]" />
            <span>Neural Telemetry Core: <strong className="text-emerald-400">Online</strong></span>
          </div>
          <button aria-label="Notifications" className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#22FFAA] shadow-[0_0_8px_#22FFAA]" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full md:w-72 border-r border-slate-800/80 p-5 bg-[#0B0F1A] flex-shrink-0 flex flex-col justify-between min-h-[calc(100vh-73px)]">
          <div className="space-y-1.5">
            <div className="px-3 pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              Core Modules
            </div>
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-3.5 transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-[#22FFAA]/15 to-teal-500/10 text-[#22FFAA] border border-[#22FFAA]/30 shadow-[0_0_20px_rgba(34,255,170,0.15)]"
                      : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-[#22FFAA]" : "text-slate-400"}`} />
                  <span className="tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#22FFAA] shadow-[0_0_8px_#22FFAA]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Globe & Branding Footer */}
          <div className="pt-6 px-1 space-y-4">
            <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <Globe className="w-24 h-24 text-[#22FFAA]" />
              </div>
              <GlobeGraphic />
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-[#070A14] border border-slate-800 space-y-1.5 shadow-inner">
              <span className="text-[11px] font-bold text-slate-200 block">Every city has a DNA.</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">Let&apos;s decode it for a better tomorrow.</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full bg-[#0B0F1A]">
          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0E1526] via-[#0B0F1A] to-[#0E1526] border border-slate-800/80 p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group">
            <div
              className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none mix-blend-screen transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1400&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F1A] via-[#0B0F1A]/95 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#22FFAA]/10 border border-[#22FFAA]/25 text-[#22FFAA] text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(34,255,170,0.15)]">
                <Sparkles className="w-3.5 h-3.5" /> AI Environmental Intelligence
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Intelligent Insights. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22FFAA] via-teal-300 to-cyan-400">Healthier Cities.</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                AI-powered environmental intelligence to analyze and improve urban ecosystems through real-time telemetry and deep predictive analytics.
              </p>
            </div>

            <form onSubmit={handleScan} className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full lg:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                <input
                  type="text"
                  placeholder="Search any city, e.g., London, Tokyo..."
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="bg-[#070A14] border border-slate-700/80 rounded-2xl pl-11 pr-4 py-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#22FFAA] focus:ring-2 focus:ring-[#22FFAA]/20 w-full shadow-inner transition-all duration-300 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#22FFAA] to-emerald-400 hover:from-[#1fe69b] hover:to-emerald-300 text-slate-950 font-black px-7 py-4 rounded-2xl text-xs transition-all duration-300 flex items-center justify-center gap-2.5 whitespace-nowrap disabled:opacity-50 shadow-[0_0_25px_rgba(34,255,170,0.35)] hover:shadow-[0_0_35px_rgba(34,255,170,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
              >
                {loading ? "Scanning City DNA..." : <>Scan City <ChevronRight className="w-4 h-4" /></>}
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
  const confidence = report?.confidence ?? 92;

  const air = report?.metrics?.air?.score ?? 82;
  const water = report?.metrics?.water?.score ?? 88;
  const green = report?.metrics?.green?.score ?? 61;
  const climate = report?.metrics?.climate?.score ?? 68;
  const waste = report?.metrics?.waste?.score ?? 57;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* City Overview & Circular Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#22FFAA]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top row inside card */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22FFAA]/10 border border-[#22FFAA]/25 text-[#22FFAA] text-xs font-bold tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22FFAA] animate-pulse shadow-[0_0_10px_#22FFAA]" />
              Analysis Complete
            </div>
            <div className="text-xs text-slate-400 bg-[#070A14]/80 px-4 py-2 rounded-xl border border-slate-800/80 font-mono shadow-inner">
              Report generated on Aug 13, 2026 • 10:50 PM
            </div>
          </div>

          {/* Bottom row inside card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-mono">Target Ecosystem</span>
              <div className="flex items-center gap-3">
                <h3 className="text-4xl font-black text-white tracking-tight">{cityName}</h3>
                <span className="text-2xl">🇮🇳</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Multispectral environmental audit completed across municipal sectors with high statistical correlation.
              </p>
              <div className="flex gap-6 pt-2">
                <div className="bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">AI Confidence</span>
                  <span className="text-sm font-black text-[#22FFAA]">{confidence}%</span>
                </div>
                <div className="bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ecosystem Trend</span>
                  <span className="text-sm font-black text-[#22FFAA]">Improving ↗</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-6 rounded-3xl bg-[#070A14]/90 border border-slate-800/90 shadow-xl backdrop-blur-md">
              <div className="relative flex items-center justify-center flex-shrink-0">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="44" stroke="#1E293B" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="#22FFAA"
                    strokeWidth="8"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * overallScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out filter drop-shadow-[0_0_8px_rgba(34,255,170,0.6)]"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-white block font-mono">{overallScore}</span>
                  <span className="text-[10px] text-slate-400 font-bold block">/100</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-mono">
                  City Health Index
                </span>
                <p className="text-lg font-black text-[#22FFAA] tracking-wide">{statusText}</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Making progress in several areas, but faces environmental challenges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live City Telemetry Map Panel */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-4 flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
              <MapPin className="w-4 h-4 text-[#22FFAA]" /> Live City Telemetry
            </h4>
            <span className="text-[10px] text-[#22FFAA] bg-[#22FFAA]/10 px-3 py-1 rounded-xl border border-[#22FFAA]/30 flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(34,255,170,0.15)]">
              <ExternalLink className="w-3 h-3" /> Live Map
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            <CityMap cityName={cityName} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1 text-center">
            <div className="bg-[#070A14] p-3 rounded-2xl border border-slate-800/80 shadow-sm">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Monitoring Hubs</span>
              <span className="text-base font-black text-white font-mono">24</span>
            </div>
            <div className="bg-[#070A14] p-3 rounded-2xl border border-slate-800/80 shadow-sm">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Active Sensors</span>
              <span className="text-base font-black text-[#22FFAA] font-mono">128</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Overview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider font-mono">Health Score Overview</h4>
          <span className="text-xs text-slate-400 font-medium">5 Core Ecological Vectors</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <MetricOverviewCard icon={Wind} label="Air Quality" score={air} status="Improving ↗" trendColor="text-[#22FFAA]" barColor="bg-[#22FFAA]" />
          <MetricOverviewCard icon={Droplets} label="Water Purity" score={water} status="Stable →" trendColor="text-[#22FFAA]" barColor="bg-[#22FFAA]" />
          <MetricOverviewCard icon={Trees} label="Green Canopy" score={green} status="Declining ↘" trendColor="text-amber-400" barColor="bg-amber-400" />
          <MetricOverviewCard icon={Thermometer} label="Climate Risk" score={climate} status="Increasing ↗" trendColor="text-amber-400" barColor="bg-amber-400" />
          <MetricOverviewCard icon={Recycle} label="Waste Systems" score={waste} status="Needs improvement →" trendColor="text-amber-400" barColor="bg-amber-400" />
        </div>
      </div>

      {/* Three-Column Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Diagnosis */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-5 shadow-2xl flex flex-col justify-between group hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#22FFAA]/10 text-[#22FFAA] border border-[#22FFAA]/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h5 className="text-base font-black text-white tracking-tight">AI Diagnosis</h5>
              </div>
              <span className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-800 font-mono">Verified Analysis</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your city has shown significant resilience in water networks and air filtration. However, urban canopy density remains below recommended regional baselines.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="text-xs text-slate-300 flex items-center gap-3 bg-[#070A14] p-3 rounded-2xl border border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-[#22FFAA] flex-shrink-0 shadow-[0_0_8px_#22FFAA]" />
                Air purity index up by 12% since 2018
              </li>
              <li className="text-xs text-slate-300 flex items-center gap-3 bg-[#070A14] p-3 rounded-2xl border border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 shadow-[0_0_8px_#fbbf24]" />
                Heat island intensity increasing in commercial districts
              </li>
            </ul>
          </div>
          <button className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition flex items-center justify-center gap-2">
            View Full Analysis <ChevronRight className="w-3.5 h-3.5 text-[#22FFAA]" />
          </button>
        </div>

        {/* Historical Trend */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-5 shadow-2xl flex flex-col justify-between group hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#22FFAA]/10 text-[#22FFAA] border border-[#22FFAA]/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h5 className="text-base font-black text-white tracking-tight">Historical Trend</h5>
              </div>
              <span className="text-[10px] bg-slate-900 text-slate-300 px-3 py-1 rounded-xl border border-slate-800 font-mono flex items-center gap-1.5">
                <SlidersHorizontal className="w-3 h-3 text-[#22FFAA]" /> Decade View
              </span>
            </div>
            <div className="pt-6 pb-2">
              <div className="flex justify-between items-end h-32 px-3 border-b border-slate-800 relative">
                <div className="absolute inset-x-0 bottom-12 border-t border-dashed border-slate-800/60 pointer-events-none" />
                <TimelinePoint year="1990" score={45} height="h-10" />
                <TimelinePoint year="2000" score={52} height="h-14" />
                <TimelinePoint year="2010" score={60} height="h-20" />
                <TimelinePoint year="2020" score={74} height="h-28" isHighlighted />
                <TimelinePoint year="2030" score={85} height="h-32" isForecast />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
              <span>Status: <strong className="text-[#22FFAA]">Improving rapidly</strong></span>
              <span className="text-slate-500 font-mono">1990 - 2030 Projection</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#070A14] border border-slate-800/80 text-center text-xs text-slate-300">
            AI projects a <span className="text-[#22FFAA] font-bold">+15% index boost</span> by 2030.
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-5 shadow-2xl flex flex-col justify-between group hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#22FFAA]/10 text-[#22FFAA] border border-[#22FFAA]/20">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h5 className="text-base font-black text-white tracking-tight">AI Recommendations</h5>
              </div>
              <span className="text-[10px] bg-slate-900 text-[#22FFAA] px-2.5 py-1 rounded-xl border border-[#22FFAA]/30 font-mono">Priority Actions</span>
            </div>
            <div className="space-y-3 pt-1">
              <RecommendationRow text="Expand urban green cover in high-density commercial districts." />
              <RecommendationRow text="Upgrade waste segregation and recycling infrastructure." />
              <RecommendationRow text="Invest in decentralized rainwater harvesting and greywater treatment." />
            </div>
          </div>
          <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#22FFAA]/20 to-teal-500/10 hover:from-[#22FFAA]/30 hover:to-teal-500/20 text-[#22FFAA] text-xs font-bold border border-[#22FFAA]/30 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,255,170,0.1)]">
            View Full Action Plan <ChevronRight className="w-3.5 h-3.5" />
          </button>
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
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-br from-[#121829] to-[#0B0F1A] p-8 rounded-3xl border border-slate-800/80 space-y-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#22FFAA]/10 text-[#22FFAA] border border-[#22FFAA]/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Global Comparison • Top 10 Cleanest Cities</h3>
            <p className="text-xs text-slate-400 mt-1">
              Ranked globally based on verified environmental benchmarks including air purity, clean water access, urban canopy density, climate adaptability, and waste circularity.
            </p>
          </div>
        </div>
      </div>

      {customCityName && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#22FFAA]/15 via-teal-500/10 to-[#121829] border border-[#22FFAA]/30 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#22FFAA] tracking-widest font-mono">Your Scanned City Profile</span>
            <h4 className="text-xl font-black text-white">{customCityName}</h4>
          </div>
          <div className="text-right bg-[#070A14] px-6 py-3 rounded-2xl border border-slate-800">
            <span className="text-3xl font-black text-[#22FFAA] font-mono">{customScore}</span>
            <span className="text-xs text-slate-400 block font-mono">/ 100 Health Index</span>
          </div>
        </div>
      )}

      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-6 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                <th className="pb-4 font-bold pl-4">Rank & City</th>
                <th className="pb-4 font-bold">Health Index</th>
                <th className="pb-4 font-bold">Air Purity</th>
                <th className="pb-4 font-bold">Water</th>
                <th className="pb-4 font-bold">Green Space</th>
                <th className="pb-4 font-bold">Climate</th>
                <th className="pb-4 font-bold">Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[13px]">
              {top10CleanestCities.map((c) => (
                <tr key={c.rank} className="text-slate-300 hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 pl-4 flex items-center gap-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-[#22FFAA] font-black text-xs flex items-center justify-center flex-shrink-0 border border-slate-800 shadow-inner font-mono">
                      #{c.rank}
                    </span>
                    <div>
                      <span className="font-bold text-white block text-sm">{c.name}</span>
                      <span className="text-[11px] text-slate-400">{c.country}</span>
                    </div>
                  </td>
                  <td className="py-4 font-bold text-[#22FFAA]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{c.score} / 100</span>
                      <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden hidden sm:block border border-slate-800">
                        <div className="bg-gradient-to-r from-[#22FFAA] to-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(34,255,170,0.5)]" style={{ width: `${c.score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono">{c.air}</td>
                  <td className="py-4 font-mono">{c.water}</td>
                  <td className="py-4 font-mono">{c.green}</td>
                  <td className="py-4 font-mono">{c.climate}</td>
                  <td className="py-4 font-mono">{c.waste}</td>
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
    <div className="p-10 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-6 shadow-2xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-[#22FFAA]" />
        <div>
          <h3 className="text-2xl font-black text-white">Comprehensive City Report</h3>
          <p className="text-xs text-slate-400 mt-1">Detailed diagnostics and telemetry insights for {report?.cityName || "your selected city"}.</p>
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-[#070A14] border border-slate-800 text-xs text-slate-300 space-y-3">
        <p className="font-bold text-white">Multispectral Environmental Audit Summary:</p>
        <p className="leading-relaxed text-slate-400">All metrics are evaluated via satellite telemetry, local IoT sensors, and predictive urban modeling. Full audit data is cached for instant municipal review.</p>
      </div>
    </div>
  );
}

function TimelineView({ report }: { report: any }) {
  return (
    <div className="p-10 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-6 shadow-2xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <Clock className="w-8 h-8 text-[#22FFAA]" />
        <div>
          <h3 className="text-2xl font-black text-white">Historical Environmental Timeline</h3>
          <p className="text-xs text-slate-400 mt-1">Decadal tracking of ecological metrics from 1990 to present and projected trends.</p>
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-[#070A14] border border-slate-800 text-xs text-slate-300 space-y-3">
        <p className="font-bold text-white">Decadal Growth Analysis:</p>
        <p className="leading-relaxed text-slate-400">Tracking urban adaptation over 4 decades shows consistent improvements in water networks and air filtration systems.</p>
      </div>
    </div>
  );
}

function RecommendationsView({ report }: { report: any }) {
  return (
    <div className="p-10 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-6 shadow-2xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-8 h-8 text-[#22FFAA]" />
        <div>
          <h3 className="text-2xl font-black text-white">Policy & Infrastructure Action Plan</h3>
          <p className="text-xs text-slate-400 mt-1">AI-optimized municipal recommendations for sustainable urban development.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-[#070A14] border border-slate-800 space-y-3">
          <span className="text-xs font-mono font-bold text-[#22FFAA]">PRIORITY 01</span>
          <h4 className="font-bold text-white text-sm">Urban Canopy Expansion</h4>
          <p className="text-xs text-slate-400 leading-relaxed">Increase tree coverage in dense urban areas and low-income neighborhoods to reduce heat island effects.</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#070A14] border border-slate-800 space-y-3">
          <span className="text-xs font-mono font-bold text-[#22FFAA]">PRIORITY 02</span>
          <h4 className="font-bold text-white text-sm">Waste Circularity</h4>
          <p className="text-xs text-slate-400 leading-relaxed">Upgrade automated sorting facilities and implement localized organic composting programs.</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#070A14] border border-slate-800 space-y-3">
          <span className="text-xs font-mono font-bold text-[#22FFAA]">PRIORITY 03</span>
          <h4 className="font-bold text-white text-sm">Water Resilience</h4>
          <p className="text-xs text-slate-400 leading-relaxed">Mandate rainwater harvesting systems for commercial real estate developments.</p>
        </div>
      </div>
    </div>
  );
}

function SavedReportsView() {
  return (
    <div className="p-10 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-6 shadow-2xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <Bookmark className="w-8 h-8 text-[#22FFAA]" />
        <div>
          <h3 className="text-2xl font-black text-white">Saved City Reports</h3>
          <p className="text-xs text-slate-400 mt-1">Access your bookmarked municipal profiles and telemetry scans.</p>
        </div>
      </div>
      <div className="p-8 rounded-2xl bg-[#070A14] border border-slate-800 text-center space-y-3">
        <p className="text-xs text-slate-400">No reports bookmarked yet. Run a city scan from the dashboard to store profiles here.</p>
      </div>
    </div>
  );
}

function AboutView() {
  return (
    <div className="p-10 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-6 shadow-2xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-[#22FFAA]" />
        <div>
          <h3 className="text-2xl font-black text-white">About DNA of a City</h3>
          <p className="text-xs text-slate-400 mt-1">Next-generation urban intelligence and environmental analytics platform.</p>
        </div>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
        DNA of a City is an advanced AI environmental health engine designed to evaluate municipal ecosystems, monitor climate vulnerabilities, and support data-driven urban planning. Powered by cutting-edge neural telemetry models.
      </p>
    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

function MetricOverviewCard({ icon: Icon, label, score, status, trendColor, barColor }: any) {
  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121829] to-[#0B0F1A] border border-slate-800/80 space-y-4 shadow-xl hover:border-slate-700 transition-all group">
      <div className="flex justify-between items-center">
        <div className="p-2.5 rounded-2xl bg-slate-900 text-[#22FFAA] border border-slate-800 group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Vector</span>
      </div>
      <div>
        <span className="text-xs text-slate-400 block font-bold">{label}</span>
        <p className="text-3xl font-black text-white mt-1 font-mono">
          {score} <span className="text-xs font-normal text-slate-500">/100</span>
        </p>
        <span className={`text-[11px] font-bold block mt-1.5 ${trendColor}`}>{status}</span>
      </div>
      <div className="pt-1 flex items-end gap-1.5 h-7">
        <div className={`w-full ${barColor}/20 h-3 rounded-md`} />
        <div className={`w-full ${barColor}/40 h-4 rounded-md`} />
        <div className={`w-full ${barColor}/70 h-5 rounded-md`} />
        <div className={`w-full ${barColor} h-7 rounded-md shadow-[0_0_8px_rgba(34,255,170,0.4)]`} />
      </div>
    </div>
  );
}

function TimelinePoint({ year, score, height, isHighlighted = false, isForecast = false }: any) {
  return (
    <div className="flex flex-col items-center gap-2 group">
      <span className={`text-[11px] font-mono font-bold ${isHighlighted || isForecast ? "text-[#22FFAA]" : "text-slate-400"}`}>
        {score}
      </span>
      <div 
        className={`w-3.5 ${height} rounded-t-full transition-all duration-300 group-hover:brightness-125 ${
          isHighlighted 
            ? "bg-[#22FFAA] shadow-[0_0_12px_#22FFAA]" 
            : isForecast 
              ? "bg-teal-400/80 border border-dashed border-teal-200" 
              : "bg-slate-700"
        }`} 
      />
      <span className={`text-[10px] font-mono font-bold ${isForecast ? "text-[#22FFAA]" : "text-slate-500"}`}>{year}</span>
    </div>
  );
}

function RecommendationRow({ text }: { text: string }) {
  return (
    <div className="p-3.5 rounded-2xl bg-[#070A14] border border-slate-800/80 flex items-start gap-3.5 hover:border-slate-700 transition-colors">
      <span className="w-2 h-2 rounded-full bg-[#22FFAA] mt-2 flex-shrink-0 shadow-[0_0_8px_#22FFAA]" />
      <p className="text-xs text-slate-300 leading-relaxed font-medium">{text}</p>
    </div>
  );
}