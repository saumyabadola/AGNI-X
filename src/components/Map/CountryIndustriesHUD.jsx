import React, { useState } from "react";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import {
  Factory,
  Flame,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  MapPin,
  CheckCircle2
} from "lucide-react";

export function CountryIndustriesHUD() {
  const {
    selectedCountry,
    resetCountry,
    countryIndustrialZones,
    hotspots,
    selectedHotspotId,
    setSelectedHotspotId,
    flyToIncident,
    theme
  } = useThermaTwin();

  const isDark = theme === "dark";
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!selectedCountry) return null;

  // Aggregate stats for the selected country's industries
  const totalFacilities = countryIndustrialZones.reduce(
    (acc, z) => acc + (z.facilitiesCount || 0),
    0
  );
  const totalFlares = countryIndustrialZones.reduce(
    (acc, z) => acc + (z.activeFlareStacks || 0),
    0
  );
  const totalArea = countryIndustrialZones.reduce(
    (acc, z) => acc + (z.areaKm2 || 0),
    0
  );

  const handleZoneClick = (zone) => {
    // Find if this zone has an active hotspot
    const targetHotspot = (hotspots || []).find((h) => h.zoneId === zone.id);
    if (targetHotspot) {
      setSelectedHotspotId(targetHotspot.id);
      flyToIncident(targetHotspot.latitude, targetHotspot.longitude, 13);
    } else {
      flyToIncident(zone.center[0], zone.center[1], 13);
    }
  };

  return (
    <div className="absolute bottom-6 left-4 z-[1000] w-96 max-w-[calc(100vw-2rem)] font-mono text-xs select-none transition-all duration-300">
      <div
        className={`rounded-2xl shadow-2xl backdrop-blur-2xl border overflow-hidden transition-all duration-300 ${
          isDark
            ? "bg-slate-950/95 border-purple-500/70 text-slate-200 shadow-purple-950/50"
            : "bg-white/95 border-purple-400 text-slate-800 shadow-purple-200/50"
        }`}
      >
        {/* Header Bar */}
        <div
          className={`px-3.5 py-2.5 border-b flex items-center justify-between cursor-pointer ${
            isDark ? "bg-purple-950/40 border-purple-500/30" : "bg-purple-50/80 border-purple-200"
          }`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-xl shrink-0" role="img" aria-label={selectedCountry.name}>
              {selectedCountry.flag}
            </span>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className={`font-black text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                  {selectedCountry.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  {selectedCountry.code}
                </span>
              </div>
              <span className={`text-[10px] block truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {countryIndustrialZones.length} Industrial Hub{countryIndustrialZones.length !== 1 ? "s" : ""} Monitored
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1 rounded-md transition cursor-pointer ${
                isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
              title={isCollapsed ? "Expand industrial assets HUD" : "Collapse HUD"}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={resetCountry}
              className={`p-1 rounded-md transition cursor-pointer ${
                isDark ? "text-slate-400 hover:text-rose-400" : "text-slate-500 hover:text-rose-600"
              }`}
              title="Close Country Filter / Back to Global"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsed State Quick Preview */}
        {!isCollapsed && (
          <>
            {/* Quick Metrics Bar */}
            {countryIndustrialZones.length > 0 ? (
              <div
                className={`grid grid-cols-3 divide-x px-3 py-2 text-[10px] text-center border-b ${
                  isDark
                    ? "bg-slate-900/40 border-slate-800 divide-slate-800"
                    : "bg-slate-50 border-slate-200 divide-slate-200"
                }`}
              >
                <div>
                  <span className={`block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Facilities</span>
                  <strong className={`text-xs ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                    {totalFacilities}
                  </strong>
                </div>
                <div>
                  <span className={`block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Flare Stacks</span>
                  <strong className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                    {totalFlares}
                  </strong>
                </div>
                <div>
                  <span className={`block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Monitored Area</span>
                  <strong className={`text-xs ${isDark ? "text-cyan-300" : "text-cyan-700"}`}>
                    {totalArea.toFixed(1)} km²
                  </strong>
                </div>
              </div>
            ) : null}

            {/* Scrollable Industrial Zones List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/40 p-1.5 space-y-1">
              {countryIndustrialZones.length === 0 ? (
                <div className="p-4 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    Orbital Satellite Surveillance Active
                  </p>
                  <p className={`text-[10px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    NASA VIIRS & MODIS passes are actively monitoring {selectedCountry.name}. No critical runaway fires or high-heat anomalies are currently registered.
                  </p>
                </div>
              ) : (
                countryIndustrialZones.map((zone) => {
                  const targetHotspot = (hotspots || []).find((h) => h.zoneId === zone.id);
                  const isZoneSelected = selectedHotspotId === targetHotspot?.id;
                  const hasAlert = targetHotspot && (targetHotspot.status === "critical" || targetHotspot.status === "warning");

                  return (
                    <div
                      key={zone.id}
                      onClick={() => handleZoneClick(zone)}
                      className={`p-2 rounded-xl transition-all cursor-pointer border ${
                        isZoneSelected
                          ? isDark
                            ? "bg-purple-950/70 border-purple-500 text-white shadow-lg"
                            : "bg-purple-50 border-purple-500 text-purple-950 shadow-md"
                          : hasAlert
                          ? isDark
                            ? "bg-red-950/30 border-red-800/60 hover:border-red-500"
                            : "bg-red-50/50 border-red-300 hover:border-red-400"
                          : isDark
                          ? "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/90 hover:border-purple-500/50"
                          : "bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-purple-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                          <Factory className={`w-3.5 h-3.5 shrink-0 ${
                            hasAlert ? "text-red-400" : "text-purple-400"
                          }`} />
                          <span className="truncate">{zone.name}</span>
                        </div>

                        {targetHotspot ? (
                          <span
                            className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                              targetHotspot.status === "critical"
                                ? "bg-red-950 text-red-300 border border-red-700 animate-pulse"
                                : targetHotspot.status === "warning"
                                ? "bg-amber-950 text-amber-300 border border-amber-700"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                            }`}
                          >
                            {targetHotspot.status === "critical"
                              ? "Critical Fire"
                              : targetHotspot.status === "warning"
                              ? "Thermal Warning"
                              : "Safe Flare"}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                            Nominal
                          </span>
                        )}
                      </div>

                      <div className={`text-[10px] space-y-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        <div className="flex items-center justify-between">
                          <span className="truncate">{zone.type}</span>
                          <span className="shrink-0 font-medium text-slate-300">{zone.areaKm2} km²</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">
                            {zone.state ? `${zone.district || zone.state}, ${zone.state}` : zone.district}
                          </span>
                          <span className="text-purple-400 font-semibold flex items-center gap-1">
                            <span>Zoom & Inspect</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
