import React from "react";
import { useMap } from "react-leaflet";
import {
  Crosshair,
  Plus,
  Minus,
  Wind,
  Layers,
  Globe
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";

export function MapControls() {
  const map = useMap();
  const {
    baseLayer,
    setBaseLayer,
    activeLayers,
    selectedHotspot,
    currentWeather,
    isWeatherLive,
    theme,
    fitWorldView
  } = useThermaTwin();

  const isDark = theme === "dark";

  const handleGlobalView = () => {
    map.flyTo([20, 10], 2, {
      duration: 1.4
    });
  };

  const handleRecenter = () => {
    if (selectedHotspot) {
      map.flyTo([selectedHotspot.latitude, selectedHotspot.longitude], 14, {
        duration: 1.2
      });
    } else {
      handleGlobalView();
    }
  };

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();

  return (
    <>
      {/* Top-Left Controls: Baselayer Switcher */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2.5 select-none font-mono text-xs">
        {/* Satellite Imagery / Dark Canvas Tile Switcher */}
        <div className={`flex rounded-xl p-1 shadow-xl backdrop-blur-xl border ${
          isDark ? "bg-slate-950/90 border-slate-800" : "bg-white/95 border-slate-300"
        }`}>
          <button
            onClick={() => setBaseLayer("satellite")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              baseLayer === "satellite"
                ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBaseLayer("dark")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              baseLayer === "dark"
                ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dark Tile
          </button>
          <button
            onClick={() => setBaseLayer("osm")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              baseLayer === "osm"
                ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Street Map
          </button>
        </div>
      </div>

      {/* Top-Right: Real-Time Wind Vector HUD */}
      <div className="absolute top-4 right-4 z-[1000] select-none font-mono text-xs">
        <div className={`rounded-xl p-3 shadow-2xl backdrop-blur-xl border w-48 transition-colors ${
          isDark
            ? "bg-slate-950/90 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-300 text-slate-900 shadow-slate-300/50"
        }`}>
          <div className={`flex items-center justify-between pb-1.5 border-b text-[10px] font-bold uppercase tracking-wider ${
            isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
          }`}>
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-teal-400" />
              <span>WIND DISPERSION</span>
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider flex items-center gap-1 ${
                isWeatherLive
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
              title={isWeatherLive ? "Open-Meteo Global NWP Model (Zero-Key Realtime Feed)" : "Regional Baseline"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isWeatherLive ? "bg-teal-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{isWeatherLive ? "OPEN-METEO" : "SIM"}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className={`relative w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${
              isDark ? "border-slate-700 bg-slate-900/90" : "border-slate-300 bg-slate-100"
            }`}>
              <span className="absolute top-0.5 text-[8px] text-slate-400 font-bold">N</span>
              <span className="absolute bottom-0.5 text-[8px] text-slate-400 font-bold">S</span>
              <span className="absolute left-1 text-[8px] text-slate-400 font-bold">W</span>
              <span className="absolute right-1 text-[8px] text-slate-400 font-bold">E</span>
              <div
                className="w-1 h-7 flex flex-col justify-between items-center transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${currentWeather.windDeg}deg)` }}
              >
                <div className="w-1.5 h-3 bg-rose-500 rounded-t-sm" />
                <div className="w-1.5 h-3 bg-slate-400 rounded-b-sm" />
              </div>
            </div>

            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold text-sm">{currentWeather.windSpeedKmH} km/h</div>
              <div className="text-teal-500 font-semibold">{currentWeather.windDirectionText}</div>
              <div className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Gusts: {currentWeather.gustSpeedKmH} km/h
              </div>
            </div>
          </div>

          {/* Cloud Cover Progress */}
          <div className={`mt-2.5 pt-2 border-t text-[10px] space-y-1 ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}>
            <div className={`flex justify-between ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              <span>Cloud Occlusion:</span>
              <span
                className={
                  currentWeather.cloudCoverPercent > 60
                    ? "text-rose-500 font-bold"
                    : "text-emerald-500 font-semibold"
                }
              >
                {currentWeather.cloudCoverPercent}%
              </span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${
              isDark ? "bg-slate-800" : "bg-slate-200"
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentWeather.cloudCoverPercent > 60 ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${currentWeather.cloudCoverPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-Right Zoom & Recenter Controls */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-1.5 select-none">
        <button
          onClick={handleGlobalView}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition cursor-pointer ${
            isDark
              ? "bg-slate-950/90 border-slate-700/80 text-emerald-400 hover:text-white hover:border-emerald-400"
              : "bg-white/95 border-slate-300 text-emerald-600 hover:text-emerald-700 hover:border-emerald-500"
          }`}
          title="Global World View (Show All Red Dots Worldwide)"
        >
          <Globe className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition cursor-pointer ${
            isDark
              ? "bg-slate-950/90 border-slate-700/80 text-cyan-400 hover:text-white hover:border-cyan-400"
              : "bg-white/95 border-slate-300 text-cyan-600 hover:text-cyan-700 hover:border-cyan-500"
          }`}
          title="Recenter Map on Selected Alert Hotspot"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition cursor-pointer ${
            isDark
              ? "bg-slate-950/90 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500"
              : "bg-white/95 border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400"
          }`}
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition cursor-pointer ${
            isDark
              ? "bg-slate-950/90 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500"
              : "bg-white/95 border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400"
          }`}
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
