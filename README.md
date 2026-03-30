# 📈 StockIQ — Stock Data Intelligence Dashboard

A full-stack financial data platform built for the **JarNox Internship Assignment**. StockIQ fetches real NSE stock market data, computes financial metrics, stores everything in MongoDB, and visualizes it through a modern React dashboard — all connected via a production-grade FastAPI backend.

---

## 🎯 Assignment Coverage

| Task | Status | Details |
|------|--------|---------|
| **Part 1** — Data Collection & Preparation | ✅ Complete | yfinance + Pandas pipeline with OHLCV cleaning |
| **Part 2** — REST API Development | ✅ Complete | 8 endpoints, full Swagger docs |
| **Part 3** — Visualization Dashboard | ✅ Complete | Next.js dashboard with Recharts |
| **Part 4** — Optional Add-ons | ✅ Complete | Async APIs, background ingestion, scheduler |
| **Custom Metric** — Volatility Score | ✅ Added | Annualised 7-day rolling volatility |
| **Bonus** — Stock Comparison + Correlation | ✅ Added | Pearson correlation with normalised chart |

---

## 🖥️ Dashboard Pages

### Market Overview (Home)
- Live top gainers and losers with daily return badges
- Summary stat cards — total companies, best gainer/loser, top close price
- Quick-access grid of all tracked companies with sector tags

### Markets Page (`/stocks`)
- Full table of all 10 NSE companies with live 52W high and daily return
- Real-time search by symbol, name, or sector
- Skeleton loading states while summaries load in parallel

### Stock Detail Page (`/stocks/[symbol]`)
- Live closing price with gain/loss badge
- Interactive area chart with MA7 + MA20 overlay toggle
- Period filters: 7D / 30D / 90D / 1Y
- 52W high/low, avg close, trading days stat cards
- Latest day metrics table: Open, High, Low, Close, Volume, Daily Return, MA7, MA20

### Compare Page (`/compare`)
- Side-by-side stock selector with swap button
- Normalized % return chart (both stocks on same axis from 0%)
- Pearson correlation badge with strength label (Weak / Moderate / Strong)
- Summary cards for both stocks side-by-side

### Admin — Data Ingestion (`/admin/ingest`)
- Trigger ingestion for default 10 symbols or custom list
- Period selector: 1mo / 3mo / 6mo / 1y / 2y
- Sync or Background mode toggle
- Live result with processed/failed counts and duration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│  Dashboard · Markets · Compare · Admin               │
│  Recharts · shadcn/ui · Tailwind CSS                 │
└───────────────────┬─────────────────────────────────┘
                    │  HTTP (fetch + CORS)
                    │  NEXT_PUBLIC_API_URL=http://localhost:8000
                    ▼
┌─────────────────────────────────────────────────────┐
│               Backend (FastAPI)                      │
│  /api/v1/*  ·  Swagger UI  ·  CORS middleware        │
│                                                      │
│  Routes → Services → Repository → MongoDB            │
└───────────────────┬─────────────────────────────────┘
                    │  Motor (async)
                    ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB                                 │
│  companies · stock_prices · summaries                │
└─────────────────────────────────────────────────────┘
                    ▲
                    │  yfinance (on ingest)
┌─────────────────────────────────────────────────────┐
│  Ingestion Pipeline                                  │
│  fetch_ohlcv → compute_metrics → bulk_upsert         │
│  APScheduler: auto-runs daily at 18:30 IST           │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Data Pipeline — How It Works

### Step 1: Fetch
```python
# services/fetcher.py
yf.Ticker("TCS.NS").history(period="1y", auto_adjust=True)
```
Pulls OHLCV from Yahoo Finance. Strips timezone, drops zero/NaN rows, rounds prices to 4dp.

### Step 2: Transform
```python
# services/transformer.py — all computed in Pandas
daily_return     = (close - open) / open
ma7              = close.rolling(7, min_periods=1).mean()
ma20             = close.rolling(20, min_periods=1).mean()
volatility_score = daily_return.rolling(7, min_periods=2).std() × √252
```

| Metric | Formula | Purpose |
|--------|---------|---------|
| `daily_return` | `(close - open) / open` | Intraday % move |
| `ma7` | 7-day rolling mean of close | Short-term trend |
| `ma20` | 20-day rolling mean of close | Medium-term trend |
| `volatility_score` | 7-day rolling std × √252 | Annualised risk ⭐ custom |
| `correlation` | Pearson on daily returns | Inter-stock relationship ⭐ custom |

### Step 3: Store
Bulk-upserts into 3 MongoDB collections using `(symbol, date)` as the unique key — fully idempotent.

---

## ⚙️ Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| **FastAPI** | REST API framework with auto Swagger docs |
| **Motor** | Async MongoDB driver |
| **yfinance** | Real NSE stock data source |
| **Pandas + NumPy** | Data cleaning and metric computation |
| **APScheduler** | Daily auto-ingestion at 18:30 IST |
| **Pydantic v2** | Schema validation and settings management |
| **MongoDB** | Document store for prices, summaries, companies |

### Frontend
| Tool | Purpose |
|------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe API interfaces matching backend schemas |
| **Recharts** | Area charts, line charts, custom tooltips |
| **shadcn/ui** | Card, Badge, Skeleton, Tabs, Select components |
| **Tailwind CSS v4** | Utility-first styling with CSS variables |

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server + DB status |
| `GET` | `/companies` | All 10 tracked NSE companies |
| `GET` | `/data/{symbol}?days=30` | OHLCV + metrics for N days |
| `GET` | `/summary/{symbol}` | 52-week high/low/avg/latest |
| `GET` | `/compare?symbol1=X&symbol2=Y&days=90` | Side-by-side + Pearson correlation |
| `GET` | `/movers?top_n=5` | Top gainers and losers |
| `POST` | `/ingest` | Synchronous data ingestion |
| `POST` | `/ingest/background` | Background data ingestion |

**Interactive docs:** http://localhost:8000/docs

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and pnpm
- MongoDB running locally on port 27017

---

### 1. Clone the repository

```bash
git clone https://github.com/Deepaksingh73229/stocks.git
cd stocks
```

---

### 2. Start the Backend

```bash
cd server
```

**Install dependencies:**
```bash
pip install fastapi[standard] uvicorn[standard] motor pymongo yfinance \
            pandas numpy pydantic-settings python-dotenv apscheduler httpx
```

**Configure environment** (create `server/.env`):
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=stock_dashboard
ENABLE_SCHEDULER=true
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
```

**Run the server:**
```bash
uvicorn main:app --reload
# Server starts at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

**Seed data** (first run — fetches 1 year of data for all 10 symbols):
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"period": "1y"}'
```

---

### 3. Start the Frontend

```bash
cd frontend
```

**Create `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Install dependencies and run:**
```bash
pnpm install
pnpm dev
# Dashboard at http://localhost:3000
```

---

## 📁 Project Structure

```
stocks/
├── server/                          # FastAPI backend
│   ├── api/
│   │   └── deps.py                  # Dependency injection (DB, services)
│   ├── core/
│   │   ├── config.py                # Environment settings (Pydantic)
│   │   └── logging.py               # Structured logging
│   ├── db/
│   │   ├── mongodb.py               # Motor client + indexes
│   │   └── repository.py            # All MongoDB CRUD operations
│   ├── routes/
│   │   ├── companies.py             # GET /companies
│   │   ├── health.py                # GET /health
│   │   ├── ingest.py                # POST /ingest, /ingest/background
│   │   └── stocks.py                # GET /data, /summary, /compare, /movers
│   ├── services/
│   │   ├── fetcher.py               # yfinance data fetching
│   │   ├── ingestion.py             # Orchestrates full pipeline
│   │   ├── stock_service.py         # Business logic layer
│   │   └── transformer.py           # Pandas metric computation
│   ├── schemas/stock.py             # Pydantic API schemas
│   ├── models/stock.py              # MongoDB document models
│   ├── utils/scheduler.py           # APScheduler cron job
│   ├── router.py                    # Aggregates all routes under /api/v1
│   └── main.py                      # FastAPI app + lifespan
│
└── frontend/                        # Next.js dashboard
    ├── app/
    │   ├── page.tsx                  # Market overview (home)
    │   ├── stocks/
    │   │   ├── page.tsx              # All companies table
    │   │   └── [symbol]/page.tsx     # Individual stock detail
    │   ├── compare/page.tsx          # Side-by-side comparison
    │   └── admin/ingest/page.tsx     # Data ingestion control panel
    ├── components/
    │   ├── charts/
    │   │   ├── PriceChart.tsx        # Area chart with MA overlay
    │   │   └── CompareChart.tsx      # Normalized % return line chart
    │   ├── layout/Navbar.tsx         # Sticky nav with live health indicator
    │   └── stocks/
    │       ├── StatCard.tsx          # Animated summary stat card
    │       └── MoverCard.tsx         # Gainer/loser row card
    └── lib/
        ├── api.ts                    # All backend API calls + TypeScript types
        └── utils.ts                  # formatCurrency, formatPercent, formatDate
```

---

## 🏢 Tracked NSE Symbols

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

---

## ✨ Key Design Decisions

**Async throughout** — Motor (MongoDB driver) and FastAPI are both fully async, so the server never blocks while waiting for DB queries or concurrent requests.

**Idempotent ingestion** — Every price row is upserted using `(symbol, date)` as the unique key. Running ingest multiple times is always safe.

**Typed end-to-end** — Backend Pydantic schemas are mirrored exactly as TypeScript interfaces in `lib/api.ts`, eliminating runtime shape mismatches.

**Normalised comparison** — The compare chart plots `% change from period start` for both stocks on the same Y axis, making performance comparison fair regardless of price difference (e.g. ₹500 vs ₹3,500 stocks).

**Auto-refresh scheduler** — APScheduler fires the full ingestion pipeline at 18:30 IST every weekday, right after NSE market close, keeping the database current without any manual intervention.

**Responsive skeleton loading** — Every page uses Skeleton components during data fetch, so there's no layout shift and the UI feels instant.

---

## 🧪 Running Tests

```bash
cd server
pip install pytest pytest-asyncio pytest-cov httpx
pytest -v
```

Covers:
- `test_transformer.py` — unit tests for all metric computations
- `test_api.py` — integration tests for all 8 endpoints with mocked DB

---

## 🔌 Live API Examples

```bash
# Health check
curl http://localhost:8000/api/v1/health

# All companies
curl http://localhost:8000/api/v1/companies

# TCS last 30 days
curl "http://localhost:8000/api/v1/data/TCS.NS?days=30"

# 52-week summary for Infosys
curl http://localhost:8000/api/v1/summary/INFY.NS

# Compare TCS vs Infosys over 90 days
curl "http://localhost:8000/api/v1/compare?symbol1=TCS.NS&symbol2=INFY.NS&days=90"

# Top 5 movers
curl "http://localhost:8000/api/v1/movers?top_n=5"

# Trigger ingestion (1 year, all symbols)
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"period": "1y"}'
```

---

## 📬 Submission

**GitHub:** https://github.com/Deepaksingh73229/stocks

Submitted to: support@jarnox.com