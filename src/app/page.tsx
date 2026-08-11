"use client";

import React, { useState, useEffect } from "react";
import {
  Wind,
  Droplets,
  Trees,
  Thermometer,
  Search,
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  Clock,
  Lightbulb,
  Bookmark,
  Info,
  Globe,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Sparkles,
  Recycle,
  Check
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Home() {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const localSaved = localStorage.getItem("city_saved_reports");
    if (localSaved) {
      try {
        setSavedReports(JSON.parse(localSaved));
      } catch (e) {
        console.error("Failed to parse saved reports", e);
      }
    }
  }, []);

  const [report, setReport] = useState<any>({
    cityName: "Your City",
    country: "Your Country",
    overallScore: 74,
    overallStatus: "Good",
    summary: "Your city is making progress in several areas, but faces significant environmental challenges.",
    reportDate: "Aug 8, 2026 • 10:30 PM",
    metrics: {
      air: { score: 82, trend: "Improving ↗", sparkline: [70, 72, 75, 78, 80, 79, 82] },
      water: { score: 88, trend: "Stable →", sparkline: [85, 86, 85, 87, 88, 88, 88] },
      green: { score: 61, trend: "Declining ↘", sparkline: [68, 66, 65, 63, 62, 61, 61] },
      climate: { score: 68, trend: "Increasing ↗", sparkline: [55, 58, 60, 62, 65, 66, 68] },
      waste: { score: 57, trend: "Needs improvement →", sparkline: [50, 52, 54, 55, 56, 57, 57] }
    },
    diagnosis: {
      mainText: "Your city has shown significant improvement in air and water quality over the past decade. However, increasing climate risks and unequal access to green spaces remain critical challenges that need immediate attention.",
      bullets: [
        "Air quality has improved by 12% since 2018",
        "Rising temperatures and heatwave frequency",
        "Urban greenery is below recommended levels",
        "Recycling rate is lower than similar cities"
      ]
    },
    timelineStatus: "Improving, but climate risks increasing",
    timeline: [
      { year: "2010", score: 68 },
      { year: "2015", score: 71 },
      { year: "2020", score: 74 },
      { year: "2026", score: 72 }
    ],
    recommendations: [
      { id: 1, title: "Increase tree coverage in dense urban areas, especially in low-income neighborhoods." },
      { id: 2, title: "Improve waste sorting and increase recycling rates through better infrastructure." },
      { id: 3, title: "Expand cooling infrastructure and heat resilience programs." }
    ]
  });

  const handleSaveReport = () => {
    const updated = [...savedReports, report];
    setSavedReports(updated);
    localStorage.setItem("city_saved_reports", JSON.stringify(updated));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cityInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityInput }),
      });
      const data = await res.json();
      if (!data.error) {
        setReport({
          cityName: data.cityName || cityInput.toUpperCase(),
          country: data.country || "Monitored Telemetry Region",
          overallScore: data.overallScore || 70,
          overallStatus: data.overallStatus || "Good",
          summary: data.summary || "Real-time environmental diagnostic generated via active sensor streams.",
          reportDate: "Just Now",
          metrics: {
            air: { score: data.metrics?.air?.score || 80, trend: data.metrics?.air?.trend || "Stable →", sparkline: data.metrics?.air?.sparkline || [70, 75, 80] },
            water: { score: data.metrics?.water?.score || 85, trend: data.metrics?.water?.trend || "Stable →", sparkline: data.metrics?.water?.sparkline || [80, 83, 85] },
            green: { score: data.metrics?.nature?.score || 65, trend: data.metrics?.nature?.trend || "Stable →", sparkline: data.metrics?.nature?.sparkline || [60, 62, 65] },
            climate: { score: data.metrics?.climate?.score || 68, trend: data.metrics?.climate?.trend || "Increasing ↗", sparkline: data.metrics?.climate?.sparkline || [60, 64, 68] },
            waste: { score: data.metrics?.waste?.score || 60, trend: data.metrics?.waste?.trend || "Needs improvement →", sparkline: data.metrics?.waste?.sparkline || [55, 58, 60] }
          },
          diagnosis: {
            mainText: data.diagnosis?.mainText || `Active monitoring for ${cityInput} compiled.`,
            bullets: data.diagnosis?.bullets || [
              "Live environmental data retrieved",
              "Primary readings processed",
              "Sub-index models calibrated"
            ]
          },
          timelineStatus: "Telemetry tracked",
          timeline: data.timeline || [
            { year: "2010", score: 65 },
            { year: "2015", score: 68 },
            { year: "2020", score: 72 },
            { year: "2026", score: data.overallScore || 70 }
          ],
          recommendations: data.recommendations
            ? data.recommendations.map((rec: string, i: number) => ({ id: i + 1, title: rec }))
            : [
                { id: 1, title: "Expand urban forest coverage along high-density transport vectors." },
                { id: 2, title: "Upgrade regional solid waste processing facilities." }
              ]
        });
        setActiveTab("dashboard");
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/60 p-6 flex flex-col justify-between hidden lg:flex bg-[#080D1A] shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-tight">DNA of a City</h1>
              <p className="text-[11px] text-slate-400 font-medium">AI Environmental Health Scanner</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <SidebarLink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarLink icon={<FileText className="w-4 h-4" />} label="City Report" active={activeTab === "report"} onClick={() => setActiveTab("report")} />
            <SidebarLink icon={<ArrowLeftRight className="w-4 h-4" />} label="Compare Cities" active={activeTab === "compare"} onClick={() => setActiveTab("compare")} />
            <SidebarLink icon={<Clock className="w-4 h-4" />} label="Timeline" active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")} />
            <SidebarLink icon={<Lightbulb className="w-4 h-4" />} label="Recommendations" active={activeTab === "recommendations"} onClick={() => setActiveTab("recommendations")} />
            <SidebarLink icon={<Bookmark className="w-4 h-4" />} label="Saved Reports" active={activeTab === "saved"} badge={savedReports.length > 0 ? savedReports.length : undefined} onClick={() => setActiveTab("saved")} />
            <SidebarLink icon={<Info className="w-4 h-4" />} label="About" active={activeTab === "about"} onClick={() => setActiveTab("about")} />
          </nav>
        </div>

        <div className="space-y-4">
          <div className="relative w-full h-36 rounded-full overflow-hidden flex items-center justify-center opacity-80">
            <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-transparent to-transparent z-10" />
            <Globe className="w-32 h-32 text-cyan-500/20 animate-pulse" />
          </div>
          <div className="p-3.5 rounded-xl bg-[#0C1222] border border-slate-800/80 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-200 mb-0.5 flex items-center gap-1.5">
              AI for a Better Planet
            </p>
            <p className="text-[10px] text-slate-500 leading-normal">
              Empowering decisions for a sustainable tomorrow.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-[1400px] mx-auto">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Check the <span className="text-emerald-400">Planet Health</span> of Any City
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              AI analyzes real environmental data to generate a comprehensive health profile.
            </p>
          </div>

          <form onSubmit={handleScan} className="flex items-center gap-2">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Enter city name..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0C1222] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/10 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? "Scanning..." : "Scan City"}
            </button>
          </form>
        </div>

        {/* Dynamic Views */}
        {activeTab === "dashboard" && (
          <DashboardView
            report={report}
            isSaved={isSaved}
            handleSaveReport={handleSaveReport}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === "report" && <ReportView report={report} />}
        {activeTab === "compare" && <CompareView report={report} />}
        {activeTab === "timeline" && <TimelineView report={report} />}
        {activeTab === "recommendations" && <RecommendationsView report={report} />}
        {activeTab === "saved" && <SavedView savedReports={savedReports} />}
        {activeTab === "about" && <AboutView />}
      </main>
    </div>
  );
}

// Sidebar Button Helper
function SidebarLink({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
        active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
      }`}
    >
      <div className="flex items-center gap-2.5">{icon}<span>{label}</span></div>
      {badge !== undefined && <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">{badge}</span>}
    </button>
  );
}

// Metric Card Helper
function MetricCard({ icon, label, score, trend, sparkline }: { icon: React.ReactNode; label: string; score: number; trend: string; sparkline: number[] }) {
  const data = sparkline.map((val, i) => ({ val, i }));

  return (
    <div className="p-3.5 rounded-xl bg-[#0C1222] border border-slate-800/80 flex flex-col justify-between space-y-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60">{icon}</div>
        <span className="text-xs font-semibold text-slate-300">{label}</span>
      </div>

      <div>
        <p className="text-xl font-black text-white">
          {score}
          <span className="text-[10px] font-normal text-slate-500">/100</span>
        </p>
        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{trend}</p>
      </div>

      <div className="h-6 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// VIEW 1: DASHBOARD
function DashboardView({ report, isSaved, handleSaveReport, setActiveTab }: any) {
  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-[#0C1222] min-h-[200px] flex items-center p-6 lg:p-8">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter brightness-75 contrast-125"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f30ac4ce09?auto=format&fit=crop&w=1200&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060913] via-[#060913]/90 to-transparent" />

        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Analysis Complete</span>
            </div>

            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {report.cityName}
            </h3>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {report.country}
            </p>

            <p className="text-[11px] text-slate-500 pt-2 font-mono">
              Report generated on<br />
              <span className="text-slate-400">{report.reportDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="8" className="text-slate-800/80" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  fill="transparent"
                  strokeDasharray={289}
                  strokeDashoffset={289 - (289 * report.overallScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white tracking-tight">{report.overallScore}</span>
                <span className="text-[9px] text-slate-400 font-medium">/100</span>
              </div>
            </div>

            <div className="max-w-xs space-y-1">
              <p className="text-xs font-bold text-slate-300">Overall Planet Health</p>
              <p className="text-emerald-400 font-bold text-sm">{report.overallStatus}</p>
              <p className="text-[11px] text-slate-400 leading-snug">
                {report.summary}
              </p>
              <button
                onClick={handleSaveReport}
                className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 rounded-md border border-slate-700 flex items-center gap-1.5 transition"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                {isSaved ? "Saved!" : "Save Report"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Health Score Overview
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <MetricCard
            icon={<Wind className="w-4 h-4 text-sky-400" />}
            label="Air"
            score={report.metrics.air.score}
            trend={report.metrics.air.trend}
            sparkline={report.metrics.air.sparkline}
          />
          <MetricCard
            icon={<Droplets className="w-4 h-4 text-blue-400" />}
            label="Water"
            score={report.metrics.water.score}
            trend={report.metrics.water.trend}
            sparkline={report.metrics.water.sparkline}
          />
          <MetricCard
            icon={<Trees className="w-4 h-4 text-emerald-400" />}
            label="Green Space"
            score={report.metrics.green.score}
            trend={report.metrics.green.trend}
            sparkline={report.metrics.green.sparkline}
          />
          <MetricCard
            icon={<Thermometer className="w-4 h-4 text-amber-500" />}
            label="Climate Risk"
            score={report.metrics.climate.score}
            trend={report.metrics.climate.trend}
            sparkline={report.metrics.climate.sparkline}
          />
          <MetricCard
            icon={<Recycle className="w-4 h-4 text-yellow-500" />}
            label="Waste"
            score={report.metrics.waste.score}
            trend={report.metrics.waste.trend}
            sparkline={report.metrics.waste.sparkline}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0C1222] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <h5 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              AI Diagnosis
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {report.diagnosis.mainText}
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              {report.diagnosis.bullets.map((b: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => setActiveTab("report")} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition self-start pt-2">
            View Full Analysis <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[#0C1222] border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div>
            <h5 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              City Health Timeline
            </h5>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.timeline}>
                  <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#060913", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="score" stroke="#eab308" strokeWidth={2} dot={{ fill: "#eab308", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Status: </span>
            {report.timelineStatus}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0C1222] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <h5 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Top Recommendations
            </h5>
            <div className="space-y-2.5">
              {report.recommendations.map((rec: any) => (
                <div key={rec.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center gap-3 text-xs">
                  <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/20">
                    {rec.id}
                  </span>
                  <p className="text-slate-300 text-[11px] leading-tight">{rec.title}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveTab("recommendations")} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition self-start pt-2">
            View All Recommendations <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// VIEW 2: CITY REPORT
function ReportView({ report }: any) {
  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Full Diagnostic Report: {report.cityName}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Region: {report.country} • Last updated: {report.reportDate}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-400">{report.overallScore}/100</span>
          <p className="text-xs text-slate-400">{report.overallStatus}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-200">Executive Summary</h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/60">
          {report.diagnosis.mainText}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-200">Key Diagnostic Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {report.diagnosis.bullets.map((b: string, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
              <span className="text-slate-300">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// VIEW 3: COMPARE CITIES (WITH TOP 10 CLEANEST BENCHMARKS)
function CompareView({ report }: any) {
  const benchmarkCities = [
    { name: "🇸🇬 Singapore", country: "Singapore", overall: 92, air: 88, water: 95, green: 90, climate: 85, waste: 96 },
    { name: "🇯🇵 Tokyo", country: "Japan", overall: 90, air: 89, water: 94, green: 82, climate: 84, waste: 95 },
    { name: "🇨🇭 Zurich", country: "Switzerland", overall: 89, air: 91, water: 96, green: 88, climate: 82, waste: 93 },
    { name: "🇩🇰 Copenhagen", country: "Denmark", overall: 88, air: 90, water: 92, green: 86, climate: 80, waste: 91 },
    { name: "🇦🇹 Vienna", country: "Austria", overall: 87, air: 88, water: 95, green: 87, climate: 79, waste: 90 },
    { name: "🇫🇮 Helsinki", country: "Finland", overall: 87, air: 93, water: 95, green: 89, climate: 78, waste: 88 },
    { name: "🇳🇴 Oslo", country: "Norway", overall: 86, air: 92, water: 94, green: 88, climate: 77, waste: 89 },
    { name: "🇮🇸 Reykjavík", country: "Iceland", overall: 86, air: 96, water: 98, green: 84, climate: 75, waste: 85 },
    { name: "🇳🇿 Wellington", country: "New Zealand", overall: 85, air: 94, water: 93, green: 87, climate: 76, waste: 84 },
    { name: "🇩🇪 Munich", country: "Germany", overall: 84, air: 86, water: 91, green: 83, climate: 78, waste: 89 }
  ];

  const userCity = {
    name: `📍 ${report.cityName} (Your City)`,
    country: report.country,
    overall: report.overallScore,
    air: report.metrics.air.score,
    water: report.metrics.water.score,
    green: report.metrics.green.score,
    climate: report.metrics.climate.score,
    waste: report.metrics.waste.score,
    isUserCity: true
  };

  const combinedList = [userCity, ...benchmarkCities].sort((a, b) => b.overall - a.overall);

  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
          Global Environmental Benchmark Comparison
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Comparing <strong>{report.cityName}</strong> against the world's top 10 cleanest benchmark cities.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Position</span>
          <p className="text-sm font-bold text-white mt-0.5">
            {report.cityName} ranks <span className="text-emerald-400">#{combinedList.findIndex(c => c.isUserCity) + 1}</span> out of {combinedList.length} monitored cities.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Global Benchmark Average: <strong className="text-slate-200">87.4 / 100</strong>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 text-[11px] font-medium">
              <th className="pb-3 font-semibold">Rank</th>
              <th className="pb-3 font-semibold">City & Country</th>
              <th className="pb-3 font-semibold">Overall Index</th>
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
                    ? "bg-emerald-500/10 border-l-4 border-l-emerald-400 font-bold" 
                    : "hover:bg-slate-900/40"
                }`}
              >
                <td className="py-3.5 px-2 text-slate-400 font-mono">#{i + 1}</td>
                <td className={`py-3.5 ${c.isUserCity ? "text-emerald-400 font-bold" : "text-white"}`}>
                  <div>
                    <span>{c.name}</span>
                    <p className="text-[10px] text-slate-500 font-normal">{c.country}</p>
                  </div>
                </td>
                <td className="py-3.5 font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span>{c.overall} / 100</span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                      <div 
                        className={`h-full rounded-full ${c.isUserCity ? "bg-emerald-400" : "bg-cyan-400"}`} 
                        style={{ width: `${c.overall}%` }} 
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3.5 text-slate-300">{c.air}</td>
                <td className="py-3.5 text-slate-300">{c.water}</td>
                <td className="py-3.5 text-slate-300">{c.green}</td>
                <td className="py-3.5 text-slate-300">{c.climate}</td>
                <td className="py-3.5 text-slate-300">{c.waste}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// VIEW 4: TIMELINE
function TimelineView({ report }: any) {
  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Multi-Year Health Trajectory
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Historical score evolution over time for {report.cityName}.
        </p>
      </div>

      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={report.timeline}>
            <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#060913", borderColor: "#1e293b", borderRadius: "8px", fontSize: "12px" }} />
            <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={3} dot={{ fill: "#38bdf8", r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300">
        <span className="font-bold text-white">Trajectory Note: </span>
        {report.timelineStatus}
      </div>
    </div>
  );
}

// VIEW 5: RECOMMENDATIONS
function RecommendationsView({ report }: any) {
  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-5">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Actionable Policy Recommendations
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Recommended interventions to improve indicators in {report.cityName}.
        </p>
      </div>

      <div className="space-y-3">
        {report.recommendations.map((rec: any) => (
          <div key={rec.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-start gap-3.5 text-xs">
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/20 text-xs">
              {rec.id}
            </span>
            <div>
              <h4 className="font-semibold text-slate-200 mb-1">Priority Strategy #{rec.id}</h4>
              <p className="text-slate-400 leading-relaxed">{rec.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// VIEW 6: SAVED REPORTS
function SavedView({ savedReports }: any) {
  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-5">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-emerald-400" />
        Saved Reports ({savedReports.length})
      </h3>

      {savedReports.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-slate-800/50">
          <p className="text-xs text-slate-400">No saved reports yet. Click "Save Report" on the Dashboard after scanning a city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedReports.map((item: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">{item.cityName}</h4>
                <span className="text-emerald-400 font-bold">{item.overallScore}/100</span>
              </div>
              <p className="text-slate-400 line-clamp-2">{item.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// VIEW 7: ABOUT
function AboutView() {
  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-4 text-xs text-slate-300">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Info className="w-5 h-5 text-cyan-400" />
        About DNA of a City
      </h3>
      <p className="leading-relaxed">
        DNA of a City processes environmental telemetry to build urban health scores covering air quality, water safety, green cover, climate vulnerability, and waste management systems.
      </p>
    </div>
  );
}