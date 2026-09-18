/**
 * OpenStreetMap (OSM) Overpass API Industrial Polygons Service
 * 100% Free, Open Data - NO API KEY REQUIRED.
 * 
 * Queries OSM database in real-time for registered industrial facilities:
 * - landuse=industrial
 * - man_made=works
 * - industrial=* (refineries, chemical plants, manufacturing, logistics)
 * 
 * Transforms raw Overpass ways & nodes into clean GeoJSON-compatible polygon arrays.
 */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

const osmCache = new Map();

/**
 * Calculates center of a polygon coordinate array
 */
function calculatePolygonCenter(coords) {
  if (!coords || coords.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLon = 0;
  coords.forEach(([lat, lon]) => {
    sumLat += lat;
    sumLon += lon;
  });
  return [sumLat / coords.length, sumLon / coords.length];
}

/**
 * Converts Overpass QL raw JSON response into structured AGNI-X industrial zone objects
 */
export function parseOverpassResponse(data, defaultCountryCode = null) {
  if (!data || !data.elements) return [];

  // Index nodes by ID for fast lookup
  const nodeMap = new Map();
  const ways = [];

  data.elements.forEach((el) => {
    if (el.type === "node") {
      nodeMap.set(el.id, [el.lat, el.lon]);
    } else if (el.type === "way") {
      ways.push(el);
    }
  });

  const industrialZones = [];

  ways.forEach((way) => {
    if (!way.nodes || way.nodes.length < 3) return;

    const coords = [];
    way.nodes.forEach((nodeId) => {
      const point = nodeMap.get(nodeId);
      if (point) coords.push(point);
    });

    if (coords.length < 3) return;

    const tags = way.tags || {};
    const facilityName =
      tags.name ||
      tags.operator ||
      tags.brand ||
      tags["name:en"] ||
      (tags.industrial ? `${tags.industrial.toUpperCase()} Facility` : "Registered Industrial Complex");

    const center = calculatePolygonCenter(coords);
    const category = tags.industrial || tags["man_made"] || tags.landuse || "industrial";

    industrialZones.push({
      id: `OSM-${way.id}`,
      name: facilityName,
      shortCode: tags["ref"] || `OSM-${way.id.toString().slice(-4)}`,
      center,
      coordinates: coords,
      countryCode: defaultCountryCode,
      hazardLevel: tags.hazard || (tags.industrial === "chemical" || tags.industrial === "oil" ? "High" : "Standard"),
      facilityType: tags.industrial || tags.landuse || "manufacturing",
      description: tags.description || `Live OpenStreetMap polygon (way #${way.id}, ${category})`,
      isLiveOsm: true,
      tags: {
        landuse: tags.landuse,
        man_made: tags["man_made"],
        industrial: tags.industrial,
        operator: tags.operator
      }
    });
  });

  return industrialZones;
}

/**
 * Queries Overpass API for industrial landuse within radius (km) of coordinates
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} [radiusKm=25] - Search radius in km
 * @param {string} [countryCode] - ISO-2 Country code
 * @returns {Promise<{ zones: Array, isLive: boolean, count: number }>}
 */
export async function fetchLiveOsmIndustrialZones(lat, lon, radiusKm = 25, countryCode = null) {
  if (lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) {
    return { zones: [], isLive: false, count: 0 };
  }

  const radiusMeters = Math.min(60000, Math.max(5000, radiusKm * 1000));
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${radiusMeters}`;

  if (osmCache.has(cacheKey)) {
    const cached = osmCache.get(cacheKey);
    return { zones: cached, isLive: true, count: cached.length, source: "osm-cache" };
  }

  // Construct Overpass QL Query
  // Filters for industrial polygons and works around the given coordinate
  const query = `
    [out:json][timeout:25];
    (
      way["landuse"="industrial"](around:${radiusMeters}, ${lat.toFixed(4)}, ${lon.toFixed(4)});
      way["man_made"="works"](around:${radiusMeters}, ${lat.toFixed(4)}, ${lon.toFixed(4)});
      way["industrial"](around:${radiusMeters}, ${lat.toFixed(4)}, ${lon.toFixed(4)});
    );
    out body;
    >;
    out skel qt 100;
  `.trim();

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const url = `${endpoint}?data=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Overpass HTTP ${response.status}`);
      }

      const text = await response.text();
      if (!text.startsWith("{")) {
        throw new Error("Overpass endpoint returned HTML/non-JSON");
      }

      const data = JSON.parse(text);
      const parsedZones = parseOverpassResponse(data, countryCode);

      if (parsedZones.length > 0) {
        osmCache.set(cacheKey, parsedZones);
      }

      return {
        zones: parsedZones,
        isLive: true,
        count: parsedZones.length,
        source: "osm-overpass-live"
      };
    } catch (err) {
      console.warn(`Overpass endpoint ${endpoint} failed:`, err.message);
      // Try next endpoint in array
    }
  }

  return { zones: [], isLive: false, count: 0, error: "All Overpass endpoints timed out or rate limited" };
}

/**
 * Queries Overpass API for industrial landuse within a bounding box
 * @param {Array<number>} bbox - [south, west, north, east]
 * @param {string} [countryCode] - ISO-2 Country code
 */
export async function fetchLiveOsmByBoundingBox(bbox, countryCode = null) {
  if (!bbox || bbox.length < 4) return { zones: [], isLive: false, count: 0 };
  const [south, west, north, east] = bbox;

  const query = `
    [out:json][timeout:25];
    (
      way["landuse"="industrial"](${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)});
      way["man_made"="works"](${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)});
    );
    out body;
    >;
    out skel qt 80;
  `.trim();

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const url = `${endpoint}?data=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) continue;

      const text = await response.text();
      if (!text.startsWith("{")) continue;

      const data = JSON.parse(text);
      const parsedZones = parseOverpassResponse(data, countryCode);

      return {
        zones: parsedZones,
        isLive: true,
        count: parsedZones.length,
        source: "osm-overpass-live"
      };
    } catch (e) {
      // Continue to next mirror
    }
  }

  return { zones: [], isLive: false, count: 0 };
}
