from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    # Lazy initialization — critical for serverless cold starts
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=10,
        )
    return _client


def get_database() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


async def connect_db() -> None:
    global _client
    logger.info("Connecting to MongoDB...")
    client = get_client()
    await client.admin.command("ping")
    logger.info("MongoDB connection established.")
    await _ensure_indexes()


async def disconnect_db() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")


async def _ensure_indexes() -> None:
    db = get_database()

    await db.companies.create_indexes([
        IndexModel([("symbol", ASCENDING)], unique=True, name="symbol_unique"),
    ])
    await db.stock_prices.create_indexes([
        IndexModel(
            [("symbol", ASCENDING), ("date", DESCENDING)],
            unique=True,
            name="symbol_date_unique",
        ),
        IndexModel([("date", DESCENDING)], name="date_desc"),
    ])
    await db.summaries.create_indexes([
        IndexModel([("symbol", ASCENDING)], unique=True, name="symbol_unique"),
    ])

    logger.info("MongoDB indexes ensured.")