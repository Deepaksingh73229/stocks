from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from router import api_router

# from routes.companies import router as company_router
# from routes.health import router as health_router
# from routes.ingest import router as ingest_router
# from routes.stocks import router as stocks_router

from core.config import settings
from core.logging import get_logger, setup_logging
from db.mongodb import connect_db, disconnect_db, get_database
from utils.scheduler import create_scheduler, start_scheduler, stop_scheduler

setup_logging()
logger = get_logger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting %s v%s [%s]", settings.app_name, settings.app_version, settings.environment)

    await connect_db()
    db = get_database()
    app.state.db = db

    scheduler = create_scheduler()
    app.state.scheduler = scheduler

    if settings.enable_scheduler:
        start_scheduler(scheduler, db)

    yield

    # Shutdown
    stop_scheduler(scheduler)
    await disconnect_db()
    logger.info("Application shut down cleanly.")

# ─── App Factory ──────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "A financial data platform for NSE/BSE stock market intelligence. "
            "Provides REST APIs for stock data, metrics, comparisons, and top movers."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ─── CORS ─────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ─── Global Exception Handler ─────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred."},
        )

    # ─── Routers ──────────────────────────────────────────────────────────────
    # app.include_router(company_router)
    # app.include_router(health_router)
    # app.include_router(ingest_router)
    # app.include_router(stocks_router)

    app.include_router(api_router)

    # Root redirect info
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
            "health": "/api/v1/health",
        }

    return app


app = create_app()