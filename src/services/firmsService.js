/**
 * NASA FIRMS Live Active Fire Ingestion Service
 * 
 * SECURITY: All NASA API calls go through the backend server.
 * The NASA MAP_KEY is NEVER stored in or sent to the browser.
 * 
 * Channels:
 * 1. Backend proxy (/api/v1/firms/live) — key stored server-side
 * 2. Fallback to mock data if backend is unreachable
 * 
 * Supported sources:
 * - VIIRS_NOAA20_NRT (VIIRS 375m NOAA-20 NRT)
 * - VIIRS_SNPP_NRT (VIIRS 375m Suomi NPP)
 * - MODIS_NRT (MODIS 1km Terra/Aqua)
 */

import { mockIndustrialZones } from "../data/mockIndustrialZones";
import { mockHotspots } from "../data/mockHotspots";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Calculates distance in km between two lat/lon points
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parses raw CSV string from NASA FIRMS API into structured hotspot entities
 */
export function parseFirmsCSV(csvText) {
  if (!csvText || typeof csvText !== "string") return [];

  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const latIndex = headers.indexOf("latitude");
  const lonIndex = headers.indexOf("longitude");
  const frpIndex = headers.indexOf("frp");
  const ti4Index = headers.indexOf("bright_ti4") !== -1 ? headers.indexOf("bright_ti4") : headers.indexOf("brightness");
  const ti5Index = headers.indexOf("bright_ti5") !== -1 ? headers.indexOf("bright_ti5") : headers.indexOf("bright_t31");
  const confIndex = headers.indexOf("confidence");
  const dateIndex = headers.indexOf("acq_date");
  const timeIndex = headers.indexOf("acq_time");
  const satIndex = headers.indexOf("satellite");
  const dayNightIndex = headers.indexOf("daynight");

  if (latIndex === -1 || lonIndex === -1) {
    return [];
  }

  const rawRows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim());
    const lat = parseFloat(cols[latIndex]);
    const lon = parseFloat(cols[lonIndex]);

    if (isNaN(lat) || isNaN(lon)) continue;

    const frp = frpIndex !== -1 && !isNaN(parseFloat(cols[frpIndex])) ? parseFloat(cols[frpIndex]) : 25.0;
    const brightTi4 = ti4Index !== -1 && !isNaN(parseFloat(cols[ti4Index])) ? parseFloat(cols[ti4Index]) : 330.0;
    const brightTi5 = ti5Index !== -1 && !isNaN(parseFloat(cols[ti5Index])) ? parseFloat(cols[ti5Index]) : 295.0;
    const confRaw = confIndex !== -1 ? cols[confIndex] : "nominal";
    const acqDate = dateIndex !== -1 ? cols[dateIndex] : new Date().toISOString().slice(0, 10);
    const acqTime = timeIndex !== -1 ? cols[timeIndex] : "1200";
    const satellite = satIndex !== -1 ? cols[satIndex] : "VIIRS 375m";
    const daynight = dayNightIndex !== -1 ? cols[dayNightIndex] : "N";

    rawRows.push({
      lat,
      lon,
      frp,
      brightTi4,
      brightTi5,
      confRaw,
      acqDate,
      acqTime,
      satellite,
      daynight
    });
  }

  if (rawRows.length === 0) return [];

  // For global feeds, sort by thermal power (FRP) and take top 250 most energetic anomalies
  rawRows.sort((a, b) => b.frp - a.frp);
  const selectedRows = rawRows.length > 250 ? rawRows.slice(0, 250) : rawRows;

  return selectedRows.map((row, idx) => {
    let closestZone = null;
    let minDistanceKm = 9999;

    mockIndustrialZones.forEach((zone) => {
      const dist = calculateDistanceKm(row.lat, row.lon, zone.center[0], zone.center[1]);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        closestZone = zone;
      }
    });

    const isInsideZone = minDistanceKm <= (closestZone?.emergencyZoneRadiusKm || 8.0);
    const baselineFrp = closestZone?.activeFlareStacks ? 42.0 : 25.0;
    const frpDeviation = Math.round(((row.frp - baselineFrp) / baselineFrp) * 100);

    let confidenceScore = 92.5;
    if (!isNaN(parseFloat(row.confRaw))) {
      confidenceScore = parseFloat(row.confRaw);
    } else if (row.confRaw.toLowerCase() === "high") {
      confidenceScore = 98.4;
    } else if (row.confRaw.toLowerCase() === "nominal") {
      confidenceScore = 89.2;
    } else {
      confidenceScore = 74.0;
    }

    let status = "safe";
    let statusLabel = "ROUTINE PERSISTENT FLARING";
    let classification = "Routine Industrial Operational Heat";

    if (row.frp >= 75 || (isInsideZone && frpDeviation >= 80)) {
      status = "critical";
      statusLabel = "CRITICAL THERMAL ALERT";
      classification = "Catastrophic Hydrocarbon / Structure Fire";
    } else if (row.frp >= 35 || frpDeviation >= 35) {
      status = "warning";
      statusLabel = "THERMAL SURGE ALERT";
      classification = "Abnormal Heat Surge / Pre-Ignition Exotherm";
    }

    const latStr = row.lat >= 0 ? `${row.lat.toFixed(2)}°N` : `${Math.abs(row.lat).toFixed(2)}°S`;
    const lonStr = row.lon >= 0 ? `${row.lon.toFixed(2)}°E` : `${Math.abs(row.lon).toFixed(2)}°W`;
    const facilityName = closestZone && minDistanceKm < 30
      ? `${closestZone.name} (Alert Cluster #${idx + 1})`
      : `Global Thermal Anomaly (${latStr}, ${lonStr})`;

    const shapFactors = [
      {
        feature: "Fire Radiative Power (FRP) Surge",
        contribution: frpDeviation > 50 ? 0.38 : 0.18,
        percentText: frpDeviation > 50 ? "+38%" : "+18%",
        impact: "risk_elevating",
        desc: `Observed ${row.frp} MW vs ${baselineFrp} MW baseline (+${frpDeviation}%)`
      },
      {
        feature: "Brightness Temperature (TI-4)",
        contribution: row.brightTi4 > 350 ? 0.24 : 0.10,
        percentText: row.brightTi4 > 350 ? "+24%" : "+10%",
        impact: "risk_elevating",
        desc: `${row.brightTi4} K sensor brightness temperature`
      },
      {
        feature: isInsideZone ? "Inside Monitored Industrial Zone" : "Remote Regional Anomaly",
        contribution: isInsideZone ? 0.25 : -0.15,
        percentText: isInsideZone ? "+25%" : "-15%",
        impact: isInsideZone ? "risk_elevating" : "risk_mitigating",
        desc: isInsideZone ? `Within ${minDistanceKm.toFixed(1)} km of ${closestZone?.name}` : "Outside standard industrial clusters"
      }
    ];

    return {
      id: `FIRMS-GLOBAL-${row.lat.toFixed(3)}-${row.lon.toFixed(3)}-${idx}`,
      latitude: row.lat,
      longitude: row.lon,
      frp: row.frp,
      baselineFrp,
      frpDeviation: Math.max(0, frpDeviation),
      confidence: confidenceScore,
      aiConfidence: confidenceScore,
      brightnessTempK: row.brightTi4,
      brightnessTempC: Math.round(row.brightTi4 - 273.15),
      brightness_temp_k: row.brightTi4,
      brightness_temp_c: Math.round(row.brightTi4 - 273.15),
      satellite: `${row.satellite} (NASA Live)`,
      satellitePassTime: `${row.acqDate} ${row.acqTime.slice(0, 2)}:${row.acqTime.slice(2, 4)} UTC`,
      scanDate: row.acqDate,
      scanTime: `${row.acqTime.slice(0, 2)}:${row.acqTime.slice(2, 4)} UTC`,
      daynight: row.daynight === "N" ? "Night" : "Day",
      status,
      statusLabel,
      classification,
      name: status === "critical" ? `Active Fire Anomaly (#${idx + 1})` : `Thermal Hotspot (#${idx + 1})`,
      facilityName,
      zoneId: closestZone?.id || "GLOBAL-HOTSPOT",
      isInsideIndustrialZone: isInsideZone,
      isLiveNasa: true,
      historicalFRP: [
        Math.round(baselineFrp * 0.9),
        Math.round(baselineFrp * 1.05),
        Math.round(baselineFrp * 0.95),
        Math.round(baselineFrp * 1.1),
        Math.round(baselineFrp * 1.0),
        row.frp
      ],
      shapFactors,
      shapValues: shapFactors.map((s) => ({
        feature: s.feature,
        contribution: s.percentText,
        description: s.desc,
        type: s.impact === "risk_elevating" ? "anomaly" : "baseline"
      })),
      plume: {
        active: status === "critical",
        threatClass: status === "critical" ? "IDLH_RED" : "ADVISORY_YELLOW",
        toxicGas: "Combustion Byproducts & Dense Soot Aerosol",
        affectedPopulationEst: 15000,
        projectedLengthKm: 5.5,
        spreadAngleDeg: 28,
        windDeg: 270,
        windSpeedKmH: 18.0
      }
    };
  });
}

/**
 * Check if NASA key is configured on the backend server
 */
export async function checkNasaKeyStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/firms/status`, {
      method: "GET",
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend not reachable
  }
  return { configured: false, keyLength: 0 };
}

/**
 * Send NASA MAP_KEY to the backend for secure storage
 */
export async function setNasaKeyOnServer(key) {
  const res = await fetch(`${API_BASE_URL}/api/v1/firms/key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
    signal: AbortSignal.timeout(5000)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Server returned HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Clear NASA MAP_KEY from the backend
 */
export async function clearNasaKeyOnServer() {
  try {
    await fetch(`${API_BASE_URL}/api/v1/firms/key`, {
      method: "DELETE",
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    // Silently fail if backend is unreachable
  }
}

/**
 * Main function to fetch live active fire hotspots via the backend proxy
 * The NASA MAP_KEY is stored on the server — the frontend never sees it.
 */
export async function fetchLiveFirmsData(area = "world", dayRange = 2, source = "VIIRS_NOAA20_NRT") {
  try {
    const params = new URLSearchParams({
      source,
      area: area.trim(),
      days: String(dayRange)
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(`${API_BASE_URL}/api/v1/firms/live?${params}`, {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      if (errBody.error && errBody.error.includes("Invalid MAP_KEY")) {
        throw new Error("NASA FIRMS Error: Invalid MAP_KEY. Please verify your key at https://firms.modaps.eosdis.nasa.gov/api/map_key");
      }
      if (errBody.error && errBody.error.includes("No NASA MAP_KEY")) {
        // No key configured — return mock data
        return mockHotspots;
      }
      throw new Error(errBody.error || `Backend returned HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/csv")) {
      const csvText = await res.text();
      const parsed = parseFirmsCSV(csvText);
      if (parsed.length > 0) {
        return parsed;
      }
    } else if (contentType.includes("application/json")) {
      const json = await res.json();
      if (json.hotspots && json.hotspots.length > 0) {
        return json.hotspots;
      }
    }
  } catch (err) {
    if (err.message && err.message.includes("Invalid MAP_KEY")) {
      throw err;
    }
    console.warn("NASA live fetch via backend encountered warning:", err);
  }

  // Fallback to mock data
  return mockHotspots;
}
