import React, { useState, useRef, useEffect, useMemo } from "react";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import {
  Search,
  Globe,
  Factory,
  ChevronDown,
  X,
  Flame,
  Check
} from "lucide-react";

export function CountrySearchDropdown({ isInline = false, className = "" }) {
  const {
    worldCountries,
    selectedCountry,
    selectCountry,
    resetCountry,
    industrialZones,
    hotspots,
    theme
  } = useThermaTwin();

  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "monitored"
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute stats per country (industrial zones count & active alerts)
  const countryStats = useMemo(() => {
    const stats = {};
    (industrialZones || []).forEach((zone) => {
      if (!zone.countryCode) return;
      if (!stats[zone.countryCode]) {
        stats[zone.countryCode] = { zonesCount: 0, criticalCount: 0, warningCount: 0 };
      }
      stats[zone.countryCode].zonesCount += 1;
    });

    (hotspots || []).forEach((h) => {
      const zone = industrialZones.find((z) => z.id === h.zoneId);
      if (zone && zone.countryCode) {
        if (!stats[zone.countryCode]) {
          stats[zone.countryCode] = { zonesCount: 0, criticalCount: 0, warningCount: 0 };
        }
        if (h.status === "critical") stats[zone.countryCode].criticalCount += 1;
        if (h.status === "warning") stats[zone.countryCode].warningCount += 1;
      }
    });

    return stats;
  }, [industrialZones, hotspots]);

  // Filtered countries based on search and tab
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (worldCountries || []).filter((c) => {
      const matchesText =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q);

      if (!matchesText) return false;

      if (filterMode === "monitored") {
        return (countryStats[c.code]?.zonesCount || 0) > 0;
      }
      return true;
    });
  }, [worldCountries, searchQuery, filterMode, countryStats]);

  const handleSelect = (country) => {
    selectCountry(country);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleReset = (e) => {
    e.stopPropagation();
    resetCountry();
    setIsOpen(false);
    setSearchQuery("");
  };

  const containerClass = className
    ? className
    : isInline
    ? "relative z-40 w-full font-mono text-xs select-none"
    : "absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md font-mono text-xs select-none";

  return (
    <div ref={dropdownRef} className={containerClass}>
      {/* Search Input / Trigger Button Bar */}
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-md border transition-all duration-200 ${
          isInline ? "min-h-[58px]" : "rounded-2xl shadow-2xl backdrop-blur-xl"
        } ${
          isOpen
            ? isDark
              ? "bg-slate-950 border-cyan-500 ring-2 ring-cyan-500/30"
              : "bg-white border-cyan-500 ring-2 ring-cyan-500/20 shadow-cyan-900/10"
            : selectedCountry
            ? isDark
              ? "bg-slate-950/95 border-purple-500/80 shadow-purple-950/50"
              : "bg-white/95 border-purple-400 shadow-purple-200/50"
            : isDark
            ? "bg-slate-900/90 border-slate-700/80 hover:border-slate-500"
            : "bg-white/95 border-slate-300 hover:border-slate-400"
        }`}
      >
        {/* Search Icon or Country Flag */}
        <div className="shrink-0 flex items-center justify-center">
          {selectedCountry ? (
            <span className="text-base" role="img" aria-label={selectedCountry.name}>
              {selectedCountry.flag}
            </span>
          ) : (
            <Search className="w-4 h-4 text-cyan-400" />
          )}
        </div>

        {/* Input or Selected Country Display */}
        <div className="flex-1 min-w-0">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search country, ISO code, or region..."
              autoFocus
              className={`w-full bg-transparent outline-none text-xs ${
                isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
              }`}
            />
          ) : (
            <div
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-between cursor-pointer truncate"
            >
              {selectedCountry ? (
                <div className="flex items-center gap-2 truncate">
                  <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {selectedCountry.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40">
                    {countryStats[selectedCountry.code]?.zonesCount || 0} Industrial Hubs
                  </span>
                </div>
              ) : (
                <span className={`truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Search any country on map...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions: Clear or Chevron */}
        <div className="flex items-center gap-1 shrink-0">
          {selectedCountry && (
            <button
              onClick={handleReset}
              className={`p-1 rounded-full transition cursor-pointer ${
                isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Reset to Global World View"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1 rounded-md transition cursor-pointer ${
              isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute mt-2 z-[2000] rounded-2xl shadow-2xl backdrop-blur-2xl border overflow-hidden transition-all duration-200 max-h-[420px] flex flex-col ${
            isInline ? "top-full left-0 right-0 sm:left-auto sm:right-0 sm:w-[420px]" : "w-full"
          } ${
            isDark
              ? "bg-slate-950/98 border-slate-700/90 text-slate-200 shadow-cyan-950/40"
              : "bg-white/98 border-slate-300 text-slate-800 shadow-slate-400/40"
          }`}
        >
          {/* Header & Quick Filter Pills */}
          <div
            className={`p-2.5 border-b flex items-center justify-between text-[11px] ${
              isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-slate-400">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>GEOSPATIAL COUNTRY DIRECTORY</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                  filterMode === "all"
                    ? "bg-cyan-500 text-slate-950 font-black"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({worldCountries.length})
              </button>
              <button
                onClick={() => setFilterMode("monitored")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                  filterMode === "monitored"
                    ? "bg-purple-500 text-white font-black"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Active Hubs
              </button>
            </div>
          </div>

          {/* Quick Option: Reset / Global World View */}
          <div
            onClick={handleReset}
            className={`px-3 py-2 border-b flex items-center justify-between cursor-pointer transition ${
              !selectedCountry
                ? isDark
                  ? "bg-cyan-950/40 text-cyan-300 font-bold"
                  : "bg-cyan-50 text-cyan-800 font-bold"
                : isDark
                ? "hover:bg-slate-900 text-slate-300 border-slate-800"
                : "hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold">Global World View (All Countries)</span>
                <span className={`block text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Show global thermal anomaly detections worldwide
                </span>
              </div>
            </div>
            {!selectedCountry && <Check className="w-4 h-4 text-cyan-400" />}
          </div>

          {/* Scrollable Countries List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40">
            {filteredCountries.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No countries found matching "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map((country) => {
                const stats = countryStats[country.code];
                const zonesCount = stats?.zonesCount || 0;
                const criticalCount = stats?.criticalCount || 0;
                const isSelected = selectedCountry?.code === country.code;

                return (
                  <div
                    key={country.code}
                    onClick={() => handleSelect(country)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? isDark
                          ? "bg-purple-950/50 text-white font-bold"
                          : "bg-purple-50 text-purple-900 font-bold"
                        : isDark
                        ? "hover:bg-slate-900/90 text-slate-300"
                        : "hover:bg-slate-100/90 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0" role="img" aria-label={country.name}>
                        {country.flag}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold truncate ${isSelected ? "text-purple-300" : ""}`}>
                            {country.name}
                          </span>
                          <span className={`text-[10px] px-1 rounded ${
                            isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"
                          }`}>
                            {country.code}
                          </span>
                        </div>
                        <span className={`block text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {country.description || country.continent}
                        </span>
                      </div>
                    </div>

                    {/* Stats Badges */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {criticalCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700 font-bold animate-pulse">
                          <Flame className="w-2.5 h-2.5 text-red-400" />
                          <span>{criticalCount} Alert</span>
                        </span>
                      )}

                      {zonesCount > 0 ? (
                        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isDark
                            ? "bg-purple-950/70 border-purple-600/60 text-purple-300"
                            : "bg-purple-100 border-purple-300 text-purple-800"
                        }`}>
                          <Factory className="w-3 h-3 text-purple-400" />
                          <span>{zonesCount} {zonesCount === 1 ? "Hub" : "Hubs"}</span>
                        </span>
                      ) : (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          isDark ? "text-slate-500 bg-slate-900" : "text-slate-400 bg-slate-100"
                        }`}>
                          Surveillance
                        </span>
                      )}

                      {isSelected && <Check className="w-4 h-4 text-purple-400 ml-1" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className={`px-3 py-1.5 text-[10px] text-center border-t ${
            isDark ? "border-slate-800 text-slate-500 bg-slate-900/40" : "border-slate-200 text-slate-400 bg-slate-50"
          }`}>
            Selecting a country zooms in and showcases all registered industrial assets
          </div>
        </div>
      )}
    </div>
  );
}
