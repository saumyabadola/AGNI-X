import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useThermaTwin } from "../../context/ThermaTwinContext";

export function Toast() {
  const { toast } = useThermaTwin();
  if (!toast) return null;

  const icons = {
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    alert: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
  };

  const borders = {
    info: "border-cyan-500/50 bg-slate-900/95 shadow-cyan-950/50",
    success: "border-emerald-500/50 bg-slate-900/95 shadow-emerald-950/50",
    alert: "border-amber-500/50 bg-slate-900/95 shadow-amber-950/50",
    error: "border-rose-500/50 bg-slate-900/95 shadow-rose-950/50"
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-in transition-all">
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-xl shadow-2xl ${
          borders[toast.type] || borders.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-100 font-mono tracking-wide">{toast.title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}
