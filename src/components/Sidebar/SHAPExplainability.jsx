import React from "react";
import { BrainCircuit, Info, TrendingUp, TrendingDown } from "lucide-react";

export function SHAPExplainability({ shapFactors, aiConfidence }) {
  if (!shapFactors || shapFactors.length === 0) return null;

  return (
    <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 font-mono text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>SHAP AI EXPLAINABILITY FACTORS</span>
        </div>
        <span className="text-[10px] text-slate-400">TreeSHAP v2.4</span>
      </div>

      <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
        Feature attribution breakdown explaining why the AI classified this event with{" "}
        <span className="text-cyan-300 font-bold">{aiConfidence}% confidence</span>:
      </p>

      {/* Waterfall / Contribution Bars */}
      <div className="space-y-2.5">
        {shapFactors.map((factor, idx) => {
          const isElevating = factor.impact === "risk_elevating";
          const barWidth = Math.min(100, Math.abs(factor.contribution) * 100);

          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-200 truncate pr-2 flex items-center gap-1">
                  {isElevating ? (
                    <TrendingUp className="w-3 h-3 text-rose-400 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                  )}
                  {factor.feature}
                </span>
                <span
                  className={`font-bold shrink-0 ${
                    isElevating ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {factor.percentText}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isElevating
                      ? "bg-gradient-to-r from-rose-600 to-rose-400"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Tooltip / Explanation Note */}
              <p className="text-[10px] text-slate-400 mt-1 pl-4 leading-normal hidden group-hover:block">
                {factor.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
