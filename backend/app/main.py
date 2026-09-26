"""
StockSense Backend - FastAPI application entry point.

Registers all routers, error handlers, CORS, and startup events.
PostgreSQL database via Alembic migrations (create_all kept as dev fallback).
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import auth, config, dashboard, moves, operations, products
from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Dev fallback: create tables if Alembic hasn't run. In production use `alembic upgrade head`."""
    import app.models  # noqa: F401 — ensure metadata populated
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="StockSense API",
        description="Inventory management system — trustworthy stock per product and location.",
        version="0.1.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Error handler
    application.add_exception_handler(AppError, app_error_handler)

    # API v1 routers
    api_prefix = "/api/v1"
    application.include_router(auth.router, prefix=api_prefix)
    application.include_router(dashboard.router, prefix=api_prefix)
    application.include_router(products.router, prefix=api_prefix)
    application.include_router(operations.router, prefix=api_prefix)
    application.include_router(moves.router, prefix=api_prefix)
    application.include_router(config.router, prefix=api_prefix)

    # Health check — verifies API + database connectivity
    @application.get("/api/health")
    @application.get("/api/v1/health")
    @application.get("/health")
    async def health():
        from app.db.session import async_session_factory
        try:
            async with async_session_factory() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception as e:
            return {"status": "degraded", "database": str(e)}

    return application


app = create_app()
