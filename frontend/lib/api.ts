const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export interface Company {
    symbol: string;
    name: string;
    sector: string;
    exchange: string;
    currency: string;
}

export interface CompanyListResponse {
    total: number;
    companies: Company[];
}

export interface StockPrice {
    symbol: string;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    daily_return: number | null;
    ma7: number | null;
    ma20: number | null;
    volatility_score: number | null;
}

export interface StockDataResponse {
    symbol: string;
    period_days: number;
    data: StockPrice[];
}

export interface SummaryResponse {
    symbol: string;
    week52_high: number;
    week52_low: number;
    avg_close: number;
    latest_close: number;
    latest_daily_return: number | null;
    total_trading_days: number;
    last_updated: string;
}

export interface StockSeries {
    symbol: string;
    data: StockPrice[];
    summary: SummaryResponse | null;
}

export interface CompareResponse {
    symbol1: string;
    symbol2: string;
    correlation: number | null;
    series: StockSeries[];
}

export interface GainerLoserItem {
    symbol: string;
    name: string;
    latest_close: number;
    daily_return: number;
    daily_return_pct: number;
}

export interface TopMoversResponse {
    gainers: GainerLoserItem[];
    losers: GainerLoserItem[];
}

export interface HealthResponse {
    status: string;
    version: string;
    environment: string;
    db_connected: boolean;
}

export interface IngestResponse {
    message: string;
    symbols_processed: string[];
    symbols_failed: string[];
    duration_seconds: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

export const api = {
    health: () => apiFetch<HealthResponse>("/health"),

    companies: () => apiFetch<CompanyListResponse>("/companies"),

    stockData: (symbol: string, days = 30) =>
        apiFetch<StockDataResponse>(`/data/${symbol}?days=${days}`),

    summary: (symbol: string) => apiFetch<SummaryResponse>(`/summary/${symbol}`),

    compare: (symbol1: string, symbol2: string, days = 90) =>
        apiFetch<CompareResponse>(
            `/compare?symbol1=${symbol1}&symbol2=${symbol2}&days=${days}`
        ),

    movers: (topN = 5) => apiFetch<TopMoversResponse>(`/movers?top_n=${topN}`),

    ingest: (symbols?: string[], period = "1y") =>
        apiFetch<IngestResponse>("/ingest", {
            method: "POST",
            body: JSON.stringify({ symbols: symbols || null, period }),
        }),

    ingestBackground: (symbols?: string[], period = "1y") =>
        apiFetch<{ message: string }>("/ingest/background", {
            method: "POST",
            body: JSON.stringify({ symbols: symbols || null, period }),
        }),
};