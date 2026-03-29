from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.deps import get_stock_service
from schemas.stock import (
    CompareResponse,
    StockDataResponse,
    StockPriceResponse,
    StockSeries,
    SummaryResponse,
    TopMoversResponse,
)
from services.stock_service import StockService

router = APIRouter(tags=["Stocks"])


@router.get(
    "/data/{symbol}",
    response_model=StockDataResponse,
    summary="Get stock price data",
    description="Returns OHLCV + computed metrics for the given symbol. Defaults to last 30 days.",
)
async def get_stock_data(
    symbol: str,
    days: Annotated[int, Query(ge=1, le=365, description="Number of days to look back")] = 30,
    service: StockService = Depends(get_stock_service),
) -> StockDataResponse:
    symbol = symbol.upper()
    result = await service.get_stock_data(symbol, days=days)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol '{symbol}' not found. Ensure it has been ingested.",
        )
    if not result["data"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No price data found for '{symbol}' in the last {days} days.",
        )

    return StockDataResponse(
        symbol=result["symbol"],
        period_days=result["period_days"],
        data=[StockPriceResponse(**d) for d in result["data"]],
    )


@router.get(
    "/summary/{symbol}",
    response_model=SummaryResponse,
    summary="Get 52-week summary",
    description="Returns 52-week high, low, average close, and latest daily return.",
)
async def get_summary(
    symbol: str,
    service: StockService = Depends(get_stock_service),
) -> SummaryResponse:
    symbol = symbol.upper()
    result = await service.get_summary(symbol)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Summary for '{symbol}' not found. Ensure it has been ingested.",
        )

    return SummaryResponse(**result)


@router.get(
    "/compare",
    response_model=CompareResponse,
    summary="Compare two stocks",
    description=(
        "Compares closing prices and daily returns of two symbols. "
        "Also returns Pearson correlation of their daily returns."
    ),
)
async def compare_stocks(
    symbol1: Annotated[str, Query(description="First stock symbol, e.g. INFY.NS")],
    symbol2: Annotated[str, Query(description="Second stock symbol, e.g. TCS.NS")],
    days: Annotated[int, Query(ge=7, le=365, description="Lookback period in days")] = 90,
    service: StockService = Depends(get_stock_service),
) -> CompareResponse:
    symbol1, symbol2 = symbol1.upper(), symbol2.upper()

    if symbol1 == symbol2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="symbol1 and symbol2 must be different.",
        )

    result = await service.compare_stocks(symbol1, symbol2, days=days)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not retrieve data for one or both symbols: {symbol1}, {symbol2}.",
        )

    series = []
    for s in result["series"]:
        series.append(
            StockSeries(
                symbol=s["symbol"],
                data=[StockPriceResponse(**d) for d in s["data"]],
                summary=SummaryResponse(**s["summary"]) if s.get("summary") else None,
            )
        )

    return CompareResponse(
        symbol1=result["symbol1"],
        symbol2=result["symbol2"],
        correlation=result["correlation"],
        series=series,
    )


@router.get(
    "/movers",
    response_model=TopMoversResponse,
    summary="Top gainers and losers",
    description="Returns the top N gainers and losers based on the latest daily return.",
)
async def top_movers(
    top_n: Annotated[int, Query(ge=1, le=20, description="Number of results per category")] = 5,
    service: StockService = Depends(get_stock_service),
) -> TopMoversResponse:
    result = await service.get_top_movers(top_n=top_n)
    return TopMoversResponse(**result)