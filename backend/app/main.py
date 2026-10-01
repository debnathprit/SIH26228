"""FastAPI Application Entry Point for Trusted Computer Vision Assurance."""

import os
from pathlib import Path
import sys

# Ensure repository root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes_assurance import router as assurance_router
from backend.app.api.routes_system import router as system_router

app = FastAPI(
    title="Trusted Computer Vision Assurance API",
    description=(
        "Extensible integrity and assurance framework assessing data, models, "
        "and inference outputs in multi-contributor computer vision pipelines."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for frontend and cross-network client access
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5173",
]

env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins.strip() == "*":
    ALLOWED_ORIGINS = ["*"]
elif env_origins.strip():
    ALLOWED_ORIGINS = list(DEFAULT_ALLOWED_ORIGINS)
    for origin in env_origins.split(","):
        stripped = origin.strip()
        if stripped and stripped not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(stripped)
else:
    ALLOWED_ORIGINS = list(DEFAULT_ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register versioned API routers
app.include_router(system_router, prefix="/api/v1")
app.include_router(assurance_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root_redirect():
    """Root redirect to docs and health status."""
    return {
        "message": "Trusted Computer Vision Assurance API is online.",
        "documentation": "/docs",
        "health_check": "/api/v1/health",
        "system_overview": "/api/v1/system/overview",
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)

