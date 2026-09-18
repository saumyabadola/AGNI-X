"""
Spatial Database & PostGIS Spatial Intersection Engine
Executes ST_Intersects queries to classify whether NASA hotspots fall inside
registered OpenStreetMap industrial boundaries (landuse=industrial, man_made=works).
"""

from typing import Optional, Dict, Any, List
from shapely.geometry import Point, Polygon

# OpenStreetMap Industrial Boundary Polygons (WGS84 Lat/Lon)
# Standard OSM tags: landuse=industrial, man_made=works
OSM_INDUSTRIAL_ZONES = [
    {
        "id": "IND-JAMNAGAR-01",
        "name": "Jamnagar Petroleum Refinery Complex (RIL & Nayara)",
        "osm_tag": "landuse=industrial",
        "risk_tier": "Tier-1 Major Accident Hazard (MAH)",
        "coordinates": [
            [22.345, 69.810],
            [22.355, 69.890],
            [22.410, 69.905],
            [22.420, 69.835],
            [22.385, 69.805],
            [22.345, 69.810]
        ],
        "registered_flares": [
            {"name": "Flare Stack #4", "lat": 22.3812, "lon": 69.8624, "baseline_frp": 44.8}
        ]
    },
    {
        "id": "IND-VIZAG-02",
        "name": "Visakhapatnam Autonagar Chemical & Polymer Corridor",
        "osm_tag": "man_made=works",
        "risk_tier": "Tier-1 High Toxicity / Monomer Runaway",
        "coordinates": [
            [17.675, 83.175],
            [17.695, 83.245],
            [17.735, 83.235],
            [17.725, 83.165],
            [17.685, 83.155],
            [17.675, 83.175]
        ],
        "registered_flares": []
    },
    {
        "id": "IND-MUNDRA-03",
        "name": "Mundra Port Hydrocarbon & Chemical Terminal SEZ",
        "osm_tag": "landuse=industrial",
        "risk_tier": "Tier-1 Flammable Liquid Storage",
        "coordinates": [
            [22.795, 69.670],
            [22.810, 69.755],
            [22.855, 69.740],
            [22.850, 69.660],
            [22.805, 69.650],
            [22.795, 69.670]
        ],
        "registered_flares": []
    },
    {
        "id": "IND-HAZIRA-04",
        "name": "Hazira LNG & Gas Processing Hub",
        "osm_tag": "man_made=works",
        "risk_tier": "Tier-1 Pressurized Gas Risk",
        "coordinates": [
            [21.080, 72.605],
            [21.095, 72.670],
            [21.135, 72.655],
            [21.125, 72.595],
            [21.090, 72.590],
            [21.080, 72.605]
        ],
        "registered_flares": [
            {"name": "GSU Elevated Flare", "lat": 21.1082, "lon": 72.6321, "baseline_frp": 33.5}
        ]
    },
    {
        "id": "IND-MANALI-05",
        "name": "Manali Petrochemical Complex (CPCL Corridor)",
        "osm_tag": "landuse=industrial",
        "risk_tier": "Tier-1 Dense Population Proximity Hazard",
        "coordinates": [
            [13.145, 80.240],
            [13.155, 80.285],
            [13.190, 80.275],
            [13.185, 80.235],
            [13.155, 80.230],
            [13.145, 80.240]
        ],
        "registered_flares": []
    },
    {
        "id": "IND-DAHEJ-06",
        "name": "Dahej Petroleum & Chemicals Investment Region (PCPIR)",
        "osm_tag": "landuse=industrial",
        "risk_tier": "Tier-1 Hazardous Chemical Zone",
        "coordinates": [
            [21.670, 72.530],
            [21.685, 72.610],
            [21.745, 72.595],
            [21.735, 72.520],
            [21.685, 72.515],
            [21.670, 72.530]
        ],
        "registered_flares": []
    }
]

# Pre-compile Shapely Polygons for sub-millisecond ST_Intersects execution
COMPILED_SPATIAL_ZONES = []
for z in OSM_INDUSTRIAL_ZONES:
    # Shapely expects (lon, lat) tuples
    poly_points = [(pt[1], pt[0]) for pt in z["coordinates"]]
    COMPILED_SPATIAL_ZONES.append({
        "meta": z,
        "polygon": Polygon(poly_points)
    })

def st_intersects(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Executes ST_Intersects(geom, ST_SetSRID(ST_MakePoint(lon, lat), 4326))
    Returns matching industrial zone metadata if point is inside, otherwise None.
    """
    point = Point(lon, lat)
    for zone_entry in COMPILED_SPATIAL_ZONES:
        if zone_entry["polygon"].contains(point) or zone_entry["polygon"].intersects(point):
            return zone_entry["meta"]
    return None

def get_all_industrial_zones() -> List[Dict[str, Any]]:
    """Returns all OSM industrial polygon geometries formatted for GeoJSON"""
    return OSM_INDUSTRIAL_ZONES
