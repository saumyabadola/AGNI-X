import React, { useState, useEffect } from "react";
import {
  Menu,
  RefreshCw,
  Sliders,
  Globe,
  Map,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Search,
  Satellite
} from "lucide-react";
import { useThermaTwin } from "../context/ThermaTwinContext";
import agniLogo from "../assets/agni-logo.png";

export function Header({ viewMode = "globe", setViewMode }) {
  const {
    fetchHotspots,
    isBackendLive,
    theme,
    toggleTheme,
    isNasaKeyConfigured,
    toggleSideMenu,
    openSideMenu,
    isSideMenuOpen
  } = useThermaTwin();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeStr = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchHotspots) {
      await fetchHotspots();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const isDark = theme === "dark";

  return (
    <header className={`px-4 sm:px-6 py-2.5 flex items-center justify-between z-30 shrink-0 select-none transition-colors duration-200 ${
      isDark
        ? "bg-slate-950/95 border-b border-slate-800/80 text-white shadow-md backdrop-blur-xl"
        : "bg-white border-b border-slate-200 text-slate-900 shadow-sm"
    }`}>
      {/* Left: Side Menu Toggle & AGNI-X Logo Branding */}
      <div className="flex items-center gap-3">
        {/* Toggle Button for Side Menu Panel */}
        <button
          onClick={toggleSideMenu}
          className={`px-3 py-1.5 rounded-xl border transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95 font-bold ${
            isSideMenuOpen
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 border-orange-400 font-black shadow-orange-950/50 ring-2 ring-orange-400/40"
              : isDark
              ? "bg-slate-900/90 border-slate-700/80 text-orange-400 hover:text-white hover:bg-slate-800 hover:border-orange-500/60"
              : "bg-slate-100 border-slate-300 text-orange-600 hover:text-orange-700 hover:bg-slate-200"
          }`}
          title="Open Side Menu Panel (Simulation, Search, NASA Live)"
        >
          <Menu className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-mono font-black tracking-wider">SIDE MENU</span>
        </button>

        {/* User's Uploaded Logo */}
        <div
          onClick={openSideMenu}
          className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md border border-orange-500/40 bg-slate-950 flex items-center justify-center shrink-0 cursor-pointer hover:border-orange-400 transition"
          title="Open AGNI-X Side Menu"
        >
          <img
            src={agniLogo}
            alt="AGNI-X"
            className="w-full h-full object-cover scale-110"
          />
        </div>

        {/* AGNI-X Project Title & Subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-widest font-mono leading-none bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              AGNI-X
            </span>
            <span className="text-slate-400 font-normal">/</span>
            <span className="text-xs font-bold text-cyan-400 font-mono tracking-wide">
              SATELLITE C2
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border ${
              isDark
                ? "bg-slate-900 border-slate-700 text-slate-300"
                : "bg-slate-100 border-slate-300 text-slate-700"
            }`}>
              v2.4
            </span>
          </div>
          <span className={`text-[10px] font-mono uppercase tracking-widest mt-0.5 hidden md:block ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}>
            Autonomous Geospatial Network for Industrial Thermal Intelligence
          </span>
        </div>
      </div>

      {/* Center: SINGLE UNIFIED 3D Globe vs 2D Tactical Map Switcher */}
      <div className={`flex rounded-xl p-0.5 text-xs font-mono font-bold border shadow-inner ${
        isDark
          ? "bg-slate-900 border-slate-800"
          : "bg-slate-100 border-slate-300"
      }`}>
        <button
          onClick={() => setViewMode && setViewMode("globe")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            viewMode === "globe"
              ? "bg-cyan-500 text-slate-950 shadow-md font-black"
              : isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="Switch to Interactive 3D Satellite Earth Globe"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">3D GLOBE</span>
          <span className="sm:hidden">3D</span>
        </button>

        <button
          onClick={() => setViewMode && setViewMode("map")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            viewMode === "map"
              ? "bg-cyan-500 text-slate-950 shadow-md font-black"
              : isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="Switch to 2D Detailed Street-Level Satellite Map"
        >
          <Map className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">2D MAP</span>
          <span className="sm:hidden">2D</span>
        </button>
      </div>

      {/* Right Controls: Side Panel Triggers, Dark/Light Theme & Status */}
      <div className="flex items-center gap-2 text-xs font-mono">
        {/* Quick Side Menu Launcher: Search */}
        <button
          onClick={openSideMenu}
          className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
            isDark
              ? "bg-slate-900/80 border-slate-700/80 text-cyan-300 hover:bg-slate-800 hover:text-white"
              : "bg-slate-100 border-slate-300 text-cyan-700 hover:bg-slate-200"
          }`}
          title="Open Search Panel (Countries, Industrial Hubs, Alerts)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span>Search</span>
        </button>

        {/* Quick Side Menu Launcher: NASA Live */}
        <button
          onClick={openSideMenu}
          className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
            isNasaKeyConfigured
              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
              : isDark
              ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50"
              : "bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100"
          }`}
          title="Open NASA Live Satellite Stream Panel"
        >
          <Satellite className={`w-3.5 h-3.5 ${isNasaKeyConfigured ? "text-emerald-400" : "text-cyan-400"}`} />
          <span>NASA Live</span>
        </button>

        {/* Quick Side Menu Launcher: Simulation */}
        <button
          onClick={openSideMenu}
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
            isDark
              ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/40 text-amber-300"
              : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800"
          }`}
          title="Open Historical Backtesting Simulation Studio"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulation</span>
        </button>

        {/* Dark Mode / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition shadow-sm cursor-pointer flex items-center gap-1.5 font-bold ${
            isDark
              ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800 hover:text-amber-200"
              : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
          }`}
          title={isDark ? "Switch to Clean Light Mode" : "Switch to Dark Tactical Mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Manual Refresh Button */}
        <button
          onClick={handleManualRefresh}
          className={`p-2 rounded-xl border transition shadow-sm cursor-pointer ${
            isDark
              ? "bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-white"
              : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
          }`}
          title="Refresh live satellite passes"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </header>
  );
}
