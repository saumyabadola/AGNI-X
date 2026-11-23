/**
 * AGNI-X Atmospheric Dispersion Model
 * 
 * Implements the Pasquill-Gifford Gaussian Plume Atmospheric Dispersion Model
 * based on EPA / NOAA atmospheric dispersion science guidelines (ISC3 / SCREEN3 / ALOHA).
 * 
 * Replaces the simplified frontend plume approximation with a physically rigorous
 * calculation of downwind chemical / particulate transport, atmospheric stability,
 * concentration decay, threat perimeter zones (IDLH, ERPG-2, ERPG-1), and
 * affected population impact.
 * 
 * Zero external dependencies — pure ES module JavaScript.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Constants & Empirical Parameters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard Pasquill-Gifford dispersion coefficients for rural/open terrain.
 * Parameterized as power-law approximations:
 *   σy = a * x^b  (crosswind lateral standard deviation, in meters)
 *   σz = c * x^d  (vertical dispersion standard deviation, in meters)
 * where x is downwind distance in meters.
 * 
 * Source: D.B. Turner (Workbook of Atmospheric Dispersion Estimates) /
 *         EPA Industrial Source Complex (ISC3) formulations.
 */
export const PASQUILL_COEFFICIENTS = {
  A: { a: 0.22, b: 0.91, c: 0.20, d: 0.85 }, // Extremely Unstable
  B: { a: 0.16, b: 0.91, c: 0.12, d: 0.85 }, // Moderately Unstable
  C: { a: 0.11, b: 0.91, c: 0.08, d: 0.85 }, // Slightly Unstable
  D: { a: 0.08, b: 0.91, c: 0.06, d: 0.81 }, // Neutral
  E: { a: 0.06, b: 0.91, c: 0.03, d: 0.71 }, // Slightly Stable
  F: { a: 0.04, b: 0.91, c: 0.016, d: 0.61 } // Moderately to Extremely Stable
};

/**
 * Human-readable descriptions for Pasquill-Gifford atmospheric stability classes.
 */
export const STABILITY_DESCRIPTIONS = {
  A: "Extremely Unstable (Sunny daytime, strong solar insolation, light winds)",
  B: "Moderately Unstable (Moderate daytime insolation, slight winds)",
  C: "Slightly Unstable (Slight daytime insolation or moderate winds)",
  D: "Neutral (Overcast day/night or high wind speed mixing)",
  E: "Slightly Stable (Nighttime with partial clouds / moderate wind)",
  F: "Very Stable (Clear night sky, low wind speed, nocturnal inversion)"
};

/**
 * Population density benchmarks by region type (people per km²).
 * Used for estimating affected populace within plume evacuation paths.
 */
export const POPULATION_DENSITIES = {
  "urban industrial": 2500,
  urban: 2500,
  suburban: 800,
  rural: 100,
  default: 500
};

/**
 * Approximate emission factor for active combustion products.
 * Q ≈ FRP * 0.1 kg/s per MW (EPA / Wooster et al. thermal emission proxies).
 */
export const EMISSION_FACTOR_KG_PER_S_MW = 0.1;

/**
 * Earth mean radius in kilometers for Great-Circle geodesic projection.
 */
const EARTH_RADIUS_KM = 6371.0;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Geodesic & Geometry Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates destination latitude and longitude given origin, bearing, and distance
 * using standard spherical Earth trigonometry (Great-Circle direct geodesic formula).
 * 
 * @param {number} lat - Origin latitude in decimal degrees
 * @param {number} lon - Origin longitude in decimal degrees
 * @param {number} distanceKm - Travel distance in kilometers
 * @param {number} bearingDeg - Direction of travel in degrees (0 = North, 90 = East)
 * @returns {[number, number]} Destination coordinates [latitude, longitude]
 */
export function getDestinationPoint(lat, lon, distanceKm, bearingDeg) {
  const dByR = distanceKm / EARTH_RADIUS_KM;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const bearingRad = (bearingDeg * Math.PI) / 180;

  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(dByR) +
    Math.cos(latRad) * Math.sin(dByR) * Math.cos(bearingRad)
  );

  const destLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(dByR) * Math.cos(latRad),
    Math.cos(dByR) - Math.sin(latRad) * Math.sin(destLatRad)
  );

  const destLat = (destLatRad * 180) / Math.PI;
  const destLon = (((destLonRad * 180) / Math.PI + 540) % 360) - 180;

  return [Number(destLat.toFixed(6)), Number(destLon.toFixed(6))];
}

/**
 * Generates closed parabolic plume cone polygon coordinates for map rendering.
 * Matches the frontend parabolic geometry and Leaflet coordinate structure.
 * 
 * @param {number} lat - Source origin latitude
 * @param {number} lon - Source origin longitude
 * @param {number} travelBearingDeg - Direction plume is blowing towards
 * @param {number} lengthKm - Downwind plume length/radius in km
 * @param {number} spreadAngleDeg - Half-spread angle in degrees
 * @param {number} steps - Interpolation step count for curved parabolic front
 * @returns {Array<[number, number]>} Closed coordinate array starting and ending at [lat, lon]
 */
export function computePlumePolygon(lat, lon, travelBearingDeg, lengthKm, spreadAngleDeg = 18, steps = 12) {
  const coords = [[lat, lon]]; // Start at source origin

  const startAngle = travelBearingDeg - spreadAngleDeg;
  const endAngle = travelBearingDeg + spreadAngleDeg;
  const angleStep = (endAngle - startAngle) / steps;

  // Generate curved parabolic front: maximum reach along the centerline,
  // tapering down to 72% at the plume lateral fringes (centerFactor).
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * angleStep;
    const normalizedOffset = (angle - travelBearingDeg) / spreadAngleDeg;
    const centerFactor = 1 - 0.28 * Math.pow(normalizedOffset, 2);
    const effectiveLength = lengthKm * Math.max(0.6, centerFactor);

    coords.push(getDestinationPoint(lat, lon, effectiveLength, angle));
  }

  coords.push([lat, lon]); // Close back to origin
  return coords;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Core Exported Scientific Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines Pasquill-Gifford atmospheric stability class (A through F)
 * based on surface wind speed, solar insolation (daytime), and cloud cover.
 * 
 * Pasquill-Gifford Lookup Table:
 * ┌───────────┬────────────┬──────────────┬────────────┬──────────┬─────────────┬──────────────┐
 * │ Wind(m/s) │ Strong Sun │ Moderate Sun │ Slight Sun │ Overcast │ Night Clear │ Night Cloudy │
 * ├───────────┼────────────┼──────────────┼────────────┼──────────┼─────────────┼──────────────┤
 * │   < 2     │     A      │     A-B      │     B      │    D     │      F      │      F       │
 * │   2 - 3   │    A-B     │      B       │     C      │    D     │      E      │      F       │
 * │   3 - 5   │     B      │     B-C      │     C      │    D     │      D      │      E       │
 * │   5 - 6   │     C      │     C-D      │     D      │    D     │      D      │      D       │
 * │   > 6     │     C      │      D       │     D      │    D     │      D      │      D       │
 * └───────────┴────────────┴──────────────┴────────────┴──────────┴─────────────┴──────────────┘
 * 
 * Intermediate classes (A-B, B-C, C-D) map to discrete conservative single letters
 * matching standard EPA air dispersion conventions.
 * 
 * @param {number} windSpeedMs - Surface wind speed in meters per second
 * @param {boolean} [isDaytime=true] - True for daytime, false for nighttime
 * @param {number} [cloudCoverPercent=20] - Total cloud cover percentage (0 to 100)
 * @returns {'A'|'B'|'C'|'D'|'E'|'F'} Pasquill stability class
 */
export function estimateStabilityClass(windSpeedMs, isDaytime = true, cloudCoverPercent = 20) {
  const u = Math.max(0, Number(windSpeedMs) || 0);
  const cloud = Math.min(100, Math.max(0, Number(cloudCoverPercent) || 0));
  const day = Boolean(isDaytime);

  // Categorize insolation / radiative condition
  // Day: Strong (<25% clouds), Moderate (25-59%), Slight (60-79%), Overcast (>=80%)
  // Night: Clear (<50% clouds), Cloudy (>=50% clouds)
  if (day) {
    if (cloud >= 80) {
      // Overcast day is always neutral (Class D) due to cloud-attenuated radiative heating
      return "D";
    }

    const isStrongSun = cloud < 25;
    const isModerateSun = cloud >= 25 && cloud < 60;
    // Otherwise Slight Sun (60 <= cloud < 80)

    if (u < 2.0) {
      if (isStrongSun) return "A";
      if (isModerateSun) return "B"; // A-B convention maps to B
      return "B";
    } else if (u < 3.0) {
      if (isStrongSun) return "B"; // A-B convention maps to B
      if (isModerateSun) return "B";
      return "C";
    } else if (u < 5.0) {
      if (isStrongSun) return "B";
      if (isModerateSun) return "C"; // B-C convention maps to C
      return "C";
    } else if (u <= 6.0) {
      if (isStrongSun) return "C";
      if (isModerateSun) return "D"; // C-D convention maps to D
      return "D";
    } else {
      // u > 6.0 m/s
      if (isStrongSun) return "C";
      return "D";
    }
  } else {
    // Nighttime conditions
    const isCloudyNight = cloud >= 50;

    if (u < 2.0) {
      return "F"; // Both clear and cloudy night with light winds are very stable
    } else if (u < 3.0) {
      return isCloudyNight ? "F" : "E";
    } else if (u < 5.0) {
      return isCloudyNight ? "E" : "D";
    } else {
      // u >= 5.0 m/s: Mechanical turbulence dominates at night in strong wind
      return "D";
    }
  }
}

/**
 * Returns lateral (σy) and vertical (σz) Gaussian dispersion coefficients
 * using standard Pasquill-Gifford empirical power-law formulas:
 *   σy = a * x^b (lateral dispersion in meters)
 *   σz = c * x^d (vertical dispersion in meters)
 * 
 * @param {'A'|'B'|'C'|'D'|'E'|'F'|string} stabilityClass - Pasquill stability class
 * @param {number} downwindDistanceM - Downwind distance x in meters
 * @returns {{ sigmaY: number, sigmaZ: number }} Lateral and vertical standard deviations
 */
export function calculateDispersionCoefficients(stabilityClass, downwindDistanceM) {
  let sc = typeof stabilityClass === "string" ? stabilityClass.trim().toUpperCase() : "D";
  
  // Handle compound notations (e.g., 'A-B' -> 'B', 'B-C' -> 'C', 'C-D' -> 'D')
  if (sc.length > 1) {
    sc = sc.includes("-") ? sc.split("-")[1] : sc[0];
  }

  const coeff = PASQUILL_COEFFICIENTS[sc] || PASQUILL_COEFFICIENTS.D;

  // Clamp minimum distance to 0.1m to prevent 0^power singularities
  const x = Math.max(0.1, Number(downwindDistanceM) || 0.1);

  const sigmaY = coeff.a * Math.pow(x, coeff.b);
  const sigmaZ = coeff.c * Math.pow(x, coeff.d);

  return { sigmaY, sigmaZ };
}

/**
 * Calculates complete atmospheric plume dispersion, hazard threat zones,
 * ground concentrations, and affected population.
 * 
 * @param {object} params - Atmospheric and emission parameters
 * @param {number} [params.sourceLat=0] - Fire hotspot latitude
 * @param {number} [params.sourceLon=0] - Fire hotspot longitude
 * @param {number} [params.frpMW=10] - Fire Radiative Power in Megawatts
 * @param {number} [params.windSpeedKmH=15] - Wind speed in km/h
 * @param {number} [params.windDeg=270] - Meteorological wind direction (direction wind comes FROM)
 * @param {boolean} [params.isDaytime=true] - Solar day/night flag
 * @param {number} [params.cloudCoverPercent=20] - Cloud cover percentage (0-100)
 * @param {number} [params.stackHeightM=15] - Effective release height in meters (default 15m)
 * @param {string} [params.regionType="default"] - Region classification for population estimation
 * @returns {object} Comprehensive dispersion model result
 */
export function calculatePlumeDispersion(params = {}) {
  // 1. Sanitize inputs and establish baseline values
  const sourceLat = Number(params.sourceLat ?? 0);
  const sourceLon = Number(params.sourceLon ?? 0);
  const frpMW = Math.max(0.1, Number(params.frpMW ?? 10));
  const windSpeedKmH = Math.max(0.5, Number(params.windSpeedKmH ?? 15));
  const windDeg = Number(params.windDeg ?? 270);
  const isDaytime = Boolean(params.isDaytime ?? true);
  const cloudCoverPercent = Math.min(100, Math.max(0, Number(params.cloudCoverPercent ?? 20)));
  const stackHeightM = Math.max(0, Number(params.stackHeightM ?? 15));
  const regionType = String(params.regionType ?? "default").trim().toLowerCase();

  // 2. Wind conversions & travel trajectory
  // Meteorological windDeg is where wind originates; plume travels downwind towards (windDeg + 180) % 360
  const windSpeedMs = Number((windSpeedKmH / 3.6).toFixed(2));
  const travelBearingDeg = (Math.round(windDeg + 180) % 360 + 360) % 360;

  // 3. Determine atmospheric stability class
  const stabilityClass = estimateStabilityClass(windSpeedMs, isDaytime, cloudCoverPercent);
  const stabilityDescription = STABILITY_DESCRIPTIONS[stabilityClass] || "Atmospheric Condition";

  // 4. Emission rate Q from Fire Radiative Power (kg/s)
  const Q = frpMW * EMISSION_FACTOR_KG_PER_S_MW;

  // 5. Gaussian Plume Centerline Ground Concentration Calculation:
  //    C(x) = [Q / (π * σy(x) * σz(x) * u)] * exp(-H² / (2 * σz(x)²))
  //    u is clamped to >= 0.5 m/s to prevent zero-wind infinite concentration singularity
  const u = Math.max(0.5, windSpeedMs);
  const H = stackHeightM;
  const coeff = PASQUILL_COEFFICIENTS[stabilityClass] || PASQUILL_COEFFICIENTS.D;

  function calculateGroundConcentration(xMeters) {
    const { sigmaY, sigmaZ } = calculateDispersionCoefficients(stabilityClass, xMeters);
    if (sigmaY <= 0 || sigmaZ <= 0) return 0;

    const verticalDispersionTerm = H > 0 ? Math.exp(-(H * H) / (2 * sigmaZ * sigmaZ)) : 1.0;
    return (Q / (Math.PI * sigmaY * sigmaZ * u)) * verticalDispersionTerm;
  }

  // 6. Find maximum ground-level concentration (Cmax) and touchdown distance (xmax)
  //    Analytically, for elevated stack H:
  //    xmax = [ (d * H²) / ((b + d) * c²) ]^(1 / (2d))
  let xTouchdownM;
  if (H > 0) {
    const numerator = coeff.d * H * H;
    const denominator = (coeff.b + coeff.d) * coeff.c * coeff.c;
    xTouchdownM = Math.max(15, Math.pow(numerator / denominator, 1 / (2 * coeff.d)));
  } else {
    xTouchdownM = 15; // Ground-level source: maximum is at source boundary
  }

  const cMax = Math.max(1e-12, calculateGroundConcentration(xTouchdownM));

  // 7. Find downwind distances where concentration drops below safety thresholds
  //    Using monotonic bisection root-finding along the decay curve for x >= xTouchdownM
  function findThresholdDistanceM(targetRatio) {
    let low = xTouchdownM;
    let high = 150000; // 150 km search ceiling

    // If concentration at search ceiling is still higher than threshold, return ceiling
    if (calculateGroundConcentration(high) / cMax > targetRatio) {
      return high;
    }

    for (let i = 0; i < 32; i++) {
      const mid = (low + high) / 2;
      const ratio = calculateGroundConcentration(mid) / cMax;
      if (ratio > targetRatio) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }

  const baseDistIdlhM = findThresholdDistanceM(0.30); // IDLH relative threshold: 30% of Cmax
  const baseDistEvacM = findThresholdDistanceM(0.10); // ERPG-2 relative threshold: 10% of Cmax
  const baseDistAdvM  = findThresholdDistanceM(0.03); // ERPG-1 relative threshold: 3% of Cmax

  // 8. Physical Scaling:
  //    - Fire power scaling: More powerful fires release more mass, extending plume extent
  //      Baseline benchmark: 20 MW fire
  //    - Wind speed scaling: Faster winds provide enhanced downwind advective transport
  //      Baseline benchmark: 4.17 m/s (15 km/h)
  const frpScale = Math.min(3.5, Math.max(0.35, Math.pow(frpMW / 20.0, 0.35)));
  const windScale = Math.min(2.2, Math.max(0.5, Math.pow(u / 4.17, 0.30)));
  const dynamicScale = frpScale * windScale;

  let rIdlhKm = (baseDistIdlhM * dynamicScale) / 1000;
  let rEvacKm = (baseDistEvacM * dynamicScale) / 1000;
  let rAdvKm  = (baseDistAdvM  * dynamicScale) / 1000;

  // Apply emergency response envelope bounds and ensure monotonic concentric zones:
  // IDLH core < Evacuation zone < Advisory perimeter
  rIdlhKm = Math.min(8.0, Math.max(0.25, rIdlhKm));
  rEvacKm = Math.min(16.0, Math.max(rIdlhKm + 0.3, rEvacKm));
  rAdvKm  = Math.min(32.0, Math.max(rEvacKm + 0.5, rAdvKm));

  const zones = {
    idlh: {
      radiusKm: Number(rIdlhKm.toFixed(2)),
      description: "Level-A HazMat required"
    },
    evacuation: {
      radiusKm: Number(rEvacKm.toFixed(2)),
      description: "2-hour mandatory evacuation"
    },
    advisory: {
      radiusKm: Number(rAdvKm.toFixed(2)),
      description: "Shelter-in-place, seal HVAC"
    }
  };

  // 9. Generate plume polygon coordinates for GIS / Leaflet rendering
  //    Spread angles expand downwind matching atmospheric lateral plume expansion
  const idlhPolygon = computePlumePolygon(sourceLat, sourceLon, travelBearingDeg, zones.idlh.radiusKm, 12, 12);
  const evacuationPolygon = computePlumePolygon(sourceLat, sourceLon, travelBearingDeg, zones.evacuation.radiusKm, 17, 12);
  const advisoryPolygon = computePlumePolygon(sourceLat, sourceLon, travelBearingDeg, zones.advisory.radiusKm, 22, 12);

  // 10. Compute ground-level relative concentrations at key distance checkpoints
  const keyDistancesKm = [0.5, 1.0, 2.0, 5.0];
  const concentrations = keyDistancesKm.map((dKm) => {
    const conc = calculateGroundConcentration(dKm * 1000);
    const relConc = Math.min(1.0, Math.max(0.0, conc / cMax));
    return {
      distanceKm: dKm,
      relativeConcentration: Number(relConc.toFixed(4))
    };
  });

  // 11. Affected population estimation based on region density and evacuation zone sector area
  //     Sector area formula: Area = π * r² * (2 * spreadAngle / 360)
  const populationDensityUsed = POPULATION_DENSITIES[regionType] || POPULATION_DENSITIES.default;
  const evacSpreadHalfAngleDeg = 17;
  const evacSectorAreaKm2 = Math.PI * Math.pow(zones.evacuation.radiusKm, 2) * ((2 * evacSpreadHalfAngleDeg) / 360);
  const estimatedAffectedPopulation = Math.round(evacSectorAreaKm2 * populationDensityUsed);

  // 12. Assemble and return complete dispersion object
  return {
    stabilityClass,
    stabilityDescription,
    windSpeedMs,
    travelBearingDeg,
    zones,
    idlhPolygon,
    evacuationPolygon,
    advisoryPolygon,
    concentrations,
    estimatedAffectedPopulation,
    populationDensityUsed,
    modelVersion: "Pasquill-Gifford v1.0",
    calculatedAt: new Date().toISOString()
  };
}

export default {
  estimateStabilityClass,
  calculateDispersionCoefficients,
  calculatePlumeDispersion,
  computePlumePolygon,
  getDestinationPoint,
  PASQUILL_COEFFICIENTS,
  STABILITY_DESCRIPTIONS,
  POPULATION_DENSITIES
};
