import React from "react";
import {
  Ruler,
  MapPin,
  Layers,
  Sliders,
  Camera,
  Share2,
  HelpCircle,
  Monitor
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import { ThermaTwinLogo } from "../Common/ThermaTwinLogo";

export function NASABottomDock() {
  const { openBacktestingModal, toggleLayer, activeLayers, baseLayer, setBaseLayer } = useThermaTwin();

  const handleCapture = () => {
    window.print();
  };

  return (
    <>
      {/* Floating Tactical Command Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] select-none font-mono">
        <div className="flex items-center gap-1 bg-slate-950/95 border border-slate-700/80 backdrop-blur-xl px-3 py-1.5 rounded-xl shadow-2xl text-[11px] text-slate-300">
          {/* MEASURE */}
          <button
            onClick={() => alert("Measurement Tool: Calculate distances and dispersion radii between facilities.")}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[9px] font-semibold tracking-wider uppercase">MEASURE</span>
          </button>

          {/* LOCATION */}
          <button
            onClick={() => alert("Location Tool: Geolocation centered on selected industrial asset.")}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-semibold tracking-wider uppercase">LOCATION</span>
          </button>

          {/* LAYERS */}
          <button
            onClick={() => toggleLayer("osm")}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded transition cursor-pointer ${
              activeLayers.osm
                ? "bg-purple-950/80 text-purple-300 border border-purple-500/40"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[9px] font-semibold tracking-wider uppercase">OSM LAYERS</span>
          </button>

          {/* TIMELINE (Historical Backtesting Simulation Mode) */}
          <button
            onClick={openBacktestingModal}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[9px] font-bold tracking-wider uppercase">SIMULATION</span>
          </button>

          {/* CAPTURE */}
          <button
            onClick={handleCapture}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[9px] font-semibold tracking-wider uppercase">CAPTURE</span>
          </button>

          {/* SHARE */}
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert("C2 Dashboard URL copied to clipboard!");
              }
            }}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[9px] font-semibold tracking-wider uppercase">SHARE</span>
          </button>

          {/* HELP */}
          <button
            onClick={() => alert("ThermaTwin C2 Architecture:\n1. Ingestion: VIIRS/MODIS Satellite Thermal Feeds\n2. Spatial DB: OSM Industrial Polygons (ST_Intersects)\n3. AI Classifier: 3σ Baseline Anomaly Detection\n4. Dispatch: ERSS-112 Webhooks")}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[9px] font-semibold tracking-wider uppercase">HELP</span>
          </button>

          {/* VIEW MODE */}
          <button
            onClick={() => setBaseLayer(baseLayer === "satellite" ? "dark" : "satellite")}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[9px] font-semibold tracking-wider uppercase">
              {baseLayer === "satellite" ? "SATELLITE" : "TACTICAL"}
            </span>
          </button>

          <div className="w-[1px] h-6 bg-slate-700 mx-1" />

          {/* Custom ThermaTwin C2 Emblem */}
          <div className="px-1 py-0.5" title="ThermaTwin Industrial C2 Engine">
            <ThermaTwinLogo className="w-6 h-6 drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* Map Scale Bar on Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-[1000] select-none font-mono">
        <div className="bg-slate-950/80 border border-slate-700/70 px-2 py-1 rounded text-[10px] text-slate-300 shadow-lg">
          <div className="border-b border-l border-r border-slate-300 h-1.5 w-20 mb-0.5" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>0</span>
            <span>2000 km</span>
          </div>
        </div>
      </div>
    </>
  );
}
