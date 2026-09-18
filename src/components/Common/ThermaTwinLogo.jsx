import React from "react";

/**
 * Custom ThermaTwin C2 Emblem
 * High-tech industrial thermal anomaly detection sensor crosshair with heatwave core.
 * Replaces any external/agency logos with proprietary C2 branding.
 */
export function ThermaTwinLogo({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Core Heat Anomaly Gradient */}
        <radialGradient id="c2-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff4444" stopOpacity="1" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
        </radialGradient>

        <linearGradient id="c2-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      {/* Hexagonal Outer Frame */}
      <polygon
        points="50,6 88,27 88,73 50,94 12,73 12,27"
        fill="#070d1a"
        stroke="url(#c2-ring-grad)"
        strokeWidth="3"
      />

      {/* Targeting Reticle Grid */}
      <circle cx="50" cy="50" r="32" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
      <circle cx="50" cy="50" r="20" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />

      {/* Crosshair Ticks */}
      <line x1="50" y1="12" x2="50" y2="24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="76" x2="50" y2="88" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="50" x2="28" y2="50" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="72" y1="50" x2="84" y2="50" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

      {/* Core Heat Signature */}
      <circle cx="50" cy="50" r="10" fill="url(#c2-core-glow)" />
      <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
    </svg>
  );
}
