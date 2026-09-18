import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Flame, AlertTriangle, ShieldCheck, ArrowRight, Radio } from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";

// Create custom animated SVG DivIcon for Leaflet: crisp small red dots for alert areas
function createHotspotIcon(status, isSelected, frp) {
  const configs = {
    critical: {
      color: "#ef4444", // Bright Crimson Red
      glow: "rgba(239, 68, 68, 0.8)",
      ringColor: "rgba(239, 68, 68, 0.45)",
      dotSize: isSelected ? 11 : 8,
      containerSize: isSelected ? 26 : 18,
      label: "🔴 CRITICAL ALERT"
    },
    warning: {
      color: "#f87171", // Vibrant Alert Red-Coral
      glow: "rgba(248, 113, 113, 0.75)",
      ringColor: "rgba(248, 113, 113, 0.4)",
      dotSize: isSelected ? 10 : 7,
      containerSize: isSelected ? 24 : 16,
      label: "🔴 THERMAL ALERT"
    },
    safe: {
      color: "#10b981", // Emerald 500
      glow: "rgba(16, 185, 129, 0.5)",
      ringColor: "rgba(16, 185, 129, 0.3)",
      dotSize: isSelected ? 8 : 5,
      containerSize: isSelected ? 20 : 14,
      label: "🟢 ROUTINE"
    }
  };

  const cfg = configs[status] || configs.critical;
  const size = cfg.containerSize;
  const dotSize = cfg.dotSize;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      <!-- Subtle Pulse Ring -->
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background: ${cfg.ringColor};
        animation: marker-pulse 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite;
      "></div>
      
      ${
        isSelected
          ? `<div style="
              position: absolute;
              width: ${size + 8}px;
              height: ${size + 8}px;
              border: 1.5px dashed ${cfg.color};
              border-radius: 9999px;
              animation: radar-sweep 4s linear infinite;
            "></div>`
          : ""
      }

      <!-- Small Crisp Center Dot -->
      <div style="
        position: relative;
        width: ${dotSize}px;
        height: ${dotSize}px;
        border-radius: 9999px;
        background-color: ${cfg.color};
        box-shadow: 0 0 8px 2px ${cfg.glow};
        border: 1.5px solid #ffffff;
        box-sizing: border-box;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-hotspot-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

export function HotspotMarker({ hotspot }) {
  const {
    selectedHotspotId,
    setSelectedHotspotId,
    openDispatchModal,
    dispatchedHotspotIds
  } = useThermaTwin();

  const isSelected = selectedHotspotId === hotspot.id;
  const isDispatched = dispatchedHotspotIds.has(hotspot.id);
  const icon = createHotspotIcon(hotspot.status, isSelected, hotspot.frp);

  return (
    <Marker
      position={[hotspot.latitude, hotspot.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => {
          setSelectedHotspotId(hotspot.id);
        }
      }}
    >
      <Popup className="custom-hotspot-popup">
        <div className="p-3 font-mono text-xs max-w-xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                hotspot.status === "critical"
                  ? "bg-rose-950 text-rose-300 border border-rose-600/50"
                  : hotspot.status === "warning"
                  ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-600/50"
              }`}
            >
              {hotspot.statusLabel}
            </span>
            <span className="text-[10px] text-slate-400">{hotspot.satellite}</span>
          </div>

          {/* Facility Title */}
          <h3 className="text-sm font-semibold text-white mb-1 leading-snug">{hotspot.name}</h3>
          <p className="text-[11px] text-slate-300 mb-2">{hotspot.facilityName}</p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded border border-slate-800 mb-3">
            <div>
              <span className="text-[10px] text-slate-400 block">Fire Radiative Power</span>
              <span className="text-sm font-bold text-amber-300">{hotspot.frp} MW</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Baseline Deviation</span>
              <span
                className={`text-sm font-bold ${
                  hotspot.frpDeviation > 50
                    ? "text-rose-400"
                    : hotspot.frpDeviation > 15
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                +{hotspot.frpDeviation}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">AI Confidence</span>
              <span className="text-xs font-semibold text-cyan-300">{hotspot.confidence}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Brightness Temp</span>
              <span className="text-xs font-semibold text-slate-200">{hotspot.brightnessTempC}°C</span>
            </div>
          </div>

          {/* Plume Info */}
          {hotspot.plume?.active && (
            <div className="mb-3 p-1.5 rounded bg-rose-950/40 border border-rose-800/50 text-[10px] text-rose-200">
              <span className="font-bold block">⚠️ Active Toxic Plume:</span>
              <span>{hotspot.plume.toxicGas}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => setSelectedHotspotId(hotspot.id)}
              className="flex-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-medium transition cursor-pointer"
            >
              View Telemetry
            </button>
            {hotspot.status !== "safe" && (
              <button
                onClick={() => openDispatchModal(hotspot)}
                disabled={isDispatched}
                className={`flex-1 py-1.5 px-2 rounded font-bold transition text-center cursor-pointer ${
                  isDispatched
                    ? "bg-blue-900/60 text-blue-300 border border-blue-500/40 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50"
                }`}
              >
                {isDispatched ? "Dispatched" : "ERSS-112"}
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
