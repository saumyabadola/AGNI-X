import React from "react";

export function StatusBadge({ status, label, size = "md", ping = false }) {
  const configs = {
    critical: {
      bg: "bg-rose-950/80 text-rose-300 border-rose-500/60",
      dot: "bg-rose-500",
      pingColor: "bg-rose-400",
      defaultText: "Critical Fire Anomaly"
    },
    warning: {
      bg: "bg-amber-950/80 text-amber-300 border-amber-500/60",
      dot: "bg-amber-500",
      pingColor: "bg-amber-400",
      defaultText: "Thermal Runaway Risk"
    },
    safe: {
      bg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/60",
      dot: "bg-emerald-500",
      pingColor: "bg-emerald-400",
      defaultText: "Routine Flaring / Safe"
    },
    dispatched: {
      bg: "bg-blue-950/80 text-blue-300 border-blue-500/60",
      dot: "bg-blue-400",
      pingColor: "bg-blue-300",
      defaultText: "ERSS-112 Dispatched"
    }
  };

  const config = configs[status] || configs.safe;
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border font-mono tracking-wide ${config.bg} ${sizeClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {ping && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {label || config.defaultText}
    </span>
  );
}

export function MetricPill({ icon: Icon, label, value, color = "slate" }) {
  const colorMap = {
    slate: "bg-slate-900/90 text-slate-300 border-slate-700/60",
    rose: "bg-rose-950/60 text-rose-300 border-rose-700/50",
    amber: "bg-amber-950/60 text-amber-300 border-amber-700/50",
    emerald: "bg-emerald-950/60 text-emerald-300 border-emerald-700/50",
    purple: "bg-purple-950/60 text-purple-300 border-purple-700/50",
    cyan: "bg-cyan-950/60 text-cyan-300 border-cyan-700/50"
  };

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono ${colorMap[color] || colorMap.slate}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 opacity-80" />}
      <span className="text-slate-400">{label}:</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
