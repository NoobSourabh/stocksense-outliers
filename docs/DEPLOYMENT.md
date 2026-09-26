# StockSense Deployment Guide

This guide covers production deployment for the **StockSense Backend (FastAPI + PostgreSQL)** and integration with the **Next.js Frontend**.

---

## 1. Architecture Overview

- **Backend**: FastAPI (Python 3.12) running under Uvicorn with asyncpg and SQLAlchemy 2.
- **Database**: PostgreSQL (Neon serverless with connection pooler recommended).
- **Frontend**: Next.js 16 (React 19) deployed on Vercel or Node.js host.
- **Authentication**: JWT stored in HttpOnly cookies (`SameSite=Lax`) with fallback to `Authorization: Bearer <token>`.

---

## 2. Environment Variables

### Backend Required Environment Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host/dbname?ssl=require` |
| `SECRET_KEY` | 64-character secret for signing JWTs | `random-64-character-string` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES`| Expiry duration for auth tokens | `480` (8 hours) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:3000,https://stocksense.vercel.app` |
| `PORT` | HTTP port to listen on | Assigned dynamically by platform (defaults to `8000`) |
| `DEBUG` | FastAPI debug mode | `false` |
| `RUN_SEED` | Run deterministic seed on launch | `false` (set `true` once for demo accounts) |

> **Note on `DATABASE_URL`**: StockSense automatically normalizes `postgres://` or `postgresql://` to `postgresql+asyncpg://` and ensures `ssl=require` is configured for asyncpg.

---

## 3. Deploying to Render

### Option A: Render Blueprint (Recommended)

1. Fork or push the repo to GitHub.
2. In Render Dashboard, click **New +** → **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Fill in the required environment variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `CORS_ORIGINS`: Your Vercel frontend URL.
5. Click **Apply**. Render will:
   - Install dependencies from `backend/requirements.txt`
   - Run database migrations via `alembic upgrade head`
   - Start the API with health checks monitored at `/health`.

### Option B: Manual Web Service

1. Click **New +** → **Web Service**.
2. Connect your repository.
3. Configure the following settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `./scripts/start.sh` (or `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`)
   - **Health Check Path**: `/health`
4. Add environment variables under **Environment**:
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `CORS_ORIGINS`
5. Click **Create Web Service**.

---

## 4. Deploying to Railway

1. In Railway, click **New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. Railway automatically detects `railway.json` and uses the Nixpacks builder.
4. Set the following environment variables in the Railway dashboard:
   - `DATABASE_URL`: Your Postgres connection string.
   - `SECRET_KEY`: A secure random string.
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app`
5. Railway will automatically run `./scripts/start.sh` (migrations + uvicorn) and monitor health via `/health`.

---

## 5. Deploying with Docker

To build and run the backend container locally or on any cloud VM (AWS ECS, GCP Cloud Run, DigitalOcean):

```bash
# Build the Docker image from backend directory
cd backend
docker build -t stocksense-api:latest .

# Run container with environment variables
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql+asyncpg://user:pass@host/stocksense?ssl=require" \
  -e SECRET_KEY="your-secret-key" \
  -e CORS_ORIGINS="http://localhost:3000" \
  --name stocksense-backend \
  stocksense-api:latest
```

---

## 6. Database Migrations & Seeding in Production

### Applying Migrations
Migrations are applied automatically during container / service startup via `scripts/start.sh` (`alembic upgrade head`).

To manually run migrations against a remote database:
```bash
cd backend
DATABASE_URL="your-connection-string" alembic upgrade head
```

### Seeding Demo Data
To populate demo users (`Maya Sharma` / `Arjun Patel`), warehouses, catalog, and initial stock in production:

1. **Option 1 (One-off CLI execution)**:
   ```bash
   cd backend
   DATABASE_URL="your-connection-string" python -m app.seed.seed_db
   ```
2. **Option 2 (Platform Env Var)**:
   Set `RUN_SEED=true` in Render/Railway environment variables during initial deployment, then set back to `false`.

---

## 7. Connecting the Frontend (Next.js)

When deploying the frontend to Vercel:

1. Set the environment variable in Vercel project settings:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://stocksense-api.onrender.com
   ```
2. In the backend settings, ensure `CORS_ORIGINS` includes your Vercel URL:
   ```env
   CORS_ORIGINS=https://stocksense.vercel.app
   ```
3. Test public health check:
   ```bash
   curl https://stocksense-api.onrender.com/health
   # Expected response: {"status":"ok","database":"connected"}
   ```
