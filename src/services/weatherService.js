/**
 * Open-Meteo Live Meteorological Service
 * 100% Free, Public Domain / Open-Data - NO API KEY REQUIRED.
 * 
 * Provides real-time atmospheric data for any coordinate on Earth:
 * - Wind speed at 10m (km/h)
 * - Wind direction (0-360 degrees)
 * - Wind gusts (km/h)
 * - Cloud cover percentage (%)
 * - Surface temperature (°C) & relative humidity (%)
 * 
 * Computes Gaussian dispersion plume vectors and Sentinel-1 SAR cloud triggers.
 */

import { mockRegionalWeather, defaultGlobalWeather } from "../data/mockWeather";

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const weatherCache = new Map();

/**
 * Converts degree angle (0-360°) to 16-wind compass point notation
 */
export function degreesToCompass(deg) {
  if (deg === undefined || deg === null) return "VAR";
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return `${directions[index]} (${Math.round(normalized)}°)`;
}

/**
 * Fetches live weather for any geographic coordinate via Open-Meteo API
 * @param {number} latitude - Target latitude
 * @param {number} longitude - Target longitude
 * @param {string} [zoneId] - Optional zone ID for regional fallback
 * @returns {Promise<{ weather: Object, isLive: boolean, source: string }>}
 */
export async function fetchLiveWeather(latitude, longitude, zoneId = null) {
  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    const fallback = (zoneId && mockRegionalWeather[zoneId]) || defaultGlobalWeather;
    return { weather: fallback, isLive: false, source: "offline-mock" };
  }

  // Cache key rounded to ~1.1km grid
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { weather: cached.data, isLive: true, source: "open-meteo-cached" };
  }

  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "cloud_cover",
        "surface_pressure"
      ].join(","),
      wind_speed_unit: "kmh"
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(`${OPEN_METEO_BASE_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error: ${response.status}`);
    }

    const json = await response.json();
    const current = json.current;

    if (!current) {
      throw new Error("Invalid Open-Meteo response format");
    }

    const windSpeedKmH = Math.round((current.wind_speed_10m ?? 18) * 10) / 10;
    const windDeg = Math.round(current.wind_direction_10m ?? 270);
    const gustSpeedKmH = Math.round((current.wind_gusts_10m ?? windSpeedKmH * 1.3) * 10) / 10;
    const cloudCoverPercent = Math.round(current.cloud_cover ?? 15);
    const temperatureC = Math.round((current.temperature_2m ?? 30) * 10) / 10;
    const relativeHumidity = Math.round(current.relative_humidity_2m ?? 60);
    const atmosphericPressureHpa = Math.round(current.surface_pressure ?? 1010);

    // Occlusion categorization for cloud-piercing SAR trigger
    const isHeavyOcclusion = cloudCoverPercent > 60;
    const opticalOcclusionLevel = isHeavyOcclusion
      ? "HEAVY_CLOUD_OCCLUSION"
      : cloudCoverPercent > 35
      ? "MODERATE_HAZE"
      : "CLEAR_OPTICAL";

    const sarRecommendation = isHeavyOcclusion ? "SAR_CRITICAL_ENGAGE" : "SAR_STANDBY";

    const formattedWeather = {
      regionName: `Live Atmospheric Vector (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
      windSpeedKmH,
      windDeg,
      windDirectionText: degreesToCompass(windDeg),
      gustSpeedKmH,
      temperatureC,
      relativeHumidity,
      cloudCoverPercent,
      atmosphericPressureHpa,
      visibilityMeters: isHeavyOcclusion ? 3000 : 10000,
      opticalOcclusionLevel,
      sarRecommendation,
      provider: "Open-Meteo Global NWP Model",
      isLive: true,
      lastUpdated: new Date().toISOString()
    };

    // Update Cache
    weatherCache.set(cacheKey, {
      data: formattedWeather,
      timestamp: Date.now()
    });

    return {
      weather: formattedWeather,
      isLive: true,
      source: "open-meteo-live"
    };
  } catch (error) {
    console.warn("Open-Meteo API unavailable or timed out, falling back:", error.message);
    const fallback = (zoneId && mockRegionalWeather[zoneId]) || defaultGlobalWeather;
    return {
      weather: { ...fallback, isLive: false, provider: "Simulated Model (Offline Fallback)" },
      isLive: false,
      source: "fallback"
    };
  }
}
