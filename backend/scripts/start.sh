#!/usr/bin/env bash
set -e

echo "=== StockSense Backend Starting ==="
echo "Port: ${PORT:-8000}"

# Run Alembic migrations to ensure schema is up-to-date
echo "Applying database migrations..."
alembic upgrade head

# Optionally run deterministic seed if RUN_SEED or SEED_DB is set to true
if [ "${RUN_SEED:-false}" = "true" ] || [ "${SEED_DB:-false}" = "true" ]; then
    echo "Running deterministic database seed..."
    python -m app.seed.seed_db
fi

# Start FastAPI application
echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers "${WEB_CONCURRENCY:-1}"
