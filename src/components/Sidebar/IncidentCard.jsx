import React from "react";
import { Flame, Clock, Navigation, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "../Common/Badge";

export function IncidentCard({
  hotspot,
  isSelected,
  isDispatched,
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border transition-all cursor-pointer select-none font-mono text-xs ${
        isSelected
          ? "bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40"
          : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700"
      }`}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <StatusBadge
          status={isDispatched ? "dispatched" : hotspot.status}
          label={isDispatched ? "Dispatched" : hotspot.statusLabel}
          size="sm"
          ping={hotspot.status === "critical"}
        />
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {hotspot.scanTime}
        </span>
      </div>

      {/* Title & Facility */}
      <div className="mb-2">
        <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
          {hotspot.name}
        </h4>
        <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
          {hotspot.facilityName}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
        <div className="flex items-center gap-1 text-slate-400">
          <Flame className="w-3 h-3 text-amber-400" />
          <span className="font-semibold text-slate-200">{hotspot.frp} MW</span>
        </div>

        <div
          className={`font-semibold ${
            hotspot.frpDeviation > 50
              ? "text-rose-400"
              : hotspot.frpDeviation > 15
              ? "text-amber-400"
              : "text-emerald-400"
          }`}
        >
          +{hotspot.frpDeviation}% baseline
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-0.5">
          <Navigation className="w-2.5 h-2.5 text-cyan-400" />
          {hotspot.latitude.toFixed(2)}°, {hotspot.longitude.toFixed(2)}°
        </div>
      </div>
    </div>
  );
}
