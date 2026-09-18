import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import { HotspotMarker } from "./HotspotMarker";
import { IndustrialPolygon } from "./IndustrialPolygon";
import { ToxicPlumeCone } from "./ToxicPlumeCone";
import { SARRadarOverlay } from "./SARRadarOverlay";
import { MapControls } from "./MapControls";
import { CountryIndustriesHUD } from "./CountryIndustriesHUD";
import { LayerControlPanel } from "../LayerPanel/LayerControlPanel";

// Smooth camera pan and zoom controller
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

export function GeospatialMap() {
  const {
    hotspots,
    selectedHotspot,
    industrialZones,
    activeLayers,
    baseLayer,
    mapCenter,
    mapZoom,
    currentWeather,
    selectedCountry,
    setSelectedHotspotId,
    flyToIncident
  } = useThermaTwin();

  // Clean, high-performance basemaps WITHOUT watermark restrictions
  // Default: Esri World Imagery (True Color Satellite, matching official NASA FIRMS)
  const satelliteTrueColorUrl =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  // Clean Dark Canvas (Esri Canvas World Dark Gray, no API key watermark)
  const darkCanvasUrl =
    "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

  // OpenStreetMap fallback
  const osmUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  const getTileUrl = () => {
    if (baseLayer === "dark") return darkCanvasUrl;
    if (baseLayer === "osm") return osmUrl;
    return satelliteTrueColorUrl; // Default Satellite matching NASA FIRMS
  };

  return (
    <div className="relative w-full h-full bg-[#050b14] overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full z-10"
      >
        {/* Active Pristine Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Earthstar Geographics &copy; NASA FIRMS'
          url={getTileUrl()}
          maxZoom={18}
        />

        {/* Dynamic Camera Syncer */}
        <MapUpdater center={mapCenter} zoom={mapZoom} />

        {/* 2. OSM Semi-Transparent Purple Industrial Boundaries */}
        {activeLayers.osm &&
          industrialZones.map((zone) => (
            <IndustrialPolygon
              key={zone.id}
              zone={zone}
              isSelected={selectedHotspot?.zoneId === zone.id}
              isCountrySelected={selectedCountry?.code === zone.countryCode}
              onClick={(z) => {
                const targetHotspot = hotspots.find((h) => h.zoneId === z.id);
                if (targetHotspot) {
                  setSelectedHotspotId(targetHotspot.id);
                  flyToIncident(targetHotspot.latitude, targetHotspot.longitude);
                } else {
                  flyToIncident(z.center[0], z.center[1]);
                }
              }}
            />
          ))}

        {/* 3. Dynamic Downwind Toxic Plume Hazard Cones */}
        {activeLayers.plumes &&
          hotspots.map((hotspot) => (
            <ToxicPlumeCone
              key={`plume-${hotspot.id}`}
              hotspot={hotspot}
              weather={currentWeather}
            />
          ))}

        {/* 4. Cloud-Piercing Sentinel-1 SAR Radar Overlay */}
        {activeLayers.sar && selectedHotspot && (
          <SARRadarOverlay hotspot={selectedHotspot} />
        )}

        {/* 5. NASA FIRMS Hotspot Markers */}
        {activeLayers.firms &&
          hotspots.map((hotspot) => (
            <HotspotMarker key={hotspot.id} hotspot={hotspot} />
          ))}

        {/* 6. Custom Floating Map Controls HUD */}
        <MapControls />
      </MapContainer>

      {/* 7. Country Industries Showcase HUD Drawer */}
      <CountryIndustriesHUD />

      {/* 8. Minimalist Bottom-Left Layer Widget */}
      <LayerControlPanel />
    </div>
  );
}
