import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
  Sliders,
  Filter,
  ArrowRight
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import { DispatchSummary } from "./DispatchSummary";

export function IncidentFeed() {
  const {
    hotspots,
    selectedHotspotId,
    setSelectedHotspotId,
    flyToIncident,
    statusFilter,
    setStatusFilter,
    theme
  } = useThermaTwin();

  const isDark = theme === "dark";
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("feed"); // 'feed' | 'inspector'

  const filteredHotspots = (hotspots || []).filter((h) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "critical") return h.status === "critical";
    if (statusFilter === "warning") return h.status === "warning";
    if (statusFilter === "safe") return h.status === "safe";
    return true;
  });

  const selectedHotspot = (hotspots || []).find((h) => h.id === selectedHotspotId) || hotspots?.[0];

  // If collapsed, show clean expand handle on right edge
  if (!isSidebarOpen) {
    return (
      <div className="absolute right-3 top-24 z-[1000] select-none font-mono">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-xl transition cursor-pointer active:scale-95 ${
            isDark
              ? "bg-slate-950/95 border-slate-700/80 text-cyan-300 hover:text-white hover:border-cyan-400"
              : "bg-white/95 border-slate-300 text-slate-800 hover:text-slate-950 hover:border-cyan-500"
          }`}
          title="Open Incident Feed"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-500 animate-pulse" />
          <span>INCIDENT FEED ({hotspots?.length || 0})</span>
        </button>
      </div>
    );
  }

  return (
    <aside className={`w-96 lg:w-[410px] flex flex-col h-full z-20 shrink-0 select-none backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 font-mono text-xs ${
      isDark
        ? "bg-slate-950/95 border-l border-slate-800/80 text-white"
        : "bg-white border-l border-slate-200 text-slate-900"
    }`}>
      {/* 1. Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        isDark
          ? "bg-slate-900/90 border-slate-800/80"
          : "bg-slate-50 border-slate-200"
      }`}>
        <div>
          <div className="flex items-center gap-2 font-black text-sm tracking-wide">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className={isDark ? "text-white" : "text-slate-900"}>INCIDENT FEED</span>
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {filteredHotspots.length} active alerts &bull; 3&sigma; Baselines Monitored
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter Pill */}
          <button
            onClick={() => setStatusFilter && setStatusFilter(statusFilter === "all" ? "critical" : "all")}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
              statusFilter === "critical"
                ? "bg-red-950 text-red-300 border-red-700"
                : isDark
                ? "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900"
            }`}
          >
            {statusFilter === "critical" ? "Critical Only" : "All Alerts"}
          </button>

          {/* Collapse Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className={`p-1 rounded transition cursor-pointer ${
              isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Collapse Sidebar (Maximize Map View)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Mode Selector: Alert Feed vs Deep-Dive Inspector */}
      <div className={`grid grid-cols-2 border-b text-xs font-bold text-center ${
        isDark
          ? "bg-slate-900/60 border-slate-800/80"
          : "bg-slate-50 border-slate-200"
      }`}>
        <button
          onClick={() => setActiveTab("feed")}
          className={`py-2 px-2 transition cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "feed"
              ? isDark
                ? "bg-slate-950 text-cyan-300 border-cyan-400"
                : "bg-white text-cyan-700 border-cyan-600"
              : isDark
              ? "text-slate-400 hover:text-white border-transparent"
              : "text-slate-500 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>ALERT FEED</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded ${
            isDark ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"
          }`}>
            {filteredHotspots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("inspector")}
          className={`py-2 px-2 transition cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "inspector"
              ? isDark
                ? "bg-slate-950 text-rose-300 border-rose-500"
                : "bg-white text-rose-700 border-rose-600"
              : isDark
              ? "text-slate-400 hover:text-white border-transparent"
              : "text-slate-500 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>SHAP INSPECTOR</span>
          {selectedHotspot && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
          )}
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className={`flex-1 overflow-y-auto divide-y ${
        isDark ? "divide-slate-800/70" : "divide-slate-200"
      }`}>
        {activeTab === "feed" ? (
          /* Alert Feed Cards */
          <div className="p-3 space-y-2.5">
            {filteredHotspots.map((hotspot) => {
              const isSelected = selectedHotspotId === hotspot.id;
              const isCritical = hotspot.status === "critical";

              return (
                <div
                  key={hotspot.id}
                  onClick={() => {
                    setSelectedHotspotId(hotspot.id);
                    flyToIncident(hotspot.latitude, hotspot.longitude);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? isDark
                        ? "bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50"
                        : "bg-cyan-50/70 border-cyan-400 shadow-sm ring-1 ring-cyan-400"
                      : isDark
                      ? "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {/* Top line: Facility Name and Status Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold text-xs truncate ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}>
                      {hotspot.facilityName || hotspot.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>

                  {/* Status Pill */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isCritical
                          ? "bg-red-950/80 text-red-300 border border-red-700/80"
                          : hotspot.status === "warning"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-700/80"
                          : "bg-emerald-950/80 text-emerald-300 border border-emerald-700/80"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isCritical ? "bg-red-400 animate-ping" : "bg-emerald-400"
                      }`} />
                      {isCritical ? "CRITICAL FIRE" : hotspot.status === "warning" ? "THERMAL RUNAWAY" : "ROUTINE FLARING"}
                    </span>
                  </div>

                  {/* Concise Description */}
                  <p className={`text-[11px] leading-snug ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}>
                    {isCritical
                      ? `CRITICAL: Abnormal fire detected at ${hotspot.facilityName}. FRP ${hotspot.frp} MW exceeds 3σ baseline. Immediate assessment required.`
                      : `NORMAL: Routine persistent flare stack within historical operational limits (${hotspot.frp} MW).`}
                  </p>

                  {/* Metadata Row: Lat, Lon | FRP (MW) | Time */}
                  <div className={`flex items-center justify-between text-[10px] pt-1.5 border-t font-mono ${
                    isDark ? "border-slate-800/60 text-slate-400" : "border-slate-200 text-slate-500"
                  }`}>
                    <span>
                      📍 {hotspot.latitude.toFixed(3)}°, {hotspot.longitude.toFixed(3)}°
                    </span>
                    <span className="text-amber-500 font-bold">
                      ⚡ {hotspot.frp} MW
                    </span>
                    <span>
                      🕒 {hotspot.scanTime || "Just now"}
                    </span>
                  </div>

                  {/* One-click open inspector */}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab("inspector");
                      }}
                      className={`w-full mt-1 py-1.5 rounded-lg border font-bold text-[10px] transition text-center ${
                        isDark
                          ? "bg-cyan-950/70 border-cyan-600/50 text-cyan-300 hover:bg-cyan-900/80"
                          : "bg-cyan-100 border-cyan-300 text-cyan-800 hover:bg-cyan-200"
                      }`}
                    >
                      VIEW SHAP TELEMETRY & DISPATCH &rarr;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Deep-Dive Inspector */
          <div className={isDark ? "bg-slate-950" : "bg-white"}>
            <DispatchSummary />
          </div>
        )}
      </div>
    </aside>
  );
}
