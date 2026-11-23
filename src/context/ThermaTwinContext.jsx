import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { mockHotspots } from "../data/mockHotspots";
import { mockIndustrialZones } from "../data/mockIndustrialZones";
import { mockRegionalWeather, defaultGlobalWeather } from "../data/mockWeather";
import { mockSimulationScenarios } from "../data/mockSimulationScenarios";
import { fetchLiveHotspots, dispatchERSSWebhook } from "../services/api";
import { fetchLiveFirmsData, checkNasaKeyStatus, setNasaKeyOnServer, clearNasaKeyOnServer } from "../services/firmsService";
import { fetchLiveWeather } from "../services/weatherService";
import { fetchLiveOsmIndustrialZones } from "../services/osmService";
import { worldCountries } from "../data/worldCountries";

const ThermaTwinContext = createContext(null);

export function ThermaTwinProvider({ children }) {
  // Hotspot & Geospatial State
  const [hotspots, setHotspots] = useState(mockHotspots);
  const [selectedHotspotId, setSelectedHotspotId] = useState("FIRMS-MUN-8821"); // Start focused on critical anomaly
  const [industrialZones, setIndustrialZones] = useState(mockIndustrialZones);
  const [isWeatherLive, setIsWeatherLive] = useState(false);
  const [isOsmLive, setIsOsmLive] = useState(false);
  const [isOsmLoading, setIsOsmLoading] = useState(false);
  const [lastOsmSyncTime, setLastOsmSyncTime] = useState(null);

  // Map Camera State - Initialized to Global World Perspective
  const [mapCenter, setMapCenter] = useState([20, 10]); // Global overview
  const [mapZoom, setMapZoom] = useState(2);
  const [selectedCountry, setSelectedCountry] = useState(null); // Selected country object or null

  // Active Layer Toggles
  const [activeLayers, setActiveLayers] = useState({
    firms: true,
    osm: true,
    plumes: true,
    sar: false, // SAR mode can be toggled manually or triggered by weather
    heatmap: false,
    windVectors: true
  });

  // Baselayer style: 'satellite' | 'dark' | 'osm' (defaults to True Color Satellite matching NASA FIRMS)
  const [baseLayer, setBaseLayer] = useState("satellite");

  // Regional & Global Weather
  const [currentWeather, setCurrentWeather] = useState(defaultGlobalWeather);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'critical' | 'warning' | 'safe' | 'dispatched'
  const [searchQuery, setSearchQuery] = useState("");

  // ERSS-112 Webhook Dispatch State
  const [dispatchedHotspotIds, setDispatchedHotspotIds] = useState(new Set());
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchingHotspot, setDispatchingHotspot] = useState(null);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);

  // Historical Backtesting Simulation Modal
  const [isBacktestingOpen, setIsBacktestingOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState(mockSimulationScenarios[0]);
  const [scenarioStepIndex, setScenarioStepIndex] = useState(3); // Start at T-0h (Current)

  // Side Menu Panel (Simulation, Search, NASA Live)
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const openSideMenu = () => setIsSideMenuOpen(true);
  const closeSideMenu = () => setIsSideMenuOpen(false);
  const toggleSideMenu = () => setIsSideMenuOpen((prev) => !prev);

  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("thermatwin_theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("thermatwin_theme", next);
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // System & API Connectivity Status
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Toast Notification System
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = "info", duration = 4500) => {
    setToast({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, duration);
  };

  // Selected hotspot entity
  const selectedHotspot = useMemo(() => {
    return hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0];
  }, [hotspots, selectedHotspotId]);

  // Sync live Open-Meteo weather whenever selected hotspot changes
  useEffect(() => {
    if (!selectedHotspot) return;

    let isMounted = true;
    const updateWeather = async () => {
      // 1. Immediate regional baseline/cache display
      if (selectedHotspot.zoneId && mockRegionalWeather[selectedHotspot.zoneId]) {
        setCurrentWeather(mockRegionalWeather[selectedHotspot.zoneId]);
      }

      // 2. Query live Open-Meteo API for real-time wind speed, direction, gusts, and clouds (Zero API Key needed)
      const res = await fetchLiveWeather(
        selectedHotspot.latitude,
        selectedHotspot.longitude,
        selectedHotspot.zoneId
      );

      if (!isMounted) return;

      if (res && res.weather) {
        setCurrentWeather(res.weather);
        setIsWeatherLive(res.isLive);

        // Auto-suggest SAR radar mode if live cloud/smoke occlusion is heavy (>60%)
        if (res.weather.opticalOcclusionLevel === "HEAVY_CLOUD_OCCLUSION" && !activeLayers.sar) {
          showToast(
            "Cloud-Piercing SAR Trigger",
            `Heavy live cloud occlusion (${res.weather.cloudCoverPercent}%) at ${selectedHotspot.facilityName}. Sentinel-1 SAR synthetic radar recommended.`,
            "alert"
          );
        }
      }
    };

    updateWeather();

    return () => {
      isMounted = false;
    };
  }, [selectedHotspotId, selectedHotspot?.latitude, selectedHotspot?.longitude]);

  // Merge newly discovered live OpenStreetMap industrial zones without duplicates
  const mergeOsmZones = (newZones) => {
    if (!newZones || newZones.length === 0) return 0;
    let addedCount = 0;
    setIndustrialZones((prev) => {
      const existingIds = new Set(prev.map((z) => z.id));
      const filteredNew = newZones.filter((z) => !existingIds.has(z.id));
      addedCount = filteredNew.length;
      if (filteredNew.length === 0) return prev;
      return [...prev, ...filteredNew];
    });
    return addedCount;
  };

  // Fetch live OSM industrial zones around coordinates via Overpass API
  const fetchLiveOsmForLocation = async (lat, lon, radiusKm = 25, countryCode = null) => {
    setIsOsmLoading(true);
    try {
      const result = await fetchLiveOsmIndustrialZones(lat, lon, radiusKm, countryCode);
      if (result.isLive && result.zones.length > 0) {
        const added = mergeOsmZones(result.zones);
        setIsOsmLive(true);
        setLastOsmSyncTime(new Date());
        showToast(
          "Live OpenStreetMap Ingestion",
          `Retrieved ${result.zones.length} industrial facilities (${added} new) via Overpass API.`,
          "info"
        );
        return result.zones;
      }
    } catch (e) {
      console.warn("OSM Fetch failed:", e);
    } finally {
      setIsOsmLoading(false);
    }
    return [];
  };

  // Scan live OSM industrial polygons for the current perspective / active incident
  const scanLiveOsmForCurrentView = async () => {
    if (selectedCountry) {
      const [lat, lon] = selectedCountry.center;
      return await fetchLiveOsmForLocation(lat, lon, 35, selectedCountry.code);
    }
    if (selectedHotspot) {
      return await fetchLiveOsmForLocation(
        selectedHotspot.latitude,
        selectedHotspot.longitude,
        25,
        selectedHotspot.countryCode || "IN"
      );
    }
    return await fetchLiveOsmForLocation(mapCenter[0], mapCenter[1], 30);
  };

  // NASA FIRMS Key Status (key is stored SERVER-SIDE, never in browser)
  const [isNasaKeyConfigured, setIsNasaKeyConfigured] = useState(false);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Check if backend has a NASA key configured on mount
  useEffect(() => {
    checkNasaKeyStatus().then((status) => {
      setIsNasaKeyConfigured(status.configured);
    });
  }, []);

  // Send NASA MAP_KEY to the backend for secure storage, then fetch live data
  const updateNasaMapKey = async (key, area = "world", source = "VIIRS_NOAA20_NRT", dayRange = 2) => {
    // Step 1: Send key to backend (it stays there, never returns to frontend)
    await setNasaKeyOnServer(key);
    setIsNasaKeyConfigured(true);

    // Step 2: Fetch live data through the backend proxy (key is used server-side)
    const liveHotspots = await fetchLiveFirmsData(area, dayRange, source);

    if (liveHotspots && liveHotspots.length > 0) {
      setHotspots(liveHotspots);
      setSelectedHotspotId(liveHotspots[0].id);
      if (area === "world") {
        setMapCenter([20, 10]);
        setMapZoom(2);
      } else {
        setMapCenter([liveHotspots[0].latitude, liveHotspots[0].longitude]);
        setMapZoom(5);
      }
      setLastSyncTime(new Date());
    }
    return liveHotspots;
  };

  const fitWorldView = () => {
    setSelectedCountry(null);
    setMapCenter([20, 10]);
    setMapZoom(2);
  };

  const selectCountry = (country) => {
    if (!country) {
      resetCountry();
      return;
    }
    setSelectedCountry(country);
    setMapCenter(country.center);
    setMapZoom(country.zoom);

    const zonesInCountry = industrialZones.filter(
      (z) => z.countryCode === country.code
    );

    const targetHotspot = hotspots.find((h) =>
      zonesInCountry.some((z) => z.id === h.zoneId)
    );

    if (targetHotspot) {
      setSelectedHotspotId(targetHotspot.id);
    }

    // Automatically trigger Overpass live industrial polygon query for the selected country center
    fetchLiveOsmForLocation(country.center[0], country.center[1], 45, country.code);

    showToast(
      `${country.flag} ${country.name} Selected`,
      zonesInCountry.length > 0
        ? `Focusing ${zonesInCountry.length} industrial complex${zonesInCountry.length > 1 ? "es" : ""} & facilities.`
        : `Surveillance active for ${country.name}. Global satellite layer monitoring.`,
      "info"
    );
  };

  const resetCountry = () => {
    setSelectedCountry(null);
    setMapCenter([20, 10]);
    setMapZoom(2);
    showToast("Global World View", "Showing all monitored industrial hotspots worldwide.", "info");
  };

  const countryIndustrialZones = useMemo(() => {
    if (!selectedCountry) return [];
    return industrialZones.filter((z) => z.countryCode === selectedCountry.code);
  }, [selectedCountry, industrialZones]);

  const clearNasaMapKey = () => {
    clearNasaKeyOnServer();
    setIsNasaKeyConfigured(false);
    setHotspots(mockHotspots);
    setSelectedHotspotId("FIRMS-MUN-8821");
    setSelectedCountry(null);
    setMapCenter([20, 10]);
    setMapZoom(2);
  };

  // Central fetchHotspots function — uses backend proxy (key stays server-side)
  const fetchHotspots = async () => {
    if (isNasaKeyConfigured) {
      try {
        const liveHotspots = await fetchLiveFirmsData("world", 2);
        if (liveHotspots && liveHotspots.length > 0) {
          setHotspots(liveHotspots);
          setLastSyncTime(new Date());
          showToast("NASA FIRMS Global Feed", `Synced ${liveHotspots.length} live satellite detections worldwide`, "success");
          return;
        }
      } catch (err) {
        console.warn("Backend NASA FIRMS fetch error, falling back to baseline:", err);
      }
    }

    // Fallback: Check backend /api/v1/hotspots/live or local baseline
    const response = await fetchLiveHotspots();
    if (response.isLive && response.data?.hotspots) {
      setHotspots(response.data.hotspots);
      setIsBackendLive(true);
    } else {
      setIsBackendLive(false);
      setHotspots(mockHotspots);
    }
    setLastSyncTime(new Date());
  };

  // Initial data load and periodic satellite tick
  useEffect(() => {
    fetchHotspots();
    const interval = setInterval(fetchHotspots, 60000);
    return () => clearInterval(interval);
  }, [isNasaKeyConfigured]);

  // Filtered hotspots based on search and status tabs
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.id.toLowerCase().includes(searchQuery.toLowerCase());

      const isDispatched = dispatchedHotspotIds.has(h.id);

      if (!matchesSearch) return false;

      if (statusFilter === "dispatched") return isDispatched;
      if (statusFilter === "all") return true;
      return h.status === statusFilter;
    });
  }, [hotspots, searchQuery, statusFilter, dispatchedHotspotIds]);

  // Top Metrics Calculation — now uses real classification data from backend
  const metrics = useMemo(() => {
    const total = hotspots.length;
    const critical = hotspots.filter((h) => h.status === "critical").length;
    const warning = hotspots.filter((h) => h.status === "warning").length;
    const safe = hotspots.filter((h) => h.status === "safe").length;
    const falsePositive = hotspots.filter((h) => h.classification === "false_positive").length;
    const dispatched = dispatchedHotspotIds.size;

    // Real false-positive filtering: safe routine flares + classified false positives
    const filtered = safe + falsePositive;
    const filterRate = total > 0 ? ((filtered / total) * 100).toFixed(1) : "0.0";

    return {
      totalActiveHotspots: total,
      monitoredIndustrialSites: industrialZones.length,
      verifiedCriticalFires: critical,
      runawayRisks: warning,
      safeRoutineFlares: safe,
      dispatchedCount: dispatched,
      falsePositivesFiltered: filtered,
      filteringEfficiency: filterRate + "%"
    };
  }, [hotspots, industrialZones, dispatchedHotspotIds]);

  // Toggle specific map layer
  const toggleLayer = (layerKey) => {
    setActiveLayers((prev) => {
      const next = { ...prev, [layerKey]: !prev[layerKey] };
      if (layerKey === "sar" && next.sar) {
        showToast("SAR Mode Engaged", "Sentinel-1 Synthetic Radar Backscatter overlay activated.", "info");
      }
      return next;
    });
  };

  // Fly to incident coordinates
  const flyToIncident = (lat, lng, zoom = 14) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
  };

  // Open ERSS-112 Dispatch Modal
  const openDispatchModal = (hotspot = selectedHotspot) => {
    setDispatchingHotspot(hotspot);
    setIsDispatchModalOpen(true);
  };

  // Execute ERSS-112 Webhook Dispatch
  const executeERSSDispatch = async (hotspotToDispatch) => {
    const target = hotspotToDispatch || dispatchingHotspot || selectedHotspot;
    if (!target) return;

    setIsDispatchLoading(true);

    const payload = {
      incidentId: target.id,
      incidentName: target.name,
      facilityName: target.facilityName,
      coordinates: [target.latitude, target.longitude],
      frpMegawatts: target.frp,
      frpDeviationPercent: target.frpDeviation,
      aiConfidenceScore: target.confidence,
      threatClassification: target.status,
      toxicGasType: target.plume?.toxicGas || "Volatile Organic Compounds",
      projectedEvacuationRadiusKm: target.plume?.projectedLengthKm || 3.5,
      estimatedAtRiskPopulation: target.plume?.affectedPopulationEst || 5000,
      timestampUtc: new Date().toISOString(),
      dispatchedByRole: "National Disaster Response Force (NDRF Duty Officer)"
    };

    try {
      const result = await dispatchERSSWebhook(payload);

      setDispatchedHotspotIds((prev) => new Set([...prev, target.id]));

      const historyEntry = {
        ...payload,
        ticketId: result.data.ticketId,
        responders: result.data.respondersNotified,
        dispatchedAt: new Date().toLocaleTimeString(),
        status: "DISPATCHED_ACTIVE"
      };

      setDispatchHistory((prev) => [historyEntry, ...prev]);

      showToast(
        "ERSS-112 Dispatched!",
        `Emergency Ticket #${result.data.ticketId} issued to NDRF & SDRF for ${target.facilityName}. Units mobilized.`,
        "success",
        6000
      );

      setIsDispatchModalOpen(false);
    } catch (err) {
      showToast("Dispatch Failed", err.message, "error");
    } finally {
      setIsDispatchLoading(false);
    }
  };

  // Apply Backtesting Simulation Step to Active Hotspot
  const applySimulationStep = (scenario, stepIndex) => {
    setActiveScenario(scenario);
    setScenarioStepIndex(stepIndex);

    const stepData = scenario.timeline[stepIndex];
    if (!stepData) return;

    // Update the corresponding hotspot in real time to visualize progression
    setHotspots((prev) =>
      prev.map((h) => {
        if (h.id === scenario.targetHotspotId) {
          return {
            ...h,
            frp: stepData.frp,
            frpDeviation: parseFloat(stepData.frpDeviation.replace(/[+%]/g, "")),
            status: stepData.status,
            statusLabel: stepData.statusLabel,
            confidence: stepData.status === "critical" ? 98.4 : stepData.status === "warning" ? 89.2 : 99.1
          };
        }
        return h;
      })
    );

    // Auto-focus on simulated incident
    const target = hotspots.find((h) => h.id === scenario.targetHotspotId);
    if (target) {
      flyToIncident(target.latitude, target.longitude, 14);
      setSelectedHotspotId(target.id);
    }
  };

  return (
    <ThermaTwinContext.Provider
      value={{
        hotspots,
        filteredHotspots,
        selectedHotspot,
        selectedHotspotId,
        setSelectedHotspotId,
        industrialZones,
        activeLayers,
        toggleLayer,
        baseLayer,
        setBaseLayer,
        mapCenter,
        mapZoom,
        selectedCountry,
        selectCountry,
        resetCountry,
        countryIndustrialZones,
        worldCountries,
        flyToIncident,
        fitWorldView,
        currentWeather,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        dispatchedHotspotIds,
        dispatchHistory,
        isDispatchModalOpen,
        dispatchingHotspot,
        isDispatchLoading,
        openDispatchModal,
        closeDispatchModal: () => setIsDispatchModalOpen(false),
        executeERSSDispatch,
        isBacktestingOpen,
        openBacktestingModal: () => setIsBacktestingOpen(true),
        closeBacktestingModal: () => setIsBacktestingOpen(false),
        activeScenario,
        scenarioStepIndex,
        applySimulationStep,
        isSideMenuOpen,
        openSideMenu,
        closeSideMenu,
        toggleSideMenu,
        isBackendLive,
        lastSyncTime,
        isWeatherLive,
        isOsmLive,
        isOsmLoading,
        lastOsmSyncTime,
        fetchLiveOsmForLocation,
        scanLiveOsmForCurrentView,
        mergeOsmZones,
        metrics,
        toast,
        showToast,
        theme,
        setTheme,
        toggleTheme,
        updateNasaMapKey,
        clearNasaMapKey,
        isNasaKeyConfigured,
        isApiKeyModalOpen,
        openApiKeyModal: () => setIsApiKeyModalOpen(true),
        closeApiKeyModal: () => setIsApiKeyModalOpen(false),
        fetchHotspots
      }}
    >
      {children}
    </ThermaTwinContext.Provider>
  );
}

export function useThermaTwin() {
  const context = useContext(ThermaTwinContext);
  if (!context) {
    throw new Error("useThermaTwin must be used within a ThermaTwinProvider");
  }
  return context;
}
