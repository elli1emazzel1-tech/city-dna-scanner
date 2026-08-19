"use client";
import CityMap from "@/components/CityMap";
import GlobeGraphic from "@/components/GlobeGraphic"; // If you're using this elsewhere too
import React, { useState } from "react";
import { 
  Activity, 
  MapPin, 
  Search, 
  Wind, 
  Droplets, 
  Sun, 
  ShieldAlert, 
  TrendingUp, 
  Globe, 
  Layers, 
  FileText, 
  Settings, 
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Database,
  Download,
  Share2,
  Bell,
  Cpu,
  BarChart3,
  Sliders,
  Zap,
  Target,
  RefreshCw,
  Compass,
  Layers3,
  Flame
} from "lucide-react";

export default function Dashboard() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedCity, setSelectedCity] = useState("New York, USA");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Feature 1: Urban Heat Island (UHI) Simulator States
  const [treeCoverage, setTreeCoverage] = useState<number>(25);
  const [whiteRoof, setWhiteRoof] = useState<number>(30);
  const [industrialCap, setIndustrialCap] = useState<number>(15);
  const [pavementReflectivity, setPavementReflectivity] = useState<number>(20);

  // Feature 2: Citizen Crowdsourcing & Hazard Reporting States
  const [reports, setReports] = useState([
    { id: 1, type: "Illegal Dumping", location: "District 4 Industrial Zone", severity: "High", status: "Pending", date: "Aug 18, 2026" },
    { id: 2, type: "Clogged Drainage", location: "Sector 7 Market", severity: "Medium", status: "In Progress", date: "Aug 18, 2026" },
    { id: 3, type: "Toxic Smoke Emissions", location: "Harbor Port 3", severity: "Critical", status: "Dispatched", date: "Aug 17, 2026" }
  ]);
  const [newHazard, setNewHazard] = useState({ 
    type: "Illegal Dumping", 
    location: "", 
    severity: "High", 
    description: "" 
  });

  // Feature 3: Flash Flood & Stormwater Risk Predictor States
  const [rainfall, setRainfall] = useState<number>(12);
  const [drainageCapacity, setDrainageCapacity] = useState<number>(70);
  const [tideLevel, setTideLevel] = useState<number>(2.4);

  // Additional Environmental Metric States
  const [airQualityIndex, setAirQualityIndex] = useState<number>(47);
  const [waterPurityScore, setWaterPurityScore] = useState<number>(88);
  const [greenCanopyIndex, setGreenCanopyIndex] = useState<number>(34);
  const [carbonEmissionRate, setCarbonEmissionRate] = useState<number>(412);
  const [noisePollutionLevel, setNoisePollutionLevel] = useState<number>(62);

  // AI Recommendation List State
  const [recommendations, setRecommendations] = useState([
    { id: 1, title: "Expand Urban Forest Canopy", category: "Ecology", impact: "+14% Air Purity", status: "Recommended" },
    { id: 2, title: "Mandatory Cool-Roof Retrofits", category: "Climate", impact: "-2.2°C UHI Drop", status: "High Priority" },
    { id: 3, title: "Stormwater Retention Basins", category: "Infrastructure", impact: "Risk Reduction", status: "Active" },
    { id: 4, title: "Industrial Emission Cap Enforcement", category: "Policy", impact: "-30% Particulates", status: "Pending Review" }
  ]);

  // Historical Timeline Data State
  const timelineData = [
    { year: "2018", score: 52, height: "52%", isHighlighted: false, isForecast: false },
    { year: "2020", score: 58, height: "58%", isHighlighted: false, isForecast: false },
    { year: "2022", score: 64, height: "64%", isHighlighted: false, isForecast: false },
    { year: "2024", score: 71, height: "71%", isHighlighted: true, isForecast: false },
    { year: "2026 (Current)", score: 78, height: "78%", isHighlighted: true, isForecast: false },
    { year: "2028 (Est.)", score: 83, height: "83%", isHighlighted: false, isForecast: true },
    { year: "2030 (Est.)", score: 91, height: "91%", isHighlighted: false, isForecast: true }
  ];

  // Top 10 Cleanest Cities Data
  const cleanestCities = [
    { rank: 1, city: "Copenhagen", country: "Denmark", score: 96.4, change: "+1.2%" },
    { rank: 2, city: "Zurich", country: "Switzerland", score: 95.8, change: "+0.8%" },
    { rank: 3, city: "Stockholm", country: "Sweden", score: 94.2, change: "+1.5%" },
    { rank: 4, city: "Vienna", country: "Austria", score: 93.1, change: "+0.4%" },
    { rank: 5, city: "Singapore", country: "Singapore", score: 92.5, change: "+2.1%" },
    { rank: 6, city: "Helsinki", country: "Finland", score: 91.9, change: "+0.7%" },
    { rank: 7, city: "Oslo", country: "Norway", score: 91.3, change: "+1.1%" },
    { rank: 8, city: "Tokyo", country: "Japan", score: 89.8, change: "+0.5%" },
    { rank: 9, city: "Vancouver", country: "Canada", score: 88.4, change: "-0.2%" },
    { rank: 10, city: "Amsterdam", country: "Netherlands", score: 87.9, change: "+1.4%" }
  ];

  // Handler for scanning city simulation
  const handleCityScan = () => {
    if (!searchQuery) return;
    setIsScanning(true);
    setTimeout(() => {
      setSelectedCity(searchQuery);
      setAirQualityIndex(Math.floor(Math.random() * 60) + 25);
      setWaterPurityScore(Math.floor(Math.random() * 25) + 75);
      setGreenCanopyIndex(Math.floor(Math.random() * 40) + 20);
      setCarbonEmissionRate(Math.floor(Math.random() * 200) + 300);
      setIsScanning(false);
      setSearchQuery("");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex font-sans selection:bg-[#22FFAA]/30 selection:text-[#22FFAA]">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0B0F1A]/95 backdrop-blur-2xl hidden md:flex flex-col justify-between p-5 sticky top-0 h-screen z-40">
        <div>
          {/* Logo Area */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-2xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 flex items-center justify-center text-[#22FFAA] shadow-[0_0_20px_rgba(34,255,170,0.25)]">
              <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-white flex items-center gap-1 text-base">
                DNA<span className="text-[#22FFAA]">·</span>City
              </h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Urban Intelligence Engine</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {[
              { name: "Dashboard", icon: Activity },
              { name: "City Report", icon: FileText },
              { name: "Compare Cities", icon: Layers },
              { name: "Timeline", icon: TrendingUp },
              { name: "Recommendations", icon: ShieldAlert },
              { name: "Saved Reports", icon: Globe },
              { name: "About", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#22FFAA]/10 text-[#22FFAA] border border-[#22FFAA]/25 shadow-[0_0_20px_rgba(34,255,170,0.12)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar System Status Footer */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/80 to-[#131B2E]/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Neural Telemetry
            </span>
            <span className="font-mono text-[10px] text-slate-500">v4.8.2</span>
          </div>
          <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
            <div className="bg-[#22FFAA] h-full w-[94%]"></div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between font-mono">
            <span>Nodes: 2,410 Active</span>
            <span className="text-[#22FFAA]">99.9% Up</span>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP NAVBAR & HEADER BANNER */}
        <header className="p-6 md:p-8 pb-4 space-y-6">
          
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0B0F1A]/90 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"></div>
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  Active Region: <span className="text-[#22FFAA] font-mono">{selectedCity}</span>
                </h4>
                <p className="text-[11px] text-slate-400">All biological & geospatial sensors synchronized successfully.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                Timestamp: Aug 18, 2026 · 19:42 UTC
              </span>
              <button 
                onClick={() => alert("Telemetry export initiated. CSV package ready.")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 text-[#22FFAA] hover:bg-[#22FFAA]/20 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export Audit
              </button>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#131B2E] via-[#0D1526] to-[#0B0F1A] border border-slate-800/80 p-6 md:p-10 overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#22FFAA]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#22FFAA] bg-[#22FFAA]/10 border border-[#22FFAA]/20 px-3.5 py-1 rounded-full mb-3 inline-block shadow-sm">
                Intelligent Insights. Healthier Cities.
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                Decode Cities with <span className="text-[#22FFAA]">AI Intelligence</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mb-6 leading-relaxed">
                Analyze environmental health, simulate urban climate interventions, report civic hazards, and predict extreme weather patterns in real-time.
              </p>

              {/* Search Bar & City Scanner */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-[#0B0F1A]/95 border border-slate-700/80 p-2.5 rounded-2xl max-w-xl shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2 w-full px-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCityScan()}
                    placeholder="Search any city, e.g., Tokyo, London, Singapore..."
                    className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-slate-500"
                  />
                </div>
                <button 
                  onClick={handleCityScan}
                  disabled={isScanning}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#22FFAA] text-slate-950 font-semibold text-xs rounded-xl hover:bg-[#1edb95] transition whitespace-nowrap shadow-[0_0_15px_rgba(34,255,170,0.3)] flex items-center justify-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    "Scan City"
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT CONTAINER */}
        <div className="px-6 md:px-8 pb-12 space-y-6">

          {/* SECTION 1: 5 CORE ECOLOGICAL VECTORS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#22FFAA]" />
                  5 Core Ecological Vectors · {selectedCity}
                </h3>
                <p className="text-xs text-slate-400">Live multi-spectral telemetry tracking biological and industrial parameters.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                All Systems Normal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Metric 1: Air Quality */}
              <div className="p-4 rounded-2xl bg-[#0B0F1A]/85 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between hover:border-[#22FFAA]/40 transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
                    <Wind className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Improving</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Air Quality Index</span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{airQualityIndex} <span className="text-xs text-cyan-400 font-normal">AQI</span></div>
                </div>
                <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full" style={{ width: `${Math.min(airQualityIndex, 100)}%` }}></div>
                </div>
              </div>

              {/* Metric 2: Water Purity */}
              <div className="p-4 rounded-2xl bg-[#0B0F1A]/85 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between hover:border-[#22FFAA]/40 transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Stable</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Water Purity Score</span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{waterPurityScore}%</div>
                </div>
                <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full" style={{ width: `${waterPurityScore}%` }}></div>
                </div>
              </div>

              {/* Metric 3: Green Canopy */}
              <div className="p-4 rounded-2xl bg-[#0B0F1A]/85 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between hover:border-[#22FFAA]/40 transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Target: 40%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Green Canopy Density</span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{greenCanopyIndex}%</div>
                </div>
                <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${greenCanopyIndex}%` }}></div>
                </div>
              </div>

              {/* Metric 4: Carbon Emissions */}
              <div className="p-4 rounded-2xl bg-[#0B0F1A]/85 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between hover:border-[#22FFAA]/40 transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">-8.4% YoY</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Carbon Output Rate</span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{carbonEmissionRate} <span className="text-xs text-slate-400 font-normal">kt/mo</span></div>
                </div>
                <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              {/* Metric 5: Acoustic Noise */}
              <div className="p-4 rounded-2xl bg-[#0B0F1A]/85 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between hover:border-[#22FFAA]/40 transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Moderate</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Noise Pollution Level</span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{noisePollutionLevel} <span className="text-xs text-purple-400 font-normal">dB</span></div>
                </div>
                <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full" style={{ width: `${noisePollutionLevel}%` }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: THE 3 COMPETITION SOLUTION FEATURES (GRID) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* FEATURE 1: Urban Heat Island (UHI) Simulator */}
            <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Sun className="w-4 h-4" />
                    </div>
                    <h3 className="text-white font-bold text-sm">UHI Policy Simulator</h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Interactive Sandbox</span>
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">Simulate municipal interventions to mitigate peak summer urban temperatures in real time.</p>

                {/* Sliders Container */}
                <div className="space-y-4">
                  {/* Tree Canopy */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Tree Canopy Coverage</span>
                      <span className="font-mono text-[#22FFAA]">{treeCoverage}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="80" 
                      value={treeCoverage} 
                      onChange={(e) => setTreeCoverage(Number(e.target.value))}
                      className="w-full accent-[#22FFAA] cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>

                  {/* Cool Roof Adoption */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Cool / White Roof Adoption</span>
                      <span className="font-mono text-[#22FFAA]">{whiteRoof}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={whiteRoof} 
                      onChange={(e) => setWhiteRoof(Number(e.target.value))}
                      className="w-full accent-[#22FFAA] cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>

                  {/* Industrial Emission Cap */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Industrial Heat Cap</span>
                      <span className="font-mono text-[#22FFAA]">{industrialCap}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={industrialCap} 
                      onChange={(e) => setIndustrialCap(Number(e.target.value))}
                      className="w-full accent-[#22FFAA] cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Cooling Impact Badge */}
              <div className="mt-6 p-4 rounded-2xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[11px] text-[#22FFAA] font-semibold block">Predicted Summer Cooling:</span>
                  <span className="text-[10px] text-slate-400">Model verified via satellite telemetry</span>
                </div>
                <span className="text-lg font-extrabold text-white font-mono">
                  -{(treeCoverage * 0.032 + whiteRoof * 0.018 + industrialCap * 0.025).toFixed(1)} °C
                </span>
              </div>
            </div>

            {/* FEATURE 2: Citizen Crowdsourcing & Hazard Reporting */}
            <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-white font-bold text-sm">Citizen Hazard Crowdsourcing</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Live Node Feed</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">Log civic environmental infractions directly into municipal grid queues.</p>

                {/* Form Input Area */}
                <div className="space-y-2.5 mb-4">
                  <select 
                    value={newHazard.type} 
                    onChange={(e) => setNewHazard({...newHazard, type: e.target.value})}
                    className="w-full bg-[#131B2E] border border-slate-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-[#22FFAA] transition"
                  >
                    <option value="Illegal Dumping">Illegal Waste Dumping</option>
                    <option value="Clogged Drainage">Clogged Storm Drain</option>
                    <option value="Toxic Smoke">Toxic Smoke Emissions</option>
                    <option value="Broken Water Pipe">Broken Water Main</option>
                  </select>

                  <input 
                    type="text" 
                    placeholder="Enter Street Name or District..." 
                    value={newHazard.location}
                    onChange={(e) => setNewHazard({...newHazard, location: e.target.value})}
                    className="w-full bg-[#131B2E] border border-slate-800 text-xs text-white p-2.5 rounded-xl outline-none placeholder:text-slate-500 focus:border-[#22FFAA] transition"
                  />

                  <button 
                    onClick={() => {
                      if (!newHazard.location) return;
                      setReports([{ 
                        id: Date.now(), 
                        type: newHazard.type, 
                        location: newHazard.location, 
                        severity: "High", 
                        status: "Pending",
                        date: "Aug 18, 2026"
                      }, ...reports]);
                      setNewHazard({ ...newHazard, location: "" });
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#22FFAA] text-slate-950 font-semibold text-xs hover:bg-[#1edb95] transition shadow-[0_0_15px_rgba(34,255,170,0.2)]"
                  >
                    Submit Report to Grid
                  </button>
                </div>
              </div>

              {/* Reports Live Feed */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {reports.map((r) => (
                  <div key={r.id} className="p-2.5 rounded-xl bg-[#131B2E] border border-slate-800/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white font-medium block">{r.type}</span>
                      <span className="text-[10px] text-slate-400">{r.location}</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px] border border-amber-500/20">
                      {r.status}
                    </span>
                  </div>
                ))}
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
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Topography Model</span>
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">Real-time stormwater capacity analysis based on precipitation rates.</p>

                {/* Rainfall Slider */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Precipitation Rate</span>
                      <span className="font-mono text-cyan-400">{rainfall} mm/hr</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="60" 
                      value={rainfall} 
                      onChange={(e) => setRainfall(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Drainage Capacity</span>
                      <span className="font-mono text-cyan-400">{drainageCapacity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="30" 
                      max="100" 
                      value={drainageCapacity} 
                      onChange={(e) => setDrainageCapacity(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Risk Box */}
              <div className={`mt-6 p-4 rounded-2xl border flex flex-col gap-1.5 shadow-inner ${
                rainfall > 35 || drainageCapacity < 50
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                  : rainfall > 20 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{rainfall > 35 ? 'Critical Flood Alert' : rainfall > 20 ? 'Moderate Caution' : 'Normal Drainage Status'}</span>
                  <span className="font-mono">{rainfall > 35 ? 'Risk: 89%' : rainfall > 20 ? 'Risk: 44%' : 'Risk: 11%'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {rainfall > 35 
                    ? 'AI Action: Reroute low-elevation traffic & engage emergency pumps.' 
                    : 'Municipal stormwater networks operating safely within thresholds.'}
                </p>
              </div>
            </div>

          </div>

          {/* SECTION 3: GEOSPATIAL TELEMETRY MAP & AI RECOMMENDATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Geospatial Map Panel */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#22FFAA]" />
                    <h3 className="text-white font-bold text-sm">Geospatial Telemetry Grid & Sector Radar</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs text-slate-400 font-mono">Live Sector Map</span>
                  </div>
                </div>
                
                {/* Simulated Telemetry Map Box */}
                <CityMap selectedCity={selectedCity} airQualityIndex={airQualityIndex} />
                  <div className="absolute inset-0 bg-[radial-gradient(#22FFAA_1px,transparent_1px)] [background-size:20px_20px] opacity-15"></div>
                  
                  {/* Radar Scanning Ring Effect */}
                  <div className="absolute w-48 h-48 rounded-full border border-[#22FFAA]/20 animate-ping pointer-events-none"></div>
                  
                  {/* Map Hotspots */}
                  <div className="absolute top-12 left-20 px-3 py-1.5 rounded-xl bg-[#0B0F1A]/90 border border-[#22FFAA]/30 text-[10px] font-mono text-[#22FFAA] shadow-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22FFAA] animate-pulse"></span>
                    Central Hub: 47 AQI
                  </div>

                  <div className="absolute bottom-16 right-24 px-3 py-1.5 rounded-xl bg-[#0B0F1A]/90 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 shadow-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    Industrial Vector: Active
                  </div>

                  <div className="text-center z-10 space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#22FFAA]/10 border border-[#22FFAA]/30 flex items-center justify-center mx-auto text-[#22FFAA] shadow-[0_0_20px_rgba(34,255,170,0.2)]">
                      <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '15s' }} />
                    </div>
                    <p className="text-xs text-slate-200 font-semibold">Autonomous Sensor Grid Synchronized</p>
                    <span className="text-[10px] text-slate-400 font-mono block">Target Coordinates: 40.7128° N, 74.0060° W · 1,420 Active Nodes</span>
                  </div>
                </div>
              </div>

              {/* Map Controls Footer */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <span className="font-mono">Elevation: 12m ASL</span>
                <div className="flex gap-4">
                  <span className="text-[#22FFAA]">● Thermal Layer</span>
                  <span className="text-cyan-400">● Hydrology</span>
                  <span className="text-amber-400">● Carbon Flux</span>
                </div>
              </div>
            </div>

            {/* AI Recommendations List Panel */}
            <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <ShieldAlert className="w-4 h-4 text-[#22FFAA]" />
                  <h3 className="text-white font-bold text-sm">AI Urban Recommendations</h3>
                </div>

                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800/70 text-xs space-y-1 hover:border-[#22FFAA]/30 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#22FFAA] bg-[#22FFAA]/10 px-2 py-0.5 rounded">{rec.category}</span>
                        <span className="text-[10px] font-mono text-slate-400">{rec.status}</span>
                      </div>
                      <strong className="text-white block">{rec.title}</strong>
                      <p className="text-[11px] text-slate-400">Expected Impact: <span className="text-emerald-400 font-semibold">{rec.impact}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => alert("Full AI Audit report generated and queued for export.")}
                className="w-full mt-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-md"
              >
                Export Full AI Audit
              </button>
            </div>

          </div>

          {/* SECTION 4: GLOBAL TOP 10 CLEANEST CITIES TABLE */}
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#22FFAA]" />
                  Global Top 10 Cleanest Cities Benchmark
                </h3>
                <p className="text-xs text-slate-400">Real-time international ranking based on multi-vector biological telemetry.</p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                Updated Live
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Telemetry Score</th>
                    <th className="py-3 px-4 text-right">YoJ Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {cleanestCities.map((item) => (
                    <tr key={item.rank} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#22FFAA]">#{item.rank}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{item.city}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.country}</td>
                      <td className="py-3.5 px-4 font-mono text-cyan-400">{item.score} / 100</td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400">{item.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5: DECADE VIEW HISTORICAL TIMELINE */}
          <div className="p-6 rounded-3xl bg-[#0B0F1A]/90 border border-slate-800/80 backdrop-blur-2xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#22FFAA]" />
                  Decade View · Historical & Predictive Urban Timeline
                </h3>
                <p className="text-xs text-slate-400">Tracking environmental evolution and future AI projections from 2018 to 2030.</p>
              </div>
              <span className="text-xs font-mono text-[#22FFAA] bg-[#22FFAA]/10 border border-[#22FFAA]/20 px-3 py-1 rounded-xl">
                AI Forecast Model Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 pt-4">
              {timelineData.map((t, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  t.isHighlighted 
                    ? 'bg-[#22FFAA]/10 border-[#22FFAA]/40 shadow-[0_0_20px_rgba(34,255,170,0.1)]' 
                    : t.isForecast 
                    ? 'bg-slate-900/40 border-slate-800/80 border-dashed' 
                    : 'bg-[#131B2E] border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-slate-400">{t.year}</span>
                    {t.isForecast && <span className="text-[9px] font-mono text-[#22FFAA]">Est.</span>}
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-extrabold text-white font-mono">{t.score}</div>
                    <span className="text-[10px] text-slate-400">Health Score</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full ${t.isForecast ? 'bg-[#22FFAA]/60' : 'bg-[#22FFAA]'}`} style={{ width: t.height }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}