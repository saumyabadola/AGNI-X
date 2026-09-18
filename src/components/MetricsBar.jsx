import React from "react";
import {
  Flame,
  Factory,
  AlertTriangle,
  Filter
} from "lucide-react";
import { useThermaTwin } from "../context/ThermaTwinContext";

export function MetricsBar() {
  const { metrics, statusFilter, setStatusFilter, theme } = useThermaTwin();
  const isDark = theme === "dark";

  return (
    <div className={`px-6 py-2.5 z-20 shrink-0 select-none font-mono transition-colors duration-200 ${
      isDark
        ? "bg-slate-950/90 border-b border-slate-800/80"
        : "bg-white border-b border-slate-200"
    }`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. ACTIVE HOTSPOTS */}
        <div
          onClick={() => setStatusFilter && setStatusFilter(statusFilter === "all" ? "critical" : "all")}
          className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
            statusFilter === "all"
              ? isDark
                ? "bg-slate-900/90 border-slate-700 ring-1 ring-cyan-500/40"
                : "bg-cyan-50/60 border-cyan-300 ring-1 ring-cyan-400"
              : isDark
              ? "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
              : "bg-slate-50 border-slate-200 hover:border-slate-300"
          }`}
          title="Total active thermal anomalies detected by satellite passes"
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${
            isDark
              ? "bg-orange-950/60 border-orange-700/60"
              : "bg-orange-100 border-orange-200"
          }`}>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              ACTIVE HOTSPOTS
            </div>
            <div className={`text-2xl font-black leading-none mt-1 tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              {metrics.totalActiveHotspots || 20}
            </div>
          </div>
        </div>

        {/* 2. MONITORED SITES */}
        <div
          className={`flex items-center gap-4 p-3 rounded-xl border transition-all shadow-sm ${
            isDark
              ? "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
              : "bg-slate-50 border-slate-200 hover:border-slate-300"
          }`}
          title="Major registered OpenStreetMap industrial facilities and SEZ boundaries"
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${
            isDark
              ? "bg-emerald-950/60 border-emerald-700/60"
              : "bg-emerald-100 border-emerald-200"
          }`}>
            <Factory className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              MONITORED SITES
            </div>
            <div className={`text-2xl font-black leading-none mt-1 tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              {metrics.monitoredIndustrialSites || 5}
            </div>
          </div>
        </div>

        {/* 3. CRITICAL FIRES */}
        <div
          onClick={() => setStatusFilter && setStatusFilter("critical")}
          className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
            statusFilter === "critical"
              ? isDark
                ? "bg-red-950/50 border-red-500 ring-1 ring-red-500/50"
                : "bg-red-50 border-red-400 ring-1 ring-red-400"
              : isDark
              ? "bg-slate-900/50 border-slate-800/80 hover:border-red-900/60"
              : "bg-slate-50 border-slate-200 hover:border-red-200"
          }`}
          title="Verified Priority-1 industrial fires exceeding 3-sigma thresholds"
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${
            isDark
              ? "bg-red-950/60 border-red-700/60"
              : "bg-red-100 border-red-200"
          }`}>
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
              CRITICAL FIRES
            </div>
            <div className="text-2xl font-black text-red-500 leading-none mt-1 tracking-tight">
              {metrics.verifiedCriticalFires || 12}
            </div>
          </div>
        </div>

        {/* 4. FALSE POSITIVES */}
        <div
          onClick={() => setStatusFilter && setStatusFilter("safe")}
          className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
            statusFilter === "safe"
              ? isDark
                ? "bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500/50"
                : "bg-cyan-50 border-cyan-400 ring-1 ring-cyan-400"
              : isDark
              ? "bg-slate-900/50 border-slate-800/80 hover:border-cyan-900/60"
              : "bg-slate-50 border-slate-200 hover:border-cyan-200"
          }`}
          title="Routine flare stacks and permitted industrial heat suppressed by 3-sigma filter"
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${
            isDark
              ? "bg-cyan-950/60 border-cyan-700/60"
              : "bg-cyan-100 border-cyan-200"
          }`}>
            <Filter className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${
              isDark ? "text-cyan-400" : "text-cyan-600"
            }`}>
              FALSE POSITIVES
            </div>
            <div className={`text-2xl font-black leading-none mt-1 tracking-tight ${
              isDark ? "text-cyan-300" : "text-cyan-600"
            }`}>
              {metrics.falsePositivesFiltered || 4}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
