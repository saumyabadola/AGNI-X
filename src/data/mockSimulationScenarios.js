// Historical Backtesting Simulation Scenarios (Hackathon Evaluator Demo Mode)
// Demonstrates live false-alarm filtering vs. catastrophic disaster escalation

export const mockSimulationScenarios = [
  {
    id: "SCENARIO-JAMNAGAR-FLARE",
    name: "Jamnagar Refinery: Routine Flaring Benchmark",
    facility: "Reliance Jamnagar Mega-Refinery",
    date: "14-Nov-2025 (Diwali Seasonal Baseline)",
    targetHotspotId: "FIRMS-JAM-1024",
    zoneId: "IND-JAMNAGAR-01",
    scenarioType: "FALSE_ALARM_SUPPRESSION",
    badgeColor: "emerald",
    summary: "Demonstrates ThermaTwin's AI baseline filtering out a massive 45 MW heat signature as routine, authorized operational flaring—saving SDRF/NDRF from unnecessary emergency mobilization.",
    keyTakeaway: "Conventional satellite thresholding triggers false alarms above 30 MW. ThermaTwin compares historical 90-day VIIRS baselines and OSM tags to suppress 100% of false dispatches.",
    falseAlarmFilterRate: "100% Filtered (0 False Dispatches)",
    baselineFrp: 44.8,
    timeline: [
      {
        timeStep: "T - 6h",
        timestamp: "18:00 UTC",
        frp: 43.1,
        frpDeviation: "-3.8%",
        status: "safe",
        statusLabel: "Safe Operational Flaring",
        aiClassification: "ROUTINE_BASELINE",
        plumeRisk: "NONE",
        notes: "Routine continuous flaring on Stack #4. Operational gases safely combusted."
      },
      {
        timeStep: "T - 3h",
        timestamp: "21:00 UTC",
        frp: 46.8,
        frpDeviation: "+4.4%",
        status: "safe",
        statusLabel: "Safe Operational Flaring",
        aiClassification: "ROUTINE_BASELINE",
        plumeRisk: "NONE",
        notes: "Slight process swing from hydrocracker unit; within 1-sigma baseline envelope."
      },
      {
        timeStep: "T - 1h",
        timestamp: "23:00 UTC",
        frp: 45.9,
        frpDeviation: "+2.4%",
        status: "safe",
        statusLabel: "Safe Operational Flaring",
        aiClassification: "ROUTINE_BASELINE",
        plumeRisk: "NONE",
        notes: "Thermal footprint stable. No expanding perimeter detected by VIIRS."
      },
      {
        timeStep: "T - 0h (Current)",
        timestamp: "00:00 UTC",
        frp: 46.2,
        frpDeviation: "+3.1%",
        status: "safe",
        statusLabel: "Safe Operational Flaring",
        aiClassification: "ROUTINE_BASELINE_VERIFIED",
        plumeRisk: "NONE",
        notes: "AI Model Verdict: SUPPRESS ERSS-112 ALERT. Routine permitted flaring confirmed."
      }
    ]
  },
  {
    id: "SCENARIO-VIZAG-POLYMER",
    name: "Vizag Chemical Plant: Styrene Pre-Ignition Runaway",
    facility: "Visakhapatnam Autonagar Synthetic Polymer Hub",
    date: "07-May-2020 (Historical Chemical Gas Leak Analog)",
    targetHotspotId: "FIRMS-VIZ-4419",
    zoneId: "IND-VIZAG-02",
    scenarioType: "PRE_IGNITION_DETECTION",
    badgeColor: "amber",
    summary: "Demonstrates early-warning detection of an exothermic chemical runaway in a refrigerated monomer storage tank hours before explosive vapor cloud release, even under heavy cloud cover.",
    keyTakeaway: "Sentinel-1 SAR radar backscatter and VIIRS thermal anomaly detect gradual internal heating when optical cameras show no smoke, enabling 3-hour advance evacuation.",
    falseAlarmFilterRate: "Early Detection: 3h 15m Ahead of Disaster",
    baselineFrp: 14.2,
    timeline: [
      {
        timeStep: "T - 6h",
        timestamp: "20:00 UTC",
        frp: 16.5,
        frpDeviation: "+16.2%",
        status: "safe",
        statusLabel: "Normal Tank Temperature",
        aiClassification: "BASELINE_MONITORING",
        plumeRisk: "NONE",
        notes: "Refrigeration system failure initiated; internal tank temperature begins creeping upward."
      },
      {
        timeStep: "T - 3h",
        timestamp: "23:00 UTC",
        frp: 38.4,
        frpDeviation: "+170.4%",
        status: "warning",
        statusLabel: "Pre-Ignition Runaway Warning",
        aiClassification: "THERMAL_RUNAWAY_SURGE",
        plumeRisk: "INCIPIENT_VAPOR",
        notes: "Auto-polymerization starts. Heat rate reaches +6.8°C/hr. Anomaly flagged on dashboard."
      },
      {
        timeStep: "T - 1h",
        timestamp: "01:00 UTC",
        frp: 68.4,
        frpDeviation: "+381.7%",
        status: "warning",
        statusLabel: "Critical Pre-Ignition Risk",
        aiClassification: "EXOTHERMIC_CRITICAL",
        plumeRisk: "EVACUATION_ADVISORY",
        notes: "SAR radar detects boiling liquid expansion. Emergency warning dispatch recommended to SDMA."
      },
      {
        timeStep: "T - 0h (Current)",
        timestamp: "02:30 UTC",
        frp: 184.0,
        frpDeviation: "+1195.7%",
        status: "critical",
        statusLabel: "Uncontrolled Toxic Vapor Cloud",
        aiClassification: "CATASTROPHIC_DISPERSION",
        plumeRisk: "IDLH_TOXIC_PLUME",
        notes: "Rupture disc failure. Toxic styrene plume carried 6.2 km inland by 26 km/h winds."
      }
    ]
  },
  {
    id: "SCENARIO-MUNDRA-EXPLOSION",
    name: "Mundra Port: Hydrocarbon Tank Farm Explosion",
    facility: "Mundra Liquid Storage Terminal 2",
    date: "19-Jan-2026 (Major Hydrocarbon Event)",
    targetHotspotId: "FIRMS-MUN-8821",
    zoneId: "IND-MUNDRA-03",
    scenarioType: "FULL_CRITICAL_DISPATCH",
    badgeColor: "rose",
    summary: "Simulates an instantaneous 340+ MW hydrocarbon tank explosion with high-velocity wind dispersion, triggering the automated ERSS-112 emergency webhook dispatch sequence.",
    keyTakeaway: "Automated SHAP attribution proves event is an uncontrolled tank blaze rather than flaring. One-click dispatch provides exact coordinates and plume boundary to emergency responders.",
    falseAlarmFilterRate: "Verified Critical Fire (ERSS-112 Armed)",
    baselineFrp: 28.5,
    timeline: [
      {
        timeStep: "T - 2h",
        timestamp: "19:00 UTC",
        frp: 27.2,
        frpDeviation: "-4.5%",
        status: "safe",
        statusLabel: "Normal Tank Operation",
        aiClassification: "NORMAL_BASELINE",
        plumeRisk: "NONE",
        notes: "Standard pumping and storage operations at Terminal 2 tank manifold."
      },
      {
        timeStep: "T - 45m",
        timestamp: "20:15 UTC",
        frp: 112.0,
        frpDeviation: "+292.9%",
        status: "warning",
        statusLabel: "Ignition Surge Detected",
        aiClassification: "RAPID_THERMAL_SURGE",
        plumeRisk: "LOCALIZED_CONE",
        notes: "Seal failure and flash fire on Tank 104. Automated alarms sounding internally."
      },
      {
        timeStep: "T - 0h (Current)",
        timestamp: "21:00 UTC",
        frp: 342.6,
        frpDeviation: "+1102.1%",
        status: "critical",
        statusLabel: "Full Surface Tank Fire",
        aiClassification: "MASSIVE_PETROCHEM_FIRE",
        plumeRisk: "IDLH_TOXIC_PLUME",
        notes: "Full boilover event. Plume carrying toxic aromatics toward port docks. ERSS-112 Webhook Ready."
      }
    ]
  },
  {
    id: "SCENARIO-MANALI-SAR-PIERCING",
    name: "Manali Petrochem: Cloud-Piercing SAR Radar Test",
    facility: "CPCL Manali Heavy Aromatics Corridor",
    date: "02-Dec-2025 (Monsoon Cyclone Overcast)",
    targetHotspotId: "FIRMS-MAN-7750",
    zoneId: "IND-MANALI-05",
    scenarioType: "SAR_RADAR_PIERCING",
    badgeColor: "cyan",
    summary: "Demonstrates how Sentinel-1 synthetic aperture radar (SAR) pierces dense 85%+ monsoon clouds and smoke where optical VIIRS/MODIS sensors are completely blind.",
    keyTakeaway: "Optical satellites register zero confidence due to cloud attenuation. Cloud-Piercing SAR backscatter reveals a severe 218 MW naphtha line fire with 97.8% AI confidence.",
    falseAlarmFilterRate: "Cloud Penetration Success (100% SAR Ground Truth)",
    baselineFrp: 22.0,
    timeline: [
      {
        timeStep: "T - 4h",
        timestamp: "16:00 UTC",
        frp: 21.5,
        frpDeviation: "-2.2%",
        status: "safe",
        statusLabel: "Normal Operations (Cloudy)",
        aiClassification: "SAR_MONITORING",
        plumeRisk: "NONE",
        notes: "Heavy cyclone cloud cover over Chennai coast. Optical satellites reporting occlusion."
      },
      {
        timeStep: "T - 1h",
        timestamp: "19:00 UTC",
        frp: 95.0,
        frpDeviation: "+331.8%",
        status: "warning",
        statusLabel: "Hidden SAR Backscatter Anomaly",
        aiClassification: "SAR_THERMAL_DETECTED",
        plumeRisk: "CONCEALED_PLUME",
        notes: "Sentinel-1 C-band radar detects +6.2 dB backscatter surface disturbance through cloud deck."
      },
      {
        timeStep: "T - 0h (Current)",
        timestamp: "20:00 UTC",
        frp: 218.4,
        frpDeviation: "+892.7%",
        status: "critical",
        statusLabel: "Critical SAR-Pierced Fire Anomaly",
        aiClassification: "SAR_CONFIRMED_DISASTER",
        plumeRisk: "IDLH_TOXIC_PLUME",
        notes: "SAR synthetic overlay highlights massive naphtha line breach. Immediate evacuation alert."
      }
    ]
  }
];
