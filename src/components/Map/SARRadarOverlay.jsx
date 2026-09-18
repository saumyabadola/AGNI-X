import React from "react";
import { Circle, Tooltip } from "react-leaflet";
import { Radio, Eye } from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";

export function SARRadarOverlay({ hotspot }) {
  const { activeLayers } = useThermaTwin();
  if (!activeLayers.sar || !hotspot) return null;

  // Render concentric synthetic radar backscatter contours around the target anomaly
  return (
    <>
      {/* Outer Radar Aperture Circle */}
      <Circle
        center={[hotspot.latitude, hotspot.longitude]}
        radius={2200}
        pathOptions={{
          color: "#06b6d4", // Cyan
          weight: 1.5,
          dashArray: "6, 6",
          fillColor: "#0891b2",
          fillOpacity: 0.12
        }}
      >
        <Tooltip direction="top" opacity={0.95}>
          <div className="p-2.5 font-mono text-xs bg-slate-950/95 text-cyan-200 rounded border border-cyan-500/80 shadow-2xl">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
              <Radio className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Sentinel-1 SAR C-Band Radar Swath</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div>Sensor: C-SAR IW (Interferometric Wide Swath)</div>
              <div>Polarization: Dual (VV + VH Backscatter)</div>
              <div>Resolution: 5m x 20m Spatial Synthetic Aperture</div>
              <div className="text-emerald-400 font-semibold">
                ✓ Piercing 88% Monsoon Cloud & Smoke Deck
              </div>
            </div>
          </div>
        </Tooltip>
      </Circle>

      {/* Mid Synthetic Backscatter Anomaly */}
      <Circle
        center={[hotspot.latitude, hotspot.longitude]}
        radius={1100}
        pathOptions={{
          color: "#38bdf8",
          weight: 2,
          dashArray: "3, 3",
          fillColor: "#0284c7",
          fillOpacity: 0.22
        }}
      />

      {/* Inner High-Intensity Anomaly Core */}
      <Circle
        center={[hotspot.latitude, hotspot.longitude]}
        radius={450}
        pathOptions={{
          color: "#a855f7", // Neon Purple SAR Return
          weight: 2.5,
          fillColor: "#9333ea",
          fillOpacity: 0.4
        }}
      >
        <Tooltip direction="bottom" opacity={0.95}>
          <div className="p-2 font-mono text-xs bg-slate-950 text-purple-200 rounded border border-purple-500 shadow-xl">
            <div className="font-bold text-purple-300">σ° Backscatter Peak: -4.8 dB</div>
            <div className="text-[10px] text-slate-300">
              High coherence delta confirms severe physical ground disturbance / boiling fuel surface
            </div>
          </div>
        </Tooltip>
      </Circle>
    </>
  );
}
