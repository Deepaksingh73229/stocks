from datetime import datetime, timedelta
from typing import List, Optional

import pandas as pd
from pymongo import ReplaceOne
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.logging import get_logger

logger = get_logger(__name__)


class StockRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.companies = db.companies
        self.stock_prices = db.stock_prices
        self.summaries = db.summaries

    # ─── Companies ────────────────────────────────────────────────────────────

    async def upsert_company(self, doc: dict) -> None:
        await self.companies.replace_one(
            {"symbol": doc["symbol"]},
            {**doc, "updated_at": datetime.utcnow()},
            upsert=True,
        )

    async def get_all_companies(self) -> List[dict]:
        cursor = self.companies.find({}, {"_id": 0}).sort("symbol", 1)
        return await cursor.to_list(length=None)

    async def get_company(self, symbol: str) -> Optional[dict]:
        return await self.companies.find_one({"symbol": symbol}, {"_id": 0})

    # ─── Stock Prices ─────────────────────────────────────────────────────────

    async def bulk_upsert_prices(self, symbol: str, df: pd.DataFrame) -> int:
        """Bulk upsert OHLCV + metrics rows from a DataFrame."""
        if df.empty:
            return 0

        operations = []
        for _, row in df.iterrows():
            doc = {
                "symbol": symbol,
                "date": row["date"].to_pydatetime(),
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "volume": float(row["volume"]),
                "daily_return": _safe_float(row.get("daily_return")),
                "ma7": _safe_float(row.get("ma7")),
                "ma20": _safe_float(row.get("ma20")),
                "volatility_score": _safe_float(row.get("volatility_score")),
                "created_at": datetime.utcnow(),
            }
            operations.append(
                ReplaceOne(
                    {"symbol": symbol, "date": doc["date"]},
                    doc,
                    upsert=True,
                )
            )

        if operations:
            result = await self.stock_prices.bulk_write(operations, ordered=False)
            logger.info(
                "Upserted %d docs for %s (matched=%d, modified=%d)",
                len(operations),
                symbol,
                result.matched_count,
                result.modified_count,
            )
            return len(operations)
        return 0

    async def get_prices(
        self, symbol: str, days: int = 30
    ) -> List[dict]:
        since = datetime.utcnow() - timedelta(days=days)
        cursor = (
            self.stock_prices.find(
                {"symbol": symbol, "date": {"$gte": since}},
                {"_id": 0},
            )
            .sort("date", 1)
        )
        return await cursor.to_list(length=None)

    async def get_prices_for_symbols(
        self, symbols: List[str], days: int = 30
    ) -> List[dict]:
        since = datetime.utcnow() - timedelta(days=days)
        cursor = (
            self.stock_prices.find(
                {"symbol": {"$in": symbols}, "date": {"$gte": since}},
                {"_id": 0},
            )
            .sort("date", 1)
        )
        return await cursor.to_list(length=None)

    async def get_latest_price(self, symbol: str) -> Optional[dict]:
        return await self.stock_prices.find_one(
            {"symbol": symbol}, {"_id": 0}, sort=[("date", -1)]
        )

    async def get_latest_prices_all(self) -> List[dict]:
        """Get the most recent price document for every symbol (for top movers)."""
        pipeline = [
            {"$sort": {"date": -1}},
            {"$group": {"_id": "$symbol", "doc": {"$first": "$$ROOT"}}},
            {"$replaceRoot": {"newRoot": "$doc"}},
            {"$project": {"_id": 0}},
        ]
        cursor = self.stock_prices.aggregate(pipeline)
        return await cursor.to_list(length=None)

    # ─── Summaries ────────────────────────────────────────────────────────────

    async def upsert_summary(self, doc: dict) -> None:
        await self.summaries.replace_one(
            {"symbol": doc["symbol"]},
            {**doc, "last_updated": datetime.utcnow()},
            upsert=True,
        )

    async def get_summary(self, symbol: str) -> Optional[dict]:
        return await self.summaries.find_one({"symbol": symbol}, {"_id": 0})

    async def get_all_summaries(self) -> List[dict]:
        cursor = self.summaries.find({}, {"_id": 0})
        return await cursor.to_list(length=None)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _safe_float(value) -> Optional[float]:
    try:
        import math
        f = float(value)
        return None if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return None