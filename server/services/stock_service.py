from typing import List, Optional

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.logging import get_logger
from db.repository import StockRepository
from services.transformer import compute_correlation

logger = get_logger(__name__)


class StockService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.repo = StockRepository(db)

    async def get_companies(self) -> dict:
        companies = await self.repo.get_all_companies()
        return {"total": len(companies), "companies": companies}

    async def get_stock_data(self, symbol: str, days: int = 30) -> Optional[dict]:
        company = await self.repo.get_company(symbol)
        if not company:
            return None

        prices = await self.repo.get_prices(symbol, days=days)
        return {
            "symbol": symbol,
            "period_days": days,
            "data": prices,
        }

    async def get_summary(self, symbol: str) -> Optional[dict]:
        return await self.repo.get_summary(symbol)

    async def compare_stocks(
        self, symbol1: str, symbol2: str, days: int = 90
    ) -> Optional[dict]:
        """
        Compare two stocks over the given period.
        Returns price series for both + Pearson correlation of daily returns.
        """
        prices1 = await self.repo.get_prices(symbol1, days=days)
        prices2 = await self.repo.get_prices(symbol2, days=days)

        if not prices1 or not prices2:
            return None

        summary1 = await self.repo.get_summary(symbol1)
        summary2 = await self.repo.get_summary(symbol2)

        # Compute correlation
        df1 = pd.DataFrame(prices1)
        df2 = pd.DataFrame(prices2)
        correlation = compute_correlation(df1, df2)

        return {
            "symbol1": symbol1,
            "symbol2": symbol2,
            "correlation": correlation,
            "series": [
                {"symbol": symbol1, "data": prices1, "summary": summary1},
                {"symbol": symbol2, "data": prices2, "summary": summary2},
            ],
        }

    async def get_top_movers(self, top_n: int = 5) -> dict:
        """
        Return top N gainers and losers based on latest daily_return.
        """
        latest_docs = await self.repo.get_latest_prices_all()
        companies = await self.repo.get_all_companies()
        company_map = {c["symbol"]: c for c in companies}

        movers = []
        for doc in latest_docs:
            daily_return = doc.get("daily_return")
            if daily_return is None:
                continue
            company = company_map.get(doc["symbol"], {})
            movers.append(
                {
                    "symbol": doc["symbol"],
                    "name": company.get("name", doc["symbol"]),
                    "latest_close": doc.get("close", 0.0),
                    "daily_return": daily_return,
                    "daily_return_pct": round(daily_return * 100, 4),
                }
            )

        movers.sort(key=lambda x: x["daily_return"], reverse=True)

        return {
            "gainers": movers[:top_n],
            "losers": movers[-top_n:][::-1],
        }