import pandas as pd
import numpy as np
import pytest
from datetime import datetime, timedelta

from services.transformer import compute_metrics, compute_summary, compute_correlation


def _make_df(n: int = 20) -> pd.DataFrame:
    """Generate a synthetic OHLCV DataFrame."""
    dates = [datetime(2024, 1, 1) + timedelta(days=i) for i in range(n)]
    closes = [100.0 + i * 0.5 for i in range(n)]
    return pd.DataFrame({
        "date": dates,
        "open":   [c - 1 for c in closes],
        "high":   [c + 2 for c in closes],
        "low":    [c - 2 for c in closes],
        "close":  closes,
        "volume": [100000.0] * n,
    })


class TestComputeMetrics:
    def test_columns_added(self):
        df = compute_metrics(_make_df())
        assert "daily_return" in df.columns
        assert "ma7" in df.columns
        assert "ma20" in df.columns
        assert "volatility_score" in df.columns

    def test_daily_return_formula(self):
        df = compute_metrics(_make_df())
        row = df.iloc[0]
        expected = (row["close"] - row["open"]) / row["open"]
        assert abs(row["daily_return"] - expected) < 1e-5

    def test_ma7_length(self):
        df = compute_metrics(_make_df(30))
        # MA7 should be non-null for all rows (min_periods=1)
        assert df["ma7"].notna().all()

    def test_no_inf_values(self):
        df = compute_metrics(_make_df())
        for col in ["daily_return", "ma7", "ma20"]:
            assert not np.isinf(df[col].dropna()).any()

    def test_sorted_by_date(self):
        df = _make_df()
        df = df.sample(frac=1)  # shuffle
        result = compute_metrics(df)
        assert result["date"].is_monotonic_increasing


class TestComputeSummary:
    def test_summary_keys(self):
        df = compute_metrics(_make_df())
        summary = compute_summary(df, "TEST.NS")
        assert summary["symbol"] == "TEST.NS"
        assert "week52_high" in summary
        assert "week52_low" in summary
        assert "avg_close" in summary
        assert "latest_close" in summary
        assert "total_trading_days" in summary

    def test_52w_high_gte_low(self):
        df = compute_metrics(_make_df())
        summary = compute_summary(df, "TEST.NS")
        assert summary["week52_high"] >= summary["week52_low"]

    def test_total_trading_days(self):
        n = 15
        df = compute_metrics(_make_df(n))
        summary = compute_summary(df, "TEST.NS")
        assert summary["total_trading_days"] == n


class TestComputeCorrelation:
    def test_perfect_correlation(self):
        df1 = compute_metrics(_make_df(30))
        corr = compute_correlation(df1, df1)
        assert corr is not None
        assert abs(corr - 1.0) < 1e-4

    def test_returns_none_for_insufficient_data(self):
        df1 = compute_metrics(_make_df(3))
        df2 = compute_metrics(_make_df(3))
        # Overlap after merge will be <= 3 rows (< 5 threshold)
        corr = compute_correlation(df1, df2)
        assert corr is None

    def test_correlation_in_range(self):
        df1 = compute_metrics(_make_df(30))
        df2 = compute_metrics(_make_df(30))
        corr = compute_correlation(df1, df2)
        if corr is not None:
            assert -1.0 <= corr <= 1.0