import React from "react";
import {
  Flame,
  AlertTriangle,
  Send,
  Radio,
  Clock,
  Navigation,
  Satellite,
  Thermometer,
  Wind,
  CheckCircle2,
  ShieldCheck,
  BrainCircuit,
  Zap,
  ChevronRight
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import { StatusBadge } from "../Common/Badge";
import { SHAPExplainability } from "./SHAPExplainability";
import { SparklineChart } from "./SparklineChart";

export function DispatchSummary() {
  const {
    selectedHotspot,
    dispatchedHotspotIds,
    openDispatchModal,
    dispatchHistory,
    currentWeather,
    theme
  } = useThermaTwin();

  const isDark = theme === "dark";

  if (!selectedHotspot) {
    return (
      <div className={`p-6 text-center font-mono text-xs ${
        isDark ? "text-slate-400" : "text-slate-500"
      }`}>
        Click any hotspot marker on the map to inspect AI telemetry.
      </div>
    );
  }

  const isDispatched = dispatchedHotspotIds.has(selectedHotspot.id);
  const dispatchRecord = dispatchHistory.find((d) => d.incidentId === selectedHotspot.id);
  const isAnomaly = selectedHotspot.status !== "safe";

  return (
    <div className={`p-3.5 space-y-3.5 font-mono text-xs overflow-y-auto ${
      isDark ? "text-slate-200" : "text-slate-800"
    }`}>
      {/* 1. TOP HEADER & STANDARDIZED COLOR-CODED STATUS */}
      <div className={`rounded-xl p-3.5 border space-y-2 shadow-sm ${
        isDark ? "bg-slate-900/95 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center justify-between">
          <StatusBadge
            status={isDispatched ? "dispatched" : selectedHotspot.status}
            label={isDispatched ? "ERSS-112 DISPATCHED" : selectedHotspot.statusLabel}
            ping={selectedHotspot.status === "critical"}
          />
          <span className={`text-[11px] flex items-center gap-1 font-semibold ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}>
            <Clock className="w-3 h-3" />
            {selectedHotspot.scanTime}
          </span>
        </div>

        <div>
          <h2 className={`text-base font-bold leading-snug tracking-tight ${
            isDark ? "text-white" : "text-slate-950"
          }`}>
            {selectedHotspot.name}
          </h2>
          <p className={`text-xs font-medium mt-0.5 ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}>
            {selectedHotspot.facilityName}
          </p>
        </div>

        <div className={`flex items-center justify-between text-[11px] pt-1.5 border-t ${
          isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
        }`}>
          <span className="flex items-center gap-1">
            <Navigation className="w-3 h-3 text-cyan-500" />
            {selectedHotspot.latitude.toFixed(4)}°N, {selectedHotspot.longitude.toFixed(4)}°E
          </span>
          <span className="text-cyan-600 font-bold">{selectedHotspot.satellite}</span>
        </div>
      </div>

      {/* 2. CONFIRMED DISPATCH NOTIFICATION (If Dispatched) */}
      {isDispatched && (
        <div className={`rounded-xl p-3 space-y-1.5 shadow-md border ${
          isDark
            ? "bg-blue-950/80 border-blue-400/80 text-blue-100 shadow-blue-950/60"
            : "bg-blue-50 border-blue-300 text-blue-900"
        }`}>
          <div className={`flex items-center gap-2 font-bold text-xs ${
            isDark ? "text-blue-200" : "text-blue-800"
          }`}>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span>DISPATCH CONFIRMED &bull; RESPONDERS EN ROUTE</span>
          </div>
          <div className="text-[11px] space-y-0.5">
            <div>
              Ticket: <span className="font-bold">{dispatchRecord?.ticketId || "ERSS-112-ACTIVE"}</span>
            </div>
            <div>Time: {dispatchRecord?.dispatchedAt || "Just now"}</div>
            <div>Units: NDRF 6th Bn, SDRF Quick Response, Fire HazMat</div>
          </div>
        </div>
      )}

      {/* 3. HIGH-CONTRAST CRITICAL METRICS & DIGITAL TWIN SPARKLINE */}
      <div className={`rounded-xl p-3.5 border space-y-3 shadow-sm ${
        isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <div className={`flex items-center justify-between border-b pb-2 ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}>
          <span className={`font-bold text-xs flex items-center gap-1.5 ${
            isDark ? "text-slate-200" : "text-slate-800"
          }`}>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            THERMAL TELEMETRY & 3σ BASELINE
          </span>
          <span className="text-[10px] text-amber-500 font-semibold">90-Day Baseline Envelope</span>
        </div>

        {/* Large, High-Contrast Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Current FRP */}
          <div className={`p-3 rounded-lg border ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <span className={`text-[10px] uppercase tracking-wide block mb-1 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              OBSERVED HEAT (FRP)
            </span>
            <div className="text-2xl font-black text-amber-500 tracking-tight leading-none">
              {selectedHotspot.frp} <span className="text-xs font-normal text-slate-400">MW</span>
            </div>
            <div className={`text-[10px] mt-1.5 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              Normal Baseline: <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                {selectedHotspot.baselineFrp} MW
              </span>
            </div>
          </div>

          {/* Baseline Deviation Spike */}
          <div className={`p-3 rounded-lg border ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <span className={`text-[10px] uppercase tracking-wide block mb-1 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              BASELINE DEVIATION
            </span>
            <div
              className={`text-2xl font-black tracking-tight leading-none ${
                selectedHotspot.frpDeviation > 50
                  ? "text-rose-500"
                  : selectedHotspot.frpDeviation > 15
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            >
              +{selectedHotspot.frpDeviation}%
            </div>
            <div className={`text-[10px] mt-1.5 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              {selectedHotspot.status === "safe" ? (
                <span className="text-emerald-600 font-semibold">✓ Routine Flaring</span>
              ) : selectedHotspot.status === "warning" ? (
                <span className="text-amber-600 font-semibold">⚠️ Heat Runaway Surge</span>
              ) : (
                <span className="text-rose-600 font-bold">🚨 3σ Threshold Breached</span>
              )}
            </div>
          </div>
        </div>

        {/* 90-Day Rolling Thermal Digital Twin Sparkline */}
        <div className="pt-2">
          <div className={`flex items-center justify-between text-[11px] mb-1.5 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}>
            <span>90-Day Rolling Historical Sensor Signature</span>
            <span className="text-rose-500 font-semibold">3σ Upper Bound: {selectedHotspot.baselineFrp * 1.5} MW</span>
          </div>
          <SparklineChart
            data={selectedHotspot.historicalFRP || [45, 52, 48, 55, 60, 58, 62, 54, 59, 102.7]}
            baseline={selectedHotspot.baselineFrp}
            status={selectedHotspot.status}
          />
        </div>
      </div>

      {/* 4. TREE-SHAP AI EXPLAINABILITY REPORT */}
      <SHAPExplainability
        shapValues={selectedHotspot.shapValues}
        aiConfidence={selectedHotspot.aiConfidence}
        classification={selectedHotspot.classification}
        status={selectedHotspot.status}
      />

      {/* 5. PROMINENT ONE-CLICK ERSS-112 EMERGENCY DISPATCH ACTION BUTTON */}
      {isAnomaly && (
        <div className="pt-1">
          <button
            onClick={() => openDispatchModal(selectedHotspot)}
            disabled={isDispatched}
            className={`w-full py-3 px-4 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
              isDispatched
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-rose-950/50 border border-red-400/40"
            }`}
          >
            {isDispatched ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>DISPATCHED TO ERSS-112 / NDRF</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white animate-pulse" />
                <span>DISPATCH ERSS-112 EMERGENCY WEBHOOK</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
