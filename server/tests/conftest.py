import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# ---------------------------------------------------------------------------
# Event-loop fixture (required by pytest-asyncio in "strict" mode)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# App fixture – creates the FastAPI app with a mocked DB state so that
# the lifespan (connect_db / scheduler) is bypassed entirely in tests.
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Provide an async test client with a mocked app state.

    We skip the real lifespan (DB connection, scheduler) by patching
    `connect_db` and `disconnect_db`, then manually setting `app.state.db`
    to a MagicMock so that dependency-injection works without a real Mongo.
    """
    from unittest.mock import AsyncMock, MagicMock, patch

    mock_db = MagicMock()

    with (
        patch("main.connect_db", new_callable=AsyncMock),
        patch("main.disconnect_db", new_callable=AsyncMock),
        patch("main.start_scheduler"),
        patch("main.stop_scheduler"),
    ):
        from main import create_app

        app = create_app()
        # Inject mock DB so Depends(get_db) returns it
        app.state.db = mock_db

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac