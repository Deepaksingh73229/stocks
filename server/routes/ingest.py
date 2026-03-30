from fastapi import APIRouter, BackgroundTasks, Depends, status

from api.deps import get_ingestion_service
from schemas.stock import IngestRequest, IngestResponse
from services.ingestion import IngestionService

router = APIRouter(prefix="/api/v1/ingest", tags=["Ingestion"])


@router.post(
    "",
    response_model=IngestResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger data ingestion",
    description=(
        "Fetches OHLCV data from yfinance, computes metrics, and upserts into MongoDB. "
        "If no symbols are provided, uses the default configured list. "
        "Runs synchronously and returns a result summary."
    ),
)
async def trigger_ingest(
    payload: IngestRequest = IngestRequest(),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestResponse:
    result = await service.ingest_symbols(
        symbols=payload.symbols,
        period=payload.period,
    )
    return IngestResponse(**result)


@router.post(
    "/background",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger ingestion in background",
    description="Fires off ingestion asynchronously and returns immediately.",
)
async def trigger_ingest_background(
    background_tasks: BackgroundTasks,
    payload: IngestRequest = IngestRequest(),
    service: IngestionService = Depends(get_ingestion_service),
) -> dict:
    background_tasks.add_task(
        service.ingest_symbols,
        symbols=payload.symbols,
        period=payload.period,
    )
    return {"message": "Ingestion started in background."}