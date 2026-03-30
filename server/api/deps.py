from fastapi import Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.ingestion import IngestionService
from services.stock_service import StockService


async def get_db(request: Request) -> AsyncIOMotorDatabase:
    """Lazy DB getter — works even if lifespan didn't connect."""
    db = getattr(request.app.state, "db", None)
    if db is None:
        # Fallback: try connecting now
        from db.mongodb import connect_db, get_database
        try:
            await connect_db()
            db = get_database()
            request.app.state.db = db
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database unavailable: {e}",
            )
    return db


def get_stock_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> StockService:
    return StockService(db)


def get_ingestion_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> IngestionService:
    return IngestionService(db)