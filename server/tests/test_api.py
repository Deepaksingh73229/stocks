import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime


MOCK_COMPANY = {
    "symbol": "TCS.NS",
    "name": "Tata Consultancy Services",
    "sector": "IT",
    "exchange": "NSE",
    "currency": "INR",
}

MOCK_PRICE = {
    "symbol": "TCS.NS",
    "date": datetime(2024, 6, 1),
    "open": 3500.0,
    "high": 3600.0,
    "low": 3480.0,
    "close": 3550.0,
    "volume": 1200000.0,
    "daily_return": 0.0143,
    "ma7": 3520.0,
    "ma20": 3510.0,
    "volatility_score": 0.18,
}

MOCK_SUMMARY = {
    "symbol": "TCS.NS",
    "week52_high": 4200.0,
    "week52_low": 3100.0,
    "avg_close": 3600.0,
    "latest_close": 3550.0,
    "latest_daily_return": 0.0143,
    "total_trading_days": 252,
    "last_updated": datetime(2024, 6, 1),
}

# ---------------------------------------------------------------------------
# Patch target helpers – use the actual module path, not the old `app.*` path
# ---------------------------------------------------------------------------

_SVC = "services.stock_service.StockService"
_INGEST_SVC = "services.ingestion.IngestionService"


@pytest.mark.asyncio
class TestCompaniesEndpoint:
    async def test_list_companies_success(self, client):
        with patch(
            f"{_SVC}.get_companies",
            new_callable=AsyncMock,
            return_value={"total": 1, "companies": [MOCK_COMPANY]},
        ):
            resp = await client.get("/api/v1/companies")
            assert resp.status_code == 200
            data = resp.json()
            assert data["total"] == 1
            assert data["companies"][0]["symbol"] == "TCS.NS"

    async def test_list_companies_empty(self, client):
        with patch(
            f"{_SVC}.get_companies",
            new_callable=AsyncMock,
            return_value={"total": 0, "companies": []},
        ):
            resp = await client.get("/api/v1/companies")
            assert resp.status_code == 404


@pytest.mark.asyncio
class TestStockDataEndpoint:
    async def test_get_data_success(self, client):
        with patch(
            f"{_SVC}.get_stock_data",
            new_callable=AsyncMock,
            return_value={
                "symbol": "TCS.NS",
                "period_days": 30,
                "data": [MOCK_PRICE],
            },
        ):
            resp = await client.get("/api/v1/data/TCS.NS")
            assert resp.status_code == 200
            data = resp.json()
            assert data["symbol"] == "TCS.NS"
            assert len(data["data"]) == 1

    async def test_get_data_not_found(self, client):
        with patch(
            f"{_SVC}.get_stock_data",
            new_callable=AsyncMock,
            return_value=None,
        ):
            resp = await client.get("/api/v1/data/FAKE.NS")
            assert resp.status_code == 404

    async def test_invalid_days_param(self, client):
        resp = await client.get("/api/v1/data/TCS.NS?days=500")
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestSummaryEndpoint:
    async def test_get_summary_success(self, client):
        with patch(
            f"{_SVC}.get_summary",
            new_callable=AsyncMock,
            return_value=MOCK_SUMMARY,
        ):
            resp = await client.get("/api/v1/summary/TCS.NS")
            assert resp.status_code == 200
            data = resp.json()
            assert data["symbol"] == "TCS.NS"
            assert data["week52_high"] == 4200.0

    async def test_get_summary_not_found(self, client):
        with patch(
            f"{_SVC}.get_summary",
            new_callable=AsyncMock,
            return_value=None,
        ):
            resp = await client.get("/api/v1/summary/FAKE.NS")
            assert resp.status_code == 404


@pytest.mark.asyncio
class TestCompareEndpoint:
    async def test_compare_success(self, client):
        mock_result = {
            "symbol1": "TCS.NS",
            "symbol2": "INFY.NS",
            "correlation": 0.87,
            "series": [
                {"symbol": "TCS.NS", "data": [MOCK_PRICE], "summary": MOCK_SUMMARY},
                {"symbol": "INFY.NS", "data": [MOCK_PRICE], "summary": MOCK_SUMMARY},
            ],
        }
        with patch(
            f"{_SVC}.compare_stocks",
            new_callable=AsyncMock,
            return_value=mock_result,
        ):
            resp = await client.get("/api/v1/compare?symbol1=TCS.NS&symbol2=INFY.NS")
            assert resp.status_code == 200
            data = resp.json()
            assert data["correlation"] == 0.87

    async def test_compare_same_symbol(self, client):
        resp = await client.get("/api/v1/compare?symbol1=TCS.NS&symbol2=TCS.NS")
        assert resp.status_code == 400


@pytest.mark.asyncio
class TestHealthEndpoint:
    async def test_health_check(self, client):
        with patch("db.mongodb.get_client") as mock_client:
            mock_client.return_value.admin.command = AsyncMock(return_value={"ok": 1})
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert "status" in data
            assert "version" in data