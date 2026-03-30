from fastapi import APIRouter, Depends, HTTPException, status

from api.deps import get_stock_service
from schemas.stock import CompanyListResponse, CompanyResponse
from services.stock_service import StockService

router = APIRouter(prefix="/api/v1/companies", tags=["Companies"])


@router.get(
    "",
    response_model=CompanyListResponse,
    summary="List all tracked companies",
    description="Returns a list of all companies currently tracked in the system.",
)
async def list_companies(
    service: StockService = Depends(get_stock_service),
) -> CompanyListResponse:
    result = await service.get_companies()
    if not result["companies"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No companies found. Run /ingest to populate data.",
        )
    return CompanyListResponse(
        total=result["total"],
        companies=[CompanyResponse(**c) for c in result["companies"]],
    )