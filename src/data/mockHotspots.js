// NASA FIRMS Thermal Anomaly Feed with AI Classification, FRP Deviation & SHAP Factors

export const mockHotspots = [
  {
    id: "FIRMS-MUN-8821",
    name: "Mundra Hydrocarbon Storage Tank Farm Fire",
    facilityName: "Mundra Liquid Terminal 2",
    zoneId: "IND-MUNDRA-03",
    status: "critical",
    statusLabel: "Critical Industrial Fire Anomaly",
    latitude: 22.8214,
    longitude: 69.7088,
    frp: 342.6, // Fire Radiative Power in MW
    baselineFrp: 28.5,
    frpDeviation: 1102.1, // +1102% over baseline
    brightnessTempK: 546.8,
    brightnessTempC: 273.6,
    satellite: "NOAA-20 VIIRS (375m)",
    satellitePassTime: "2026-09-03 21:38:12 UTC",
    confidence: 98.4,
    scanTime: "4 mins ago",
    daynight: "Night",
    zoneCategory: "Bulk Liquid Hydrocarbon Storage",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_4_CATASTROPHIC",
    shapFactors: [
      {
        feature: "FRP Surge > 99.8th Historical Baseline",
        contribution: 0.38,
        percentText: "+38%",
        impact: "risk_elevating",
        desc: "FRP jumped from 28.5 MW baseline to 342.6 MW within 45 minutes"
      },
      {
        feature: "Inside OSM Heavy Industrial Zone",
        contribution: 0.27,
        percentText: "+27%",
        impact: "risk_elevating",
        desc: "Location verified within OSM polygon 'man_made=works' (Chemical terminal)"
      },
      {
        feature: "Near Cryogenic Storage Spheres (<300m)",
        contribution: 0.19,
        percentText: "+19%",
        impact: "risk_elevating",
        desc: "Severe domino-effect risk to adjacent pressurized butane/propane spheres"
      },
      {
        feature: "High Wind Shear Dispersion Factor",
        contribution: 0.12,
        percentText: "+12%",
        impact: "risk_elevating",
        desc: "22.8 km/h westerly wind rapidly carrying toxic combustion plume toward port docks"
      },
      {
        feature: "Absence of Registered Flare Stack",
        contribution: 0.08,
        percentText: "+8%",
        impact: "risk_elevating",
        desc: "No registered flaring permit at Tank Cluster #4 (indicates uncontrolled blaze)"
      }
    ],
    plume: {
      active: true,
      threatClass: "IDLH_RED",
      toxicGas: "Benzene, Sulfur Dioxide (SO2) & Dense Black Carbon",
      affectedPopulationEst: 14200,
      projectedLengthKm: 8.4,
      spreadAngleDeg: 34,
      windDeg: 280,
      windSpeedKmH: 22.8
    }
  },
  {
    id: "FIRMS-VIZ-4419",
    name: "Vizag Polymer Tank Farm Thermal Runaway",
    facilityName: "Autonagar Chemical Processing Plant B",
    zoneId: "IND-VIZAG-02",
    status: "warning",
    statusLabel: "Pre-Ignition Thermal Runaway Risk",
    latitude: 17.7052,
    longitude: 83.2140,
    frp: 68.4,
    baselineFrp: 14.2,
    frpDeviation: 381.7, // +381.7% surge
    brightnessTempK: 394.2,
    brightnessTempC: 121.0,
    satellite: "Sentinel-1 SAR / Suomi NPP VIIRS",
    satellitePassTime: "2026-09-03 21:22:45 UTC",
    confidence: 89.2,
    scanTime: "18 mins ago",
    daynight: "Night",
    zoneCategory: "Special Chemical & Monomer Synthesis",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_2_PRE_IGNITION",
    shapFactors: [
      {
        feature: "Steady Surface Temperature Climb",
        contribution: 0.34,
        percentText: "+34%",
        impact: "risk_elevating",
        desc: "Exothermic heat signature increasing at +6.8°C/hr without open combustion"
      },
      {
        feature: "Heavy Monsoon Cloud Cover (88%)",
        contribution: 0.22,
        percentText: "+22%",
        impact: "risk_elevating",
        desc: "Optical satellite blinded; confirmed via Sentinel-1 SAR radar backscatter jump"
      },
      {
        feature: "Close Proximity to Residential Boundary",
        contribution: 0.21,
        percentText: "+21%",
        impact: "risk_elevating",
        desc: "Within 1.4 km of dense urban settlements (Gopalapatnam / Simhachalam)"
      },
      {
        feature: "Styrene Polymerization Risk Profile",
        contribution: 0.16,
        percentText: "+16%",
        impact: "risk_elevating",
        desc: "Thermal profile matches uncontrolled auto-polymerization of styrene monomer"
      },
      {
        feature: "Low Baseline Flaring Tag",
        contribution: -0.07,
        percentText: "-7%",
        impact: "risk_mitigating",
        desc: "No active exhaust stack emissions detected on site"
      }
    ],
    plume: {
      active: true,
      threatClass: "EVACUATION_ORANGE",
      toxicGas: "Styrene Vapor & VOC Aerosols (Heavy Gas Inversion)",
      affectedPopulationEst: 28600,
      projectedLengthKm: 6.2,
      spreadAngleDeg: 28,
      windDeg: 115,
      windSpeedKmH: 26.4
    }
  },
  {
    id: "FIRMS-JAM-1024",
    name: "Jamnagar Refinery Main Flare Stack #4",
    facilityName: "Reliance Jamnagar Export Refinery",
    zoneId: "IND-JAMNAGAR-01",
    status: "safe",
    statusLabel: "Routine Persistent Flaring / Safe Baseline",
    latitude: 22.3812,
    longitude: 69.8624,
    frp: 46.2,
    baselineFrp: 44.8,
    frpDeviation: 3.1, // Only +3.1% normal operational fluctuation!
    brightnessTempK: 358.4,
    brightnessTempC: 85.2,
    satellite: "NOAA-20 VIIRS (375m)",
    satellitePassTime: "2026-09-03 21:15:00 UTC",
    confidence: 99.1,
    scanTime: "32 mins ago",
    daynight: "Night",
    zoneCategory: "Petroleum Refining (Operational Flare)",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "SAFE_OPERATIONAL",
    shapFactors: [
      {
        feature: "Tagged OSM Flare Stack Location",
        contribution: -0.42,
        percentText: "-42%",
        impact: "risk_mitigating",
        desc: "Exact GPS matches officially registered emergency elevated flare stack #4"
      },
      {
        feature: "Consistent Historical Baseline (90 Days)",
        contribution: -0.31,
        percentText: "-31%",
        impact: "risk_mitigating",
        desc: "FRP is within normal 1-sigma operational variance (42-48 MW) over 180 satellite passes"
      },
      {
        feature: "Continuous Nighttime Cycle Stability",
        contribution: -0.15,
        percentText: "-15%",
        impact: "risk_mitigating",
        desc: "No sudden thermal surge or expanding perimeter detected"
      },
      {
        feature: "High Absolute Heat Output",
        contribution: 0.12,
        percentText: "+12%",
        impact: "risk_elevating",
        desc: "Absolute FRP is >40 MW, but properly suppressed by baseline model"
      }
    ],
    plume: {
      active: false,
      threatClass: "NONE",
      toxicGas: "Permitted Combustion Effluent (Clean Flare)",
      affectedPopulationEst: 0,
      projectedLengthKm: 0,
      spreadAngleDeg: 0,
      windDeg: 245,
      windSpeedKmH: 18.5
    }
  },
  {
    id: "FIRMS-HAZ-3301",
    name: "Hazira Gas Separation Unit Elevated Flare",
    facilityName: "Hazira Petrochem Terminal C",
    zoneId: "IND-HAZIRA-04",
    status: "safe",
    statusLabel: "Routine Persistent Flaring / Safe Baseline",
    latitude: 21.1082,
    longitude: 72.6321,
    frp: 34.8,
    baselineFrp: 33.5,
    frpDeviation: 3.8,
    brightnessTempK: 345.1,
    brightnessTempC: 72.0,
    satellite: "Aqua MODIS (1km)",
    satellitePassTime: "2026-09-03 20:45:10 UTC",
    confidence: 96.5,
    scanTime: "55 mins ago",
    daynight: "Night",
    zoneCategory: "LNG & Gas Processing Hub",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "SAFE_OPERATIONAL",
    shapFactors: [
      {
        feature: "OSM Flare Stack Coordinates Match",
        contribution: -0.38,
        percentText: "-38%",
        impact: "risk_mitigating",
        desc: "Identified in OpenStreetMap industrial layer as operational flare"
      },
      {
        feature: "Deviation Below Anomaly Threshold",
        contribution: -0.28,
        percentText: "-28%",
        impact: "risk_mitigating",
        desc: "FRP deviation is +3.8%, well below the +65% alarm threshold"
      },
      {
        feature: "High Industrial Buffer Isolation",
        contribution: -0.14,
        percentText: "-14%",
        impact: "risk_mitigating",
        desc: "Site maintains 3 km designated safety isolation buffer zone"
      }
    ],
    plume: {
      active: false,
      threatClass: "NONE",
      toxicGas: "Permitted Flaring Gas",
      affectedPopulationEst: 0,
      projectedLengthKm: 0,
      spreadAngleDeg: 0,
      windDeg: 210,
      windSpeedKmH: 16.2
    }
  },
  {
    id: "FIRMS-MAN-7750",
    name: "Manali Petrochem Naphtha Header Rupture",
    facilityName: "CPCL Manali Refinery Section 4",
    zoneId: "IND-MANALI-05",
    status: "critical",
    statusLabel: "Critical Industrial Fire Anomaly",
    latitude: 13.1678,
    longitude: 80.2618,
    frp: 218.4,
    baselineFrp: 22.0,
    frpDeviation: 892.7, // +892% surge
    brightnessTempK: 489.2,
    brightnessTempC: 216.0,
    satellite: "Sentinel-1 SAR / NOAA-20 VIIRS",
    satellitePassTime: "2026-09-03 21:05:30 UTC",
    confidence: 97.8,
    scanTime: "12 mins ago",
    daynight: "Night",
    zoneCategory: "Aromatics & Naphtha Cracking",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_4_CATASTROPHIC",
    shapFactors: [
      {
        feature: "Massive FRP Spike in Non-Flare Sector",
        contribution: 0.41,
        percentText: "+41%",
        impact: "risk_elevating",
        desc: "High-intensity thermal source situated 800m away from authorized flare stacks"
      },
      {
        feature: "Cloud-Piercing SAR Backscatter Confirmed",
        contribution: 0.25,
        percentText: "+25%",
        impact: "risk_elevating",
        desc: "Sentinel-1 radar indicates +8.4 dB backscatter anomaly through smoke deck"
      },
      {
        feature: "Extreme Population Density Downwind",
        contribution: 0.20,
        percentText: "+20%",
        impact: "risk_elevating",
        desc: "Northeast wind dispersing toxic smoke toward Tiruvottiyur and Chennai urban belt"
      },
      {
        feature: "Volatile Hydrocarbon Storage Proximity",
        contribution: 0.14,
        percentText: "+14%",
        impact: "risk_elevating",
        desc: "Within 250m of pressurized aromatics and benzene distillation columns"
      }
    ],
    plume: {
      active: true,
      threatClass: "IDLH_RED",
      toxicGas: "Naphtha Combustion Gases, Carbon Monoxide & VOCs",
      affectedPopulationEst: 42000,
      projectedLengthKm: 7.8,
      spreadAngleDeg: 32,
      windDeg: 45,
      windSpeedKmH: 15.0
    }
  },
  {
    id: "FIRMS-DAH-6211",
    name: "Dahej Chemical Complex Reactor Exotherm",
    facilityName: "Dahej PCPIR Specialty Chemical Bay 7",
    zoneId: "IND-DAHEJ-06",
    status: "warning",
    statusLabel: "Pre-Ignition Thermal Runaway Risk",
    latitude: 21.7145,
    longitude: 72.5682,
    frp: 58.7,
    baselineFrp: 18.0,
    frpDeviation: 226.1, // +226% surge
    brightnessTempK: 378.6,
    brightnessTempC: 105.4,
    satellite: "NOAA-20 VIIRS (375m)",
    satellitePassTime: "2026-09-03 21:12:15 UTC",
    confidence: 86.5,
    scanTime: "24 mins ago",
    daynight: "Night",
    zoneCategory: "Specialty Organic Synthesis",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_2_PRE_IGNITION",
    shapFactors: [
      {
        feature: "Uncontrolled Exothermic Heat Rate",
        contribution: 0.32,
        percentText: "+32%",
        impact: "risk_elevating",
        desc: "Consistent non-ambient thermal accumulation in chemical reactor hall"
      },
      {
        feature: "Coastal Onshore Wind Trajectory",
        contribution: 0.18,
        percentText: "+18%",
        impact: "risk_elevating",
        desc: "Wind moving at 19.4 km/h blowing directly inland across industrial perimeter"
      },
      {
        feature: "Absence of Open Flare Stack Tag",
        contribution: 0.15,
        percentText: "+15%",
        impact: "risk_elevating",
        desc: "No active permitted discharge recorded in regulatory registry"
      },
      {
        feature: "Automated Nitrogen Quenching Standby",
        contribution: -0.09,
        percentText: "-9%",
        impact: "risk_mitigating",
        desc: "Facility equipped with automatic emergency inerting purge lines"
      }
    ],
    plume: {
      active: true,
      threatClass: "ADVISORY_YELLOW",
      toxicGas: "Chlorinated Organics & Acid Gas Byproducts",
      affectedPopulationEst: 8500,
      projectedLengthKm: 4.5,
      spreadAngleDeg: 24,
      windDeg: 230,
      windSpeedKmH: 19.4
    }
  },
  {
    id: "FIRMS-HOU-9012",
    name: "Houston Ship Channel Petrochem Olefins Alert",
    facilityName: "Houston Industrial Corridor Baytown Complex",
    zoneId: "USA-HOUSTON-01",
    status: "critical",
    statusLabel: "Critical Industrial Fire Anomaly",
    latitude: 29.7355,
    longitude: -95.1245,
    frp: 284.5,
    baselineFrp: 35.0,
    frpDeviation: 712.8,
    brightnessTempK: 512.4,
    brightnessTempC: 239.25,
    satellite: "NOAA-20 VIIRS (375m)",
    satellitePassTime: "2026-09-04 18:42:00 UTC",
    confidence: 97.6,
    scanTime: "8 mins ago",
    daynight: "Night",
    zoneCategory: "Olefins & Petrochemical Cracking",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_4_CATASTROPHIC",
    shapFactors: [
      {
        feature: "FRP Surge > 99.5th Percentile Baseline",
        contribution: 0.36,
        percentText: "+36%",
        impact: "risk_elevating",
        desc: "Thermal intensity 284.5 MW vs 35.0 MW operational baseline"
      },
      {
        feature: "Major Shipping Channel Proximity (<400m)",
        contribution: 0.28,
        percentText: "+28%",
        impact: "risk_elevating",
        desc: "Adjacent to key maritime transport lane and chemical docks"
      }
    ],
    plume: {
      active: true,
      threatClass: "IDLH_RED",
      toxicGas: "Ethylene, 1,3-Butadiene & Volatile Hydrocarbons",
      affectedPopulationEst: 35000,
      projectedLengthKm: 6.8,
      spreadAngleDeg: 28,
      windDeg: 140,
      windSpeedKmH: 24.5
    }
  },
  {
    id: "FIRMS-ROT-5541",
    name: "Rotterdam Maasvlakte Petrochemical Flare Surge",
    facilityName: "Port of Rotterdam Energy & Chemical Hub",
    zoneId: "EUR-ROTTERDAM-02",
    status: "warning",
    statusLabel: "Abnormal Flaring & Heat Surge",
    latitude: 51.9542,
    longitude: 4.0531,
    frp: 76.2,
    baselineFrp: 22.0,
    frpDeviation: 246.3,
    brightnessTempK: 405.6,
    brightnessTempC: 132.45,
    satellite: "Sentinel-1 SAR / NOAA-20 VIIRS",
    satellitePassTime: "2026-09-04 19:15:30 UTC",
    confidence: 91.8,
    scanTime: "14 mins ago",
    daynight: "Night",
    zoneCategory: "Crude Storage & Hydrogen Reforming",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_2_PRE_IGNITION",
    shapFactors: [
      {
        feature: "FRP Elevated Above Flare Envelope",
        contribution: 0.29,
        percentText: "+29%",
        impact: "risk_elevating",
        desc: "Observed 76.2 MW vs 22 MW permitted limit"
      }
    ],
    plume: {
      active: true,
      threatClass: "ADVISORY_YELLOW",
      toxicGas: "Sulfur Dioxide & Hydrocarbon Precursors",
      affectedPopulationEst: 12000,
      projectedLengthKm: 5.2,
      spreadAngleDeg: 22,
      windDeg: 260,
      windSpeedKmH: 31.0
    }
  },
  {
    id: "FIRMS-JUB-8819",
    name: "Jubail Industrial City Ethylene Anomaly",
    facilityName: "Jubail Petrochemical Complex Zone 3",
    zoneId: "ME-JUBAIL-03",
    status: "critical",
    statusLabel: "Critical Chemical Thermal Exotherm",
    latitude: 27.0142,
    longitude: 49.6582,
    frp: 318.0,
    baselineFrp: 40.0,
    frpDeviation: 695.0,
    brightnessTempK: 535.8,
    brightnessTempC: 262.65,
    satellite: "Suomi NPP VIIRS (375m)",
    satellitePassTime: "2026-09-04 19:50:10 UTC",
    confidence: 98.9,
    scanTime: "6 mins ago",
    daynight: "Night",
    zoneCategory: "Ethylene Glycol & Polyethylene Cracking",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_4_CATASTROPHIC",
    shapFactors: [
      {
        feature: "Severe Radiative Surge > 300 MW",
        contribution: 0.42,
        percentText: "+42%",
        impact: "risk_elevating",
        desc: "Extreme thermal signature indicative of open hydrocarbon manifold breach"
      }
    ],
    plume: {
      active: true,
      threatClass: "IDLH_RED",
      toxicGas: "Combustion Byproducts & Dense Soot Aerosol",
      affectedPopulationEst: 18000,
      projectedLengthKm: 9.1,
      spreadAngleDeg: 35,
      windDeg: 330,
      windSpeedKmH: 18.2
    }
  },
  {
    id: "FIRMS-SGP-1033",
    name: "Jurong Island Chemical Island Thermal Alert",
    facilityName: "Jurong Aromatics Complex Plant A",
    zoneId: "ASIA-JURONG-04",
    status: "warning",
    statusLabel: "Thermal Runaway Pre-Ignition",
    latitude: 1.2644,
    longitude: 103.7028,
    frp: 88.4,
    baselineFrp: 25.0,
    frpDeviation: 253.6,
    brightnessTempK: 418.2,
    brightnessTempC: 145.05,
    satellite: "NOAA-20 VIIRS (375m)",
    satellitePassTime: "2026-09-04 20:05:40 UTC",
    confidence: 93.4,
    scanTime: "11 mins ago",
    daynight: "Night",
    zoneCategory: "Aromatics, Benzene & Xylene Processing",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_3_HIGH_ALERT",
    shapFactors: [
      {
        feature: "Dense Multi-Facility Cluster Proximity",
        contribution: 0.31,
        percentText: "+31%",
        impact: "risk_elevating",
        desc: "Over 85 hazardous chemical units within 3km blast envelope"
      }
    ],
    plume: {
      active: true,
      threatClass: "ADVISORY_YELLOW",
      toxicGas: "Benzene Vapor & Toluene Traces",
      affectedPopulationEst: 9500,
      projectedLengthKm: 4.8,
      spreadAngleDeg: 25,
      windDeg: 75,
      windSpeedKmH: 14.0
    }
  },
  {
    id: "FIRMS-SAO-4412",
    name: "Cubatão Industrial Valley Thermal Exotherm",
    facilityName: "Cubatão Petrochemical Corridor",
    zoneId: "SA-CUBATAO-05",
    status: "critical",
    statusLabel: "Critical Industrial Fire Anomaly",
    latitude: -23.8912,
    longitude: -46.4255,
    frp: 224.0,
    baselineFrp: 20.0,
    frpDeviation: 1020.0,
    brightnessTempK: 495.2,
    brightnessTempC: 222.05,
    satellite: "NOAA-20 VIIRS (375m)",
    satellitePassTime: "2026-09-04 17:30:15 UTC",
    confidence: 96.2,
    scanTime: "21 mins ago",
    daynight: "Night",
    zoneCategory: "Nitrogen Fertilizers & Refineries",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_4_CATASTROPHIC",
    shapFactors: [
      {
        feature: "Valley Inversion Atmospheric Trapping",
        contribution: 0.35,
        percentText: "+35%",
        impact: "risk_elevating",
        desc: "Thermal inversion trapping toxic gases within coastal mountain basin"
      }
    ],
    plume: {
      active: true,
      threatClass: "IDLH_RED",
      toxicGas: "Nitrogen Oxides (NOx), Ammonia & Particulate Matter",
      affectedPopulationEst: 28000,
      projectedLengthKm: 6.2,
      spreadAngleDeg: 30,
      windDeg: 160,
      windSpeedKmH: 12.5
    }
  },
  {
    id: "FIRMS-SEC-7714",
    name: "Secunda Synthetic Fuels Complex Thermal Surge",
    facilityName: "Secunda Coal Liquefaction & Synfuels Unit",
    zoneId: "AFR-SECUNDA-06",
    status: "warning",
    statusLabel: "High-Energy Thermal Gas Flare",
    latitude: -26.5512,
    longitude: 29.1785,
    frp: 95.8,
    baselineFrp: 30.0,
    frpDeviation: 219.3,
    brightnessTempK: 432.0,
    brightnessTempC: 158.85,
    satellite: "Suomi NPP VIIRS (375m)",
    satellitePassTime: "2026-09-04 20:20:00 UTC",
    confidence: 94.0,
    scanTime: "9 mins ago",
    daynight: "Night",
    zoneCategory: "Coal-to-Liquids & Synfuels Refining",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_2_PRE_IGNITION",
    shapFactors: [
      {
        feature: "World's Largest Single-Point Emitter Profile",
        contribution: 0.26,
        percentText: "+26%",
        impact: "risk_elevating",
        desc: "High volume flaring stack monitoring protocol"
      }
    ],
    plume: {
      active: true,
      threatClass: "ADVISORY_YELLOW",
      toxicGas: "Hydrogen Sulfide & Carbon Monoxide",
      affectedPopulationEst: 16000,
      projectedLengthKm: 5.5,
      spreadAngleDeg: 26,
      windDeg: 210,
      windSpeedKmH: 20.0
    }
  },
  {
    id: "FIRMS-KWI-3209",
    name: "Kwinana Heavy Industrial Area Exotherm",
    facilityName: "Kwinana Nickel & Alumina Refining Belt",
    zoneId: "AUS-KWINANA-07",
    status: "warning",
    statusLabel: "Industrial Heat Anomaly",
    latitude: -32.2285,
    longitude: 115.7725,
    frp: 64.2,
    baselineFrp: 18.0,
    frpDeviation: 256.7,
    brightnessTempK: 398.5,
    brightnessTempC: 125.35,
    satellite: "NOAA-20 VIIRS (375m)",
    satellitePassTime: "2026-09-04 16:10:00 UTC",
    confidence: 90.5,
    scanTime: "30 mins ago",
    daynight: "Night",
    zoneCategory: "Mineral Smelting & Chemical Storage",
    dispatched: false,
    dispatchTicket: null,
    riskTier: "LEVEL_2_PRE_IGNITION",
    shapFactors: [
      {
        feature: "Coastal Sound Sensitive Marine Perimeter",
        contribution: 0.22,
        percentText: "+22%",
        impact: "risk_elevating",
        desc: "Cockburn Sound marine reserve boundary within 800m"
      }
    ],
    plume: {
      active: true,
      threatClass: "ADVISORY_YELLOW",
      toxicGas: "Sulfur Compounds & Particulate Smelter Off-gas",
      affectedPopulationEst: 7200,
      projectedLengthKm: 4.0,
      spreadAngleDeg: 20,
      windDeg: 290,
      windSpeedKmH: 26.0
    }
  }
];
