"""FastAPI application entry point for SIAK-Fin."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, reports, stats, threats
from app.config import settings
from app.database import init_db
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle hook."""
    await init_db()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="SIAK-Fin",
    description="Sistem Intelijen Ancaman Siber Keuangan — Financial Threat Intelligence",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(threats.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "siak-fin"}
