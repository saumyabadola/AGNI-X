// OpenStreetMap (OSM) Industrial Boundaries (landuse=industrial, man_made=works)
// Real geospatial polygons covering major global petrochemical hubs, refineries, and strategic industrial assets

export const mockIndustrialZones = [
  // --- INDIA ---
  {
    id: "IND-JAMNAGAR-01",
    name: "Jamnagar Petroleum Refinery Complex (RIL & Nayara)",
    countryCode: "IND",
    countryName: "India",
    state: "Gujarat",
    district: "Jamnagar",
    type: "Petroleum Refining & Petrochemicals",
    osmTag: "landuse=industrial",
    areaKm2: 75.4,
    riskTier: "Seveso III / Tier-1 Major Accident Hazard",
    center: [22.378, 69.855],
    coordinates: [
      [22.345, 69.810],
      [22.355, 69.890],
      [22.410, 69.905],
      [22.420, 69.835],
      [22.385, 69.805],
      [22.345, 69.810]
    ],
    facilitiesCount: 18,
    activeFlareStacks: 6,
    emergencyZoneRadiusKm: 5.0
  },
  {
    id: "IND-VIZAG-02",
    name: "Visakhapatnam Petrochemical & Chemical Corridor",
    countryCode: "IND",
    countryName: "India",
    state: "Andhra Pradesh",
    district: "Visakhapatnam",
    type: "Special Chemical & Polymer Zone",
    osmTag: "man_made=works",
    areaKm2: 38.2,
    riskTier: "Tier-1 High Toxicity / VOC Risk",
    center: [17.702, 83.210],
    coordinates: [
      [17.675, 83.175],
      [17.695, 83.245],
      [17.735, 83.235],
      [17.725, 83.165],
      [17.685, 83.155],
      [17.675, 83.175]
    ],
    facilitiesCount: 24,
    activeFlareStacks: 3,
    emergencyZoneRadiusKm: 6.5
  },
  {
    id: "IND-MUNDRA-03",
    name: "Mundra Port Hydrocarbon & Chemical Terminal SEZ",
    countryCode: "IND",
    countryName: "India",
    state: "Gujarat",
    district: "Kutch",
    type: "Liquid Hydrocarbon Storage & Port Logistics",
    osmTag: "landuse=industrial",
    areaKm2: 44.6,
    riskTier: "Tier-1 Flammable Liquid Storage",
    center: [22.825, 69.715],
    coordinates: [
      [22.795, 69.670],
      [22.810, 69.755],
      [22.855, 69.740],
      [22.850, 69.660],
      [22.805, 69.650],
      [22.795, 69.670]
    ],
    facilitiesCount: 14,
    activeFlareStacks: 2,
    emergencyZoneRadiusKm: 4.5
  },
  {
    id: "IND-HAZIRA-04",
    name: "Hazira Industrial Area & Gas Processing Hub",
    countryCode: "IND",
    countryName: "India",
    state: "Gujarat",
    district: "Surat",
    type: "LNG Terminal & Gas Processing Facility",
    osmTag: "man_made=works",
    areaKm2: 29.8,
    riskTier: "Tier-1 Pressurized Gas Risk",
    center: [21.105, 72.635],
    coordinates: [
      [21.080, 72.605],
      [21.095, 72.670],
      [21.135, 72.655],
      [21.125, 72.595],
      [21.090, 72.590],
      [21.080, 72.605]
    ],
    facilitiesCount: 16,
    activeFlareStacks: 4,
    emergencyZoneRadiusKm: 4.0
  },
  {
    id: "IND-MANALI-05",
    name: "Manali Petrochemical Complex (CPCL Corridor)",
    countryCode: "IND",
    countryName: "India",
    state: "Tamil Nadu",
    district: "Chennai",
    type: "Refining, Aromatics & Heavy Chemicals",
    osmTag: "landuse=industrial",
    areaKm2: 22.4,
    riskTier: "Tier-1 Dense Population Proximity Hazard",
    center: [13.168, 80.262],
    coordinates: [
      [13.145, 80.240],
      [13.155, 80.285],
      [13.190, 80.275],
      [13.185, 80.235],
      [13.155, 80.230],
      [13.145, 80.240]
    ],
    facilitiesCount: 19,
    activeFlareStacks: 3,
    emergencyZoneRadiusKm: 5.5
  },
  {
    id: "IND-DAHEJ-06",
    name: "Dahej Petroleum & Chemicals Investment Region (PCPIR)",
    countryCode: "IND",
    countryName: "India",
    state: "Gujarat",
    district: "Bharuch",
    type: "Chemical Synthesis & Bulk Liquid Terminal",
    osmTag: "landuse=industrial",
    areaKm2: 52.1,
    riskTier: "Tier-1 Hazardous Chemical Zone",
    center: [21.710, 72.565],
    coordinates: [
      [21.670, 72.530],
      [21.685, 72.610],
      [21.745, 72.595],
      [21.735, 72.520],
      [21.685, 72.515],
      [21.670, 72.530]
    ],
    facilitiesCount: 28,
    activeFlareStacks: 5,
    emergencyZoneRadiusKm: 6.0
  },

  // --- UNITED STATES ---
  {
    id: "USA-HOUSTON-01",
    name: "Houston Ship Channel Petrochemical Complex",
    countryCode: "USA",
    countryName: "United States",
    state: "Texas",
    district: "Harris County",
    type: "Olefins & Refining Corridor",
    osmTag: "landuse=industrial",
    areaKm2: 88.0,
    riskTier: "Tier-1 Major Chemical Complex",
    center: [29.735, -95.124],
    coordinates: [
      [29.705, -95.160],
      [29.715, -95.080],
      [29.765, -95.090],
      [29.755, -95.170],
      [29.705, -95.160]
    ],
    facilitiesCount: 45,
    activeFlareStacks: 12,
    emergencyZoneRadiusKm: 8.0
  },

  // --- NETHERLANDS ---
  {
    id: "EUR-ROTTERDAM-02",
    name: "Port of Rotterdam Energy & Chemical Cluster",
    countryCode: "NLD",
    countryName: "Netherlands",
    state: "South Holland",
    district: "Rotterdam",
    type: "Refining & Hydrogen Reforming",
    osmTag: "landuse=industrial",
    areaKm2: 65.0,
    riskTier: "Seveso III Tier-1",
    center: [51.954, 4.053],
    coordinates: [
      [51.920, 4.010],
      [51.930, 4.100],
      [51.980, 4.090],
      [51.970, 4.005],
      [51.920, 4.010]
    ],
    facilitiesCount: 36,
    activeFlareStacks: 8,
    emergencyZoneRadiusKm: 6.5
  },

  // --- SAUDI ARABIA ---
  {
    id: "ME-JUBAIL-03",
    name: "Jubail Industrial City Petrochemical Corridor",
    countryCode: "SAU",
    countryName: "Saudi Arabia",
    state: "Eastern Province",
    district: "Jubail",
    type: "Petrochemicals & Plastics Synthesis",
    osmTag: "landuse=industrial",
    areaKm2: 95.0,
    riskTier: "Tier-1 Major Hazard",
    center: [27.014, 49.658],
    coordinates: [
      [26.970, 49.610],
      [26.985, 49.710],
      [27.050, 49.695],
      [27.040, 49.600],
      [26.970, 49.610]
    ],
    facilitiesCount: 52,
    activeFlareStacks: 15,
    emergencyZoneRadiusKm: 9.0
  },

  // --- SINGAPORE ---
  {
    id: "ASIA-JURONG-04",
    name: "Jurong Island Petrochemical & Energy Hub",
    countryCode: "SGP",
    countryName: "Singapore",
    state: "South West",
    district: "Jurong Island",
    type: "Integrated Refining & Specialty Aromatics",
    osmTag: "landuse=industrial",
    areaKm2: 32.0,
    riskTier: "Tier-1 Hazardous Synthesis",
    center: [1.264, 103.702],
    coordinates: [
      [1.240, 103.680],
      [1.245, 103.730],
      [1.290, 103.725],
      [1.285, 103.675],
      [1.240, 103.680]
    ],
    facilitiesCount: 40,
    activeFlareStacks: 7,
    emergencyZoneRadiusKm: 5.0
  },

  // --- BRAZIL ---
  {
    id: "SA-CUBATAO-05",
    name: "Cubatão Petrochemical & Industrial Pole",
    countryCode: "BRA",
    countryName: "Brazil",
    state: "São Paulo",
    district: "Baixada Santista",
    type: "Fertilizers, Refineries & Basic Petrochemicals",
    osmTag: "landuse=industrial",
    areaKm2: 48.0,
    riskTier: "Tier-1 Coastal Valley Atmospheric Hazard",
    center: [-23.891, -46.425],
    coordinates: [
      [-23.920, -46.460],
      [-23.910, -46.390],
      [-23.865, -46.400],
      [-23.870, -46.455],
      [-23.920, -46.460]
    ],
    facilitiesCount: 26,
    activeFlareStacks: 6,
    emergencyZoneRadiusKm: 7.0
  },

  // --- SOUTH AFRICA ---
  {
    id: "AFR-SECUNDA-06",
    name: "Sasol Secunda Synfuels & Petrochemical Complex",
    countryCode: "ZAF",
    countryName: "South Africa",
    state: "Mpumalanga",
    district: "Govan Mbeki",
    type: "Coal-to-Liquids Synfuels & Chemical Synthesis",
    osmTag: "man_made=works",
    areaKm2: 82.0,
    riskTier: "Tier-1 Major Synthetic Fuels Plant",
    center: [-26.551, 29.178],
    coordinates: [
      [-26.580, 29.130],
      [-26.590, 29.220],
      [-26.520, 29.230],
      [-26.515, 29.140],
      [-26.580, 29.130]
    ],
    facilitiesCount: 38,
    activeFlareStacks: 11,
    emergencyZoneRadiusKm: 8.5
  },

  // --- AUSTRALIA ---
  {
    id: "AUS-KWINANA-07",
    name: "Kwinana Strategic Industrial Area",
    countryCode: "AUS",
    countryName: "Australia",
    state: "Western Australia",
    district: "Perth Coastal Basin",
    type: "Chemical Processing, Lithium & Nickel Refining",
    osmTag: "landuse=industrial",
    areaKm2: 36.5,
    riskTier: "Tier-1 Coastal Ecological Sensitivity",
    center: [-32.228, 115.772],
    coordinates: [
      [-32.260, 115.750],
      [-32.255, 115.800],
      [-32.200, 115.790],
      [-32.210, 115.745],
      [-32.260, 115.750]
    ],
    facilitiesCount: 22,
    activeFlareStacks: 4,
    emergencyZoneRadiusKm: 5.5
  },

  // --- GERMANY ---
  {
    id: "DEU-LUDWIGSHAFEN-01",
    name: "BASF Ludwigshafen Verbund Chemical Site",
    countryCode: "DEU",
    countryName: "Germany",
    state: "Rhineland-Palatinate",
    district: "Ludwigshafen",
    type: "Integrated Verbund Chemistry & Ammonia Synthesis",
    osmTag: "man_made=works",
    areaKm2: 10.0,
    riskTier: "Seveso III / High Industrial Density",
    center: [49.496, 8.432],
    coordinates: [
      [49.480, 8.410],
      [49.485, 8.455],
      [49.525, 8.445],
      [49.520, 8.405],
      [49.480, 8.410]
    ],
    facilitiesCount: 70,
    activeFlareStacks: 5,
    emergencyZoneRadiusKm: 4.0
  },

  // --- UNITED KINGDOM ---
  {
    id: "GBR-TEESSIDE-01",
    name: "Teesside Clean Industrial Cluster & Wilton International",
    countryCode: "GBR",
    countryName: "United Kingdom",
    state: "North East England",
    district: "Redcar and Cleveland",
    type: "Specialty Polymers, Ammonia & Clean Hydrogen",
    osmTag: "landuse=industrial",
    areaKm2: 30.0,
    riskTier: "COMAH Top Tier Site",
    center: [54.582, -1.162],
    coordinates: [
      [54.560, -1.200],
      [54.565, -1.120],
      [54.610, -1.130],
      [54.605, -1.195],
      [54.560, -1.200]
    ],
    facilitiesCount: 32,
    activeFlareStacks: 4,
    emergencyZoneRadiusKm: 5.0
  },

  // --- UNITED ARAB EMIRATES ---
  {
    id: "ARE-RUWAIS-01",
    name: "Ruwais Industrial City Refinery & Chemicals Complex",
    countryCode: "ARE",
    countryName: "United Arab Emirates",
    state: "Abu Dhabi",
    district: "Al Dhafra",
    type: "Integrated Crude Refining & Borouge Olefins",
    osmTag: "landuse=industrial",
    areaKm2: 78.0,
    riskTier: "Tier-1 Major Petrochemical Hub",
    center: [24.112, 52.731],
    coordinates: [
      [24.080, 52.690],
      [24.090, 52.775],
      [24.145, 52.765],
      [24.135, 52.680],
      [24.080, 52.690]
    ],
    facilitiesCount: 48,
    activeFlareStacks: 14,
    emergencyZoneRadiusKm: 8.0
  },

  // --- CHINA ---
  {
    id: "CHN-DAXIE-01",
    name: "Ningbo Daxie Petrochemical Industrial Zone",
    countryCode: "CHN",
    countryName: "China",
    state: "Zhejiang",
    district: "Ningbo",
    type: "Mega Naphtha Cracking & Synthetic Plastics",
    osmTag: "landuse=industrial",
    areaKm2: 60.0,
    riskTier: "Tier-1 High Capacity Chemical Complex",
    center: [29.898, 121.961],
    coordinates: [
      [29.870, 121.920],
      [29.875, 122.005],
      [29.930, 121.995],
      [29.920, 121.915],
      [29.870, 121.920]
    ],
    facilitiesCount: 55,
    activeFlareStacks: 16,
    emergencyZoneRadiusKm: 7.5
  },

  // --- JAPAN ---
  {
    id: "JPN-MIZUSHIMA-01",
    name: "Mizushima Coastal Industrial & Petrochemical Zone",
    countryCode: "JPN",
    countryName: "Japan",
    state: "Okayama Prefecture",
    district: "Kurashiki",
    type: "Ethylene Production, Aromatics & Steel Manufacturing",
    osmTag: "landuse=industrial",
    areaKm2: 25.0,
    riskTier: "Tier-1 Coastal Industrial Zone",
    center: [34.502, 133.742],
    coordinates: [
      [34.480, 133.710],
      [34.485, 133.780],
      [34.530, 133.770],
      [34.525, 133.705],
      [34.480, 133.710]
    ],
    facilitiesCount: 35,
    activeFlareStacks: 6,
    emergencyZoneRadiusKm: 5.0
  },

  // --- CANADA ---
  {
    id: "CAN-HEARTLAND-01",
    name: "Alberta Industrial Heartland Hydrocarbon Processing Hub",
    countryCode: "CAN",
    countryName: "Canada",
    state: "Alberta",
    district: "Edmonton Metropolitan Region",
    type: "Bitumen Upgrading, Petrochemicals & Hydrogen",
    osmTag: "landuse=industrial",
    areaKm2: 90.0,
    riskTier: "Tier-1 Heavy Oil & Gas Upgrading",
    center: [53.725, -113.212],
    coordinates: [
      [53.690, -113.270],
      [53.700, -113.150],
      [53.765, -113.160],
      [53.755, -113.265],
      [53.690, -113.270]
    ],
    facilitiesCount: 42,
    activeFlareStacks: 9,
    emergencyZoneRadiusKm: 8.0
  },

  // --- SOUTH KOREA ---
  {
    id: "KOR-YEOSU-01",
    name: "Yeosu National Industrial Petrochemical Complex",
    countryCode: "KOR",
    countryName: "South Korea",
    state: "South Jeolla",
    district: "Yeosu",
    type: "Basic Petrochemicals, Polymers & Rubber Synthesis",
    osmTag: "landuse=industrial",
    areaKm2: 35.0,
    riskTier: "Tier-1 Mega Petrochemical Complex",
    center: [34.821, 127.712],
    coordinates: [
      [34.795, 127.675],
      [34.800, 127.750],
      [34.850, 127.740],
      [34.845, 127.670],
      [34.795, 127.675]
    ],
    facilitiesCount: 46,
    activeFlareStacks: 10,
    emergencyZoneRadiusKm: 6.0
  },

  // --- QATAR ---
  {
    id: "QAT-RASLAFFAN-01",
    name: "Ras Laffan Industrial City LNG Processing Hub",
    countryCode: "QAT",
    countryName: "Qatar",
    state: "Al Khor",
    district: "Ras Laffan",
    type: "Liquefied Natural Gas (LNG) Liquefaction & GTL",
    osmTag: "landuse=industrial",
    areaKm2: 106.0,
    riskTier: "Tier-1 Pressurized Cryogenic Cryo-Gas",
    center: [25.908, 51.528],
    coordinates: [
      [25.860, 51.480],
      [25.875, 51.580],
      [25.955, 51.560],
      [25.940, 51.465],
      [25.860, 51.480]
    ],
    facilitiesCount: 50,
    activeFlareStacks: 18,
    emergencyZoneRadiusKm: 10.0
  },

  // --- FRANCE ---
  {
    id: "FRA-FOS-01",
    name: "Fos-sur-Mer Heavy Industrial & Refining Cluster",
    countryCode: "FRA",
    countryName: "France",
    state: "Provence-Alpes-Côte d'Azur",
    district: "Marseille Port",
    type: "Crude Refining, Ethylene Cracking & Chemical Storage",
    osmTag: "landuse=industrial",
    areaKm2: 42.0,
    riskTier: "Seveso III Upper Tier Hazard",
    center: [43.435, 4.882],
    coordinates: [
      [43.410, 4.840],
      [43.415, 4.930],
      [43.465, 4.920],
      [43.460, 4.835],
      [43.410, 4.840]
    ],
    facilitiesCount: 30,
    activeFlareStacks: 7,
    emergencyZoneRadiusKm: 6.0
  }
];
