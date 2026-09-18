import React from "react";
import {
  Flame,
  Factory,
  Wind
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";

/**
 * Minimalist Layer Widget matching enterprise styling
 * Pinned neatly to bottom-left corner of the map canvas
 */
export function LayerControlPanel() {
  const { activeLayers, toggleLayer, theme, selectedCountry } = useThermaTwin();
  const isDark = theme === "dark";

  return (
    <div className={`absolute bottom-6 z-[1000] select-none font-mono text-xs transition-all duration-300 ${
      selectedCountry ? "left-[25.5rem]" : "left-6"
    }`}>
      <div className={`rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl w-56 space-y-2.5 border transition-colors duration-200 ${
        isDark
          ? "bg-slate-950/90 border-slate-700/80 text-white"
          : "bg-white/95 border-slate-300 text-slate-900 shadow-slate-300/50"
      }`}>
        <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider pb-1 border-b ${
          isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
        }`}>
          <span className="w-1.5 h-3.5 bg-slate-400 rounded-sm inline-block" />
          <span>LAYERS</span>
        </div>

        <div className="space-y-2">
          {/* 1. FIRMS Hotspots */}
          <label className={`flex items-center justify-between p-2 rounded-xl border font-bold cursor-pointer transition ${
            isDark
              ? "bg-red-950/40 border-red-800/60 text-red-200 hover:bg-red-900/40"
              : "bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
          }`}>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500 shrink-0" />
              <span>FIRMS Hotspots</span>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.hotspots !== false && activeLayers.firms !== false}
              onChange={() => {
                toggleLayer("hotspots");
                toggleLayer("firms");
              }}
              className="accent-red-600 w-4 h-4 cursor-pointer rounded"
            />
          </label>

          {/* 2. Industrial Zones */}
          <label className={`flex items-center justify-between p-2 rounded-xl border font-bold cursor-pointer transition ${
            isDark
              ? "bg-purple-950/40 border-purple-800/60 text-purple-200 hover:bg-purple-900/40"
              : "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
          }`}>
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-purple-500 shrink-0" />
              <span>Industrial Zones</span>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.osm !== false}
              onChange={() => toggleLayer("osm")}
              className="accent-purple-600 w-4 h-4 cursor-pointer rounded"
            />
          </label>

          {/* 3. Smoke Dispersion */}
          <label className={`flex items-center justify-between p-2 rounded-xl border font-medium cursor-pointer transition ${
            isDark
              ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>Smoke Dispersion</span>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.plumes}
              onChange={() => toggleLayer("plumes")}
              className="accent-cyan-500 w-4 h-4 cursor-pointer rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
