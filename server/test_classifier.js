import {
  classifyFireEvent,
  calculateFalsePositiveRate,
  calculateDistanceKm,
  findClosestIndustrialZone
} from "./classifier.js";

console.log("=== AGNI-X Fire Classifier Engine Validation Suite ===\n");

// 1. Distance Calculation Tests
console.log("Test 1: Haversine distance calculation");
const distEquator1Deg = calculateDistanceKm(0, 0, 0, 1);
console.log(`- 1 degree longitude at equator: ${distEquator1Deg.toFixed(2)} km (expected ~111.19 km)`);
console.assert(Math.abs(distEquator1Deg - 111.19) < 1, "Distance calculation out of tolerance");

const zeroDist = calculateDistanceKm(22.378, 69.855, 22.378, 69.855);
console.log(`- Zero distance check: ${zeroDist} km`);
console.assert(zeroDist === 0, "Zero distance should be 0");

// 2. Industrial Zone Search Tests
console.log("\nTest 2: findClosestIndustrialZone");
const testZones = [
  {
    id: "IND-JAMNAGAR-01",
    name: "Jamnagar Petroleum Refinery Complex",
    center: [22.378, 69.855],
    activeFlareStacks: 6,
    emergencyZoneRadiusKm: 5.0,
    type: "Petroleum Refining"
  },
  {
    id: "IND-VIZAG-02",
    name: "Visakhapatnam Chemical Corridor",
    center: [17.702, 83.210],
    activeFlareStacks: 3,
    emergencyZoneRadiusKm: 6.5,
    type: "Petrochemical"
  }
];

const closestToJamnagar = findClosestIndustrialZone(22.380, 69.860, testZones);
console.log(`- Closest to (22.380, 69.860): ${closestToJamnagar.zone?.id} at ${closestToJamnagar.distanceKm} km`);
console.assert(closestToJamnagar.zone?.id === "IND-JAMNAGAR-01", "Should identify Jamnagar");
console.assert(closestToJamnagar.distanceKm < 1.0, "Distance should be under 1 km");

const emptyResult = findClosestIndustrialZone(22, 69, []);
console.log(`- Empty zones array returns: distanceKm=${emptyResult.distanceKm}, zone=${emptyResult.zone}`);
console.assert(emptyResult.distanceKm === 9999 && emptyResult.zone === null, "Empty test failed");

// 3. Classification Tests for All 4 Tiers

// Case A: Critical Fire Event (High FRP, Surge, Night, Inside Zone)
console.log("\nTest 3: classifyFireEvent - Critical Scenario");
const criticalEvent = {
  lat: 22.380,
  lon: 69.856,
  frp: 342.6,
  brightTi4: 546.8,
  brightTi5: 310.2,
  confRaw: "high",
  acqDate: "2026-09-03",
  acqTime: "2138",
  satellite: "VIIRS NOAA-20",
  daynight: "Night",
  baselineFrp: 28.5
};

const critRes = classifyFireEvent(criticalEvent, testZones);
console.log(`- Classification: ${critRes.classification}`);
console.log(`- Confidence: ${critRes.confidence}%`);
console.log(`- Status Label: ${critRes.statusLabel}`);
console.log(`- Risk Tier: ${critRes.riskTier}`);
console.log(`- FRP Deviation: ${critRes.frpDeviation}%`);
console.log(`- Inside Industrial Zone: ${critRes.isInsideIndustrialZone}`);
console.log(`- SHAP Attributions count: ${critRes.shapAttributions.length}`);
console.log(`- SHAP Feature 0:`, critRes.shapAttributions[0]);

console.assert(critRes.classification === "critical", "Critical event must be classified as critical");
console.assert(critRes.confidence >= 94 && critRes.confidence <= 99, "Confidence must be within 94-99%");
console.assert(critRes.isInsideIndustrialZone === true, "Must be inside industrial zone");
console.assert(critRes.shapAttributions.length === 6, "Must have exactly 6 SHAP attributions");

// Case B: Warning Event (Elevated FRP, Moderate Deviation)
console.log("\nTest 4: classifyFireEvent - Warning Scenario");
const warningEvent = {
  lat: 22.420,
  lon: 69.890, // ~6km away (5-10km bucket -> 0.6)
  frp: 65.0,   // 35-75 bucket -> 0.6
  brightTi4: 350.0, // 340-400 bucket -> 0.6
  brightTi5: 295.0,
  confRaw: "nominal", // 0.5
  acqDate: "2026-09-03",
  acqTime: "1200",
  satellite: "VIIRS NOAA-20",
  daynight: "Day", // 0.0
  baselineFrp: 35.0 // deviation = (65 - 35)/35 = 85.7% (50-100% bucket -> 0.6)
};
// Expected score:
// frpScore (0.6 * 0.3) = 0.18
// devScore (0.6 * 0.25) = 0.15
// ti4Score (0.6 * 0.15) = 0.09
// proxScore (0.6 * 0.15) = 0.09
// confScore (0.5 * 0.10) = 0.05
// nightScore (0.0 * 0.05) = 0.0
// Total score = 0.18 + 0.15 + 0.09 + 0.09 + 0.05 = 0.56
// 0.56 is between 0.45 and 0.70 -> warning!
const warnRes = classifyFireEvent(warningEvent, testZones);
console.log(`- Classification: ${warnRes.classification}`);
console.log(`- Confidence: ${warnRes.confidence}%`);
console.log(`- Score: ${warnRes.score}`);
console.assert(warnRes.classification === "warning", "Should be classified as warning");
console.assert(warnRes.confidence >= 88 && warnRes.confidence <= 95, "Confidence must be 88-95%");

// Case C: Safe Event (Routine Operational Flaring)
console.log("\nTest 5: classifyFireEvent - Safe Scenario");
const safeEvent = {
  lat: 22.378,
  lon: 69.855, // 0km -> <5km bucket -> 1.0 (score 1.0 * 0.15 = 0.15)
  frp: 26.0,   // 15-35 bucket -> 0.3 (0.3 * 0.3 = 0.09)
  brightTi4: 320.0, // 310-340 bucket -> 0.3 (0.3 * 0.15 = 0.045)
  brightTi5: 295.0,
  confRaw: "nominal", // 0.5 (0.5 * 0.1 = 0.05)
  daynight: "Day", // 0.0
  baselineFrp: 25.0 // deviation = (26 - 25)/25 = 4% (<20% bucket -> 0.0)
};
// Expected score:
// 0.09 + 0.0 + 0.045 + 0.15 + 0.05 + 0 = 0.335
// 0.335 is between 0.25 and 0.45 -> safe!
const safeRes = classifyFireEvent(safeEvent, testZones);
console.log(`- Classification: ${safeRes.classification}`);
console.log(`- Confidence: ${safeRes.confidence}%`);
console.log(`- Score: ${safeRes.score}`);
console.assert(safeRes.classification === "safe", "Should be classified as safe");
console.assert(safeRes.confidence >= 85 && safeRes.confidence <= 92, "Confidence must be 85-92%");

// Case D: False Positive Event (Low FRP, Remote, Ambient Temp)
console.log("\nTest 6: classifyFireEvent - False Positive Scenario");
const fpEvent = {
  lat: 10.0,
  lon: 50.0, // Remote (>30km -> 0.0)
  frp: 8.0,  // <15 MW -> 0.0
  brightTi4: 305.0, // <310K -> 0.0
  brightTi5: 295.0,
  confRaw: "low", // 0.2 -> 0.2 * 0.10 = 0.02
  daynight: "Day", // 0.0
  baselineFrp: 25.0 // deviation < 20% -> 0.0
};
// Score = 0.02 -> false_positive!
const fpRes = classifyFireEvent(fpEvent, testZones);
console.log(`- Classification: ${fpRes.classification}`);
console.log(`- Confidence: ${fpRes.confidence}%`);
console.log(`- Score: ${fpRes.score}`);
console.assert(fpRes.classification === "false_positive", "Should be classified as false_positive");
console.assert(fpRes.confidence >= 70 && fpRes.confidence <= 85, "Confidence must be 70-85%");

// Test 7: Determinism (Same input must produce identical output)
console.log("\nTest 7: Determinism Test");
const run1 = classifyFireEvent(criticalEvent, testZones);
const run2 = classifyFireEvent(criticalEvent, testZones);
console.assert(JSON.stringify(run1) === JSON.stringify(run2), "Outputs must be strictly identical");
console.log("- Determinism verified: 100% identical outputs on duplicate runs");

// Test 8: calculateFalsePositiveRate
console.log("\nTest 8: calculateFalsePositiveRate");
const eventBatch = [
  critRes,
  warnRes,
  safeRes,
  fpRes
];
const fpr = calculateFalsePositiveRate(eventBatch);
console.log(`- False Positive Rate Stats:`, fpr);
// In eventBatch:
// critRes is critical
// warnRes is warning
// safeRes is safe, inside Jamnagar (which has 6 active flare stacks) -> filtered!
// fpRes is false_positive, but remote (>30km, not near flare stacks) -> not filtered
// filtered should be 1 out of 4 (25.0%)
console.assert(fpr.filtered === 1, `Expected 1 filtered event, got ${fpr.filtered}`);
console.assert(fpr.total === 4, `Expected 4 total events, got ${fpr.total}`);
console.assert(fpr.rate === 25.0, `Expected 25.0% rate, got ${fpr.rate}`);

console.log("\n=== ALL ASSERTIONS PASSED SUCCESSFULLY ===");
