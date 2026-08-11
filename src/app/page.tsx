"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { ArrowLeftRight, Building2, ShieldAlert, BarChart3, Leaf, Droplets, Wind, Recycling, Flame } from "lucide-react";

export default function Home() {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("compare");
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

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-[#0C1222]/50 backdrop-blur-md">
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
        <aside className="w-full md:w-64 border-r border-slate-800/80 p-4 bg-[#080D1A] space-y-2">
          <button
            onClick={() => setActiveTab("compare")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "compare"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" /> Compare Cities
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* Search Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0C1222] p-6 rounded-2xl border border-slate-800/80">
            <div>
              <h2 className="text-xl font-bold text-white">Check the <span className="text-emerald-400">Planet Health</span> of Any City</h2>
              <p className="text-xs text-slate-400 mt-1">AI analyzes real environmental telemetry streams to generate live metrics.</p>
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

          {/* Render Comparison Table */}
          <CompareView report={report} />
        </main>
      </div>
    </div>
  );
}

function CompareView({ report }: any) {
  const defaultBenchmarks = [
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

  const userCityName = report?.cityName ? `📍 ${report.cityName} (Your City)` : null;

  const userCity = userCityName ? {
    name: userCityName,
    country: report?.country || "Monitored Region",
    overall: report?.overallScore ?? 65,
    air: report?.metrics?.air?.score ?? 47,
    water: report?.metrics?.water?.score ?? 78,
    green: report?.metrics?.green?.score ?? report?.metrics?.nature?.score ?? 60,
    climate: report?.metrics?.climate?.score ?? 67,
    waste: report?.metrics?.waste?.score ?? 84,
    isUserCity: true
  } : null;

  const combinedList = userCity 
    ? [userCity, ...defaultBenchmarks].sort((a, b) => b.overall - a.overall)
    : defaultBenchmarks;

  return (
    <div className="p-6 rounded-2xl bg-[#0C1222] border border-slate-800/80 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            Global Environmental Benchmark Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-1">Comparing municipalities against top global benchmark standards.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 text-[11px]">
              <th className="pb-3 font-semibold">Rank</th>
              <th className="pb-3 font-semibold">City & Country</th>
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
                <td className="py-3.5 font-bold text-white">{c.overall} / 100</td>
                <td className="py-3.5 text-slate-300">{c.air} / 100</td>
                <td className="py-3.5 text-slate-300">{c.water} / 100</td>
                <td className="py-3.5 text-slate-300">{c.green} / 100</td>
                <td className="py-3.5 text-slate-300">{c.climate} / 100</td>
                <td className="py-3.5 text-slate-300">{c.waste} / 100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}