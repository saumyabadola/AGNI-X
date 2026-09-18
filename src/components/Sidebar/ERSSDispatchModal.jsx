import React, { useState } from "react";
import {
  PhoneCall,
  ShieldAlert,
  Send,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Users
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";

export function ERSSDispatchModal() {
  const {
    isDispatchModalOpen,
    closeDispatchModal,
    dispatchingHotspot,
    executeERSSDispatch,
    isDispatchLoading,
    currentWeather
  } = useThermaTwin();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'payload'

  if (!isDispatchModalOpen || !dispatchingHotspot) return null;

  const mockPayload = {
    eventType: "NDRF_ERSS112_CRITICAL_INCIDENT_ALERT",
    incidentId: dispatchingHotspot.id,
    facility: dispatchingHotspot.facilityName,
    zoneCategory: dispatchingHotspot.zoneCategory,
    coordinates: {
      latitude: dispatchingHotspot.latitude,
      longitude: dispatchingHotspot.longitude
    },
    telemetry: {
      fireRadiativePowerMW: dispatchingHotspot.frp,
      frpBaselineDeviationPercent: dispatchingHotspot.frpDeviation,
      aiConfidenceScore: dispatchingHotspot.confidence,
      brightnessTempCelsius: dispatchingHotspot.brightnessTempC,
      satelliteSource: dispatchingHotspot.satellite
    },
    dispersionHazard: {
      toxicGasType: dispatchingHotspot.plume?.toxicGas || "Volatile Hydrocarbon Effluent",
      estimatedEvacuationRadiusKm: dispatchingHotspot.plume?.projectedLengthKm || 4.2,
      atRiskPopulation: dispatchingHotspot.plume?.affectedPopulationEst || 12000,
      windVector: {
        speedKmH: currentWeather.windSpeedKmH,
        directionDegrees: currentWeather.windDeg
      }
    },
    erss112Routing: [
      "NDRF State Battalion Commander (Operations)",
      "SDRF Quick Response HazMat Team",
      "District Emergency Operation Center (DEOC)",
      "Port Health & Industrial Safety Inspectorate"
    ],
    timestampUtc: new Date().toISOString()
  };

  const handleConfirmDispatch = () => {
    executeERSSDispatch(dispatchingHotspot);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="bg-slate-950 border border-rose-500/70 rounded-xl shadow-2xl shadow-rose-950/60 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950/90 to-slate-950 border-b border-rose-900/60 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/50">
              <PhoneCall className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                DISPATCH ERSS-112 WEBHOOK
                <span className="text-[10px] bg-rose-900/80 text-rose-200 px-1.5 py-0.5 rounded border border-rose-500/50">
                  PRIORITY 1
                </span>
              </h3>
              <p className="text-[11px] text-rose-300/80">
                National Emergency Response Support System Gateway
              </p>
            </div>
          </div>
          <button
            onClick={closeDispatchModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 text-xs px-5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-3 border-b-2 font-medium transition cursor-pointer ${
              activeTab === "overview"
                ? "border-rose-500 text-rose-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Incident Triage Summary
          </button>
          <button
            onClick={() => setActiveTab("payload")}
            className={`py-2 px-3 border-b-2 font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "payload"
                ? "border-rose-500 text-rose-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Webhook JSON Payload
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === "overview" ? (
            <>
              {/* Incident Title Card */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">TARGET FACILITY</div>
                <div className="text-sm font-bold text-white mt-0.5">{dispatchingHotspot.name}</div>
                <div className="text-xs text-rose-400 mt-0.5">{dispatchingHotspot.facilityName}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  GPS: {dispatchingHotspot.latitude.toFixed(4)}°N, {dispatchingHotspot.longitude.toFixed(4)}°E
                </div>
              </div>

              {/* Critical Telemetry Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Fire Radiative Power</span>
                  <span className="text-base font-bold text-amber-300">{dispatchingHotspot.frp} MW</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Baseline Surge</span>
                  <span className="text-base font-bold text-rose-400">+{dispatchingHotspot.frpDeviation}%</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">AI Confidence</span>
                  <span className="text-base font-bold text-cyan-300">{dispatchingHotspot.confidence}%</span>
                </div>
              </div>

              {/* Plume Hazard Warning */}
              {dispatchingHotspot.plume?.active && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Lethal Downwind Plume Active</span>
                  </div>
                  <div className="text-[11px] text-rose-200/90 leading-relaxed">
                    Chemical Agent: <span className="font-semibold">{dispatchingHotspot.plume.toxicGas}</span>
                  </div>
                  <div className="text-[11px] text-rose-300">
                    Est. Affected Population:{" "}
                    <span className="font-bold">
                      {dispatchingHotspot.plume.affectedPopulationEst.toLocaleString()} residents
                    </span>
                  </div>
                </div>
              )}

              {/* Dispatch Routing List */}
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Authorized Responders Mobilized by Webhook</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 pl-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    NDRF Battalion Quick Reaction Team (HazMat)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    State Disaster Response Force (SDRF Incident Command)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    District Fire & Rescue Services (Foam Cannons & Ambulances)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    District Collectorate (Public Warning Broadcast Activated)
                  </li>
                </ul>
              </div>
            </>
          ) : (
            /* Raw JSON View */
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto text-[11px]">
              <pre className="text-emerald-400 leading-relaxed">
                {JSON.stringify(mockPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900/90 border-t border-slate-800 px-5 py-3 flex items-center justify-between">
          <button
            onClick={closeDispatchModal}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDispatch}
            disabled={isDispatchLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-xl shadow-rose-950/80 border border-rose-400 transition cursor-pointer disabled:opacity-50"
          >
            {isDispatchLoading ? (
              <>
                <Radio className="w-4 h-4 animate-spin" />
                <span>Broadcasting to ERSS-112...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>CONFIRM & TRANSMIT ERSS-112 WEBHOOK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
