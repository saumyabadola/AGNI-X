import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import {
  initStore,
  storeFireEvents,
  getHistory,
  getEventProgression,
  getStats,
  generateBacktestScenarios,
  HISTORY_FILE,
  DATA_DIR
} from "./store.js";

async function runTests() {
  console.log("=== Testing AGNI-X store.js ===");

  // 1. Clean test environment
  try {
    await fs.unlink(HISTORY_FILE);
  } catch (_) {}

  // 2. Test initStore
  console.log("-> Testing initStore()...");
  const initRes = await initStore();
  assert.strictEqual(initRes.success, true);
  assert.strictEqual(initRes.totalEvents, 0);

  const fileExists = await fs.access(HISTORY_FILE).then(() => true).catch(() => false);
  assert.strictEqual(fileExists, true, "history.json must exist after initStore");

  // 3. Test storeFireEvents with batch object and normal array
  console.log("-> Testing storeFireEvents()...");
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Batch 1: Cluster A (Mundra - escalating: safe -> warning -> critical)
  const batch1Events = [
    {
      id: "evt-m-1",
      lat: 22.8214,
      lon: 69.7088,
      frp: 25.4,
      classification: "safe",
      confidence: 80,
      brightnessTempK: 320,
      closestZoneId: "IND-MUNDRA-03",
      timestamp: new Date(now - 3 * dayMs).toISOString(),
      facilityName: "Mundra Port Tank Farm"
    },
    {
      id: "evt-m-2",
      lat: 22.8216,
      lon: 69.7090,
      frp: 85.0,
      classification: "warning",
      confidence: 90,
      brightnessTempK: 410,
      closestZoneId: "IND-MUNDRA-03",
      timestamp: new Date(now - 2 * dayMs).toISOString(),
      facilityName: "Mundra Port Tank Farm"
    },
    {
      id: "evt-m-3",
      lat: 22.8215,
      lon: 69.7089,
      frp: 342.6,
      classification: "critical",
      confidence: 99,
      brightnessTempK: 546.8,
      closestZoneId: "IND-MUNDRA-03",
      timestamp: new Date(now - 1 * dayMs).toISOString(),
      facilityName: "Mundra Port Tank Farm"
    }
  ];

  await storeFireEvents(batch1Events, {
    source: "NASA_FIRMS",
    sensorProduct: "VIIRS_NOAA20_NRT",
    area: "world"
  });

  // Batch 2: Cluster B (Jamnagar - declining: critical -> warning -> safe)
  const batch2 = {
    timestamp: new Date(now - 1.5 * dayMs).toISOString(),
    source: "NASA_FIRMS",
    sensorProduct: "MODIS",
    area: "India",
    totalReceived: 3,
    events: [
      {
        id: "evt-j-1",
        lat: 22.4707,
        lon: 70.0577,
        frp: 210.0,
        classification: "critical",
        confidence: 95,
        brightnessTempK: 520,
        closestZoneId: "IND-JAM-01",
        timestamp: new Date(now - 2.5 * dayMs).toISOString()
      },
      {
        id: "evt-j-2",
        lat: 22.4710,
        lon: 70.0580,
        frp: 60.0,
        classification: "warning",
        confidence: 85,
        brightnessTempK: 390,
        closestZoneId: "IND-JAM-01",
        timestamp: new Date(now - 1.8 * dayMs).toISOString()
      },
      {
        id: "evt-j-3",
        lat: 22.4705,
        lon: 70.0575,
        frp: 18.0,
        classification: "safe",
        confidence: 70,
        brightnessTempK: 310,
        closestZoneId: "IND-JAM-01",
        timestamp: new Date(now - 1.0 * dayMs).toISOString()
      }
    ]
  };
  await storeFireEvents(batch2);

  // Batch 3: False positive isolated event
  await storeFireEvents([
    {
      id: "evt-fp-1",
      lat: 19.0760,
      lon: 72.8777,
      frp: 5.0,
      classification: "false_positive",
      confidence: 40,
      brightnessTempK: 300,
      timestamp: new Date(now - 5000).toISOString()
    }
  ]);

  // Batch 4: Old event (> 30 days) to test auto-prune
  await storeFireEvents([
    {
      id: "evt-old-1",
      lat: 10.0,
      lon: 10.0,
      frp: 50.0,
      classification: "warning",
      confidence: 80,
      brightnessTempK: 350,
      timestamp: new Date(now - 35 * dayMs).toISOString()
    }
  ]);

  // 4. Verify auto-prune: evt-old-1 should have been pruned
  const historyAll = await getHistory({ limit: 100 });
  const hasOld = historyAll.some((e) => e.id === "evt-old-1");
  assert.strictEqual(hasOld, false, "Events older than 30 days must be pruned");
  assert.strictEqual(historyAll.length, 7, "Should have 7 unpruned events");

  // 5. Test getHistory filters
  console.log("-> Testing getHistory() filtering...");
  // Classification filter
  const critHistory = await getHistory({ classification: "critical" });
  assert.strictEqual(critHistory.length, 2);
  assert(critHistory.every((e) => e.classification === "critical"));

  // Geo radius search around Mundra
  const mundraHistory = await getHistory({
    lat: 22.8214,
    lon: 69.7088,
    radiusKm: 10
  });
  assert.strictEqual(mundraHistory.length, 3);
  assert(mundraHistory.every((e) => e.distanceKm <= 10));

  // Date range filter
  const rangeHistory = await getHistory({
    startDate: new Date(now - 2.2 * dayMs).toISOString(),
    endDate: new Date(now - 0.5 * dayMs).toISOString()
  });
  assert(rangeHistory.length >= 3);

  // 6. Test getEventProgression
  console.log("-> Testing getEventProgression()...");
  // Mundra: should be 'escalating'
  const mundraProg = await getEventProgression(22.8214, 69.7088, 5, 7);
  assert.strictEqual(mundraProg.events.length, 3);
  assert.strictEqual(mundraProg.trend, "escalating");
  assert.strictEqual(mundraProg.peakFrp, 342.6);
  assert(mundraProg.firstSeen != null);
  assert(mundraProg.lastSeen != null);

  // Jamnagar: should be 'declining'
  const jamProg = await getEventProgression(22.4707, 70.0577, 5, 7);
  assert.strictEqual(jamProg.events.length, 3);
  assert.strictEqual(jamProg.trend, "declining");
  assert.strictEqual(jamProg.peakFrp, 210.0);

  // Non-existent location: 'new'
  const emptyProg = await getEventProgression(0, 0, 5, 7);
  assert.strictEqual(emptyProg.events.length, 0);
  assert.strictEqual(emptyProg.trend, "new");
  assert.strictEqual(emptyProg.peakFrp, 0);

  // 7. Test getStats
  console.log("-> Testing getStats()...");
  const stats = await getStats();
  assert.strictEqual(stats.totalEvents, 7);
  assert.strictEqual(stats.byClassification.critical, 2);
  assert.strictEqual(stats.byClassification.warning, 2);
  assert.strictEqual(stats.byClassification.safe, 2);
  assert.strictEqual(stats.byClassification.false_positive, 1);
  assert(stats.oldestEvent != null);
  assert(stats.newestEvent != null);
  assert(Array.isArray(stats.topHotspots));
  assert(stats.topHotspots.length >= 2);
  assert.strictEqual(stats.topHotspots[0].count, 3); // Mundra or Jamnagar

  // 8. Test generateBacktestScenarios
  console.log("-> Testing generateBacktestScenarios()...");
  const scenarios = await generateBacktestScenarios();
  assert(Array.isArray(scenarios));
  assert(scenarios.length >= 1 && scenarios.length <= 5);

  const mundraScenario = scenarios.find((s) => s.name.includes("Mundra"));
  assert(mundraScenario, "Mundra escalating cluster should be selected as a backtest scenario");
  assert(mundraScenario.id.startsWith("scenario-"));
  assert.strictEqual(mundraScenario.timeline.length, 3);
  assert.strictEqual(mundraScenario.peakFrp, 342.6);
  assert(typeof mundraScenario.duration === "string");
  assert(mundraScenario.location.lat != null && mundraScenario.location.lon != null);

  // 9. Test concurrent thread-safe writes
  console.log("-> Testing concurrent writes...");
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      storeFireEvents([
        {
          id: `concurrent-${i}`,
          lat: 20 + i * 0.01,
          lon: 70 + i * 0.01,
          frp: 10 + i,
          classification: "safe",
          confidence: 70,
          brightnessTempK: 310,
          timestamp: new Date().toISOString()
        }
      ])
    );
  }
  await Promise.all(promises);

  const postConcurrentStats = await getStats();
  assert.strictEqual(postConcurrentStats.totalEvents, 17);

  console.log("\nALL TESTS PASSED SUCCESSFULLY! ✓");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
