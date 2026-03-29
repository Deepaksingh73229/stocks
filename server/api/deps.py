from fastapi import Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.ingestion import IngestionService
from services.stock_service import StockService


def get_db(request: Request) -> AsyncIOMotorDatabase:
    """Extract the MongoDB database from app state (set during lifespan startup)."""
    return request.app.state.db


def get_stock_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> StockService:
    """Dependency that provides a StockService instance."""
    return StockService(db)


def get_ingestion_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> IngestionService:
    """Dependency that provides an IngestionService instance."""
    return IngestionService(db)