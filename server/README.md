# 📈 Stock Data Intelligence Dashboard — Backend

A production-grade financial data platform built with **FastAPI**, **MongoDB** (Motor async driver), **pandas**, and **yfinance**. Tracks NSE-listed stocks, computes key metrics, and exposes clean REST APIs with auto-generated Swagger docs.

---

## 🏗️ Project Structure

```
server/
├── api/
│   ├── __init__.py
│   └── deps.py                  # FastAPI dependency injection
├── core/
│   ├── config.py                # Pydantic settings (reads .env)
│   └── logging.py               # Structured logging setup
├── db/
│   ├── mongodb.py               # Motor client, connect/disconnect, indexes
│   └── repository.py            # All MongoDB CRUD operations
├── models/
│   └── stock.py                 # MongoDB document models (Pydantic)
├── routes/
│   ├── __init__.py
│   ├── companies.py             # GET /companies
│   ├── health.py                # GET /health
│   ├── ingest.py                # POST /ingest
│   └── stocks.py                # GET /data, /summary, /compare, /movers
├── schemas/
│   └── stock.py                 # API request/response schemas
├── services/
│   ├── fetcher.py               # yfinance wrapper
│   ├── ingestion.py             # Full ingestion pipeline orchestrator
│   ├── stock_service.py         # Business logic for API queries
│   └── transformer.py           # Pandas metric computation
├── tests/
│   ├── conftest.py              # Pytest fixtures (async client, mocked DB)
│   ├── test_api.py              # Integration tests for all endpoints
│   └── test_transformer.py      # Unit tests for metric computation
├── utils/
│   └── scheduler.py             # APScheduler daily cron job
├── main.py                      # FastAPI app factory + lifespan
├── router.py                    # Aggregates all routers under /api/v1
├── .env.example                 # Environment variable template
└── pyproject.toml               # Project config + dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port 27017 (or a MongoDB Atlas URI)

---

### 1. Clone and install dependencies

**With uv (recommended):**
```bash
git clone <repo-url>
cd stocks/server

uv add fastapi[standard] uvicorn[standard] motor pymongo yfinance pandas numpy \
       pydantic-settings python-dotenv apscheduler httpx

# Dev/test dependencies
uv add --dev pytest pytest-asyncio pytest-cov
```

**With pip:**
```bash
git clone <repo-url>
cd stocks/server

pip install fastapi[standard] uvicorn[standard] motor pymongo yfinance pandas numpy \
            pydantic-settings python-dotenv apscheduler httpx \
            pytest pytest-asyncio pytest-cov
```

---

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and preferences
```

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | `stock_dashboard` | Database name |
| `ENABLE_SCHEDULER` | `true` | Enable daily auto-ingestion |
| `INGEST_CRON_HOUR` | `18` | Hour for daily ingest (IST) |
| `INGEST_CRON_MINUTE` | `30` | Minute for daily ingest (IST) |
| `DEBUG` | `false` | Enable debug mode |
| `ENVIRONMENT` | `production` | App environment label |

---

### 3. Start MongoDB

Make sure MongoDB is running before starting the server:

```bash
# Windows (if installed as a service)
net start MongoDB

# macOS / Linux
mongod --dbpath /data/db
```

---

### 4. Run the server

**Development (with hot reload):**
```bash
uv run fastapi dev
```

**Production:**
```bash
uv run fastapi run
# or
uvicorn main:app --host 0.0.0.0 --port 8000
```

On successful startup you should see:
```
INFO  | main       | Starting Stock Data Intelligence Dashboard v1.0.0 [production]
INFO  | db.mongodb | Connecting to MongoDB at mongodb://localhost:27017
INFO  | db.mongodb | MongoDB connection established.
INFO  | db.mongodb | MongoDB indexes ensured.
INFO  | utils.scheduler | Scheduler started. Daily ingest at 18:30 IST.
```

---

### 5. Seed data (first run)

Populate the database with 1 year of historical data for all default NSE symbols:

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"period": "1y"}'
```

Or use the interactive Swagger UI at **http://localhost:8000/docs**.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check + DB connectivity |
| `GET` | `/api/v1/companies` | List all tracked companies |
| `GET` | `/api/v1/data/{symbol}?days=30` | OHLCV + computed metrics |
| `GET` | `/api/v1/summary/{symbol}` | 52-week stats |
| `GET` | `/api/v1/compare?symbol1=X&symbol2=Y&days=90` | Compare two stocks + Pearson correlation |
| `GET` | `/api/v1/movers?top_n=5` | Top gainers and losers |
| `POST` | `/api/v1/ingest` | Trigger synchronous ingestion |
| `POST` | `/api/v1/ingest/background` | Trigger background ingestion |

### Interactive Docs

- **Swagger UI** → http://localhost:8000/docs
- **ReDoc** → http://localhost:8000/redoc

---

### Example requests

**Get last 30 days of TCS data:**
```bash
curl http://localhost:8000/api/v1/data/TCS.NS?days=30
```

**Get 52-week summary for Infosys:**
```bash
curl http://localhost:8000/api/v1/summary/INFY.NS
```

**Compare two stocks:**
```bash
curl "http://localhost:8000/api/v1/compare?symbol1=TCS.NS&symbol2=INFY.NS&days=90"
```

**Top 5 gainers and losers:**
```bash
curl http://localhost:8000/api/v1/movers?top_n=5
```

**Ingest specific symbols:**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["RELIANCE.NS", "TCS.NS"], "period": "6mo"}'
```

---

## 📊 Computed Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| `daily_return` | `(close - open) / open` | Intraday return percentage |
| `ma7` | 7-day rolling mean of close | Short-term trend |
| `ma20` | 20-day rolling mean of close | Medium-term trend |
| `volatility_score` | 7-day rolling std of `daily_return` × √252 | Annualised volatility |
| `correlation` | Pearson correlation of daily returns | Stock relationship (compare endpoint) |

---

## 🗄️ Database Collections

| Collection | Description |
|------------|-------------|
| `companies` | Company metadata (symbol, name, sector, exchange) |
| `stock_prices` | Daily OHLCV rows + all computed metrics |
| `summaries` | 52-week aggregated stats per symbol |

**Indexes created on startup:**
- `companies.symbol` — unique
- `stock_prices.(symbol, date)` — unique compound
- `stock_prices.date` — descending for range queries
- `summaries.symbol` — unique

---

## 🏢 Default Tracked Symbols (NSE)

| Symbol | Company | Sector |
|--------|---------|--------|
| `RELIANCE.NS` | Reliance Industries | Energy |
| `TCS.NS` | Tata Consultancy Services | IT |
| `INFY.NS` | Infosys | IT |
| `HDFCBANK.NS` | HDFC Bank | Banking |
| `ICICIBANK.NS` | ICICI Bank | Banking |
| `WIPRO.NS` | Wipro | IT |
| `SBIN.NS` | State Bank of India | Banking |
| `BHARTIARTL.NS` | Bharti Airtel | Telecom |
| `ITC.NS` | ITC Limited | FMCG |
| `KOTAKBANK.NS` | Kotak Mahindra Bank | Banking |

To add more symbols, update `DEFAULT_SYMBOLS` in your `.env` file or pass them directly to the `/ingest` endpoint.

---

## 🧪 Running Tests

```bash
# Run all tests
uv run pytest -v

# Run with coverage report
uv run pytest -v --cov=. --cov-report=term-missing

# Run only unit tests (transformer)
uv run pytest tests/test_transformer.py -v

# Run only API integration tests
uv run pytest tests/test_api.py -v
```

Test coverage includes:
- **`test_transformer.py`** — unit tests for `compute_metrics`, `compute_summary`, `compute_correlation`
- **`test_api.py`** — integration tests for all 8 endpoints with mocked service layer

---

## ⏰ Scheduler

The scheduler automatically ingests fresh data daily at **18:30 IST** (after NSE market close), keeping your database up to date without manual intervention.

Configure via `.env`:
```env
ENABLE_SCHEDULER=true
INGEST_CRON_HOUR=18
INGEST_CRON_MINUTE=30
```

To disable:
```env
ENABLE_SCHEDULER=false
```

---

## 🔧 Architecture Overview

```
Request
   │
   ▼
FastAPI Router (router.py)
   │
   ▼
Route Handler (routes/)
   │  uses Depends(get_stock_service)
   ▼
Service Layer (services/stock_service.py)
   │  business logic, calls repository
   ▼
Repository Layer (db/repository.py)
   │  async MongoDB queries via Motor
   ▼
MongoDB Collections
```

**Ingestion Pipeline:**
```
POST /ingest
   │
   ▼
IngestionService.ingest_symbols()
   │
   ├── fetcher.fetch_ohlcv()        ← yfinance
   ├── transformer.compute_metrics() ← pandas
   ├── repo.upsert_company()
   ├── repo.bulk_upsert_prices()
   └── repo.upsert_summary()
```

---

## 🐳 Docker (Optional)

Create a `Dockerfile` in the `server/` directory:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install fastapi[standard] uvicorn[standard] motor pymongo yfinance \
    pandas numpy pydantic-settings python-dotenv apscheduler httpx
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t stock-dashboard-backend .
docker run -p 8000:8000 --env-file .env stock-dashboard-backend
```

---

## 📝 Notes

- All datetimes are stored and returned in **UTC**
- Stock symbols must use the **yfinance format** (e.g. `TCS.NS`, not just `TCS`)
- The `/ingest` endpoint is idempotent — re-running it upserts existing data safely
- `daily_return` is calculated as intraday return `(close - open) / open`, not day-over-day