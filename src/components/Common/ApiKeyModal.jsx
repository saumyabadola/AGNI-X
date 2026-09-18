import React, { useState } from "react";
import {
  Key,
  X,
  CheckCircle2,
  ExternalLink,
  Satellite,
  AlertCircle,
  Loader2,
  Trash2,
  Terminal,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";

export function ApiKeyModal({ isOpen, onClose }) {
  const {
    nasaMapKey,
    updateNasaMapKey,
    clearNasaMapKey,
    isNasaKeyConfigured,
    showToast,
    theme
  } = useThermaTwin();

  const isDark = theme === "dark";
  const [inputKey, setInputKey] = useState(nasaMapKey || "");
  const [selectedSource, setSelectedSource] = useState("VIIRS_NOAA20_NRT");
  const [selectedArea, setSelectedArea] = useState("world");
  const [selectedDays, setSelectedDays] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);

  if (!isOpen) return null;

  const handleSaveAndFetch = async (e) => {
    e?.preventDefault();
    const cleanKey = inputKey.trim().replace(/['"\s]/g, "");

    if (!cleanKey) {
      setErrorMsg("Please enter your NASA FIRMS MAP_KEY.");
      return;
    }

    if (cleanKey.length < 16) {
      setErrorMsg("Invalid key length: NASA MAP_KEY should be 32 hexadecimal characters.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setDiagnosticLogs([
      `[1/4] Key format verified (${cleanKey.length} chars)`,
      `[2/4] Connecting to NASA FIRMS Area API (${selectedArea === "world" ? "Global World" : "Regional Area"})...`
    ]);

    try {
      const hotspots = await updateNasaMapKey(cleanKey, selectedArea, selectedSource, selectedDays);
      
      setDiagnosticLogs((prev) => [
        ...prev,
        `[3/4] NASA response received successfully!`,
        `[4/4] Ingested ${hotspots.length} active fire alert dots onto map & 3D globe.`
      ]);

      showToast(
        "NASA FIRMS Connected",
        `Synced ${hotspots.length} active fire alert dots worldwide!`,
        "success"
      );

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 900);
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || "Failed to reach NASA FIRMS API.";
      setErrorMsg(msg);
      setDiagnosticLogs((prev) => [
        ...prev,
        `[ERROR] ${msg}`,
        `[TIP] If you just generated your key, NASA takes ~10-15 minutes to activate new keys on satellite clusters.`
      ]);
    }
  };

  const handleReset = () => {
    clearNasaMapKey();
    setInputKey("");
    setDiagnosticLogs([]);
    setErrorMsg("");
    showToast("Reset Complete", "Reverted to calibrated baseline thermal dataset.", "info");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none font-mono animate-fade-in">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
        isDark ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-900"
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Key className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">NASA FIRMS API Configuration</h3>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Stream real-time VIIRS/MODIS active fires to map & globe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAndFetch} className="p-5 space-y-4 text-xs">
          {/* Status Notification */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isNasaKeyConfigured
              ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
              : isDark
              ? "bg-slate-900/80 border-slate-800 text-slate-300"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}>
            {isNasaKeyConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Satellite className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold">
                {isNasaKeyConfigured ? "NASA FIRMS API Active" : "No MAP_KEY Configured Yet"}
              </div>
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                {isNasaKeyConfigured
                  ? "Dashboard is actively connected to NASA satellite feeds. Enter a new key below to update."
                  : "Showing calibrated baseline data. Paste your NASA MAP_KEY below to fetch live fire feeds."}
              </p>
            </div>
          </div>

          {/* Key Input */}
          <div className="space-y-1.5">
            <label className={`block font-bold text-[11px] uppercase tracking-wider ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              NASA FIRMS MAP_KEY (32-character token)
            </label>
            <input
              type="text"
              placeholder="e.g. a1b2c3d4e5f6789012345678abcdef12"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setErrorMsg("");
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none transition ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  : "bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              }`}
            />
            <div className="flex items-center justify-between text-[11px] pt-1">
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/map_key"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Get a free instant NASA MAP_KEY &rarr;</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-400">Delivered by NASA in ~30 seconds</span>
            </div>
          </div>

          {/* Feed Settings: Sensor, Global Area & Day Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className={`block font-bold text-[11px] uppercase tracking-wider mb-1 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                Sensor Product
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className={`w-full px-2.5 py-2 rounded-xl border text-[11px] font-mono outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              >
                <option value="VIIRS_NOAA20_NRT">VIIRS 375m (NOAA-20)</option>
                <option value="VIIRS_SNPP_NRT">VIIRS 375m (Suomi-NPP)</option>
                <option value="MODIS_NRT">MODIS 1km (Terra/Aqua)</option>
              </select>
            </div>

            <div>
              <label className={`block font-bold text-[11px] uppercase tracking-wider mb-1 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                Geographic Scope
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className={`w-full px-2.5 py-2 rounded-xl border text-[11px] font-mono outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              >
                <option value="world">Global (Worldwide)</option>
                <option value="68,6,98,38">India & South Asia</option>
                <option value="-125,24,-66,50">North America</option>
                <option value="-10,35,40,70">Europe</option>
              </select>
            </div>

            <div>
              <label className={`block font-bold text-[11px] uppercase tracking-wider mb-1 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                Pass Window
              </label>
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className={`w-full px-2.5 py-2 rounded-xl border text-[11px] font-mono outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              >
                <option value={2}>48 Hours (Optimal)</option>
                <option value={1}>24 Hours (Recent)</option>
                <option value={3}>72 Hours (Deep)</option>
                <option value={5}>5 Days (Weekly)</option>
              </select>
            </div>
          </div>

          {/* Diagnostic Log Console (When Testing / Error) */}
          {diagnosticLogs.length > 0 && (
            <div className={`p-3 rounded-xl border text-[11px] font-mono space-y-1 ${
              errorMsg
                ? "bg-red-950/40 border-red-700/60 text-red-200"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-300"
                : "bg-slate-100 border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                <span>API Connection Diagnostics:</span>
              </div>
              {diagnosticLogs.map((log, i) => (
                <div key={i} className="leading-tight">{log}</div>
              ))}
            </div>
          )}

          {/* Important Troubleshooting Note */}
          <div className={`p-3 rounded-xl border flex items-start gap-2 text-[11px] ${
            isDark ? "bg-slate-900/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-snug">
              <strong className={isDark ? "text-slate-200" : "text-slate-800"}>Important Note on NASA Keys:</strong>
              <p>
                When you generate a new key on NASA FIRMS, NASA's satellite servers typically take <strong>10 to 15 minutes</strong> to sync and activate the key. If you receive "Invalid MAP_KEY", please wait 10 minutes and try again.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            {isNasaKeyConfigured ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-950/40 transition cursor-pointer flex items-center gap-1.5 font-bold"
                title="Clear key and revert to baseline data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Key</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-400">Key stored locally in browser</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl border font-bold transition cursor-pointer ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900"
                }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying NASA...</span>
                  </>
                ) : (
                  <>
                    <Satellite className="w-3.5 h-3.5" />
                    <span>Save & Test Live Feed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
