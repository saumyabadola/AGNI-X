import React, { useMemo } from "react";
import { Polygon, Tooltip } from "react-leaflet";
import { Wind, Skull, AlertTriangle, ShieldAlert } from "lucide-react";

/**
 * Calculates downwind dispersion cone coordinates based on wind vector
 * @param {number} lat - Origin latitude
 * @param {number} lng - Origin longitude
 * @param {number} windDeg - Wind direction (coming from) in degrees
 * @param {number} lengthKm - Downwind plume length in km
 * @param {number} spreadAngleDeg - Half-spread angle in degrees
 */
function computePlumePolygon(lat, lng, windDeg, lengthKm, spreadAngleDeg = 18, steps = 10) {
  // Meteorological convention: windDeg is where wind comes from; plume blows towards (windDeg + 180) % 360
  const travelBearing = (windDeg + 180) % 360;
  const kmPerLat = 111.32;
  const kmPerLng = 111.32 * Math.cos((lat * Math.PI) / 180);

  const coords = [[lat, lng]]; // Start at hotspot origin

  const startAngle = travelBearing - spreadAngleDeg;
  const endAngle = travelBearing + spreadAngleDeg;
  const angleStep = (endAngle - startAngle) / steps;

  // Generate curved parabolic front
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * angleStep;
    const rad = (angle * Math.PI) / 180;
    const centerFactor = 1 - 0.28 * Math.pow((angle - travelBearing) / spreadAngleDeg, 2);
    const effectiveLength = lengthKm * Math.max(0.6, centerFactor);

    const dLat = (effectiveLength * Math.cos(rad)) / kmPerLat;
    const dLng = (effectiveLength * Math.sin(rad)) / kmPerLng;

    coords.push([lat + dLat, lng + dLng]);
  }

  coords.push([lat, lng]); // Close back to origin
  return coords;
}

export function ToxicPlumeCone({ hotspot, weather }) {
  const isPlumeActive = Boolean(hotspot?.plume && hotspot.plume.active);

  const windDeg = weather?.windDeg ?? hotspot?.plume?.windDeg ?? 270;
  const windSpeed = weather?.windSpeedKmH ?? hotspot?.plume?.windSpeedKmH ?? 20;

  // Scale plume length with FRP and wind velocity
  const baseLength = hotspot?.plume?.projectedLengthKm || 6.0;
  const scaledLength = Math.min(14.0, Math.max(3.0, baseLength * (windSpeed / 18)));

  const lat = hotspot?.latitude ?? 0;
  const lng = hotspot?.longitude ?? 0;

  // Three-Tier Downwind Trajectory:
  // Sector 1: IDLH Lethal Red Core (0 - 35% distance)
  // Sector 2: 2-Hour Mandatory Evacuation Orange Sector (35% - 65% distance)
  // Sector 3: Downwind Advisory Yellow Sector (65% - 100% distance)
  const sector3AdvisoryCoords = useMemo(
    () => computePlumePolygon(lat, lng, windDeg, scaledLength, 22),
    [lat, lng, windDeg, scaledLength]
  );

  const sector2EvacuationCoords = useMemo(
    () => computePlumePolygon(lat, lng, windDeg, scaledLength * 0.65, 17),
    [lat, lng, windDeg, scaledLength]
  );

  const sector1IdlhCoords = useMemo(
    () => computePlumePolygon(lat, lng, windDeg, scaledLength * 0.35, 12),
    [lat, lng, windDeg, scaledLength]
  );

  if (!isPlumeActive) return null;

  return (
    <>
      {/* Sector 3: Outer Advisory Perimeter (Yellow Translucent Gradient) */}
      <Polygon
        positions={sector3AdvisoryCoords}
        pathOptions={{
          color: "#eab308",
          weight: 1.5,
          fillColor: "#facc15",
          fillOpacity: 0.14,
          dashArray: "4, 4"
        }}
      >
        <Tooltip direction="top" opacity={0.95}>
          <div className="p-2.5 font-mono text-xs bg-slate-950/95 text-slate-100 rounded-lg border border-yellow-500/70 shadow-2xl max-w-xs">
            <div className="flex items-center gap-1.5 text-yellow-400 font-bold mb-1">
              <Wind className="w-4 h-4" />
              <span>SECTOR 3: DOWNWIND ADVISORY ZONE</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div>Agent: <span className="text-white font-medium">{hotspot.plume.toxicGas}</span></div>
              <div>Wind: {windSpeed} km/h from {windDeg}°</div>
              <div>Reach: {scaledLength.toFixed(1)} km downwind</div>
              <div className="text-yellow-300 font-medium">Protocol: Shelter-in-place, seal HVAC air intakes.</div>
            </div>
          </div>
        </Tooltip>
      </Polygon>

      {/* Sector 2: 2-Hour Mandatory Evacuation Sector (Orange Translucent Gradient) */}
      <Polygon
        positions={sector2EvacuationCoords}
        pathOptions={{
          color: "#f97316",
          weight: 2,
          fillColor: "#ea580c",
          fillOpacity: 0.24
        }}
      >
        <Tooltip direction="top" opacity={0.95}>
          <div className="p-2.5 font-mono text-xs bg-slate-950/95 text-slate-100 rounded-lg border border-orange-500/80 shadow-2xl max-w-xs">
            <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>SECTOR 2: 2-HOUR EVACUATION PERIMETER</span>
            </div>
            <div className="text-[11px] text-slate-200 space-y-1">
              <div>Exposure Threshold: Exceeds ERPG-2 Safety Limits</div>
              <div>Estimated Population: <span className="font-bold text-white">{hotspot.plume.affectedPopulationEst.toLocaleString()} people</span></div>
              <div className="text-orange-300 font-bold">Action: Immediate bus & ambulance dispatch.</div>
            </div>
          </div>
        </Tooltip>
      </Polygon>

      {/* Sector 1: IDLH Lethal Core (Red Translucent Gradient) */}
      <Polygon
        positions={sector1IdlhCoords}
        pathOptions={{
          color: "#ef4444",
          weight: 2.5,
          fillColor: "#dc2626",
          fillOpacity: 0.42
        }}
      >
        <Tooltip direction="top" opacity={0.95}>
          <div className="p-2.5 font-mono text-xs bg-slate-950/95 text-rose-100 rounded-lg border border-rose-500 shadow-2xl max-w-xs">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
              <Skull className="w-4 h-4 animate-bounce" />
              <span>SECTOR 1: IDLH LETHAL TOXIC CORE</span>
            </div>
            <div className="text-[11px] text-rose-200 space-y-1">
              <div>Immediate Danger to Life or Health (0 - {(scaledLength * 0.35).toFixed(1)} km)</div>
              <div>Responders: Level-A HazMat Suits & SCBA Mandatory</div>
              <div className="text-rose-400 font-bold">ERSS-112 Siren Broadcast Active</div>
            </div>
          </div>
        </Tooltip>
      </Polygon>
    </>
  );
}
