import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "ThermaTwin C2 Backend Engine"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api/v1"
    
    # NASA FIRMS Ingestion Configuration
    NASA_FIRMS_MAP_KEY: str = os.getenv("NASA_FIRMS_MAP_KEY", "DEMO_MAP_KEY")
    NASA_FIRMS_BASE_URL: str = "https://firms.modaps.eosdis.nasa.gov/api/country/csv"
    
    # Database Configuration (PostgreSQL + PostGIS)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/thermatwin_postgis"
    )
    
    # Emergency Webhook (ERSS-112) Endpoint
    ERSS_WEBHOOK_URL: str = os.getenv(
        "ERSS_WEBHOOK_URL",
        "https://gateway.erss112.gov.in/api/v1/dispatch"
    )
    
    # CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
