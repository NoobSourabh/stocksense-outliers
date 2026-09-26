"""
StockSense Backend - Database session management.

Async SQLAlchemy engine and session factory for PostgreSQL via asyncpg.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings


def _create_engine():
    """Create the async engine with PostgreSQL-specific settings."""
    settings = get_settings()
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        future=True,
        # Use NullPool for serverless Neon — each connection goes through the pooler
        poolclass=NullPool,
    )
    return engine


engine = _create_engine()
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    """FastAPI dependency yielding a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
