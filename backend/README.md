# StockSense Backend

FastAPI + async SQLAlchemy 2 + Alembic + PostgreSQL (Neon).

## Teammate Quickstart

### 1. Environment Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` is set to the shared Neon PostgreSQL instance.

### 3. Database Migrations & Seed
```bash
# Run migrations
python -m alembic upgrade head

# Seed demo dataset (2 users, 2 warehouses, 4 products, operations)
python -m app.seed.seed_db
```

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be available at: http://localhost:8000/api/docs
