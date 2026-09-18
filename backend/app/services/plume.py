"""
Toxic Plume Dispersion Danger Cone Engine
Calculates 2-hour downwind toxic smoke and VOC dispersion geometry
using live OpenWeatherMap wind vectors and Fire Radiative Power (FRP).
"""

import math
from typing import Dict, Any, List

def compute_plume_polygon_geojson(
    lat: float,
    lon: float,
    wind_deg: float,
    length_km: float,
    spread_angle_deg: float = 18.0,
    steps: int = 10
) -> List[List[float]]:
    """
    Computes GeoJSON polygon coordinates [lon, lat] for downwind dispersion wedge.
    Wind blows towards (wind_deg + 180) % 360.
    """
    travel_bearing = (wind_deg + 180.0) % 360.0
    km_per_lat = 111.32
    km_per_lng = 111.32 * math.cos(math.radians(lat))

    # GeoJSON convention: [longitude, latitude]
    coords = [[lon, lat]]

    start_angle = travel_bearing - spread_angle_deg
    end_angle = travel_bearing + spread_angle_deg
    angle_step = (end_angle - start_angle) / steps

    for i in range(steps + 1):
        angle = start_angle + (i * angle_step)
        rad = math.radians(angle)
        center_factor = 1.0 - 0.28 * math.pow((angle - travel_bearing) / spread_angle_deg, 2)
        effective_length = length_km * max(0.6, center_factor)

        d_lat = (effective_length * math.cos(rad)) / km_per_lat
        d_lng = (effective_length * math.sin(rad)) / km_per_lng

        coords.append([round(lon + d_lng, 5), round(lat + d_lat, 5)])

    coords.append([lon, lat])  # Close polygon
    return coords

def predict_plume_dispersion(
    hotspot_id: str,
    lat: float,
    lon: float,
    frp: float,
    wind_deg: float,
    wind_speed_kmh: float,
    toxic_gas: str = "Styrene / Benzene Hydrocarbon Vapor"
) -> Dict[str, Any]:
    """
    Returns 3-tier dispersion cone GeoJSON FeatureCollection.
    """
    # Scale plume distance dynamically with FRP and wind velocity
    base_length = max(2.5, min(14.0, (frp / 35.0) * (wind_speed_kmh / 18.0) * 4.5))
    
    sector1_coords = compute_plume_polygon_geojson(lat, lon, wind_deg, base_length * 0.35, 12.0)
    sector2_coords = compute_plume_polygon_geojson(lat, lon, wind_deg, base_length * 0.65, 17.0)
    sector3_coords = compute_plume_polygon_geojson(lat, lon, wind_deg, base_length, 22.0)

    est_population = int(max(1500, (base_length ** 1.8) * 450))

    return {
        "type": "FeatureCollection",
        "hotspot_id": hotspot_id,
        "parameters": {
            "origin": [lat, lon],
            "wind_direction_deg": wind_deg,
            "wind_speed_kmh": wind_speed_kmh,
            "toxic_agent": toxic_gas,
            "max_hazard_reach_km": round(base_length, 2),
            "estimated_exposed_population": est_population
        },
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "sector": 3,
                    "name": "Sector 3: Downwind Advisory Zone",
                    "threat_level": "ADVISORY_YELLOW",
                    "reach_km": round(base_length, 2),
                    "action": "Shelter-in-place & close ventilation intakes"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [sector3_coords]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "sector": 2,
                    "name": "Sector 2: 2-Hour Evacuation Perimeter",
                    "threat_level": "EVACUATION_ORANGE",
                    "reach_km": round(base_length * 0.65, 2),
                    "action": "Mandatory civil evacuation within 2 hours"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [sector2_coords]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "sector": 1,
                    "name": "Sector 1: IDLH Lethal Toxic Core",
                    "threat_level": "IDLH_RED",
                    "reach_km": round(base_length * 0.35, 2),
                    "action": "Immediate Danger to Life & Health. Level-A HazMat response"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [sector1_coords]
                }
            }
        ]
    }
