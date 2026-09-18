# AGNI-X: Autonomous Geospatial Network for Industrial Thermal Intelligence & Satellite C2

> **Production-grade geospatial intelligence and command-and-control platform streaming live active fire data from NASA FIRMS satellites, executing spatial boundary filtering against OpenStreetMap industrial zones, running real-time Gaussian plume dispersion with live Open-Meteo winds, and visualizing telemetry across interactive 3D WebGL Earth and 2D Tactical maps.**

---

## 🛰️ System Architecture

```
thermatwin-dashboard/
├── backend/                             # Python + FastAPI Backend Engine
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py                # Live Hotspots, Plume Prediction, ERSS Webhooks
│   │   ├── core/
│   │   │   ├── config.py                # NASA FIRMS Key, DB URL, CORS settings
│   │   │   └── ai_classifier.py         # 3σ Baseline Comparison & TreeSHAP Attribution
│   │   ├── db/
│   │   │   └── spatial.py               # PostGIS / Shapely ST_Intersects OSM Query Engine
│   │   ├── services/
│   │   │   ├── firms.py                 # Async NASA FIRMS Ingestion (VIIRS 375m & MODIS)
│   │   │   └── plume.py                 # Dynamic 2-Hour Downwind Toxic Smoke Trajectory
│   │   └── main.py                      # FastAPI App, CORS & OpenAPI Swagger (/docs)
│   ├── requirements.txt                 # fastapi, uvicorn, shapely, httpx, numpy
│   └── run.py                           # Single-command backend runner
├── src/                                 # Frontend (React 19 + Vite + Tailwind v4 + Leaflet)
│   ├── components/
│   │   ├── Backtesting/
│   │   │   └── SimulationModal.jsx      # Hackathon Evaluator Simulation Benchmarks
│   │   ├── Common/
│   │   │   ├── Badge.jsx                # Standardized 3-tier status badges (🟢, 🟡, 🔴)
│   │   │   ├── NasaLogo.jsx             # Official NASA Meatball SVG Logo
│   │   │   └── Toast.jsx                # High-contrast tactical alert HUD
│   │   ├── Footer/
│   │   │   └── NASABottomDock.jsx       # NASA FIRMS Dock: MEASURE, LOCATION, LAYERS, TIMELINE
│   │   ├── Header.jsx                   # Official NASA FIRMS Crimson Bar with Drawer Trigger
│   │   ├── LayerPanel/
│   │   │   └── LayerControlPanel.jsx    # Overlay toggles & Cloud-Piercing SAR Mode
│   │   ├── Map/
│   │   │   ├── GeospatialMap.jsx        # True Color Satellite Map (No watermarks)
│   │   │   ├── HotspotMarker.jsx        # Pulsing color-coded status markers
│   │   │   ├── IndustrialPolygon.jsx    # Semi-transparent purple OSM industrial boundaries
│   │   │   ├── MapControls.jsx          # Cloud-Piercing SAR Automatic Fallback HUD
│   │   │   ├── SARRadarOverlay.jsx      # Sentinel-1 C-Band SAR radar backscatter
│   │   │   └── ToxicPlumeCone.jsx       # 3-Tier Downwind Toxic Danger Cone
│   │   ├── MetricsBar.jsx               # High-contrast operational status HUD
│   │   └── Sidebar/
│   │       ├── DispatchSummary.jsx      # Surfaced SHAP attribution & 1-click dispatch
│   │       ├── ERSSDispatchModal.jsx    # Raw JSON ERSS-112 Webhook payload inspector
│   │       ├── IncidentCard.jsx         # Auto-pan GPS incident cards
│   │       ├── IncidentFeed.jsx         # Collapsible NASA FIRMS Right Control Drawer
│   │       ├── NASALeftNavDrawer.jsx    # Slide-Out Left NASA FIRMS Menu Drawer
│   │       └── SparklineChart.jsx       # Thermal Digital Twin 3σ Baseline Chart
│   ├── context/
│   │   └── ThermaTwinContext.jsx        # Global React Context state manager
│   ├── services/
│   │   └── api.js                       # FastAPI client + Resilient offline fallback
│   ├── App.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

---

## ⚡ Quick Start: Running Full-Stack

### 1. Start the FastAPI Backend Engine
Open your terminal in `thermatwin-dashboard`:
```bash
.venv\Scripts\python backend/run.py
```
*Backend runs on `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.*

### 2. Start the NASA FIRMS Frontend Dashboard
Open a second terminal in `thermatwin-dashboard`:
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/hotspots/live` | Ingests live NASA FIRMS active fire feed, runs PostGIS `ST_Intersects` on OSM industrial zones, evaluates 3$\sigma$ baseline, and returns GeoJSON with SHAP explainability. |
| `GET` / `POST` | `/api/v1/plume/predict` | Computes 2-hour downwind toxic smoke dispersion danger cone GeoJSON polygons based on live wind vectors. |
| `POST` | `/api/v1/alerts/webhook` | Dispatches emergency JSON payload to National Emergency Response Support System (ERSS-112) gateway. |
| `GET` | `/api/v1/industrial-zones`| Returns GeoJSON of all OpenStreetMap registered industrial boundaries. |
| `GET` | `/docs` | Interactive OpenAPI Swagger test console. |

---

## 🧪 Evaluator Demo & Verification Features

1. **Official NASA FIRMS Aesthetic**: Deep red `#8b0000` header with official NASA Meatball Logo, functional slide-out left navigation drawer, and floating bottom dock (MEASURE, LOCATION, LAYERS, TIMELINE, CAPTURE, SHARE, HELP, VIEW MODE).
2. **PostGIS `ST_Intersects` Boundary Classification**: Distinguishes industrial facilities (`landuse=industrial`, `man_made=works`) from agricultural burns.
3. **Thermal Digital Twin Sparkline Chart**: Compares live FRP against historical 90-day mean and $3\sigma$ threshold envelope.
4. **Surfaced SHAP Explainability**: Visually explains *why* the AI flagged the event (`+38% FRP Surge`, `+27% Inside Industrial Zone`, `-42% Tagged Flare Stack`).
5. **One-Click ERSS-112 Emergency Webhook**: Sends real-time emergency dispatch payload with instant responder tracking.
6. **Cloud-Piercing SAR Automatic Fallback**: Sentinel-1 synthetic radar backscatter overlay automatically engaged when cloud/smoke occlusion $>60\%$.
7. **Historical Backtesting Simulation Mode**: Evaluates Jamnagar normal flaring baseline filtering vs. Vizag/Mundra runaway disasters with timeline playback.
