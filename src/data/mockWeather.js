// Live & Mock Meteorological Data (OpenWeatherMap-compatible vector models)
// Crucial for real-time downwind toxic plume dispersion modeling & SAR radar trigger

export const mockRegionalWeather = {
  "IND-JAMNAGAR-01": {
    regionName: "Jamnagar Industrial Belt, Gujarat",
    windSpeedKmH: 18.5,
    windDeg: 245, // South-West
    windDirectionText: "SW (245°)",
    gustSpeedKmH: 26.0,
    temperatureC: 34.2,
    relativeHumidity: 64,
    cloudCoverPercent: 12,
    atmosphericPressureHpa: 1008,
    visibilityMeters: 10000,
    opticalOcclusionLevel: "CLEAR_OPTICAL",
    sarRecommendation: "SAR_STANDBY"
  },
  "IND-VIZAG-02": {
    regionName: "Visakhapatnam Industrial Corridor, AP",
    windSpeedKmH: 26.4,
    windDeg: 115, // East-South-East (blowing Inland toward residential areas)
    windDirectionText: "ESE (115°)",
    gustSpeedKmH: 38.2,
    temperatureC: 31.8,
    relativeHumidity: 92,
    cloudCoverPercent: 88, // Heavy monsoon cloud cover!
    atmosphericPressureHpa: 998,
    visibilityMeters: 2800,
    opticalOcclusionLevel: "HEAVY_CLOUD_OCCLUSION",
    sarRecommendation: "SAR_CRITICAL_ENGAGE"
  },
  "IND-MUNDRA-03": {
    regionName: "Mundra Port & SEZ, Kutch",
    windSpeedKmH: 22.8,
    windDeg: 280, // West
    windDirectionText: "W (280°)",
    gustSpeedKmH: 32.5,
    temperatureC: 36.1,
    relativeHumidity: 52,
    cloudCoverPercent: 18,
    atmosphericPressureHpa: 1006,
    visibilityMeters: 9500,
    opticalOcclusionLevel: "CLEAR_OPTICAL",
    sarRecommendation: "SAR_STANDBY"
  },
  "IND-HAZIRA-04": {
    regionName: "Hazira Gas Processing Belt, Surat",
    windSpeedKmH: 16.2,
    windDeg: 210, // South-South-West
    windDirectionText: "SSW (210°)",
    gustSpeedKmH: 22.0,
    temperatureC: 33.5,
    relativeHumidity: 78,
    cloudCoverPercent: 35,
    atmosphericPressureHpa: 1010,
    visibilityMeters: 8000,
    opticalOcclusionLevel: "MODERATE_HAZE",
    sarRecommendation: "SAR_STANDBY"
  },
  "IND-MANALI-05": {
    regionName: "Manali Petrochemical Corridor, Chennai",
    windSpeedKmH: 15.0,
    windDeg: 45, // North-East
    windDirectionText: "NE (45°)",
    gustSpeedKmH: 24.1,
    temperatureC: 32.0,
    relativeHumidity: 84,
    cloudCoverPercent: 74, // High smoke & cloud occlusion
    atmosphericPressureHpa: 1004,
    visibilityMeters: 4200,
    opticalOcclusionLevel: "DENSE_SMOKE_CLOUD",
    sarRecommendation: "SAR_CRITICAL_ENGAGE"
  },
  "IND-DAHEJ-06": {
    regionName: "Dahej PCPIR Hub, Bharuch",
    windSpeedKmH: 19.4,
    windDeg: 230, // South-West
    windDirectionText: "SW (230°)",
    gustSpeedKmH: 28.3,
    temperatureC: 35.0,
    relativeHumidity: 70,
    cloudCoverPercent: 22,
    atmosphericPressureHpa: 1009,
    visibilityMeters: 9000,
    opticalOcclusionLevel: "CLEAR_OPTICAL",
    sarRecommendation: "SAR_STANDBY"
  }
};

export const defaultGlobalWeather = mockRegionalWeather["IND-MUNDRA-03"];
