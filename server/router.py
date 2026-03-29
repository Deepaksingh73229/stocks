from fastapi import APIRouter

from routes import companies, health, ingest, stocks

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(companies.router)
api_router.include_router(stocks.router)
api_router.include_router(ingest.router)