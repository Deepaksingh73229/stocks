from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "Stock Data Intelligence Dashboard"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "stock_dashboard"

    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # Scheduler
    enable_scheduler: bool = True
    ingest_cron_hour: int = 18
    ingest_cron_minute: int = 30

    # Default stock symbols (NSE)
    default_symbols: List[str] = Field(
        default=[
            "RELIANCE.NS",
            "TCS.NS",
            "INFY.NS",
            "HDFCBANK.NS",
            "ICICIBANK.NS",
            "WIPRO.NS",
            "SBIN.NS",
            "BHARTIARTL.NS",
            "ITC.NS",
            "KOTAKBANK.NS",
        ]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()