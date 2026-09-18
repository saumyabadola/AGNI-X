import React from "react";
import {
  Globe,
  Map,
  Flame,
  Image,
  Radio,
  Bell,
  Download,
  Server,
  BookOpen,
  HelpCircle,
  FolderOpen,
  GitBranch,
  X,
  Factory,
  Wind,
  Sliders,
  ShieldAlert
} from "lucide-react";
import { ThermaTwinLogo } from "../Common/ThermaTwinLogo";
import { useThermaTwin } from "../../context/ThermaTwinContext";

export function NASALeftNavDrawer({ isOpen, onClose }) {
  const { openBacktestingModal, baseLayer, setBaseLayer } = useThermaTwin();

  if (!isOpen) return null;

  const menuItems = [
    {
      id: "regional",
      icon: Map,
      label: "REGIONAL INDUSTRIAL C2 MAP",
      active: true,
      action: onClose
    },
    {
      id: "zones",
      icon: Factory,
      label: "OSM INDUSTRIAL ZONES (OVERPASS)",
      action: () => {
        alert("Overpass API Extraction Active:\n- landuse=industrial\n- man_made=works\n- industrial=*");
        onClose();
      }
    },
    {
      id: "active",
      icon: Flame,
      label: "SATELLITE THERMAL HOTSPOTS (VIIRS/MODIS)",
      action: onClose
    },
    {
      id: "plumes",
      icon: Wind,
      label: "TOXIC PLUME DISPERSION DANGER CONES",
      action: onClose
    },
    {
      id: "baseline",
      icon: Radio,
      label: "3σ BASELINE FILTER & PERSISTENT FLARES",
      action: () => {
        alert("3-Sigma Baseline Engine:\nMaintains 90-day μ and σ for registered coordinates to automatically ignore routine flaring.");
        onClose();
      }
    },
    {
      id: "alerts",
      icon: Bell,
      label: "ERSS-112 EMERGENCY DISPATCH FEED",
      badge: "LIVE",
      action: onClose
    },
    {
      id: "webservices",
      icon: Server,
      label: "FASTAPI REST API & SWAGGER DOCS",
      action: () => {
        alert("FastAPI Endpoints Active:\n- GET  /api/v1/hotspots/live\n- GET  /api/v1/zones/industrial\n- GET  /api/v1/plume/predict\n- POST /api/v1/alerts/dispatch\n- POST /api/v1/backtest/simulate");
        onClose();
      }
    },
    {
      id: "tutorials",
      icon: Sliders,
      label: "HISTORICAL BACKTESTING SIMULATION",
      badge: "DEMO",
      action: () => {
        onClose();
        openBacktestingModal();
      }
    },
    {
      id: "download",
      icon: Download,
      label: "EXPORT CLASSIFIED INCIDENTS (GEOJSON)",
      action: () => {
        alert("Exporting classified thermal anomalies GeoJSON...");
      }
    },
    {
      id: "faqs",
      icon: HelpCircle,
      label: "AI CLASSIFIER & SHAP METHODOLOGY",
      action: () => {
        alert("ThermaTwin Core Pipeline:\n1. Spatial Intersection (ST_Intersects with OSM)\n2. 3-Sigma Anomaly Baseline Check\n3. Dynamic Toxic Plume Cone Simulation\n4. One-Click ERSS-112 Webhook Dispatch");
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-[2500] flex select-none font-mono">
      {/* Dark Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Menu Container */}
      <div className="relative w-80 max-w-full bg-[#080d1a] text-slate-200 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10 text-xs animate-slide-right">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ThermaTwinLogo className="w-7 h-7 drop-shadow-md" />
            <div className="flex flex-col">
              <span className="text-sm font-black text-white tracking-wider font-mono">
                THERMATWIN <span className="text-cyan-400">C2</span>
              </span>
              <span className="text-[10px] text-slate-400">Operations & Pipelines</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 py-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition cursor-pointer ${
                  item.active
                    ? "bg-cyan-950/40 text-cyan-200 font-bold border-l-4 border-cyan-500"
                    : "hover:bg-slate-900/80 text-slate-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.active ? "text-cyan-400" : "text-slate-400"}`} />
                  <span className="text-[11px] tracking-wide">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-200">ThermaTwin Platform</div>
          <div>AI Industrial Fire & Thermal Detection</div>
          <div className="text-cyan-400/80 pt-0.5 font-semibold">PS: 162 Production C2</div>
        </div>
      </div>
    </div>
  );
}
