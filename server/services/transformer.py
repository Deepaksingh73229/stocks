import pandas as pd
import numpy as np
from typing import Optional

from core.logging import get_logger

logger = get_logger(__name__)


def compute_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute all derived metrics on an OHLCV DataFrame sorted by date ascending.

    Adds columns:
      - daily_return      : (close - open) / open
      - ma7               : 7-day rolling mean of close
      - ma20              : 20-day rolling mean of close
      - volatility_score  : 7-day rolling std of daily_return (annualised)
    """
    df = df.sort_values("date").reset_index(drop=True)

    # Daily return
    df["daily_return"] = ((df["close"] - df["open"]) / df["open"]).round(6)

    # Moving averages
    df["ma7"] = df["close"].rolling(window=7, min_periods=1).mean().round(4)
    df["ma20"] = df["close"].rolling(window=20, min_periods=1).mean().round(4)

    # Volatility: rolling 7-day std of daily_return (annualised √252)
    df["volatility_score"] = (
        df["daily_return"]
        .rolling(window=7, min_periods=2)
        .std()
        .multiply(np.sqrt(252))
        .round(6)
    )

    return df


def compute_summary(df: pd.DataFrame, symbol: str) -> dict:
    """
    Compute 52-week (or available) summary statistics.

    Returns a dict ready for upsert into the `summaries` collection.
    """
    latest = df.iloc[-1]
    return {
        "symbol": symbol,
        "week52_high": float(df["high"].max()),
        "week52_low": float(df["low"].min()),
        "avg_close": float(df["close"].mean().round(4)),
        "latest_close": float(latest["close"]),
        "latest_daily_return": (
            float(latest["daily_return"]) if pd.notna(latest.get("daily_return")) else None
        ),
        "total_trading_days": len(df),
    }


def compute_correlation(df1: pd.DataFrame, df2: pd.DataFrame) -> Optional[float]:
    """
    Compute Pearson correlation of daily returns between two DataFrames.
    DataFrames must have `date` and `daily_return` columns.
    """
    try:
        merged = pd.merge(
            df1[["date", "daily_return"]].rename(columns={"daily_return": "r1"}),
            df2[["date", "daily_return"]].rename(columns={"daily_return": "r2"}),
            on="date",
            how="inner",
        ).dropna()

        if len(merged) < 5:
            return None

        corr = merged["r1"].corr(merged["r2"])
        return round(float(corr), 6) if pd.notna(corr) else None
    except Exception as exc:
        logger.warning("Correlation computation failed: %s", exc)
        return None