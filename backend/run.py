"""
Convenience launcher for the ThermaTwin FastAPI backend server.
Run with:
    .venv\\Scripts\\python backend/run.py
or
    .venv\\Scripts\\python run.py
"""

import sys
import os
from pathlib import Path

# Add project root and backend dir to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Set PYTHONPATH environment variable so uvicorn reloader subprocess also inherits it
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
