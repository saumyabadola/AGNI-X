import React from "react";
import { Polygon, Tooltip } from "react-leaflet";
import { Factory } from "lucide-react";

export function IndustrialPolygon({ zone, isSelected, isCountrySelected, onClick }) {
  // Semi-transparent purple bounding geometries for industrial zones (landuse=industrial, man_made=works)
  const pathOptions = {
    color: isSelected
      ? "#38bdf8" // Bright Cyan 400 when specifically selected
      : isCountrySelected
      ? "#c084fc" // Vivid Purple 400 when part of selected country
      : "#8b5cf6", // Standard Violet 500
    weight: isSelected ? 3.0 : isCountrySelected ? 2.4 : 1.6,
    opacity: isSelected ? 0.95 : isCountrySelected ? 0.9 : 0.7,
    fillColor: isSelected ? "#0284c7" : isCountrySelected ? "#9333ea" : "#7c3aed",
    fillOpacity: isSelected ? 0.35 : isCountrySelected ? 0.28 : 0.15,
    dashArray: isSelected || isCountrySelected ? "none" : "5, 5"
  };

  return (
    <Polygon
      positions={zone.coordinates}
      pathOptions={pathOptions}
      eventHandlers={{
        click: () => {
          if (onClick) onClick(zone);
        }
      }}
    >
      <Tooltip direction="top" opacity={0.95} sticky>
        <div className="p-2 font-mono text-xs max-w-xs bg-slate-950 text-slate-100 rounded-xl border border-purple-500/60 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
            <Factory className="w-3.5 h-3.5" />
            <span className="truncate">{zone.name}</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            {zone.countryName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Territory:</span>
                <span className="text-white font-semibold">{zone.countryName} ({zone.countryCode})</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">OSM Tag:</span>
              <span className="text-purple-300 font-medium">{zone.osmTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hazard Tier:</span>
              <span className="text-amber-300 font-medium">{zone.riskTier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Facilities / Flares:</span>
              <span>{zone.facilitiesCount} sites / {zone.activeFlareStacks} stacks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monitored Area:</span>
              <span>{zone.areaKm2} km²</span>
            </div>
          </div>
        </div>
      </Tooltip>
    </Polygon>
  );
}
