from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

_scheduler: AsyncIOScheduler | None = None


def create_scheduler() -> AsyncIOScheduler:
    return AsyncIOScheduler(timezone="Asia/Kolkata")


def start_scheduler(scheduler: AsyncIOScheduler, db) -> None:
    from services.ingestion import IngestionService

    async def _daily_ingest():
        logger.info("Scheduled ingestion triggered.")
        svc = IngestionService(db)
        await svc.ingest_symbols()

    scheduler.add_job(
        _daily_ingest,
        trigger=CronTrigger(
            hour=settings.ingest_cron_hour,
            minute=settings.ingest_cron_minute,
        ),
        id="daily_ingest",
        name="Daily stock data ingestion",
        replace_existing=True,
        misfire_grace_time=300,
    )

    scheduler.start()
    logger.info(
        "Scheduler started. Daily ingest at %02d:%02d IST.",
        settings.ingest_cron_hour,
        settings.ingest_cron_minute,
    )


def stop_scheduler(scheduler: AsyncIOScheduler) -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")