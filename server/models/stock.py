"""
MongoDB document models (Pydantic).

These mirror the shape stored in each collection. They are intentionally
separate from the API-facing schemas in schemas/stock.py so that internal
storage concerns (e.g. `created_at`, `_id`) don't leak into responses.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CompanyDocument(BaseModel):
    symbol: str
    name: str
    sector: str
    exchange: str
    currency: str = "INR"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class StockPriceDocument(BaseModel):
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
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SummaryDocument(BaseModel):
    symbol: str
    week52_high: float
    week52_low: float
    avg_close: float
    latest_close: float
    latest_daily_return: Optional[float] = None
    total_trading_days: int
    last_updated: datetime = Field(default_factory=datetime.utcnow)