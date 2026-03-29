import time
from datetime import datetime
from typing import List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from core.config import settings
from core.logging import get_logger
from db.repository import StockRepository
from services.fetcher import fetch_ohlcv, get_company_metadata
from services.transformer import compute_metrics, compute_summary

logger = get_logger(__name__)


class IngestionService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.repo = StockRepository(db)

    async def ingest_symbols(
        self,
        symbols: Optional[List[str]] = None,
        period: str = "1y",
    ) -> dict:
        """
        Full ingestion pipeline for a list of symbols.
        1. Fetch OHLCV from yfinance
        2. Compute metrics (daily_return, MA7, MA20, volatility)
        3. Upsert into MongoDB (stock_prices + summaries + companies)

        Returns a result summary dict.
        """
        symbols = symbols or settings.default_symbols
        start = time.perf_counter()

        processed: List[str] = []
        failed: List[str] = []

        for symbol in symbols:
            try:
                logger.info("Ingesting symbol: %s", symbol)

                # 1. Fetch raw OHLCV
                df = fetch_ohlcv(symbol, period=period)
                if df is None or df.empty:
                    logger.warning("Skipping %s — no data returned.", symbol)
                    failed.append(symbol)
                    continue

                # 2. Compute metrics
                df = compute_metrics(df)

                # 3. Upsert company metadata
                metadata = get_company_metadata(symbol)
                company_doc = {
                    "symbol": symbol,
                    "name": metadata["name"],
                    "sector": metadata["sector"],
                    "exchange": metadata["exchange"],
                    "currency": "INR",
                    "created_at": datetime.utcnow(),
                }
                await self.repo.upsert_company(company_doc)

                # 4. Bulk upsert price + metrics rows
                await self.repo.bulk_upsert_prices(symbol, df)

                # 5. Upsert summary (52w stats)
                summary = compute_summary(df, symbol)
                await self.repo.upsert_summary(summary)

                processed.append(symbol)
                logger.info("Successfully ingested %s", symbol)

            except Exception as exc:
                logger.error("Ingestion failed for %s: %s", symbol, exc, exc_info=True)
                failed.append(symbol)

        duration = round(time.perf_counter() - start, 3)
        logger.info(
            "Ingestion complete. processed=%d failed=%d duration=%.3fs",
            len(processed),
            len(failed),
            duration,
        )

        return {
            "message": "Ingestion complete",
            "symbols_processed": processed,
            "symbols_failed": failed,
            "duration_seconds": duration,
        }