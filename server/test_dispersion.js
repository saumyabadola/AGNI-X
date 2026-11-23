/**
 * Test Suite for AGNI-X Atmospheric Dispersion Model
 * Verifies mathematical correctness, stability classification,
 * dispersion coefficients, threat perimeter zones, and GIS polygon output.
 */

import {
  estimateStabilityClass,
  calculateDispersionCoefficients,
  calculatePlumeDispersion,
  computePlumePolygon,
  getDestinationPoint,
  PASQUILL_COEFFICIENTS,
  STABILITY_DESCRIPTIONS,
  POPULATION_DENSITIES
} from "./dispersion.js";

console.log("=================================================");
console.log("AGNI-X Atmospheric Dispersion Model Test Suite");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// ─────────────────────────────────────────────────────────────
// Test 1: Atmospheric Stability Class Lookup Table
// ─────────────────────────────────────────────────────────────
console.log("Test 1: Pasquill-Gifford Stability Class Estimation");

// Daytime Strong Sun (cloud < 25%)
assert(estimateStabilityClass(1.5, true, 10) === "A", "Wind < 2 m/s, Daytime Strong Sun -> Class A");
assert(estimateStabilityClass(2.5, true, 10) === "B", "Wind 2-3 m/s, Daytime Strong Sun -> Class B");
assert(estimateStabilityClass(4.0, true, 10) === "B", "Wind 3-5 m/s, Daytime Strong Sun -> Class B");
assert(estimateStabilityClass(5.5, true, 10) === "C", "Wind 5-6 m/s, Daytime Strong Sun -> Class C");
assert(estimateStabilityClass(7.0, true, 10) === "C", "Wind > 6 m/s, Daytime Strong Sun -> Class C");

// Daytime Moderate Sun (cloud 30%)
assert(estimateStabilityClass(1.5, true, 30) === "B", "Wind < 2 m/s, Daytime Moderate Sun -> Class B");
assert(estimateStabilityClass(2.5, true, 30) === "B", "Wind 2-3 m/s, Daytime Moderate Sun -> Class B");
assert(estimateStabilityClass(4.0, true, 30) === "C", "Wind 3-5 m/s, Daytime Moderate Sun -> Class C");
assert(estimateStabilityClass(5.5, true, 30) === "D", "Wind 5-6 m/s, Daytime Moderate Sun -> Class D");
assert(estimateStabilityClass(7.0, true, 30) === "D", "Wind > 6 m/s, Daytime Moderate Sun -> Class D");

// Daytime Overcast (cloud >= 80%) -> Always Neutral (Class D)
assert(estimateStabilityClass(1.0, true, 90) === "D", "Wind < 2 m/s, Daytime Overcast -> Class D");
assert(estimateStabilityClass(3.0, true, 85) === "D", "Wind 3 m/s, Daytime Overcast -> Class D");
assert(estimateStabilityClass(8.0, true, 100) === "D", "Wind > 6 m/s, Daytime Overcast -> Class D");

// Night Clear (cloud < 50%)
assert(estimateStabilityClass(1.5, false, 20) === "F", "Wind < 2 m/s, Night Clear -> Class F");
assert(estimateStabilityClass(2.5, false, 20) === "E", "Wind 2-3 m/s, Night Clear -> Class E");
assert(estimateStabilityClass(4.0, false, 20) === "D", "Wind 3-5 m/s, Night Clear -> Class D");
assert(estimateStabilityClass(6.5, false, 20) === "D", "Wind > 6 m/s, Night Clear -> Class D");

// Night Cloudy (cloud >= 50%)
assert(estimateStabilityClass(1.5, false, 70) === "F", "Wind < 2 m/s, Night Cloudy -> Class F");
assert(estimateStabilityClass(2.5, false, 70) === "F", "Wind 2-3 m/s, Night Cloudy -> Class F");
assert(estimateStabilityClass(4.0, false, 70) === "E", "Wind 3-5 m/s, Night Cloudy -> Class E");
assert(estimateStabilityClass(5.5, false, 70) === "D", "Wind 5-6 m/s, Night Cloudy -> Class D");

// ─────────────────────────────────────────────────────────────
// Test 2: Dispersion Coefficients (sigmaY, sigmaZ)
// ─────────────────────────────────────────────────────────────
console.log("\nTest 2: Dispersion Coefficients Calculation");

const dist1000m = 1000;
const coeffsD = calculateDispersionCoefficients("D", dist1000m);
assert(typeof coeffsD.sigmaY === "number" && coeffsD.sigmaY > 0, "sigmaY for Class D is a positive number");
assert(typeof coeffsD.sigmaZ === "number" && coeffsD.sigmaZ > 0, "sigmaZ for Class D is a positive number");
// For D at 1000m: sy = 0.08 * 1000^0.91 ≈ 42.98, sz = 0.06 * 1000^0.81 ≈ 16.14
assert(Math.abs(coeffsD.sigmaY - 42.98) < 1.0, `Class D sigmaY at 1km is ~43m (actual: ${coeffsD.sigmaY.toFixed(2)})`);
assert(Math.abs(coeffsD.sigmaZ - 16.14) < 1.0, `Class D sigmaZ at 1km is ~16m (actual: ${coeffsD.sigmaZ.toFixed(2)})`);

// Verify that unstable (A) has much greater dispersion than stable (F)
const coeffsA = calculateDispersionCoefficients("A", dist1000m);
const coeffsF = calculateDispersionCoefficients("F", dist1000m);
assert(coeffsA.sigmaY > coeffsF.sigmaY, `Class A sigmaY (${coeffsA.sigmaY.toFixed(1)}) > Class F (${coeffsF.sigmaY.toFixed(1)})`);
assert(coeffsA.sigmaZ > coeffsF.sigmaZ, `Class A sigmaZ (${coeffsA.sigmaZ.toFixed(1)}) > Class F (${coeffsF.sigmaZ.toFixed(1)})`);

// ─────────────────────────────────────────────────────────────
// Test 3: Full Plume Dispersion Simulation
// ─────────────────────────────────────────────────────────────
console.log("\nTest 3: calculatePlumeDispersion Specification Compliance");

const testParams = {
  sourceLat: 28.6139,
  sourceLon: 77.2090,
  frpMW: 45.0,
  windSpeedKmH: 22.0,
  windDeg: 270, // Wind coming from West (270°) -> travels East (90°)
  isDaytime: true,
  cloudCoverPercent: 15,
  stackHeightM: 15,
  regionType: "urban industrial"
};

const result = calculatePlumeDispersion(testParams);

// Verify required schema fields
assert(typeof result.stabilityClass === "string" && ["A","B","C","D","E","F"].includes(result.stabilityClass), `stabilityClass is valid: ${result.stabilityClass}`);
assert(typeof result.stabilityDescription === "string" && result.stabilityDescription.length > 0, "stabilityDescription is present");
assert(typeof result.windSpeedMs === "number" && Math.abs(result.windSpeedMs - (22.0 / 3.6)) < 0.1, `windSpeedMs is correct (${result.windSpeedMs} m/s)`);
assert(result.travelBearingDeg === 90, `travelBearingDeg is 90° for West wind (windDeg: 270)`);

// Verify zones
assert(result.zones && result.zones.idlh && result.zones.evacuation && result.zones.advisory, "Three threat zones are defined");
assert(result.zones.idlh.description === "Level-A HazMat required", "IDLH description matches exact requirement");
assert(result.zones.evacuation.description === "2-hour mandatory evacuation", "Evacuation description matches exact requirement");
assert(result.zones.advisory.description === "Shelter-in-place, seal HVAC", "Advisory description matches exact requirement");
assert(result.zones.idlh.radiusKm < result.zones.evacuation.radiusKm, `Concentric order: IDLH (${result.zones.idlh.radiusKm} km) < Evac (${result.zones.evacuation.radiusKm} km)`);
assert(result.zones.evacuation.radiusKm < result.zones.advisory.radiusKm, `Concentric order: Evac (${result.zones.evacuation.radiusKm} km) < Advisory (${result.zones.advisory.radiusKm} km)`);

// Verify polygons
assert(Array.isArray(result.idlhPolygon) && result.idlhPolygon.length >= 10, "idlhPolygon has valid coordinate array");
assert(Array.isArray(result.evacuationPolygon) && result.evacuationPolygon.length >= 10, "evacuationPolygon has valid coordinate array");
assert(Array.isArray(result.advisoryPolygon) && result.advisoryPolygon.length >= 10, "advisoryPolygon has valid coordinate array");

// Verify polygon start and end closure at source origin
const firstPt = result.evacuationPolygon[0];
const lastPt = result.evacuationPolygon[result.evacuationPolygon.length - 1];
assert(firstPt[0] === testParams.sourceLat && firstPt[1] === testParams.sourceLon, "Polygon starts at source coordinate");
assert(lastPt[0] === testParams.sourceLat && lastPt[1] === testParams.sourceLon, "Polygon closes back to source coordinate");

// Verify concentrations at key distances
assert(Array.isArray(result.concentrations) && result.concentrations.length === 4, "Concentrations array has 4 key distance checkpoints");
const expectedDistances = [0.5, 1.0, 2.0, 5.0];
result.concentrations.forEach((c, idx) => {
  assert(c.distanceKm === expectedDistances[idx], `Checkpoint ${idx}: distance is ${expectedDistances[idx]} km`);
  assert(typeof c.relativeConcentration === "number" && c.relativeConcentration >= 0 && c.relativeConcentration <= 1, `Relative concentration at ${c.distanceKm} km is in [0, 1]: ${c.relativeConcentration}`);
});

// Verify population estimation
assert(typeof result.estimatedAffectedPopulation === "number" && result.estimatedAffectedPopulation > 0, `affectedPopulation estimated: ${result.estimatedAffectedPopulation}`);
assert(result.populationDensityUsed === 2500, `populationDensityUsed is 2500 for 'urban industrial'`);

// Verify metadata
assert(result.modelVersion === "Pasquill-Gifford v1.0", `modelVersion matches: ${result.modelVersion}`);
assert(typeof result.calculatedAt === "string" && !isNaN(Date.parse(result.calculatedAt)), "calculatedAt is a valid ISO timestamp");

// ─────────────────────────────────────────────────────────────
// Test 4: Physical Scaling Verification (Fire Power & Atmosphere)
// ─────────────────────────────────────────────────────────────
console.log("\nTest 4: Physical Scaling Checks");

// Larger fire should produce larger or equal plume zones
const smallFire = calculatePlumeDispersion({ ...testParams, frpMW: 5.0 });
const largeFire = calculatePlumeDispersion({ ...testParams, frpMW: 150.0 });
assert(largeFire.zones.advisory.radiusKm >= smallFire.zones.advisory.radiusKm,
  `Larger fire (150 MW: ${largeFire.zones.advisory.radiusKm} km) >= Small fire (5 MW: ${smallFire.zones.advisory.radiusKm} km)`);

// Ground level release (stackHeightM = 0)
const groundRelease = calculatePlumeDispersion({ ...testParams, stackHeightM: 0 });
assert(groundRelease.zones.idlh.radiusKm > 0, "Ground level release calculates valid IDLH radius");
assert(groundRelease.concentrations[0].relativeConcentration > 0, "Ground level release calculates valid concentration");

// Default parameters fallback
const defaultResult = calculatePlumeDispersion({});
assert(defaultResult.zones.idlh.radiusKm > 0, "Default parameters produce valid dispersion zones");

// ─────────────────────────────────────────────────────────────
// Test 5: Auxiliary Geodesic Functions & Constants
// ─────────────────────────────────────────────────────────────
console.log("\nTest 5: Auxiliary Functions & Constants");

const destPoint = getDestinationPoint(0, 0, 111.19, 0); // 1 degree north along meridian
assert(Math.abs(destPoint[0] - 1.0) < 0.01, `getDestinationPoint northward 1 deg: ${destPoint[0]}`);

const polyDirect = computePlumePolygon(28.6, 77.2, 90, 5, 15, 8);
assert(polyDirect.length === 11, `computePlumePolygon point count: ${polyDirect.length}`);

assert(Object.keys(PASQUILL_COEFFICIENTS).length === 6, "PASQUILL_COEFFICIENTS has 6 stability classes");
assert(Object.keys(STABILITY_DESCRIPTIONS).length === 6, "STABILITY_DESCRIPTIONS has 6 stability classes");
assert(POPULATION_DENSITIES.suburban === 800, "POPULATION_DENSITIES suburban benchmark is 800");

console.log("\n=================================================");
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log("=================================================");
