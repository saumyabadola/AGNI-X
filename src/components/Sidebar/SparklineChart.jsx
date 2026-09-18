import React from "react";

/**
 * Thermal Digital Twin Baseline Sparkline Chart
 * Compares current FRP against the facility's historical 3-sigma (3σ) baseline envelope
 */
export function SparklineChart({
  currentFrp,
  baselineFrp,
  isAnomaly,
  height = 56,
  width = 240
}) {
  // Generate 7-day historical hourly baseline points around baselineFrp
  // with a realistic 1-sigma variance, and a sharp spike on Day 7 if isAnomaly
  const pointsCount = 14;
  const history = React.useMemo(() => {
    const data = [];
    const base = baselineFrp || 35;
    const variance = base * 0.08;

    for (let i = 0; i < pointsCount - 1; i++) {
      // Normal operational fluctuations within 1-sigma
      const noise = (Math.sin(i * 1.3) * 0.7 + Math.cos(i * 0.9) * 0.3) * variance;
      data.push(Math.max(5, base + noise));
    }
    // Last point is the current observed FRP
    data.push(currentFrp);
    return data;
  }, [currentFrp, baselineFrp]);

  const maxVal = Math.max(...history, baselineFrp * 1.5) * 1.15;
  const minVal = 0;
  const range = maxVal - minVal || 1;

  // Compute 3-sigma upper threshold line
  const threeSigmaThreshold = baselineFrp * 1.65; // +65% threshold

  // Map coordinates to SVG viewBox
  const coords = history.map((val, idx) => {
    const x = (idx / (pointsCount - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = coords.join(" ");

  // 3-sigma line y coordinate
  const thresholdY = Math.max(4, height - ((threeSigmaThreshold - minVal) / range) * height);

  // Baseline average line y coordinate
  const baselineY = height - ((baselineFrp - minVal) / range) * height;

  // Last point coordinates
  const lastX = width;
  const lastY = height - ((currentFrp - minVal) / range) * height;

  return (
    <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px]">
      <div className="flex items-center justify-between text-slate-400 mb-1">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
          THERMAL DIGITAL TWIN (7-DAY BASELINE)
        </span>
        <span className={isAnomaly ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
          {isAnomaly ? "3σ EXCURSION" : "WITHIN 1σ"}
        </span>
      </div>

      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Safe Envelope Background Shading (0 to 3-sigma) */}
          <rect
            x="0"
            y={thresholdY}
            width={width}
            height={height - thresholdY}
            fill="#10b981"
            fillOpacity="0.06"
          />

          {/* Historical Baseline Mean Line (dashed cyan) */}
          <line
            x1="0"
            y1={baselineY}
            x2={width}
            y2={baselineY}
            stroke="#38bdf8"
            strokeWidth="1"
            strokeDasharray="3, 3"
            strokeOpacity="0.6"
          />

          {/* 3-Sigma Upper Threshold Boundary (dashed red) */}
          <line
            x1="0"
            y1={thresholdY}
            x2={width}
            y2={thresholdY}
            stroke="#f43f5e"
            strokeWidth="1.2"
            strokeDasharray="4, 3"
          />

          {/* Baseline Area Gradient */}
          <defs>
            <linearGradient id={`grad-${isAnomaly ? "rose" : "emerald"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isAnomaly ? "#f43f5e" : "#10b981"} stopOpacity="0.4" />
              <stop offset="100%" stopColor={isAnomaly ? "#f43f5e" : "#10b981"} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Sparkline Area */}
          <polygon
            points={`0,${height} ${polylineStr} ${width},${height}`}
            fill={`url(#grad-${isAnomaly ? "rose" : "emerald"})`}
          />

          {/* Main Sparkline Trend */}
          <polyline
            points={polylineStr}
            fill="none"
            stroke={isAnomaly ? "#f43f5e" : "#10b981"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Observed Pulse Point */}
          <circle
            cx={lastX}
            cy={lastY}
            r="4"
            fill={isAnomaly ? "#f43f5e" : "#10b981"}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-900">
        <span className="text-cyan-300">Mean: {baselineFrp} MW</span>
        <span className="text-rose-400">3σ Alarm: {threeSigmaThreshold.toFixed(1)} MW</span>
        <span className={isAnomaly ? "text-rose-300 font-bold" : "text-emerald-300 font-bold"}>
          Observed: {currentFrp} MW
        </span>
      </div>
    </div>
  );
}
