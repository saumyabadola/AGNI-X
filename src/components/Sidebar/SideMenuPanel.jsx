import React, { useState, useEffect, useRef, useMemo } from "react";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import agniLogo from "../../assets/agni-logo.png";
import {
  X,
  Search,
  Sliders,
  Satellite,
  Globe,
  Map,
  Factory,
  Flame,
  Radio,
  RefreshCw,
  Key,
  ChevronRight,
  Sun,
  Moon,
  Play,
  Wind,
  Database
} from "lucide-react";

export function SideMenuPanel({ viewMode, setViewMode }) {
  const {
    isSideMenuOpen,
    closeSideMenu,
    theme,
    toggleTheme,
    // Simulation
    openBacktestingModal,
    activeScenario,
    scenarioStepIndex,
    applySimulationStep,
    // NASA Live
    isNasaKeyConfigured,
    openApiKeyModal,
    fetchHotspots,
    lastSyncTime,
    hotspots,
    // Live Zero-Key Services
    currentWeather,
    isWeatherLive,
    isOsmLive,
    isOsmLoading,
    scanLiveOsmForCurrentView,
    // Industrial & Countries Search
    worldCountries,
    industrialZones,
    selectCountry,
    setSelectedHotspotId,
    flyToIncident,
    activeLayers,
    toggleLayer
  } = useThermaTwin();

  const isDark = theme === "dark";
  const [panelSearchQuery, setPanelSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const drawerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSideMenuOpen) {
        closeSideMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSideMenuOpen, closeSideMenu]);

  // Focus search input when drawer opens
  useEffect(() => {
    if (isSideMenuOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [isSideMenuOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchHotspots) {
      await fetchHotspots();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Unified Search Results: Countries, Industrial Hubs, and Incidents
  const searchResults = useMemo(() => {
    const q = panelSearchQuery.toLowerCase().trim();
    if (!q) return null;

    const matchedCountries = (worldCountries || []).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedZones = (industrialZones || []).filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        (z.state && z.state.toLowerCase().includes(q)) ||
        (z.district && z.district.toLowerCase().includes(q)) ||
        (z.countryName && z.countryName.toLowerCase().includes(q)) ||
        z.type.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedHotspots = (hotspots || []).filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.facilityName.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q)
    ).slice(0, 4);

    return {
      countries: matchedCountries,
      zones: matchedZones,
      hotspots: matchedHotspots,
      totalCount: matchedCountries.length + matchedZones.length + matchedHotspots.length
    };
  }, [panelSearchQuery, worldCountries, industrialZones, hotspots]);

  if (!isSideMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex select-none font-mono text-xs overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeSideMenu}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-Out Side Menu Panel */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-10 transition-all duration-300 border-r ${
          isDark
            ? "bg-[#060b17] border-slate-800 text-slate-200"
            : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Top Header with AGNI-X Logo */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark
              ? "bg-gradient-to-r from-slate-950 via-[#0a1224] to-slate-950 border-slate-800"
              : "bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-orange-500/40 bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src={agniLogo}
                alt="AGNI-X Logo"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-widest bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  AGNI-X
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                  C2 SAT
                </span>
              </div>
              <span className={`text-[10px] block truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Operations, Search & Simulation Suite
              </span>
            </div>
          </div>

          <button
            onClick={closeSideMenu}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                : "bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Close Menu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body: Search, Simulation, NASA Live, Tools */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ======================================================== */}
          {/* 1. SEARCH SECTION */}
          {/* ======================================================== */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geospatial Directory Search</span>
              </span>
              {panelSearchQuery && (
                <button
                  onClick={() => setPanelSearchQuery("")}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Input Box */}
            <div
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                isDark
                  ? "bg-slate-900/90 border-slate-700/80 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20"
                  : "bg-slate-50 border-slate-300 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-sm"
              }`}
            >
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={panelSearchQuery}
                onChange={(e) => setPanelSearchQuery(e.target.value)}
                placeholder="Search country, industrial hub, or fire alert..."
                className={`w-full bg-transparent outline-none text-xs ${
                  isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
                }`}
              />
              {panelSearchQuery && (
                <button
                  onClick={() => setPanelSearchQuery("")}
                  className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Results Display */}
            {searchResults && (
              <div
                className={`rounded-xl border overflow-hidden p-2 space-y-3 ${
                  isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                {searchResults.totalCount === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No records found matching "{panelSearchQuery}"
                  </div>
                ) : (
                  <>
                    {/* Matching Countries */}
                    {searchResults.countries.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Countries ({searchResults.countries.length})
                        </span>
                        <div className="space-y-1">
                          {searchResults.countries.map((c) => (
                            <div
                              key={c.code}
                              onClick={() => {
                                selectCountry(c);
                                closeSideMenu();
                              }}
                              className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                                isDark ? "hover:bg-slate-900 text-slate-200" : "hover:bg-white text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-base">{c.flag}</span>
                                <span className="font-semibold truncate">{c.name}</span>
                                <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                                  {c.code}
                                </span>
                              </div>
                              <span className="text-[10px] text-cyan-400 flex items-center gap-0.5">
                                <span>Zoom</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Industrial Hubs */}
                    {searchResults.zones.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Industrial Hubs & Refineries ({searchResults.zones.length})
                        </span>
                        <div className="space-y-1">
                          {searchResults.zones.map((z) => (
                            <div
                              key={z.id}
                              onClick={() => {
                                flyToIncident(z.center[0], z.center[1], 13);
                                closeSideMenu();
                              }}
                              className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                                isDark ? "hover:bg-slate-900 text-slate-200" : "hover:bg-white text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Factory className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <div className="truncate">
                                  <span className="font-semibold block truncate">{z.name}</span>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {z.countryName || z.countryCode} &bull; {z.areaKm2} km²
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] text-purple-400 flex items-center gap-0.5 shrink-0 ml-1">
                                <span>Inspect</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Thermal Incidents */}
                    {searchResults.hotspots.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Active Thermal Alerts ({searchResults.hotspots.length})
                        </span>
                        <div className="space-y-1">
                          {searchResults.hotspots.map((h) => (
                            <div
                              key={h.id}
                              onClick={() => {
                                setSelectedHotspotId(h.id);
                                flyToIncident(h.latitude, h.longitude, 14);
                                closeSideMenu();
                              }}
                              className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                                isDark ? "hover:bg-slate-900 text-slate-200" : "hover:bg-white text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Flame className={`w-3.5 h-3.5 shrink-0 ${h.status === "critical" ? "text-red-500" : "text-amber-500"}`} />
                                <div className="truncate">
                                  <span className="font-semibold block truncate">{h.facilityName || h.name}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    FRP: <strong className="text-red-400">{h.frp} MW</strong> &bull; Deviation: +{h.frpDeviation}%
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] text-red-400 flex items-center gap-0.5 shrink-0 ml-1">
                                <span>Locate</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Quick Country Jump Shortcuts */}
            {!searchResults && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { name: "India", code: "IND", flag: "🇮🇳" },
                  { name: "USA", code: "USA", flag: "🇺🇸" },
                  { name: "Saudi", code: "SAU", flag: "🇸🇦" },
                  { name: "Germany", code: "DEU", flag: "🇩🇪" },
                  { name: "Singapore", code: "SGP", flag: "🇸🇬" },
                  { name: "UAE", code: "ARE", flag: "🇦🇪" }
                ].map((item) => {
                  const countryObj = (worldCountries || []).find((c) => c.code === item.code);
                  return (
                    <button
                      key={item.code}
                      onClick={() => {
                        if (countryObj) {
                          selectCountry(countryObj);
                          closeSideMenu();
                        }
                      }}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                        isDark
                          ? "bg-slate-900/80 border-slate-800 hover:border-slate-600 text-slate-300"
                          : "bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700"
                      }`}
                    >
                      <span>{item.flag}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ======================================================== */}
          {/* 2. SIMULATION SECTION */}
          {/* ======================================================== */}
          <section
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark
                ? "bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20"
                : "bg-amber-50/70 border-amber-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-amber-400 block">
                    HISTORICAL BACKTESTING SIMULATION
                  </span>
                  <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Multi-step thermal progression replay
                  </span>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-amber-500 text-slate-950">
                ACTIVE
              </span>
            </div>

            {/* Active Scenario Quick Card */}
            <div
              className={`p-2.5 rounded-xl border mb-3 ${
                isDark ? "bg-slate-950/80 border-amber-500/20" : "bg-white border-amber-200"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-[11px] text-white truncate">
                  {activeScenario?.name || "Mundra Hydrocarbon Storage Tank Fire"}
                </span>
              </div>
              <p className={`text-[10px] leading-relaxed line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {activeScenario?.description || "Simulates catastrophic hydrocarbon flashover with FRP deviation jumping +1102%."}
              </p>

              {/* Timeline Steps Preview */}
              <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-amber-500/20">
                {(activeScenario?.timeline || []).map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => applySimulationStep(activeScenario, idx)}
                    className={`flex-1 py-1 px-0.5 rounded text-[9px] font-bold transition cursor-pointer border ${
                      scenarioStepIndex === idx
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm"
                        : isDark
                        ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {step.timeLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Simulation Modal Button */}
            <button
              onClick={() => {
                closeSideMenu();
                openBacktestingModal();
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black tracking-wide text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>LAUNCH SIMULATION STUDIO</span>
            </button>
          </section>

          {/* ======================================================== */}
          {/* 3. NASA LIVE SATELLITE FEED SECTION */}
          {/* ======================================================== */}
          <section
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark
                ? "bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-950/20"
                : "bg-cyan-50/70 border-cyan-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Satellite className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-cyan-400 block">
                    NASA FIRMS LIVE STREAM
                  </span>
                  <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    VIIRS (375m) & MODIS (1km) Satellites
                  </span>
                </div>
              </div>

              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                  isNasaKeyConfigured
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                }`}
              >
                {isNasaKeyConfigured ? "CONNECTED" : "DEMO / PASS"}
              </span>
            </div>

            {/* Telemetry Metrics */}
            <div
              className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border mb-3 text-[10px] ${
                isDark ? "bg-slate-950/80 border-cyan-500/20" : "bg-white border-cyan-200"
              }`}
            >
              <div>
                <span className="text-slate-400 block">Active Detections:</span>
                <strong className="text-xs text-rose-500 font-black">
                  {hotspots.length} Global Points
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Sensor Array:</span>
                <span className="text-xs text-cyan-300 font-bold">NOAA-20 / VIIRS</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800 flex justify-between items-center text-slate-400">
                <span>Last Orbit Pass:</span>
                <span className="text-slate-300 font-mono">
                  {lastSyncTime ? lastSyncTime.toLocaleTimeString() : "Live"}
                </span>
              </div>
            </div>

            {/* Actions: Configure Key & Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  closeSideMenu();
                  openApiKeyModal();
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isNasaKeyConfigured
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                    : isDark
                    ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50"
                    : "bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isNasaKeyConfigured ? "Manage Key" : "Add NASA Key"}</span>
              </button>

              <button
                onClick={handleManualRefresh}
                className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                    : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                }`}
                title="Fetch latest orbital passes"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Sync</span>
              </button>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 4. LIVE ZERO-KEY ATMOSPHERIC & OSM SERVICES */}
          {/* ======================================================== */}
          <section
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-teal-500/40"
                : "bg-slate-50 border-slate-200 hover:border-teal-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                  <Wind className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-teal-400">
                    Live Wind & OSM Feeds
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Zero-Key Public Domain APIs
                  </span>
                </div>
              </div>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  isWeatherLive
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {isWeatherLive ? "OPEN-METEO LIVE" : "BASELINE"}
              </span>
            </div>

            {/* Open-Meteo Current Atmospheric Vector */}
            <div
              className={`p-2.5 rounded-xl border mb-2.5 text-[10px] space-y-1 ${
                isDark ? "bg-slate-950/80 border-teal-500/20" : "bg-white border-teal-200"
              }`}
            >
              <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                <span className="text-slate-400 font-bold">Open-Meteo Wind Vector:</span>
                <span className="font-black text-teal-400">
                  {currentWeather.windSpeedKmH} km/h • {currentWeather.windDirectionText}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cloud Occlusion:</span>
                <span className={currentWeather.cloudCoverPercent > 60 ? "text-rose-400 font-bold" : "text-emerald-400 font-semibold"}>
                  {currentWeather.cloudCoverPercent}% ({currentWeather.opticalOcclusionLevel})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Plume Calculation:</span>
                <span className="text-slate-300 font-mono">Gaussian Dispersion Active</span>
              </div>
            </div>

            {/* OpenStreetMap Overpass Industrial Ingestion */}
            <div
              className={`p-2.5 rounded-xl border mb-3 text-[10px] space-y-1.5 ${
                isDark ? "bg-slate-950/80 border-purple-500/20" : "bg-white border-purple-200"
              }`}
            >
              <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                <div className="flex items-center gap-1 font-bold text-purple-300">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  <span>OSM Overpass API</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                  isOsmLive
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {isOsmLive ? "CONNECTED" : "READY"}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Monitored Facilities:</span>
                <strong className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {industrialZones.length} Registered Sites
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>OSM Tags Filtered:</span>
                <span className="text-slate-300 font-mono text-[9px]">landuse=industrial, works</span>
              </div>
            </div>

            {/* Action Trigger: Scan Live OSM */}
            <button
              onClick={scanLiveOsmForCurrentView}
              disabled={isOsmLoading}
              className={`w-full py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                isOsmLoading
                  ? "bg-purple-900/40 border-purple-500/50 text-purple-300 cursor-wait"
                  : isDark
                  ? "bg-purple-950/50 border-purple-600/50 text-purple-200 hover:bg-purple-900/60 hover:border-purple-400"
                  : "bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100"
              }`}
              title="Query OpenStreetMap Overpass API for industrial polygons in current view"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isOsmLoading ? "animate-spin" : ""}`} />
              <span>{isOsmLoading ? "Querying Overpass API..." : "Scan Live OSM Industrial Polygons"}</span>
            </button>
          </section>

          {/* ======================================================== */}
          {/* 5. QUICK VIEW & SAR SATELLITE CONTROLS */}
          {/* ======================================================== */}
          <section className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Viewport & Sensor Modes
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (setViewMode) setViewMode("globe");
                  closeSideMenu();
                }}
                className={`p-2 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                  viewMode === "globe"
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow"
                    : isDark
                    ? "bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>3D Earth</span>
              </button>

              <button
                onClick={() => {
                  if (setViewMode) setViewMode("map");
                  closeSideMenu();
                }}
                className={`p-2 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                  viewMode === "map"
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow"
                    : isDark
                    ? "bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                }`}
              >
                <Map className="w-4 h-4" />
                <span>2D Tactical</span>
              </button>
            </div>

            {/* SAR Radar Toggle */}
            <div
              onClick={() => toggleLayer("sar")}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                activeLayers.sar
                  ? "bg-cyan-950/60 border-cyan-500 text-cyan-200"
                  : isDark
                  ? "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${activeLayers.sar ? "text-cyan-400 animate-spin" : "text-slate-400"}`} />
                <div>
                  <span className="font-bold text-xs block">Cloud-Piercing SAR Radar</span>
                  <span className="text-[10px] text-slate-500">Sentinel-1 C-Band Penetration</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                activeLayers.sar ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}>
                {activeLayers.sar ? "ON" : "OFF"}
              </span>
            </div>
          </section>
        </div>

        {/* Drawer Bottom Footer */}
        <div
          className={`p-3.5 border-t text-[10px] flex items-center justify-between shrink-0 ${
            isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-slate-300">AGNI-X v2.4</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-amber-300"
                  : "bg-white border-slate-300 text-indigo-600"
              }`}
              title="Toggle Dark/Light Mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-bold">{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
