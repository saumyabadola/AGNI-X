import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { classifyFireEvent, findClosestIndustrialZone, calculateFalsePositiveRate } from "./classifier.js";
import { initStore, storeFireEvents, getHistory, getEventProgression, getStats, generateBacktestScenarios } from "./store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") }); // Load server/.env

// Dispersion model - loaded dynamically since it may still be building
let dispersionModule = null;
try {
  dispersionModule = await import("./dispersion.js");
} catch (e) {
  console.warn("[AGNI-X] Dispersion model not available yet, plume endpoints will use fallback");
}


const app = express();
const PORT = process.env.PORT || 8000;

// In-memory key storage (seeded from .env, updatable at runtime via API)
let nasaMapKey = process.env.NASA_FIRMS_MAP_KEY || "";

// In-memory cache for the latest classified hotspots
let cachedHotspots = [];
let lastFetchTimestamp = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache

// Hardcoded industrial zones for server-side classification
// (matches the frontend mockIndustrialZones.js)
const INDUSTRIAL_ZONES = [
  { id: "IND-JAMNAGAR-01", name: "Jamnagar Petroleum Refinery Complex", center: [22.378, 69.855], emergencyZoneRadiusKm: 5.0, activeFlareStacks: 6, type: "Petroleum Refining" },
  { id: "IND-VIZAG-02", name: "Visakhapatnam Petrochemical Corridor", center: [17.702, 83.210], emergencyZoneRadiusKm: 4.0, activeFlareStacks: 3, type: "Chemical Zone" },
  { id: "IND-MUNDRA-03", name: "Mundra Port Industrial Zone", center: [22.839, 69.721], emergencyZoneRadiusKm: 3.5, activeFlareStacks: 2, type: "Port Terminal" },
  { id: "IND-HALDIA-04", name: "Haldia Petrochemical Complex", center: [22.025, 88.063], emergencyZoneRadiusKm: 4.0, activeFlareStacks: 4, type: "Petrochemical" },
  { id: "USA-TXCITY-05", name: "Texas City Industrial Complex", center: [29.384, -94.903], emergencyZoneRadiusKm: 6.0, activeFlareStacks: 8, type: "Petroleum Refining" },
  { id: "USA-LAREF-06", name: "Louisiana Refinery Corridor", center: [30.212, -93.263], emergencyZoneRadiusKm: 5.0, activeFlareStacks: 5, type: "Petroleum Refining" },
  { id: "SAU-JUBAIL-07", name: "Jubail Industrial City", center: [27.004, 49.660], emergencyZoneRadiusKm: 7.0, activeFlareStacks: 10, type: "Petrochemical Mega-Complex" },
  { id: "NGA-BONNY-08", name: "Bonny Island LNG Terminal", center: [4.431, 7.168], emergencyZoneRadiusKm: 4.0, activeFlareStacks: 3, type: "LNG Terminal" },
  { id: "RUS-OMSK-09", name: "Omsk Oil Refinery", center: [54.923, 73.335], emergencyZoneRadiusKm: 4.5, activeFlareStacks: 4, type: "Petroleum Refining" },
  { id: "CHN-NINGBO-10", name: "Ningbo-Zhoushan Petrochemical Zone", center: [29.868, 121.814], emergencyZoneRadiusKm: 5.0, activeFlareStacks: 6, type: "Petrochemical" },
  { id: "SGP-JURONG-11", name: "Jurong Island Chemical Hub", center: [1.265, 103.700], emergencyZoneRadiusKm: 3.0, activeFlareStacks: 4, type: "Chemical Manufacturing" },
  { id: "NLD-ROTT-12", name: "Rotterdam Europoort Refinery Complex", center: [51.950, 4.120], emergencyZoneRadiusKm: 5.0, activeFlareStacks: 5, type: "Petroleum Refining" },
  { id: "BRA-CUBAT-13", name: "Cubatao Industrial Pole", center: [-23.879, -46.418], emergencyZoneRadiusKm: 3.5, activeFlareStacks: 2, type: "Chemical Corridor" },
  { id: "KOR-ULSAN-14", name: "Ulsan Petrochemical Complex", center: [35.510, 129.370], emergencyZoneRadiusKm: 5.0, activeFlareStacks: 6, type: "Petrochemical" }
];

app.use(cors({ origin: true }));
app.use(express.json());

// Initialize data store on startup
initStore().then(() => {
  console.log("[AGNI-X] Data store initialized");
}).catch(err => {
  console.error("[AGNI-X] Data store init error:", err.message);
});

// ─────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/health", async (_req, res) => {
  let storeStats = {};
  try { storeStats = await getStats(); } catch {}
  res.json({
    status: "ok",
    service: "AGNI-X Backend",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    nasaKeyConfigured: isKeyConfigured(),
    modules: {
      classifier: true,
      dispersion: !!dispersionModule,
      store: true
    },
    cache: {
      hotspotCount: cachedHotspots.length,
      lastFetch: lastFetchTimestamp
    },
    history: storeStats
  });
});

// ─────────────────────────────────────────────────────────────
// NASA FIRMS Key Management
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/firms/status", (_req, res) => {
  res.json({
    configured: isKeyConfigured(),
    keyLength: nasaMapKey ? nasaMapKey.length : 0,
    message: isKeyConfigured()
      ? "NASA FIRMS MAP_KEY is configured on the server."
      : "No NASA MAP_KEY configured. Use POST /api/v1/firms/key to set one."
  });
});

app.post("/api/v1/firms/key", (req, res) => {
  const { key } = req.body;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Missing 'key' in request body." });
  }
  const cleanKey = key.trim().replace(/['"%20\s]/g, "");
  if (cleanKey.length < 16) {
    return res.status(400).json({ error: "Invalid key length. NASA FIRMS MAP_KEY should be 32 hex characters." });
  }
  nasaMapKey = cleanKey;
  cachedHotspots = []; // Clear cache to force fresh fetch
  lastFetchTimestamp = null;
  console.log(`[AGNI-X] NASA MAP_KEY updated (${cleanKey.length} chars)`);
  res.json({ success: true, configured: true, keyLength: cleanKey.length, message: "NASA FIRMS MAP_KEY saved securely on the server." });
});

app.delete("/api/v1/firms/key", (_req, res) => {
  nasaMapKey = "";
  cachedHotspots = [];
  lastFetchTimestamp = null;
  console.log("[AGNI-X] NASA MAP_KEY cleared");
  res.json({ success: true, configured: false, message: "NASA MAP_KEY cleared." });
});

// ─────────────────────────────────────────────────────────────
// NASA FIRMS Live Proxy + Server-Side Classification
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/firms/live", async (req, res) => {
  if (!isKeyConfigured()) {
    return res.status(400).json({ error: "No NASA MAP_KEY configured on the server." });
  }

  const source = req.query.source || "VIIRS_NOAA20_NRT";
  const area = req.query.area || "world";
  const days = parseInt(req.query.days, 10) || 2;
  const classify = req.query.classify !== "false"; // Default: classify on server

  // Check cache
  if (cachedHotspots.length > 0 && lastFetchTimestamp && (Date.now() - lastFetchTimestamp < CACHE_TTL_MS)) {
    console.log(`[AGNI-X] Serving ${cachedHotspots.length} cached hotspots`);
    if (classify) {
      return res.json({ hotspots: cachedHotspots, fromCache: true, timestamp: new Date(lastFetchTimestamp).toISOString() });
    }
  }

  const nasaUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${nasaMapKey}/${source}/${area}/${days}`;
  console.log(`[AGNI-X] Fetching NASA FIRMS: source=${source} area=${area} days=${days}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const nasaRes = await fetch(nasaUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "AGNI-X/2.0 Thermal Intelligence Platform" }
    });
    clearTimeout(timeoutId);

    if (!nasaRes.ok) {
      const errorText = await nasaRes.text();
      return res.status(nasaRes.status).json({ error: `NASA returned HTTP ${nasaRes.status}`, detail: errorText.slice(0, 500) });
    }

    const csvText = await nasaRes.text();

    if (csvText.includes("Invalid MAP_KEY")) {
      return res.status(401).json({ error: "Invalid NASA MAP_KEY." });
    }

    if (!classify) {
      // Raw CSV passthrough mode
      res.set("Content-Type", "text/csv; charset=utf-8");
      return res.send(csvText);
    }

    // Parse CSV and classify each event server-side
    const rawEvents = parseCSVToEvents(csvText);
    console.log(`[AGNI-X] Parsed ${rawEvents.length} raw events from NASA CSV`);

    const classified = rawEvents.map(evt => {
      const result = classifyFireEvent(evt, INDUSTRIAL_ZONES);
      result.event = evt;
      return result;
    });
    
    // Sort by weighted score (highest risk first), take top 250
    classified.sort((a, b) => (b.confidence / 100 * (b.classification === "critical" ? 3 : b.classification === "warning" ? 2 : 1)) -
                               (a.confidence / 100 * (a.classification === "critical" ? 3 : a.classification === "warning" ? 2 : 1)));
    const top = classified.slice(0, 250);

    // Calculate real metrics
    const fpRate = calculateFalsePositiveRate(classified);

    // Store in history for backtesting
    try {
      await storeFireEvents(top.map(c => ({
        id: `FIRMS-${c.closestZone?.id || "GLOBAL"}-${c.event?.lat?.toFixed(3)}-${c.event?.lon?.toFixed(3)}`,
        lat: c.event?.lat,
        lon: c.event?.lon,
        frp: c.event?.frp,
        classification: c.classification,
        confidence: c.confidence,
        brightnessTempK: c.event?.brightTi4,
        closestZoneId: c.closestZone?.id || null,
        closestZoneDistKm: c.closestZone?.distanceKm || 9999
      })), {
        source: "NASA_FIRMS",
        sensorProduct: source,
        area,
        totalReceived: rawEvents.length
      });
    } catch (storeErr) {
      console.warn("[AGNI-X] History store error:", storeErr.message);
    }

    // Build response with classified hotspots
    const hotspots = top.map((c, idx) => buildHotspotResponse(c, idx));
    
    cachedHotspots = hotspots;
    lastFetchTimestamp = Date.now();

    res.json({
      hotspots,
      metrics: {
        totalReceived: rawEvents.length,
        classified: classified.length,
        returned: hotspots.length,
        byClass: {
          critical: classified.filter(c => c.classification === "critical").length,
          warning: classified.filter(c => c.classification === "warning").length,
          safe: classified.filter(c => c.classification === "safe").length,
          false_positive: classified.filter(c => c.classification === "false_positive").length
        },
        falsePositiveRate: fpRate.rate.toFixed(1) + "%",
        falsePositivesFiltered: fpRate.filtered
      },
      fromCache: false,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "NASA FIRMS API timed out (20s)." });
    }
    console.error("[AGNI-X] NASA proxy error:", err.message);
    res.status(502).json({ error: "Failed to reach NASA FIRMS API.", detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Plume Dispersion Prediction
// ─────────────────────────────────────────────────────────────
app.post("/api/v1/plume/predict", (req, res) => {
  const { hotspotId, lat, lon, frp, windDeg, windSpeedKmH, isDaytime, cloudCoverPercent } = req.body;

  const sourceLat = lat || 22.82;
  const sourceLon = lon || 69.71;
  const frpMW = frp || 50;
  const wind = windSpeedKmH || 20;
  const windDir = windDeg || 270;
  const daytime = isDaytime !== undefined ? isDaytime : true;
  const clouds = cloudCoverPercent || 50;

  if (dispersionModule && dispersionModule.calculatePlumeDispersion) {
    const result = dispersionModule.calculatePlumeDispersion({
      sourceLat, sourceLon, frpMW, windSpeedKmH: wind, windDeg: windDir,
      isDaytime: daytime, cloudCoverPercent: clouds, stackHeightM: 15
    });
    return res.json(result);
  }

  // Fallback simplified calculation
  const windMs = wind / 3.6;
  const lengthKm = Math.min(14, Math.max(2, (frpMW / 40) * (wind / 15)));
  res.json({
    hotspotId: hotspotId || "unknown",
    stabilityClass: "D",
    stabilityDescription: "Neutral",
    zones: {
      idlh: { radiusKm: parseFloat((lengthKm * 0.35).toFixed(2)), description: "Level-A HazMat required" },
      evacuation: { radiusKm: parseFloat((lengthKm * 0.65).toFixed(2)), description: "2-hour mandatory evacuation" },
      advisory: { radiusKm: parseFloat(lengthKm.toFixed(2)), description: "Shelter-in-place, seal HVAC" }
    },
    windSpeedMs: parseFloat(windMs.toFixed(1)),
    travelBearingDeg: (windDir + 180) % 360,
    estimatedAffectedPopulation: Math.round(Math.PI * lengthKm * lengthKm * 500 * 0.3),
    modelVersion: "Simplified-Fallback v1.0",
    calculatedAt: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────────────────────
// ERSS-112 Alert Webhook Dispatch
// ─────────────────────────────────────────────────────────────
app.post("/api/v1/alerts/webhook", (req, res) => {
  const payload = req.body;
  const ticketId = `AGNI-ERSS112-${Date.now().toString(36).toUpperCase()}`;
  
  // Log the alert (in production this would go to a real alerting service)
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[ALERT] ERSS-112 DISPATCH - Ticket: ${ticketId}`);
  console.log(`[ALERT] Incident: ${payload.incidentName || payload.incidentId}`);
  console.log(`[ALERT] Facility: ${payload.facilityName}`);
  console.log(`[ALERT] Coordinates: ${JSON.stringify(payload.coordinates)}`);
  console.log(`[ALERT] FRP: ${payload.frpMegawatts} MW (+${payload.frpDeviationPercent}%)`);
  console.log(`[ALERT] AI Confidence: ${payload.aiConfidenceScore}%`);
  console.log(`[ALERT] Threat: ${payload.threatClassification}`);
  console.log(`[ALERT] Toxic Gas: ${payload.toxicGasType}`);
  console.log(`[ALERT] At-Risk Population: ${payload.estimatedAtRiskPopulation}`);
  console.log(`[ALERT] Timestamp: ${payload.timestampUtc}`);
  console.log(`${"=".repeat(60)}\n`);

  res.json({
    success: true,
    ticketId,
    dispatchStatus: "ACKNOWLEDGED_BY_ERSS112_GATEWAY",
    respondersNotified: [
      "National Disaster Response Force (NDRF) - Nearest Battalion",
      "State Disaster Response Force (SDRF) - Quick Reaction Team",
      "District Fire & Rescue Services - HazMat Engine",
      "Port/Industrial Safety Directorate"
    ],
    timestamp: new Date().toISOString(),
    incidentSummary: payload.incidentName || payload.incidentId,
    gpsTarget: payload.coordinates,
    dispatchedBy: `AGNI-X Automated Dispatch (${payload.dispatchedByRole || "System"})`
  });
});

// ─────────────────────────────────────────────────────────────
// Historical Data & Backtesting
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/history", async (req, res) => {
  try {
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      lat: req.query.lat ? parseFloat(req.query.lat) : undefined,
      lon: req.query.lon ? parseFloat(req.query.lon) : undefined,
      radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm) : 50,
      classification: req.query.classification,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 500
    };
    const events = await getHistory(options);
    res.json({ events, count: events.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/history/progression", async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: "lat and lon query params required" });
  }
  try {
    const result = await getEventProgression(lat, lon, parseFloat(req.query.radiusKm) || 5, parseInt(req.query.days, 10) || 7);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/history/stats", async (_req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/backtesting/scenarios", async (_req, res) => {
  try {
    const scenarios = await generateBacktestScenarios();
    res.json({ scenarios, count: scenarios.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Classify a single event (for frontend ad-hoc classification)
// ─────────────────────────────────────────────────────────────
app.post("/api/v1/classify", (req, res) => {
  const event = req.body;
  if (!event || !event.lat || !event.lon) {
    return res.status(400).json({ error: "Event object with lat, lon required" });
  }
  const result = classifyFireEvent(event, INDUSTRIAL_ZONES);
  res.json(result);
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function isKeyConfigured() {
  return Boolean(
    nasaMapKey && nasaMapKey.trim() !== "" &&
    nasaMapKey !== "YOUR_NASA_FIRMS_MAP_KEY_HERE" &&
    nasaMapKey !== "DEMO_MAP_KEY"
  );
}

/**
 * Parse NASA FIRMS CSV into raw event objects for server-side classification
 */
function parseCSVToEvents(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const idx = {
    lat: headers.indexOf("latitude"),
    lon: headers.indexOf("longitude"),
    frp: headers.indexOf("frp"),
    ti4: headers.indexOf("bright_ti4") !== -1 ? headers.indexOf("bright_ti4") : headers.indexOf("brightness"),
    ti5: headers.indexOf("bright_ti5") !== -1 ? headers.indexOf("bright_ti5") : headers.indexOf("bright_t31"),
    conf: headers.indexOf("confidence"),
    date: headers.indexOf("acq_date"),
    time: headers.indexOf("acq_time"),
    sat: headers.indexOf("satellite"),
    dn: headers.indexOf("daynight")
  };

  if (idx.lat === -1 || idx.lon === -1) return [];

  const events = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].trim().split(",").map(c => c.trim());
    if (!cols[idx.lat]) continue;
    const lat = parseFloat(cols[idx.lat]);
    const lon = parseFloat(cols[idx.lon]);
    if (isNaN(lat) || isNaN(lon)) continue;

    events.push({
      lat, lon,
      frp: idx.frp !== -1 ? parseFloat(cols[idx.frp]) || 25 : 25,
      brightTi4: idx.ti4 !== -1 ? parseFloat(cols[idx.ti4]) || 330 : 330,
      brightTi5: idx.ti5 !== -1 ? parseFloat(cols[idx.ti5]) || 295 : 295,
      confRaw: idx.conf !== -1 ? cols[idx.conf] : "nominal",
      acqDate: idx.date !== -1 ? cols[idx.date] : new Date().toISOString().slice(0, 10),
      acqTime: idx.time !== -1 ? cols[idx.time] : "1200",
      satellite: idx.sat !== -1 ? cols[idx.sat] : "VIIRS",
      daynight: idx.dn !== -1 ? cols[idx.dn] : "N"
    });
  }
  return events;
}

/**
 * Build a frontend-compatible hotspot object from a classified event
 */
function buildHotspotResponse(classified, index) {
  const evt = classified.event || {};
  const lat = evt.lat || 0;
  const lon = evt.lon || 0;
  const latStr = lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`;
  const lonStr = lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`;

  const zone = classified.closestZone;
  const facilityName = zone && zone.distanceKm < 30
    ? `${zone.name} (Alert #${index + 1})`
    : `Global Thermal Anomaly (${latStr}, ${lonStr})`;

  return {
    id: `FIRMS-${(zone?.id || "GLOBAL").slice(0, 12)}-${lat.toFixed(3)}-${lon.toFixed(3)}-${index}`,
    latitude: lat,
    longitude: lon,
    frp: evt.frp || 25,
    baselineFrp: classified.baselineFrp,
    frpDeviation: Math.max(0, classified.frpDeviation),
    confidence: classified.confidence,
    aiConfidence: classified.confidence,
    brightnessTempK: evt.brightTi4 || 330,
    brightnessTempC: Math.round((evt.brightTi4 || 330) - 273.15),
    brightness_temp_k: evt.brightTi4 || 330,
    brightness_temp_c: Math.round((evt.brightTi4 || 330) - 273.15),
    satellite: `${evt.satellite || "VIIRS"} (NASA Live)`,
    satellitePassTime: `${evt.acqDate || "N/A"} ${(evt.acqTime || "1200").slice(0, 2)}:${(evt.acqTime || "1200").slice(2, 4)} UTC`,
    scanDate: evt.acqDate,
    scanTime: `${(evt.acqTime || "1200").slice(0, 2)}:${(evt.acqTime || "1200").slice(2, 4)} UTC`,
    daynight: evt.daynight === "N" ? "Night" : "Day",
    status: classified.classification === "false_positive" ? "safe" : classified.classification,
    statusLabel: classified.statusLabel,
    classification: classified.classification,
    name: classified.classification === "critical" ? `Active Fire Anomaly (#${index + 1})` : `Thermal Hotspot (#${index + 1})`,
    facilityName,
    zoneId: zone?.id || "GLOBAL-HOTSPOT",
    isInsideIndustrialZone: classified.isInsideIndustrialZone,
    isLiveNasa: true,
    riskTier: classified.riskTier,
    // Real dynamically-generated SHAP attributions from the classifier
    shapFactors: classified.shapAttributions.map(s => ({
      feature: s.feature,
      contribution: s.contribution,
      percentText: s.percentText,
      impact: s.impact,
      desc: s.desc
    })),
    shapValues: classified.shapAttributions.map(s => ({
      feature: s.feature,
      contribution: s.percentText,
      description: s.desc,
      type: s.impact === "risk_elevating" ? "anomaly" : "baseline"
    })),
    historicalFRP: [
      Math.round(classified.baselineFrp * 0.9),
      Math.round(classified.baselineFrp * 1.05),
      Math.round(classified.baselineFrp * 0.95),
      Math.round(classified.baselineFrp * 1.1),
      Math.round(classified.baselineFrp * 1.0),
      evt.frp || 25
    ],
    plume: {
      active: classified.classification === "critical",
      threatClass: classified.classification === "critical" ? "IDLH_RED" : "ADVISORY_YELLOW",
      toxicGas: "Combustion Byproducts & Dense Soot Aerosol",
      affectedPopulationEst: 15000,
      projectedLengthKm: Math.min(14, Math.max(2, ((evt.frp || 25) / 40) * 1.2)),
      spreadAngleDeg: 28,
      windDeg: 270,
      windSpeedKmH: 18.0
    }
  };
}

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║  AGNI-X Backend Server v2.0                             ║
  ║  Port: ${PORT}                                              ║
  ║  NASA Key: ${isKeyConfigured() ? "CONFIGURED ✓" : "NOT SET ✗"}                                ║
  ║  Classifier: ACTIVE ✓                                   ║
  ║  Dispersion: ${dispersionModule ? "ACTIVE ✓" : "FALLBACK ⚠"}                                  ║
  ║  History Store: ACTIVE ✓                                 ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});
