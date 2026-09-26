"""
StockSense Backend - Application Configuration.

Loads settings from environment variables with validation at startup.
PostgreSQL via Neon is the default database.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database (PostgreSQL — asyncpg driver)
    database_url: str = "postgresql+asyncpg://user:pass@localhost/stocksense"

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
