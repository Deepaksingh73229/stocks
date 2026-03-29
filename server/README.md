# 📈 Stock Data Intelligence Dashboard — Backend

A production-grade financial data platform built with **FastAPI**, **MongoDB** (Motor async driver), **pandas**, and **yfinance**. Tracks NSE-listed stocks, computes key metrics, and exposes clean REST APIs with auto-generated Swagger docs.

---

## 🏗️ Project Structure

```
stock-dashboard-backend/
|
│── api/
│   │   ├── deps.py                  # FastAPI dependency injection
│   │   └── v1/
│   │       ├── router.py            # Aggregates all routers
│   │       └── endpoints/
│   │           ├── companies.py     # GET /companies
│   │           ├── stocks.py        # GET /data, /summary, /compare, /movers
│   │           ├── ingest.py        # POST /ingest
│   │           └── health.py        # GET /health
├── core/
│   │   ├── config.py               # Pydantic settings (reads .env)
│   │   └── logging.py              # Structured logging setup
|── db/
│   │   ├── mongodb.py              # Motor client, connect/disconnect, indexes
│   │   └── repository.py           # All MongoDB CRUD operations
│   ├── models/
│   │   └── stock.py                # MongoDB document models (Pydantic)
│   ├── schemas/
│   │   └── stock.py                # API request/response schemas
│   ├── services/
│   │   ├── fetcher.py              # yfinance wrapper
│   │   ├── transformer.py          # Pandas metric computation
│   │   ├── ingestion.py            # Full ingestion pipeline orchestrator
│   │   └── stock_service.py        # Business logic for API queries
│   ├── utils/
│   │   └── scheduler.py            # APScheduler daily cron job
│   └── main.py                     # FastAPI app factory + lifespan
├── tests/
│   ├── conftest.py                 # Pytest fixtures
│   ├── test_transformer.py         # Unit tests for metric computation
│   └── test_api.py                 # Integration tests for all endpoints
├── main.py                         # Uvicorn entrypoint
├── pyproject.toml                  # uv project config + dependencies
├── pytest.ini                      # Pytest configuration
├── .env.example                    # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd stock-dashboard-backend
uv sync
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and preferences
```

### 3. Run the server

```bash
uv run python main.py
```

### 4. Seed data (first run)

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"period": "1y"}'
```

---

## 📡 API Reference

Swagger UI: http://localhost:8000/docs | ReDoc: http://localhost:8000/redoc

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/health | Health + DB check |
| GET | /api/v1/companies | List all tracked companies |
| GET | /api/v1/data/{symbol}?days=30 | OHLCV + metrics |
| GET | /api/v1/summary/{symbol} | 52-week stats |
| GET | /api/v1/compare?symbol1=X&symbol2=Y | Compare + correlation |
| GET | /api/v1/movers?top_n=5 | Top gainers and losers |
| POST | /api/v1/ingest | Trigger ingestion |
| POST | /api/v1/ingest/background | Background ingestion |

---

## 📊 Computed Metrics

| Metric | Formula |
|--------|---------|
| daily_return | (close - open) / open |
| ma7 | 7-day rolling mean of close |
| ma20 | 20-day rolling mean of close |
| volatility_score | 7-day rolling std of daily_return × √252 |
| correlation | Pearson correlation of daily returns |

---

## 🧪 Tests

```bash
uv run pytest -v
```

---

## ⏰ Scheduler

Auto-runs daily at 18:30 IST after NSE market close. Configure via .env:

```env
ENABLE_SCHEDULER=true
INGEST_CRON_HOUR=18
INGEST_CRON_MINUTE=30
```