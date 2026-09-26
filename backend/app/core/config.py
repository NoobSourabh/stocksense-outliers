"""
StockSense Backend - Application Configuration.

Loads settings from environment variables with validation at startup.
PostgreSQL via Neon is the default database.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database (PostgreSQL — asyncpg driver)
    database_url: str = "postgresql+asyncpg://user:pass@localhost/stocksense"

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        """Ensure the database URL has the correct asyncpg driver for async SQLAlchemy."""
        if not v or not isinstance(v, str):
            return v
        cleaned = v.strip()
        if cleaned.startswith("postgres://"):
            cleaned = cleaned.replace("postgres://", "postgresql+asyncpg://", 1)
        elif cleaned.startswith("postgresql://") and not cleaned.startswith("postgresql+asyncpg://"):
            cleaned = cleaned.replace("postgresql://", "postgresql+asyncpg://", 1)
        if "sslmode=require" in cleaned and "ssl=require" not in cleaned:
            cleaned = cleaned.replace("sslmode=require", "ssl=require")
        return cleaned

    # JWT
    secret_key: str = "change-me-to-a-random-64-char-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sync_database_url(self) -> str:
        """Convert async URL to sync URL for Alembic migrations."""
        return self.database_url.replace("+asyncpg", "").replace("?ssl=require", "?sslmode=require")


@lru_cache
def get_settings() -> Settings:
    """Cached singleton settings instance."""
    return Settings()
