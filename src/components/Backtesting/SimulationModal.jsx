import React, { useState, useEffect } from "react";
import {
  History,
  X,
  Play,
  Pause,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Radio,
  CheckCircle2,
  TrendingDown,
  Clock,
  Sparkles,
  MapPin
} from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import { mockSimulationScenarios } from "../../data/mockSimulationScenarios";

export function SimulationModal() {
  const {
    isBacktestingOpen,
    closeBacktestingModal,
    activeScenario,
    scenarioStepIndex,
    applySimulationStep
  } = useThermaTwin();

  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timeline loop
  useEffect(() => {
    let timer;
    if (isPlaying && isBacktestingOpen) {
      timer = setInterval(() => {
        const nextStep = (scenarioStepIndex + 1) % activeScenario.timeline.length;
        applySimulationStep(activeScenario, nextStep);
        if (nextStep === activeScenario.timeline.length - 1) {
          setIsPlaying(false);
        }
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, scenarioStepIndex, activeScenario, isBacktestingOpen]);

  if (!isBacktestingOpen) return null;

  const currentStep = activeScenario.timeline[scenarioStepIndex] || activeScenario.timeline[0];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="bg-slate-950 border border-amber-500/70 rounded-2xl shadow-2xl shadow-amber-950/50 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border-b border-amber-800/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/90 border border-amber-400/50 flex items-center justify-center text-white shadow-lg shadow-amber-900/60">
              <History className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  HISTORICAL BACKTESTING SIMULATION
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold uppercase tracking-wider">
                  HACKATHON EVALUATOR MODE
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Benchmark live false-alarm filtering vs. catastrophic industrial disaster escalation
              </p>
            </div>
          </div>
          <button
            onClick={closeBacktestingModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Scenario Selection Cards */}
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Historical Evaluation Scenario:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockSimulationScenarios.map((scen) => {
                const isSelected = activeScenario.id === scen.id;
                return (
                  <div
                    key={scen.id}
                    onClick={() => {
                      setIsPlaying(false);
                      applySimulationStep(scen, scen.timeline.length - 1);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/40"
                        : "bg-slate-900/50 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate">{scen.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          scen.scenarioType === "FALSE_ALARM_SUPPRESSION"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-600/60"
                            : scen.scenarioType === "PRE_IGNITION_DETECTION"
                            ? "bg-amber-950 text-amber-300 border-amber-600/60"
                            : scen.scenarioType === "SAR_RADAR_PIERCING"
                            ? "bg-cyan-950 text-cyan-300 border-cyan-600/60"
                            : "bg-rose-950 text-rose-300 border-rose-600/60"
                        }`}
                      >
                        {scen.scenarioType.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 mb-2">{scen.facility}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {scen.summary}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Date: {scen.date}</span>
                      <span className="text-amber-300 font-bold">{scen.falseAlarmFilterRate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Scenario Detailed Benchmark Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">ACTIVE BENCHMARK</span>
                <h4 className="text-sm font-bold text-white">{activeScenario.name}</h4>
                <div className="text-[11px] text-amber-400 font-semibold">{activeScenario.keyTakeaway}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isPlaying
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "Pause Playback" : "Auto-Play Steps"}</span>
                </button>
              </div>
            </div>

            {/* Timeline Step Selector */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>SIMULATION TIMELINE PROGRESSION:</span>
                <span className="text-cyan-300 font-bold">
                  Step {scenarioStepIndex + 1} of {activeScenario.timeline.length} ({currentStep.timeStep})
                </span>
              </div>

              {/* Step Bubbles */}
              <div className="grid grid-cols-4 gap-2">
                {activeScenario.timeline.map((step, idx) => {
                  const isCurrent = scenarioStepIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsPlaying(false);
                        applySimulationStep(activeScenario, idx);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        isCurrent
                          ? "bg-amber-950/70 border-amber-400 text-white shadow-md shadow-amber-950/50"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span>{step.timeStep}</span>
                        <span className="text-slate-400 font-normal">{step.timestamp}</span>
                      </div>
                      <div className="text-xs font-bold mt-1 text-amber-300">{step.frp} MW</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{step.statusLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Diagnostic Output */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">AI MODEL VERDICT AT THIS TIMESTAMP:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded border text-[10px] ${
                    currentStep.status === "safe"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-600/60"
                      : currentStep.status === "warning"
                      ? "bg-amber-950 text-amber-300 border-amber-600/60"
                      : "bg-rose-950 text-rose-300 border-rose-600/60"
                  }`}
                >
                  {currentStep.aiClassification}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                {currentStep.notes}
              </p>

              {/* Comparative Metrics Table */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Observed Heat</span>
                  <span className="text-sm font-bold text-amber-300">{currentStep.frp} MW</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Baseline Deviation</span>
                  <span className="text-sm font-bold text-rose-400">{currentStep.frpDeviation}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Downwind Toxic Threat</span>
                  <span className="text-sm font-bold text-cyan-300">{currentStep.plumeRisk}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900/90 border-t border-slate-800 px-6 py-3.5 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Clicking any step updates the interactive geospatial map in real-time.
          </div>
          <button
            onClick={closeBacktestingModal}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/60 transition cursor-pointer"
          >
            <span>Return to Live Command Center</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
