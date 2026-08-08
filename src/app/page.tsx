"use client";

import React, { useState, useEffect } from "react";
import {
  Wind,
  Droplets,
  Trees,
  ShieldAlert,
  Trash2,
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
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  ChevronRight,
  Sparkles,
  Save,
  Trash,
  HelpCircle,
  X
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function Home() {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    const localSaved = localStorage.getItem("city_saved_reports");
    if (localSaved) {
      try {
        setSavedReports(JSON.parse(localSaved));
      } catch (e) {
        console.error("Failed to parse saved reports", e);
      }
    }
  }, []);

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
        setReport(data);
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

  const handleSaveReport = () => {
    if (!report) return;
    const exists = savedReports.some((r) => r.cityName === report.cityName);
    if (!exists) {
      const updated = [
        ...savedReports,
        { ...report, savedAt: new Date().toLocaleDateString() }
      ];
      setSavedReports(updated);
      localStorage.setItem("city_saved_reports", JSON.stringify(updated));
    }
  };

  const handleDeleteSaved = (cityName: string) => {
    const updated = savedReports.filter((r) => r.cityName !== cityName);
    setSavedReports(updated);
    localStorage.setItem("city_saved_reports", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 p-6 flex flex-col justify-between hidden lg:flex bg-[#0A0E1A] shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight">DNA of a City</h1>
              <p className="text-[11px] text-slate-400 font-medium">Environmental Health Engine</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <SidebarLink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarLink icon={<FileText className="w-4 h-4" />} label="City Report" active={activeTab === "report"} onClick={() => setActiveTab("report")} />
            <SidebarLink icon={<ArrowLeftRight className="w-4 h-4" />} label="Compare Cities" active={activeTab === "compare"} onClick={() => setActiveTab("compare")} />
            <SidebarLink icon={<Clock className="w-4 h-4" />} label="Timeline" active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")} />
            <SidebarLink icon={<Lightbulb className="w-4 h-4" />} label="Recommendations" active={activeTab === "recommendations"} onClick={() => setActiveTab("recommendations")} />
            <SidebarLink icon={<Bookmark className="w-4 h-4" />} label="Saved Reports" active={activeTab === "saved"} badge={savedReports.length > 0 ? savedReports.length : undefined} onClick={() => setActiveTab("saved")} />
            <SidebarLink icon={<Info className="w-4 h-4" />} label="Methodology" active={activeTab === "about"} onClick={() => setActiveTab("about")} />
          </nav>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 text-xs text-slate-400">
          <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Data-Driven Planet Health
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Combining municipal frameworks & live sensor telemetry.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto max-w-[1400px] mx-auto">
        {/* Top Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Environmental Health Index <span className="text-emerald-400">Scanner</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Calibrated environmental diagnostic & policy recommendation engine.
            </p>
          </div>

          <form onSubmit={handleScan} className="flex items-center gap-2">
            <div className="relative w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter city (e.g. Mumbai, Tokyo)..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0E1424] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? "Analyzing..." : "Scan City"}
            </button>
          </form>
        </div>

        {/* TAB: DASHBOARD / REPORT */}
        {(activeTab === "dashboard" || activeTab === "report") && (
          <>
            {/* Banner Header */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 min-h-[220px] flex items-center p-8 lg:p-10">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 transition-all duration-700 filter brightness-75 contrast-125"
                style={{
                  backgroundImage: `url(${report?.imageUrl || "https://images.unsplash.com/photo-1477959858617-67f30ac4ce09?auto=format&fit=crop&w=1200&q=80"})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070A11] via-[#070A11]/80 to-transparent" />

              <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{report ? "Analysis Complete" : "Awaiting Scan"}</span>
                    </div>

                    <button
                      onClick={() => setShowMethodology(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold border border-cyan-500/20 backdrop-blur-md hover:bg-cyan-500/20 transition"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>How is this calculated?</span>
                    </button>

                    {report && (
                      <button
                        onClick={handleSaveReport}
                        className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                      >
                        <Save className="w-3 h-3 text-emerald-400" />
                        Save
                      </button>
                    )}
                  </div>

                  <h3 className="text-4xl font-black text-white tracking-tight">
                    {report?.cityName || "City Diagnostic"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {report?.country || "Enter a city to load dataset profile"}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg pt-1">
                    {report?.summary || "Run a city scan to analyze local air, water, canopy, climate resilience, and waste management indicators."}
                  </p>
                </div>

                {/* Score Dial */}
                <div className="flex flex-col items-end gap-2 self-start md:self-auto">
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-300">City Health Index</p>
                      <p className="text-emerald-400 text-sm font-semibold mt-0.5">{report?.overallStatus || "Pending Scan"}</p>
                    </div>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="52" stroke="currentColor" strokeWidth="10" className="text-slate-800/80" fill="transparent" />
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          stroke="currentColor"
                          strokeWidth="10"
                          className="text-emerald-400 transition-all duration-1000 ease-out"
                          fill="transparent"
                          strokeDasharray={326}
                          strokeDashoffset={326 - (326 * (report?.overallScore || 0)) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-white tracking-tight">{report?.overallScore || 0}</span>
                        <span className="text-[10px] text-slate-400 font-medium">/100</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Weighted: Air(25%) + Water(20%) + Nature(20%) + Climate(20%) + Waste(15%)
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Overview Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold tracking-wide uppercase text-slate-400">
                  Core Environmental Metrics & Sub-Indicators
                </h4>
                <button
                  onClick={() => setShowMethodology(true)}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" /> View Indicator Breakdown
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                  icon={<Wind className="w-4 h-4 text-sky-400" />}
                  label="Air Quality"
                  score={report?.metrics?.air?.score || 0}
                  trend={report?.metrics?.air?.trend || "N/A"}
                  sparkline={report?.metrics?.air?.sparkline || [0, 0, 0, 0, 0]}
                  indicators={report?.metrics?.air?.indicators}
                />
                <MetricCard
                  icon={<Droplets className="w-4 h-4 text-blue-400" />}
                  label="Water Quality"
                  score={report?.metrics?.water?.score || 0}
                  trend={report?.metrics?.water?.trend || "N/A"}
                  sparkline={report?.metrics?.water?.sparkline || [0, 0, 0, 0, 0]}
                  indicators={report?.metrics?.water?.indicators}
                />
                <MetricCard
                  icon={<Trees className="w-4 h-4 text-emerald-400" />}
                  label="Green Canopy"
                  score={report?.metrics?.nature?.score || 0}
                  trend={report?.metrics?.nature?.trend || "N/A"}
                  sparkline={report?.metrics?.nature?.sparkline || [0, 0, 0, 0, 0]}
                  indicators={report?.metrics?.nature?.indicators}
                />
                <MetricCard
                  icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
                  label="Climate Resilience"
                  score={report?.metrics?.climate?.score || 0}
                  trend={report?.metrics?.climate?.trend || "N/A"}
                  sparkline={report?.metrics?.climate?.sparkline || [0, 0, 0, 0, 0]}
                  indicators={report?.metrics?.climate?.indicators}
                />
                <MetricCard
                  icon={<Trash2 className="w-4 h-4 text-yellow-400" />}
                  label="Waste Systems"
                  score={report?.metrics?.waste?.score || 0}
                  trend={report?.metrics?.waste?.trend || "N/A"}
                  sparkline={report?.metrics?.waste?.sparkline || [0, 0, 0, 0, 0]}
                  indicators={report?.metrics?.waste?.indicators}
                />
              </div>
            </div>

            {/* AI Diagnosis, Timeline & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#0E1424] border border-slate-800/80 flex flex-col justify-between space-y-4">
                <div>
                  <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    AI Diagnosis & Findings
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {report?.diagnosis?.mainText || "City environmental diagnosis will load after scanning."}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    {report?.diagnosis?.bullets ? (
                      report.diagnosis.bullets.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <span>{b}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-600">No diagnostic bullets loaded.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0E1424] border border-slate-800/80 flex flex-col justify-between space-y-4">
                <div>
                  <h5 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Historical Health Index
                  </h5>
                  <p className="text-[11px] text-slate-400 mb-1">
                    {report?.timelineNote || "Modeled Historical Estimate"}
                  </p>
                  <p className="text-[10px] text-amber-400/80 mb-4 italic">
                    * Derived from station telemetry and historical trend proxies.
                  </p>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={report?.timeline || [{ year: "2015", score: 0 }, { year: "2020", score: 0 }, { year: "2026", score: 0 }]}>
                        <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }} />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0E1424] border border-slate-800/80 flex flex-col justify-between space-y-4">
                <div>
                  <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Policy & Infrastructure Actions
                  </h5>
                  <div className="space-y-3">
                    {report?.recommendations ? (
                      report.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-start gap-3 text-xs">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">
                            {idx + 1}
                          </span>
                          <p className="text-slate-300 leading-relaxed">{rec}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Scan a city to view actionable recommendations.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: SAVED REPORTS */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-emerald-400" />
              Saved City Reports
            </h3>

            {savedReports.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#0E1424] border border-slate-800/80 text-center space-y-3">
                <p className="text-slate-400 text-sm">No saved reports yet.</p>
                <p className="text-xs text-slate-600">Scan any city and click "Save" to bookmark its environmental profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedReports.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#0E1424] border border-slate-800/80 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-base">{item.cityName}</h4>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                          {item.overallScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.country}</p>
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">{item.summary}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <button onClick={() => { setReport(item); setActiveTab("dashboard"); }} className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                        Load Scan <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteSaved(item.cityName)} className="text-slate-500 hover:text-rose-400 transition">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: COMPARE CITIES */}
        {activeTab === "compare" && (
          <div className="p-6 rounded-2xl bg-[#0E1424] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                Cross-City Comparative Index
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3">City</th>
                    <th className="pb-3">Overall Index</th>
                    <th className="pb-3">Air Quality</th>
                    <th className="pb-3">Water Quality</th>
                    <th className="pb-3">Green Canopy</th>
                    <th className="pb-3">Climate Resilience</th>
                    <th className="pb-3">Waste Systems</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {report?.comparedCities ? (
                    report.comparedCities.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 font-semibold text-emerald-400">{c.name}</td>
                        <td className="py-3 font-bold text-white">{c.overall}/100</td>
                        <td className="py-3 text-slate-300">{c.air}/100</td>
                        <td className="py-3 text-slate-300">{c.water}/100</td>
                        <td className="py-3 text-slate-300">{c.nature}/100</td>
                        <td className="py-3 text-slate-300">{c.climate}/100</td>
                        <td className="py-3 text-slate-300">{c.waste}/100</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-500">Scan a city to populate comparative analysis.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: METHODOLOGY */}
        {(activeTab === "about" || activeTab === "timeline" || activeTab === "recommendations") && (
          <div className="p-8 rounded-2xl bg-[#0E1424] border border-slate-800/80 space-y-6 max-w-3xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-400" />
              Scoring Methodology & Data Calibration
            </h3>
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>City DNA</strong> generates normalized environmental health scores (0 to 100) across five core dimensions to enable standard comparative analysis.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/60 space-y-1">
                  <span className="font-bold text-emerald-400 text-sm">1. Weighting Structure</span>
                  <p className="text-[11px] text-slate-400">
                    Overall Score = Air (25%) + Water (20%) + Green Canopy (20%) + Climate Resilience (20%) + Waste Systems (15%).
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/60 space-y-1">
                  <span className="font-bold text-cyan-400 text-sm">2. Live Sensor Integration</span>
                  <p className="text-[11px] text-slate-400">
                    Air quality sub-scores directly convert live global station AQI values into inverted zero-to-100 wellness indexes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1424] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs text-slate-300 relative shadow-2xl">
            <button
              onClick={() => setShowMethodology(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              How City DNA Calculates Scores
            </h4>
            <div className="space-y-2.5">
              <p className="text-slate-300">
                The overall City Health score is calculated directly using a calibrated weighted formula:
              </p>
              <div className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800">
                Score = (Air × 0.25) + (Water × 0.20) + (Canopy × 0.20) + (Resilience × 0.20) + (Waste × 0.15)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
        active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
      }`}
    >
      <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
      {badge !== undefined && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">{badge}</span>}
    </button>
  );
}

function MetricCard({ icon, label, score, trend, sparkline, indicators }: { icon: React.ReactNode; label: string; score: number; trend: string; sparkline: number[]; indicators?: string[] }) {
  const data = sparkline.map((val, i) => ({ val, i }));

  const getTrendIcon = (t: string) => {
    if (t.toLowerCase().includes("improv") || t.toLowerCase().includes("modern")) return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (t.toLowerCase().includes("declin") || t.toLowerCase().includes("unhealth")) return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
    return <Minus className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0E1424] border border-slate-800/80 flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">{icon}</div>
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          {getTrendIcon(trend)}
          {trend}
        </span>
      </div>

      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5">
          {score}
          <span className="text-xs font-normal text-slate-500">/100</span>
        </p>
      </div>

      {indicators && indicators.length > 0 && (
        <div className="space-y-1 border-t border-slate-800/60 pt-2 text-[10px] text-slate-400">
          {indicators.slice(0, 2).map((ind, i) => (
            <p key={i} className="truncate flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-500 shrink-0" />
              {ind}
            </p>
          ))}
        </div>
      )}

      <div className="h-7 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Home;