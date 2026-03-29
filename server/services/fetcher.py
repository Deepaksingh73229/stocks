import pandas as pd
import yfinance as yf
from typing import Dict, List, Optional

from core.logging import get_logger

logger = get_logger(__name__)

# Known metadata for NSE symbols
SYMBOL_METADATA: Dict[str, Dict[str, str]] = {
    "RELIANCE.NS": {"name": "Reliance Industries", "sector": "Energy", "exchange": "NSE"},
    "TCS.NS":       {"name": "Tata Consultancy Services", "sector": "IT", "exchange": "NSE"},
    "INFY.NS":      {"name": "Infosys", "sector": "IT", "exchange": "NSE"},
    "HDFCBANK.NS":  {"name": "HDFC Bank", "sector": "Banking", "exchange": "NSE"},
    "ICICIBANK.NS": {"name": "ICICI Bank", "sector": "Banking", "exchange": "NSE"},
    "WIPRO.NS":     {"name": "Wipro", "sector": "IT", "exchange": "NSE"},
    "SBIN.NS":      {"name": "State Bank of India", "sector": "Banking", "exchange": "NSE"},
    "BHARTIARTL.NS":{"name": "Bharti Airtel", "sector": "Telecom", "exchange": "NSE"},
    "ITC.NS":       {"name": "ITC Limited", "sector": "FMCG", "exchange": "NSE"},
    "KOTAKBANK.NS": {"name": "Kotak Mahindra Bank", "sector": "Banking", "exchange": "NSE"},
}


def get_company_metadata(symbol: str) -> Dict[str, str]:
    """Return metadata for a symbol, falling back to yfinance info."""
    if symbol in SYMBOL_METADATA:
        return SYMBOL_METADATA[symbol]

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            "name": info.get("longName", symbol),
            "sector": info.get("sector", "Unknown"),
            "exchange": info.get("exchange", "Unknown"),
        }
    except Exception:
        return {"name": symbol, "sector": "Unknown", "exchange": "Unknown"}


def fetch_ohlcv(symbol: str, period: str = "1y") -> Optional[pd.DataFrame]:
    """
    Fetch OHLCV data from yfinance and return a cleaned DataFrame.

    Columns returned: date, open, high, low, close, volume
    """
    try:
        logger.debug("Fetching %s for period=%s", symbol, period)
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, auto_adjust=True)

        if df.empty:
            logger.warning("No data returned for symbol: %s", symbol)
            return None

        df = df.reset_index()
        df.columns = [c.lower() for c in df.columns]

        # Keep only required columns
        df = df[["date", "open", "high", "low", "close", "volume"]].copy()

        # Normalize datetime (strip timezone → UTC naive)
        df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)

        # Drop rows where close is NaN or zero
        df = df[df["close"].notna() & (df["close"] > 0)].reset_index(drop=True)

        # Round floats
        for col in ["open", "high", "low", "close"]:
            df[col] = df[col].round(4)
        df["volume"] = df["volume"].astype(float)

        logger.info("Fetched %d rows for %s", len(df), symbol)
        return df

    except Exception as exc:
        logger.error("Failed to fetch %s: %s", symbol, exc)
        return None