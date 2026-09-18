"""
Root launcher for ThermaTwin C2 Backend Engine.
Run with:
    .venv\\Scripts\\python run.py
"""

import sys
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ["PYTHONPATH"] = f"{ROOT_DIR}{os.pathsep}{BACKEND_DIR}{os.pathsep}{os.environ.get('PYTHONPATH', '')}"

import uvicorn

if __name__ == "__main__":
    print("==================================================================")
    print("Starting ThermaTwin C2 FastAPI Backend Engine on http://127.0.0.1:8000")
    print("OpenAPI Swagger Documentation available at: http://127.0.0.1:8000/docs")
    print("==================================================================")
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        app_dir=str(BACKEND_DIR)
    )
