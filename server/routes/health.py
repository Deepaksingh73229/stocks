from fastapi import APIRouter, Request

from core.config import settings
from db.mongodb import get_client
from schemas.stock import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns API health status and MongoDB connectivity.",
)
async def health_check(request: Request) -> HealthResponse:
    db_connected = False
    try:
        client = get_client()
        await client.admin.command("ping")
        db_connected = True
    except Exception:
        pass

    return HealthResponse(
        status="ok" if db_connected else "degraded",
        version=settings.app_version,
        environment=settings.environment,
        db_connected=db_connected,
    )