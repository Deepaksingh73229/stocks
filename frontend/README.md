# StockIQ — Frontend

A production-grade financial data dashboard built with **Next.js 16**, **Tailwind CSS v4**, and **shadcn/Radix UI** components. Connects to the FastAPI backend for live NSE/BSE stock market data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS Variables |
| UI Components | Radix UI (headless) + custom shadcn-style components |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Native `fetch` (typed API client) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with Navbar
│   ├── globals.css          # Design system — CSS variables, animations
│   ├── page.tsx             # Dashboard — top movers, company grid
│   ├── loading.tsx          # Global loading state
│   ├── error.tsx            # Global error boundary
│   ├── not-found.tsx        # 404 page
│   ├── stocks/
│   │   ├── page.tsx         # Market explorer — searchable company table
│   │   └── [symbol]/
│   │       └── page.tsx     # Stock detail — chart, metrics, 52W stats
│   ├── compare/
│   │   └── page.tsx         # Stock comparison — normalized chart, correlation
│   └── admin/
│       └── ingest/
│           └── page.tsx     # Data ingestion control panel
├── components/
│   ├── ui/                  # Base UI primitives
│   │   ├── badge.tsx        # Status badge (gain/loss variants)
│   │   ├── button.tsx       # Button (default, outline, ghost, etc.)
│   │   ├── card.tsx         # Card container
│   │   ├── input.tsx        # Text input
│   │   ├── select.tsx       # Radix-powered select dropdown
│   │   ├── skeleton.tsx     # Loading skeleton
│   │   └── tabs.tsx         # Radix-powered tabs
│   ├── layout/
│   │   └── Navbar.tsx       # Sticky nav with health indicator
│   ├── charts/
│   │   ├── PriceChart.tsx   # Area chart with MA7/MA20 overlay
│   │   └── CompareChart.tsx # Normalized % dual-line comparison chart
│   └── stocks/
│       ├── StatCard.tsx     # Animated KPI stat card
│       └── MoverCard.tsx    # Top gainer/loser row item
└── lib/
    ├── api.ts               # Typed API client for all backend endpoints
    └── utils.ts             # Formatting utilities (currency, dates, %)
```

---

## Pages

### `/` — Dashboard
- Top gainers and losers (5 each)
- Key stats: total companies, best/worst performer
- Quick-access company grid linking to detail pages

### `/stocks` — Market Explorer
- Searchable/filterable table of all tracked companies
- Real-time 52W summary data loaded in parallel per company
- Sector color badges, last close price, daily return

### `/stocks/[symbol]` — Stock Detail
- Period selector: 7D / 30D / 90D / 1Y
- Area chart with MA7 and MA20 overlay toggle
- 52W high/low, average close, trading days
- Latest day OHLCV + computed metrics grid
- "Compare" button pre-fills the compare page

### `/compare` — Stock Comparison
- Select two stocks from dropdown
- Normalized % performance chart (both stocks start at 0%)
- Pearson correlation badge with strength label
- Side-by-side summary cards for each stock

### `/admin/ingest` — Data Ingestion
- Choose period (1mo / 3mo / 6mo / 1y / 2y)
- Use default 10 NSE symbols or enter custom comma-separated list
- Synchronous mode (shows full result) or Background mode (non-blocking)
- Result summary: processed/failed counts, duration, symbol-level badges

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- Backend running at `http://localhost:8000` (see `../server/README.md`)

### Install & Run

```bash
cd frontend

# Install dependencies
npm install

# Set backend URL (already set in .env.local)
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Development server
npm run dev
# → http://localhost:3000

# Production build
npm run build
npm start
```

### First-Time Setup

1. Start the FastAPI backend: `cd ../server && uv run fastapi dev`
2. Ingest data via the UI: go to **Admin → Data Ingestion**, click **Start Ingestion**
3. Wait 30–60s for all 10 symbols to be fetched and stored
4. Navigate to the Dashboard — all data will be live

---

## Design System

The app uses a custom CSS variable–based design system with full dark mode support.

### Key Variables

```css
--primary        /* Blue — interactive elements, active states */
--muted          /* Subtle backgrounds, disabled states */
--gain           /* Green — positive returns */
--gain-bg        /* Light green background for badges */
--loss           /* Red — negative returns */
--loss-bg        /* Light red background for badges */
```

### Animations

```css
.animate-fade-up     /* Instant fade + slide up */
.animate-fade-up-d1  /* 50ms delay */
.animate-fade-up-d2  /* 100ms delay */
.animate-fade-up-d3  /* 150ms delay */
.animate-fade-up-d4  /* 200ms delay */
```

Stagger cards on page load using `delay-1`, `delay-2`, etc.

---

## API Integration

All API calls go through `src/lib/api.ts`:

```ts
import { api } from "@/lib/api";

// Fetch companies
const companies = await api.companies();

// Fetch 30-day stock data
const data = await api.stockData("TCS.NS", 30);

// Fetch 52-week summary
const summary = await api.summary("TCS.NS");

// Compare two stocks
const comparison = await api.compare("TCS.NS", "INFY.NS", 90);

// Top movers
const movers = await api.movers(5);

// Trigger ingestion
const result = await api.ingest(["TCS.NS", "INFY.NS"], "1y");
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to point at any backend host.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI backend base URL |