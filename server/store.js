import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

// Resolve data directory and history file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, "data");
export const HISTORY_FILE = process.env.HISTORY_FILE || path.resolve(DATA_DIR, "history.json");
const RETENTION_DAYS = 30;

// In-memory cache for fast query execution
let inMemoryBatches = [];
let isInitialized = false;

// Write queue to guarantee serial, thread-safe file operations
let writeQueue = Promise.resolve();

/**
 * Calculates the great-circle distance between two points on the Earth (Haversine formula).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's mean radius in km
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Safely writes data to a temporary file first and atomically renames it to destination.
 * Serialized through writeQueue to prevent race conditions across concurrent requests.
 * @param {string} targetFile
 * @param {any} data
 */
async function atomicWriteJson(targetFile, data) {
  const task = async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tempFile = `${targetFile}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    const jsonStr = JSON.stringify(data, null, 2);

    try {
      await fs.writeFile(tempFile, jsonStr, "utf8");

      // Attempt rename with retry for Windows file locking
      let renamed = false;
      let lastErr = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await fs.rename(tempFile, targetFile);
          renamed = true;
          break;
        } catch (err) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 20 * (attempt + 1)));
        }
      }

      if (!renamed) {
        // Fallback for Windows if rename fails: copy and unlink
        try {
          await fs.copyFile(tempFile, targetFile);
          await fs.unlink(tempFile);
        } catch (copyErr) {
          throw lastErr || copyErr;
        }
      }
    } catch (err) {
      try {
        if (existsSync(tempFile)) {
          await fs.unlink(tempFile);
        }
      } catch (_) {}
      throw err;
    }
  };

  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

/**
 * Persists the current in-memory batches to disk.
 */
async function persistToDisk() {
  const payload = {
    updatedAt: new Date().toISOString(),
    batches: inMemoryBatches
  };
  await atomicWriteJson(HISTORY_FILE, payload);
}

/**
 * Prunes events and batches older than RETENTION_DAYS (30 days).
 */
function pruneOldData() {
  const cutoffMs = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const pruned = [];

  for (const batch of inMemoryBatches) {
    if (Array.isArray(batch.events)) {
      const filteredEvents = batch.events.filter((evt) => {
        const timeStr = evt.timestamp || batch.timestamp;
        const timeMs = new Date(timeStr).getTime();
        return isNaN(timeMs) || timeMs >= cutoffMs;
      });

      if (filteredEvents.length > 0) {
        pruned.push({
          ...batch,
          totalReceived: filteredEvents.length,
          events: filteredEvents
        });
      }
    } else {
      const batchTime = new Date(batch.timestamp).getTime();
      if (isNaN(batchTime) || batchTime >= cutoffMs) {
        pruned.push(batch);
      }
    }
  }

  inMemoryBatches = pruned;
}

/**
 * Ensures the store has been initialized before reading or writing.
 */
async function ensureInitialized() {
  if (!isInitialized) {
    await initStore();
  }
}

/**
 * Flattens all events across all stored batches, inheriting batch-level metadata.
 * @returns {Array<object>}
 */
function getAllEvents() {
  const all = [];
  for (const batch of inMemoryBatches) {
    if (!Array.isArray(batch.events)) continue;
    for (const evt of batch.events) {
      all.push({
        id: evt.id,
        lat: evt.lat,
        lon: evt.lon,
        frp: evt.frp,
        classification: evt.classification,
        confidence: evt.confidence,
        brightnessTempK: evt.brightnessTempK,
        closestZoneId: evt.closestZoneId,
        closestZoneDistKm: evt.closestZoneDistKm,
        timestamp: evt.timestamp || batch.timestamp,
        source: evt.source || batch.source || "NASA_FIRMS",
        sensorProduct: evt.sensorProduct || batch.sensorProduct || "VIIRS_NOAA20_NRT",
        ...(evt.name ? { name: evt.name } : {}),
        ...(evt.facilityName ? { facilityName: evt.facilityName } : {})
      });
    }
  }
  return all;
}

/**
 * 1. initStore()
 * Create data directory and load existing history file. Call on server startup.
 */
export async function initStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    if (existsSync(HISTORY_FILE)) {
      const raw = await fs.readFile(HISTORY_FILE, "utf8");
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          inMemoryBatches = parsed;
        } else if (parsed && Array.isArray(parsed.batches)) {
          inMemoryBatches = parsed.batches;
        } else {
          inMemoryBatches = [];
        }
      } catch (parseErr) {
        console.warn(`[store.js] Failed to parse existing ${HISTORY_FILE}, resetting store:`, parseErr.message);
        inMemoryBatches = [];
      }
    } else {
      inMemoryBatches = [];
      await persistToDisk();
    }

    pruneOldData();
    isInitialized = true;
    return {
      success: true,
      batchCount: inMemoryBatches.length,
      totalEvents: getAllEvents().length
    };
  } catch (err) {
    console.error("[store.js] Error initializing store:", err);
    throw err;
  }
}

/**
 * 2. storeFireEvents(events, metadata)
 * Store a batch of classified fire events with metadata.
 * Auto-prunes data older than 30 days and performs atomic disk writes.
 * 
 * Supports both signatures:
 *   - storeFireEvents(eventsArray, metadataObject)
 *   - storeFireEvents(batchObjectWithEvents)
 *
 * @param {Array|object} events - array of events or full batch object
 * @param {object} [metadata] - optional batch metadata
 * @returns {Promise<object>} The stored batch
 */
export async function storeFireEvents(events, metadata = {}) {
  await ensureInitialized();

  let eventList = [];
  let meta = {};

  if (Array.isArray(events)) {
    eventList = events;
    meta = metadata && typeof metadata === "object" ? metadata : {};
  } else if (events && Array.isArray(events.events)) {
    eventList = events.events;
    meta = { ...events };
    delete meta.events;
  } else if (events && typeof events === "object") {
    eventList = [events];
    meta = metadata && typeof metadata === "object" ? metadata : {};
  }

  const batchTimestamp = meta.timestamp || new Date().toISOString();
  const source = meta.source || "NASA_FIRMS";
  const sensorProduct = meta.sensorProduct || "VIIRS_NOAA20_NRT";
  const area = meta.area || "world";

  const normalizedEvents = eventList.map((evt, idx) => {
    const lat = Number(evt.lat ?? evt.latitude ?? 0);
    const lon = Number(evt.lon ?? evt.longitude ?? 0);
    const frp = Number(evt.frp ?? 0);
    const classification = String(evt.classification ?? evt.status ?? "safe").toLowerCase();
    const confidence = Number(evt.confidence ?? 0);
    const brightnessTempK = Number(evt.brightnessTempK ?? evt.brightness ?? evt.bright_ti4 ?? 0);
    const closestZoneId = evt.closestZoneId ?? evt.zoneId ?? null;
    const closestZoneDistKm =
      evt.closestZoneDistKm != null
        ? Number(evt.closestZoneDistKm)
        : evt.distanceKm != null
        ? Number(evt.distanceKm)
        : null;
    const id = String(evt.id || `evt_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`);
    const timestamp = evt.timestamp || evt.scanTimeIso || evt.satellitePassTime || batchTimestamp;

    return {
      id,
      timestamp,
      lat,
      lon,
      frp,
      classification,
      confidence,
      brightnessTempK,
      closestZoneId,
      closestZoneDistKm,
      ...(evt.name ? { name: evt.name } : {}),
      ...(evt.facilityName ? { facilityName: evt.facilityName } : {})
    };
  });

  const batch = {
    timestamp: batchTimestamp,
    source,
    sensorProduct,
    area,
    totalReceived: meta.totalReceived != null ? Number(meta.totalReceived) : normalizedEvents.length,
    events: normalizedEvents
  };

  inMemoryBatches.push(batch);

  // Auto-prune events older than 30 days
  pruneOldData();

  // Thread-safe atomic write to disk
  await persistToDisk();

  return batch;
}

/**
 * 3. getHistory(options)
 * Query stored events.
 * 
 * options = {
 *   startDate: ISO string (optional),
 *   endDate: ISO string (optional),
 *   lat: number (optional, center of search),
 *   lon: number (optional),
 *   radiusKm: number (optional, default 50),
 *   classification: string (optional, filter by class),
 *   limit: number (optional, default 500)
 * }
 * 
 * @param {object} [options]
 * @returns {Promise<Array<object>>} Matching events sorted by timestamp descending
 */
export async function getHistory(options = {}) {
  await ensureInitialized();

  const {
    startDate,
    endDate,
    lat,
    lon,
    radiusKm = 50,
    classification,
    limit = 500
  } = options;

  const hasGeo = lat != null && lon != null && !isNaN(Number(lat)) && !isNaN(Number(lon));
  const centerLat = hasGeo ? Number(lat) : null;
  const centerLon = hasGeo ? Number(lon) : null;
  const maxRadiusKm = Number(radiusKm) > 0 ? Number(radiusKm) : 50;

  const startTime = startDate ? new Date(startDate).getTime() : null;
  const endTime = endDate ? new Date(endDate).getTime() : null;
  const classFilter = classification ? String(classification).trim().toLowerCase() : null;

  const allEvents = getAllEvents();
  const matched = [];

  for (const evt of allEvents) {
    const evtTime = new Date(evt.timestamp).getTime();

    if (startTime != null && !isNaN(startTime) && evtTime < startTime) {
      continue;
    }
    if (endTime != null && !isNaN(endTime) && evtTime > endTime) {
      continue;
    }
    if (classFilter && evt.classification.toLowerCase() !== classFilter) {
      continue;
    }

    let dist = null;
    if (hasGeo) {
      dist = haversineDistanceKm(centerLat, centerLon, evt.lat, evt.lon);
      if (dist > maxRadiusKm) {
        continue;
      }
    }

    matched.push(dist != null ? { ...evt, distanceKm: Math.round(dist * 100) / 100 } : evt);
  }

  // Sort by timestamp descending
  matched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const maxLimit = limit != null && !isNaN(Number(limit)) ? Math.max(0, Number(limit)) : 500;
  return matched.slice(0, maxLimit);
}

/**
 * 4. getEventProgression(lat, lon, radiusKm = 5, days = 7)
 * Get the FRP progression for events at approximately the same location.
 * 
 * Returns:
 * {
 *   location: { lat, lon },
 *   events: [{ timestamp, frp, classification, confidence }],
 *   trend: 'escalating' | 'stable' | 'declining' | 'new',
 *   peakFrp: number,
 *   firstSeen: ISO string,
 *   lastSeen: ISO string
 * }
 * 
 * @param {number} lat
 * @param {number} lon
 * @param {number} [radiusKm=5]
 * @param {number} [days=7]
 * @returns {Promise<object>}
 */
export async function getEventProgression(lat, lon, radiusKm = 5, days = 7) {
  await ensureInitialized();

  const targetLat = Number(lat);
  const targetLon = Number(lon);
  const searchRadius = Number(radiusKm) > 0 ? Number(radiusKm) : 5;
  const daysWindow = Number(days) > 0 ? Number(days) : 7;
  const cutoffTime = Date.now() - (daysWindow * 24 * 60 * 60 * 1000);

  const allEvents = getAllEvents();
  const nearbyEvents = [];

  for (const evt of allEvents) {
    const timeMs = new Date(evt.timestamp).getTime();
    if (!isNaN(timeMs) && timeMs < cutoffTime) {
      continue;
    }

    const dist = haversineDistanceKm(targetLat, targetLon, evt.lat, evt.lon);
    if (dist <= searchRadius) {
      nearbyEvents.push(evt);
    }
  }

  // Sort chronologically ascending
  nearbyEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const location = { lat: targetLat, lon: targetLon };

  if (nearbyEvents.length === 0) {
    return {
      location,
      events: [],
      trend: "new",
      peakFrp: 0,
      firstSeen: null,
      lastSeen: null
    };
  }

  const progressionEvents = nearbyEvents.map((e) => ({
    timestamp: e.timestamp,
    frp: Number(e.frp || 0),
    classification: e.classification,
    confidence: Number(e.confidence || 0)
  }));

  const peakFrp = Math.max(...progressionEvents.map((e) => e.frp));
  const firstSeen = progressionEvents[0].timestamp;
  const lastSeen = progressionEvents[progressionEvents.length - 1].timestamp;

  let trend = "new";
  if (progressionEvents.length >= 2) {
    const firstFrp = progressionEvents[0].frp;
    const lastFrp = progressionEvents[progressionEvents.length - 1].frp;

    const mid = Math.floor(progressionEvents.length / 2);
    const firstHalf = progressionEvents.slice(0, mid);
    const secondHalf = progressionEvents.slice(mid);

    const avgFirst = firstHalf.reduce((sum, e) => sum + e.frp, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, e) => sum + e.frp, 0) / secondHalf.length;

    const severityMap = { safe: 1, warning: 2, critical: 3, false_positive: 0 };
    const firstSev = severityMap[progressionEvents[0].classification] ?? 1;
    const lastSev = severityMap[progressionEvents[progressionEvents.length - 1].classification] ?? 1;

    // Severity escalated or FRP jumped significantly
    if (
      (lastSev > firstSev && lastFrp >= firstFrp) ||
      avgSecond > avgFirst * 1.2 ||
      lastFrp > firstFrp * 1.25
    ) {
      trend = "escalating";
    } else if (
      (lastSev < firstSev && lastFrp <= firstFrp) ||
      avgSecond < avgFirst * 0.8 ||
      lastFrp < firstFrp * 0.75
    ) {
      trend = "declining";
    } else {
      trend = "stable";
    }
  }

  return {
    location,
    events: progressionEvents,
    trend,
    peakFrp: Math.round(peakFrp * 10) / 10,
    firstSeen,
    lastSeen
  };
}

/**
 * 5. getStats()
 * Return summary statistics:
 * {
 *   totalEvents: number,
 *   byClassification: { critical: n, warning: n, safe: n, false_positive: n },
 *   oldestEvent: ISO string,
 *   newestEvent: ISO string,
 *   topHotspots: [{ lat, lon, peakFrp, count }] // top 10 recurring locations
 * }
 * 
 * @returns {Promise<object>}
 */
export async function getStats() {
  await ensureInitialized();

  const allEvents = getAllEvents();
  const byClassification = { critical: 0, warning: 0, safe: 0, false_positive: 0 };

  if (allEvents.length === 0) {
    return {
      totalEvents: 0,
      byClassification,
      oldestEvent: null,
      newestEvent: null,
      topHotspots: []
    };
  }

  let oldestMs = Infinity;
  let newestMs = -Infinity;
  let oldestIso = null;
  let newestIso = null;

  for (const evt of allEvents) {
    const cls = (evt.classification || "safe").toLowerCase().replace(/[\s-]/g, "_");
    if (cls === "critical") {
      byClassification.critical++;
    } else if (cls === "warning") {
      byClassification.warning++;
    } else if (cls === "safe") {
      byClassification.safe++;
    } else if (cls === "false_positive" || cls === "falsepositive") {
      byClassification.false_positive++;
    } else {
      if (byClassification[cls] != null) {
        byClassification[cls]++;
      } else {
        byClassification[cls] = 1;
      }
    }

    const t = new Date(evt.timestamp).getTime();
    if (!isNaN(t)) {
      if (t < oldestMs) {
        oldestMs = t;
        oldestIso = evt.timestamp;
      }
      if (t > newestMs) {
        newestMs = t;
        newestIso = evt.timestamp;
      }
    }
  }

  // Spatial clustering for recurring hotspots (~5 km radius)
  const HOTSPOT_RADIUS_KM = 5;
  const clusters = [];

  for (const evt of allEvents) {
    let bestCluster = null;
    let minDist = Infinity;

    for (const cl of clusters) {
      const d = haversineDistanceKm(cl.lat, cl.lon, evt.lat, evt.lon);
      if (d <= HOTSPOT_RADIUS_KM && d < minDist) {
        minDist = d;
        bestCluster = cl;
      }
    }

    if (bestCluster) {
      bestCluster.count++;
      bestCluster.peakFrp = Math.max(bestCluster.peakFrp, evt.frp || 0);
      bestCluster.latSum += evt.lat;
      bestCluster.lonSum += evt.lon;
      bestCluster.lat = bestCluster.latSum / bestCluster.count;
      bestCluster.lon = bestCluster.lonSum / bestCluster.count;
    } else {
      clusters.push({
        lat: evt.lat,
        lon: evt.lon,
        latSum: evt.lat,
        lonSum: evt.lon,
        peakFrp: evt.frp || 0,
        count: 1
      });
    }
  }

  // Sort hotspots by recurring count desc, then peakFrp desc
  clusters.sort((a, b) => b.count - a.count || b.peakFrp - a.peakFrp);

  const topHotspots = clusters.slice(0, 10).map((c) => ({
    lat: Number(c.lat.toFixed(4)),
    lon: Number(c.lon.toFixed(4)),
    peakFrp: Math.round(c.peakFrp * 10) / 10,
    count: c.count
  }));

  return {
    totalEvents: allEvents.length,
    byClassification,
    oldestEvent: oldestIso,
    newestEvent: newestIso,
    topHotspots
  };
}

/**
 * Helper to format duration between timestamps in a readable string.
 * @param {number} diffMs
 * @returns {string} e.g. '48 hours', '3.5 hours', '45 minutes', '3 days'
 */
function formatDuration(diffMs) {
  if (isNaN(diffMs) || diffMs <= 0) return "0 minutes";
  const totalMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
  if (totalMins < 60) {
    return `${totalMins} minute${totalMins === 1 ? "" : "s"}`;
  }
  const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  if (hours < 48) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * 6. generateBacktestScenarios()
 * Scan stored history and find real fire event progressions that can be used for backtesting.
 * Look for locations where FRP escalated over time (safe → warning → critical).
 * Return up to 5 scenarios in the format:
 * {
 *   id: string,
 *   name: string (auto-generated from location),
 *   location: { lat, lon },
 *   timeline: [{ timestamp, frp, classification, confidence }],
 *   peakFrp: number,
 *   duration: string (e.g. '48 hours')
 * }
 * 
 * @returns {Promise<Array<object>>} Up to 5 scenarios
 */
export async function generateBacktestScenarios() {
  await ensureInitialized();

  const allEvents = getAllEvents();
  if (allEvents.length === 0) {
    return [];
  }

  // Cluster events spatially (~10 km radius) to find local progressions
  const SCENARIO_RADIUS_KM = 10;
  const clusters = [];

  for (const evt of allEvents) {
    let bestCluster = null;
    let minDist = Infinity;

    for (const cl of clusters) {
      const d = haversineDistanceKm(cl.lat, cl.lon, evt.lat, evt.lon);
      if (d <= SCENARIO_RADIUS_KM && d < minDist) {
        minDist = d;
        bestCluster = cl;
      }
    }

    if (bestCluster) {
      bestCluster.events.push(evt);
    } else {
      clusters.push({
        lat: evt.lat,
        lon: evt.lon,
        events: [evt]
      });
    }
  }

  // Filter and score clusters
  const scoredCandidates = [];

  for (const cluster of clusters) {
    if (cluster.events.length < 2) {
      continue;
    }

    // Sort chronologically
    const sorted = [...cluster.events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstTime = new Date(sorted[0].timestamp).getTime();
    const lastTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
    const durationMs = lastTime - firstTime;

    const firstFrp = sorted[0].frp;
    const lastFrp = sorted[sorted.length - 1].frp;
    const peakFrp = Math.max(...sorted.map((e) => e.frp));

    const severityOrder = { safe: 1, warning: 2, critical: 3, false_positive: 0 };
    const classes = sorted.map((e) => (e.classification || "safe").toLowerCase());

    const hasSafe = classes.includes("safe");
    const hasWarning = classes.includes("warning");
    const hasCritical = classes.includes("critical");

    let escalationScore = 0;

    // Highest score: progression from safe -> warning -> critical
    if (hasSafe && hasWarning && hasCritical) {
      const safeIdx = classes.indexOf("safe");
      const warnIdx = classes.indexOf("warning");
      const critIdx = classes.lastIndexOf("critical");
      if (safeIdx < warnIdx && warnIdx < critIdx) {
        escalationScore += 100;
      } else {
        escalationScore += 70;
      }
    } else if (hasSafe && hasCritical) {
      const safeIdx = classes.indexOf("safe");
      const critIdx = classes.lastIndexOf("critical");
      if (safeIdx < critIdx) {
        escalationScore += 60;
      } else {
        escalationScore += 35;
      }
    } else if (hasWarning && hasCritical) {
      const warnIdx = classes.indexOf("warning");
      const critIdx = classes.lastIndexOf("critical");
      if (warnIdx < critIdx) {
        escalationScore += 50;
      } else {
        escalationScore += 30;
      }
    }

    // FRP growth score
    if (peakFrp > firstFrp * 1.5) {
      escalationScore += 30;
    }
    if (lastFrp > firstFrp * 1.2) {
      escalationScore += 20;
    }
    if (peakFrp > 50) {
      escalationScore += 15;
    }
    if (durationMs > 0) {
      escalationScore += 10;
    }

    // Number of steps in progression (at least 2, up to 10 is ideal)
    escalationScore += Math.min(sorted.length * 2, 20);

    scoredCandidates.push({
      cluster,
      sortedEvents: sorted,
      score: escalationScore,
      peakFrp,
      durationMs
    });
  }

  // Sort candidates by escalation score desc, then peakFrp desc
  scoredCandidates.sort((a, b) => b.score - a.score || b.peakFrp - a.peakFrp);

  // Take top 5
  const topCandidates = scoredCandidates.slice(0, 5);

  return topCandidates.map((cand, idx) => {
    const { cluster, sortedEvents, peakFrp, durationMs } = cand;

    const lat = Number(cluster.lat.toFixed(4));
    const lon = Number(cluster.lon.toFixed(4));
    const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
    const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;

    const namedEvt = sortedEvents.find((e) => e.facilityName || e.name || e.closestZoneId);
    let name;
    if (namedEvt && (namedEvt.facilityName || namedEvt.name)) {
      name = `${namedEvt.facilityName || namedEvt.name} Fire Escalation (${latStr}, ${lonStr})`;
    } else if (namedEvt && namedEvt.closestZoneId) {
      name = `Zone ${namedEvt.closestZoneId} Fire Escalation (${latStr}, ${lonStr})`;
    } else {
      name = `Fire Escalation Near ${latStr}, ${lonStr}`;
    }

    const timeline = sortedEvents.map((e) => ({
      timestamp: e.timestamp,
      frp: Number(e.frp || 0),
      classification: e.classification,
      confidence: Number(e.confidence || 0)
    }));

    return {
      id: `scenario-${idx + 1}`,
      name,
      location: { lat, lon },
      timeline,
      peakFrp: Math.round(peakFrp * 10) / 10,
      duration: formatDuration(durationMs)
    };
  });
}

export default {
  initStore,
  storeFireEvents,
  getHistory,
  getEventProgression,
  getStats,
  generateBacktestScenarios,
  haversineDistanceKm,
  DATA_DIR,
  HISTORY_FILE
};
