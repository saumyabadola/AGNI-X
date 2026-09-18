"""
ThermaTwin Command-and-Control FastAPI Backend Application
Main entrypoint initializing CORS, API routers, and health telemetry.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.routes import router as api_router
from datetime import datetime

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack C2 engine streaming NASA FIRMS anomalies, OSM boundaries, and ERSS-112 webhook dispatches.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ONLINE",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "utc_time": datetime.utcnow().isoformat(),
        "endpoints": {
            "docs": "/docs",
            "live_hotspots": f"{settings.API_V1_STR}/hotspots/live",
            "plume_predict": f"{settings.API_V1_STR}/plume/predict",
            "alerts_webhook": f"{settings.API_V1_STR}/alerts/webhook",
            "industrial_zones": f"{settings.API_V1_STR}/industrial-zones"
        }
    }
