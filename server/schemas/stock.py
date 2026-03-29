from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ─── Company Schemas ───────────────────────────────────────────────────────────

class CompanyResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    exchange: str
    currency: str

    model_config = {"from_attributes": True}


class CompanyListResponse(BaseModel):
    total: int
    companies: List[CompanyResponse]


# ─── Stock Price Schemas ───────────────────────────────────────────────────────

class StockPriceResponse(BaseModel):
    symbol: str
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    daily_return: Optional[float] = None
    ma7: Optional[float] = None
    ma20: Optional[float] = None
    volatility_score: Optional[float] = None

    model_config = {"from_attributes": True}


class StockDataResponse(BaseModel):
    symbol: str
    period_days: int
    data: List[StockPriceResponse]


# ─── Summary Schemas ───────────────────────────────────────────────────────────

class SummaryResponse(BaseModel):
    symbol: str
    week52_high: float
    week52_low: float
    avg_close: float
    latest_close: float
    latest_daily_return: Optional[float] = None
    total_trading_days: int
    last_updated: datetime


# ─── Compare Schemas ──────────────────────────────────────────────────────────

class StockSeries(BaseModel):
    symbol: str
    data: List[StockPriceResponse]
    summary: Optional[SummaryResponse] = None


class CompareResponse(BaseModel):
    symbol1: str
    symbol2: str
    correlation: Optional[float] = Field(
        None,
        description="Pearson correlation of daily returns between the two symbols",
    )
    series: List[StockSeries]


# ─── Top Gainers / Losers ──────────────────────────────────────────────────────

class GainerLoserItem(BaseModel):
    symbol: str
    name: str
    latest_close: float
    daily_return: float
    daily_return_pct: float


class TopMoversResponse(BaseModel):
    gainers: List[GainerLoserItem]
    losers: List[GainerLoserItem]


# ─── Ingest Schemas ───────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    symbols: Optional[List[str]] = Field(
        None,
        description="List of yfinance symbols to ingest. Defaults to configured list.",
        examples=[["RELIANCE.NS", "TCS.NS"]],
    )
    period: str = Field(
        default="1y",
        description="yfinance period string: 1mo, 3mo, 6mo, 1y, 2y",
    )


class IngestResponse(BaseModel):
    message: str
    symbols_processed: List[str]
    symbols_failed: List[str]
    duration_seconds: float


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    db_connected: bool