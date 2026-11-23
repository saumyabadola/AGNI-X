/**
 * AGNI-X Fire Classification & Explainability Engine
 * 
 * Deterministic rule-based and SHAP explainability engine for satellite thermal anomaly data.
 * Replaces hardcoded mock confidence scores, SHAP values, and classification logic with
 * dynamic, mathematically sound evaluation of active FIRMS satellite detections.
 * 
 * Zero external dependencies — pure ES module JavaScript.
 */

/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of origin point
 * @param {number} lon1 - Longitude of origin point
 * @param {number} lat2 - Latitude of destination point
 * @param {number} lon2 - Longitude of destination point
 * @returns {number} Distance in kilometers (or 9999 if invalid)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return 9999;
  }

  const R = 6371; // Earth's mean radius in km
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) *
      Math.cos(lat2 * toRad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Identifies the nearest monitored industrial zone to a given geographic coordinate.
 *
 * @param {number} lat - Latitude of the anomaly
 * @param {number} lon - Longitude of the anomaly
 * @param {Array<object>} industrialZones - Array of monitored industrial zone objects
 * @returns {{ zone: object|null, distanceKm: number }} Closest zone and distance in km
 */
export function findClosestIndustrialZone(lat, lon, industrialZones) {
  if (!Array.isArray(industrialZones) || industrialZones.length === 0 || lat == null || lon == null) {
    return { zone: null, distanceKm: 9999 };
  }

  let closestZone = null;
  let minDistanceKm = Infinity;

  for (const zone of industrialZones) {
    if (!zone) continue;

    let zoneLat = null;
    let zoneLon = null;

    if (Array.isArray(zone.center) && zone.center.length >= 2) {
      zoneLat = zone.center[0];
      zoneLon = zone.center[1];
    } else if (zone.lat != null && zone.lon != null) {
      zoneLat = zone.lat;
      zoneLon = zone.lon;
    } else if (zone.latitude != null && zone.longitude != null) {
      zoneLat = zone.latitude;
      zoneLon = zone.longitude;
    } else if (zone.center && typeof zone.center === "object") {
      zoneLat = zone.center.lat ?? zone.center.latitude;
      zoneLon = zone.center.lon ?? zone.center.longitude;
    }

    if (zoneLat == null || zoneLon == null || isNaN(zoneLat) || isNaN(zoneLon)) {
      continue;
    }

    const dist = calculateDistanceKm(lat, lon, zoneLat, zoneLon);
    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      closestZone = zone;
    }
  }

  if (!closestZone || minDistanceKm === Infinity) {
    return { zone: null, distanceKm: 9999 };
  }

  return {
    zone: closestZone,
    distanceKm: parseFloat(minDistanceKm.toFixed(2))
  };
}

/**
 * Normalizes raw satellite sensor confidence flag or numeric score into a [0, 1] range.
 *
 * @param {string|number} confRaw - Raw confidence flag ('low', 'nominal', 'high') or number (0-100)
 * @returns {number} Normalized confidence score between 0.0 and 1.0
 */
function normalizeSensorConfidence(confRaw) {
  if (typeof confRaw === "number" && !isNaN(confRaw)) {
    return confRaw > 1
      ? Math.min(1.0, Math.max(0.0, confRaw / 100))
      : Math.min(1.0, Math.max(0.0, confRaw));
  }

  if (typeof confRaw === "string") {
    const trimmed = confRaw.trim().toLowerCase();
    const parsedNum = parseFloat(trimmed);

    if (!isNaN(parsedNum)) {
      return parsedNum > 1
        ? Math.min(1.0, Math.max(0.0, parsedNum / 100))
        : Math.min(1.0, Math.max(0.0, parsedNum));
    }

    if (trimmed === "high" || trimmed === "h") return 0.9;
    if (trimmed === "low" || trimmed === "l") return 0.2;
    if (trimmed === "nominal" || trimmed === "medium" || trimmed === "n" || trimmed === "m") return 0.5;
  }

  return 0.5; // Default nominal
}

/**
 * Classifies an active FIRMS thermal anomaly event using rule-based weighted feature scoring
 * and computes dynamic SHAP attribution vectors.
 *
 * @param {object} event - Parsed FIRMS hotspot object
 * @param {Array<object>} industrialZones - Registered industrial zones list
 * @returns {object} Classification decision, dynamic confidence, zone metadata, and SHAP attributions
 */
export function classifyFireEvent(event, industrialZones = []) {
  if (!event || typeof event !== "object") {
    throw new TypeError("classifyFireEvent expects a valid event object");
  }

  // 1. Extract and sanitize core fields
  const lat = Number(event.lat ?? event.latitude ?? 0);
  const lon = Number(event.lon ?? event.longitude ?? 0);
  const frp = Number(event.frp ?? 0);
  const brightTi4 = Number(
    event.brightTi4 ?? event.bright_ti4 ?? event.brightnessTempK ?? event.brightness ?? 300
  );
  const brightTi5 = Number(event.brightTi5 ?? event.bright_ti5 ?? 290);
  const confRaw = event.confRaw ?? event.confidence ?? "nominal";
  const daynight = String(event.daynight ?? "D");

  // 2. Identify nearest industrial zone and zone boundary status
  const { zone: closestZoneObj, distanceKm } = findClosestIndustrialZone(lat, lon, industrialZones);
  const emergencyRadius = closestZoneObj ? (closestZoneObj.emergencyZoneRadiusKm ?? 5.0) : 0;
  const isInsideIndustrialZone = closestZoneObj ? distanceKm <= emergencyRadius : false;

  // 3. Establish baseline FRP for anomaly site
  let baselineFrp = 25.0;
  if (event.baselineFrp != null && !isNaN(event.baselineFrp)) {
    baselineFrp = Number(event.baselineFrp);
  } else if (closestZoneObj) {
    if (closestZoneObj.baselineFrp != null && !isNaN(closestZoneObj.baselineFrp)) {
      baselineFrp = Number(closestZoneObj.baselineFrp);
    } else if (closestZoneObj.activeFlareStacks && closestZoneObj.activeFlareStacks > 0) {
      baselineFrp = 25.0 + closestZoneObj.activeFlareStacks * 3.5;
    }
  }
  baselineFrp = parseFloat(baselineFrp.toFixed(1));

  // 4. Calculate FRP deviation percentage
  const frpDeviation = baselineFrp > 0
    ? parseFloat((((frp - baselineFrp) / baselineFrp) * 100).toFixed(1))
    : 0.0;

  // 5. Feature Scoring (Rule-Based Weighted Scoring Model)

  // Feature 1: FRP magnitude (Weight: 0.30)
  // <15 MW → 0, 15-35 → 0.3, 35-75 → 0.6, 75-150 → 0.8, >150 → 1.0
  let frpScore;
  if (frp < 15) {
    frpScore = 0.0;
  } else if (frp < 35) {
    frpScore = 0.3;
  } else if (frp < 75) {
    frpScore = 0.6;
  } else if (frp <= 150) {
    frpScore = 0.8;
  } else {
    frpScore = 1.0;
  }

  // Feature 2: FRP deviation from baseline (Weight: 0.25)
  // <20% → 0, 20-50% → 0.3, 50-100% → 0.6, >100% → 1.0
  let deviationScore;
  if (frpDeviation < 20) {
    deviationScore = 0.0;
  } else if (frpDeviation < 50) {
    deviationScore = 0.3;
  } else if (frpDeviation <= 100) {
    deviationScore = 0.6;
  } else {
    deviationScore = 1.0;
  }

  // Feature 3: Brightness temperature (TI4) (Weight: 0.15)
  // <310K → 0, 310-340 → 0.3, 340-400 → 0.6, >400K → 1.0
  let ti4Score;
  if (brightTi4 < 310) {
    ti4Score = 0.0;
  } else if (brightTi4 < 340) {
    ti4Score = 0.3;
  } else if (brightTi4 <= 400) {
    ti4Score = 0.6;
  } else {
    ti4Score = 1.0;
  }

  // Feature 4: Proximity to industrial zone (Weight: 0.15)
  // >30km → 0, 10-30km → 0.3, 5-10km → 0.6, <5km → 1.0
  let proximityScore;
  if (distanceKm > 30) {
    proximityScore = 0.0;
  } else if (distanceKm >= 10) {
    proximityScore = 0.3;
  } else if (distanceKm >= 5) {
    proximityScore = 0.6;
  } else {
    proximityScore = 1.0;
  }

  // Feature 5: Sensor confidence (Weight: 0.10)
  // Map 'low'→0.2, 'nominal'→0.5, 'high'→0.9, numeric→normalize
  const confScore = normalizeSensorConfidence(confRaw);

  // Feature 6: Night detection bonus (Weight: 0.05)
  // Night → 0.7 (fires more visible at night = higher confidence)
  const daynightStr = daynight.trim().toLowerCase();
  const isNight = daynightStr === "night" || daynightStr === "n";
  const nightScore = isNight ? 0.7 : 0.0;

  // 6. Aggregate Total Weighted Score (0.0 to 1.0)
  const totalScore =
    frpScore * 0.30 +
    deviationScore * 0.25 +
    ti4Score * 0.15 +
    proximityScore * 0.15 +
    confScore * 0.10 +
    nightScore * 0.05;

  const score = Math.min(1.0, Math.max(0.0, parseFloat(totalScore.toFixed(4))));

  // 7. Map Total Score to Classification & Dynamic Confidence
  // - 0.00-0.25 → false_positive (confidence: 70-85%)
  // - 0.25-0.45 → safe (confidence: 85-92%)
  // - 0.45-0.70 → warning (confidence: 88-95%)
  // - 0.70-1.00 → critical (confidence: 94-99%)
  // Confidence formula: baseConfidence + (score - thresholdMin) / (thresholdMax - thresholdMin) * range
  let classification;
  let statusLabel;
  let riskTier;
  let thresholdMin;
  let thresholdMax;
  let baseConfidence;
  let confRange;

  if (score < 0.25) {
    classification = "false_positive";
    statusLabel = "Benign Thermal Anomaly / False Positive";
    riskTier = "LEVEL_1_FALSE_POSITIVE";
    thresholdMin = 0.00;
    thresholdMax = 0.25;
    baseConfidence = 70;
    confRange = 15; // 85 - 70
  } else if (score < 0.45) {
    classification = "safe";
    statusLabel = "Routine Operational Heat";
    riskTier = "LEVEL_2_SAFE";
    thresholdMin = 0.25;
    thresholdMax = 0.45;
    baseConfidence = 85;
    confRange = 7; // 92 - 85
  } else if (score < 0.70) {
    classification = "warning";
    statusLabel = "Thermal Surge Alert";
    riskTier = "LEVEL_3_WARNING";
    thresholdMin = 0.45;
    thresholdMax = 0.70;
    baseConfidence = 88;
    confRange = 7; // 95 - 88
  } else {
    classification = "critical";
    statusLabel = "Critical Industrial Thermal Anomaly";
    riskTier = "LEVEL_4_CRITICAL";
    thresholdMin = 0.70;
    thresholdMax = 1.00;
    baseConfidence = 94;
    confRange = 5; // 99 - 94
  }

  const confidenceRaw =
    baseConfidence + ((score - thresholdMin) / (thresholdMax - thresholdMin)) * confRange;
  const confidence = parseFloat(Math.min(100, Math.max(0, confidenceRaw)).toFixed(1));

  // 8. Generate Explainable SHAP Attribution Array
  const shapAttributions = [
    {
      feature: "Fire Radiative Power (FRP)",
      value: parseFloat(frp.toFixed(1)),
      baseline: parseFloat(baselineFrp.toFixed(1)),
      score: parseFloat(frpScore.toFixed(2)),
      weight: 0.30,
      contribution: parseFloat((frpScore * 0.30).toFixed(3)),
      percentText: `${frpScore * 0.30 >= 0 ? "+" : ""}${((frpScore * 0.30) * 100).toFixed(1)}%`,
      impact: frpScore >= 0.6 ? "risk_elevating" : frpScore === 0 ? "risk_mitigating" : "neutral",
      desc:
        frpDeviation > 0
          ? `FRP of ${frp.toFixed(1)} MW exceeds baseline of ${baselineFrp.toFixed(1)} MW by +${frpDeviation.toFixed(1)}%`
          : `FRP of ${frp.toFixed(1)} MW is within baseline of ${baselineFrp.toFixed(1)} MW (${frpDeviation.toFixed(1)}%)`
    },
    {
      feature: "FRP Baseline Deviation",
      value: parseFloat(frpDeviation.toFixed(1)),
      baseline: 0.0,
      score: parseFloat(deviationScore.toFixed(2)),
      weight: 0.25,
      contribution: parseFloat((deviationScore * 0.25).toFixed(3)),
      percentText: `${deviationScore * 0.25 >= 0 ? "+" : ""}${((deviationScore * 0.25) * 100).toFixed(1)}%`,
      impact:
        deviationScore >= 0.6 ? "risk_elevating" : deviationScore === 0 ? "risk_mitigating" : "neutral",
      desc:
        frpDeviation > 0
          ? `Thermal power exceeds expected historical facility baseline by ${frpDeviation.toFixed(1)}%`
          : `Thermal emission conforms to normal baseline level (${baselineFrp.toFixed(1)} MW)`
    },
    {
      feature: "Brightness Temperature (TI4)",
      value: parseFloat(brightTi4.toFixed(1)),
      baseline: 310.0,
      score: parseFloat(ti4Score.toFixed(2)),
      weight: 0.15,
      contribution: parseFloat((ti4Score * 0.15).toFixed(3)),
      percentText: `${ti4Score * 0.15 >= 0 ? "+" : ""}${((ti4Score * 0.15) * 100).toFixed(1)}%`,
      impact: ti4Score >= 0.6 ? "risk_elevating" : ti4Score === 0 ? "risk_mitigating" : "neutral",
      desc: `TI4 band radiometric brightness temperature of ${brightTi4.toFixed(1)} K (${Math.round(brightTi4 - 273.15)}°C)`
    },
    {
      feature: "Proximity to Industrial Zone",
      value: parseFloat(distanceKm.toFixed(2)),
      baseline: closestZoneObj ? (closestZoneObj.emergencyZoneRadiusKm ?? 5.0) : 30.0,
      score: parseFloat(proximityScore.toFixed(2)),
      weight: 0.15,
      contribution: parseFloat((proximityScore * 0.15).toFixed(3)),
      percentText: `${proximityScore * 0.15 >= 0 ? "+" : ""}${((proximityScore * 0.15) * 100).toFixed(1)}%`,
      impact:
        proximityScore >= 0.6 ? "risk_elevating" : proximityScore === 0 ? "risk_mitigating" : "neutral",
      desc: closestZoneObj
        ? isInsideIndustrialZone
          ? `Inside hazardous perimeter of ${closestZoneObj.name} (${distanceKm.toFixed(1)} km from center)`
          : `Located ${distanceKm.toFixed(1)} km from ${closestZoneObj.name} (${closestZoneObj.type || "Industrial Zone"})`
        : "Remote location, >30 km from nearest known industrial asset"
    },
    {
      feature: "Sensor Confidence",
      value: typeof confRaw === "number" ? confRaw : String(confRaw),
      baseline: "nominal",
      score: parseFloat(confScore.toFixed(2)),
      weight: 0.10,
      contribution: parseFloat((confScore * 0.10).toFixed(3)),
      percentText: `${confScore * 0.10 >= 0 ? "+" : ""}${((confScore * 0.10) * 100).toFixed(1)}%`,
      impact: confScore >= 0.8 ? "risk_elevating" : confScore <= 0.3 ? "risk_mitigating" : "neutral",
      desc: `Satellite sensor confidence flag '${confRaw}' mapped to confidence weight ${(confScore * 100).toFixed(0)}%`
    },
    {
      feature: "Night Detection Bonus",
      value: isNight ? "Night" : "Day",
      baseline: "Day",
      score: parseFloat(nightScore.toFixed(2)),
      weight: 0.05,
      contribution: parseFloat((nightScore * 0.05).toFixed(3)),
      percentText: `${nightScore * 0.05 >= 0 ? "+" : ""}${((nightScore * 0.05) * 100).toFixed(1)}%`,
      impact: isNight ? "risk_elevating" : "neutral",
      desc: isNight
        ? "Night pass detection (higher signal-to-noise ratio, zero solar background interference)"
        : "Daytime satellite observation (ambient solar heating baseline present)"
    }
  ];

  // 9. Format closestZone object matching specification
  const closestZone = closestZoneObj
    ? {
        id: closestZoneObj.id,
        name: closestZoneObj.name,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        activeFlareStacks: closestZoneObj.activeFlareStacks ?? 0,
        emergencyZoneRadiusKm: closestZoneObj.emergencyZoneRadiusKm ?? 5.0,
        type: closestZoneObj.type ?? "Industrial Facility"
      }
    : {
        id: null,
        name: "No Monitored Industrial Facility",
        distanceKm: 9999,
        activeFlareStacks: 0,
        emergencyZoneRadiusKm: 0,
        type: "None"
      };

  return {
    classification,
    confidence,
    statusLabel,
    riskTier,
    closestZone,
    isInsideIndustrialZone,
    baselineFrp,
    frpDeviation,
    shapAttributions,
    // Complementary aliases for UI / pipeline convenience
    status: classification,
    aiConfidence: confidence,
    shapFactors: shapAttributions,
    score: parseFloat(score.toFixed(3))
  };
}

/**
 * Calculates the False Positive Rate (FPR) across an array of classified events.
 * Counts events classified as 'safe' or 'false_positive' near industrial zones with known
 * flare stacks (expected persistent operational heat signatures that are NOT uncontrolled fires).
 *
 * @param {Array<object>} classifiedEvents - Array of classified fire events
 * @returns {{ rate: number, filtered: number, total: number }} False positive statistics
 */
export function calculateFalsePositiveRate(classifiedEvents) {
  if (!Array.isArray(classifiedEvents) || classifiedEvents.length === 0) {
    return { rate: 0.0, filtered: 0, total: 0 };
  }

  const total = classifiedEvents.length;
  let filtered = 0;

  for (const event of classifiedEvents) {
    if (!event) continue;

    const classification = event.classification || event.status;
    const isSafeOrFP = classification === "safe" || classification === "false_positive";

    if (!isSafeOrFP) continue;

    const zone = event.closestZone || event.zone;
    const dist = zone?.distanceKm ?? event.distanceKm ?? 9999;
    const radius = zone?.emergencyZoneRadiusKm ?? 10.0;
    const isNear = Boolean(event.isInsideIndustrialZone || dist <= radius);

    const flareStacks = zone?.activeFlareStacks ?? event.activeFlareStacks ?? event.zone?.activeFlareStacks;
    const hasKnownFlares = flareStacks !== undefined ? flareStacks > 0 : true;

    if (isNear && hasKnownFlares) {
      filtered++;
    }
  }

  const rate = total > 0 ? parseFloat(((filtered / total) * 100).toFixed(1)) : 0.0;

  return {
    rate,
    filtered,
    total
  };
}
