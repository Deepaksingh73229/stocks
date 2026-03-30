"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
    ArrowLeft, TrendingUp, TrendingDown, BarChart2, Activity,
    Calendar, GitCompare, RefreshCw,
} from "lucide-react";
import { api, StockDataResponse, SummaryResponse } from "@/lib/api";
import { PriceChart } from "@/components/charts/PriceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

const PERIODS: { label: string; days: number }[] = [
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
    { label: "1Y", days: 365 },
];

export default function StockDetailPage({
    params,
}: {
    params: Promise<{ symbol: string }>;
}) {
    const { symbol } = use(params);
    const decodedSymbol = decodeURIComponent(symbol);

    const [days, setDays] = useState(30);
    const [stockData, setStockData] = useState<StockDataResponse | null>(null);
    const [summary, setSummary] = useState<SummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMA, setShowMA] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [sd, sm] = await Promise.all([
                api.stockData(decodedSymbol, days),
                api.summary(decodedSymbol),
            ]);
            setStockData(sd);
            setSummary(sm);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [decodedSymbol, days]);

    const latestPrice = stockData?.data?.[stockData.data.length - 1];
    const ret = summary?.latest_daily_return;
    const isGain = ret !== null && ret !== undefined && ret >= 0;

    const shortSymbol = decodedSymbol.replace(".NS", "");

    return (
        <div className="space-y-5">
            {/* Back + header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/stocks">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{shortSymbol}</h1>
                            {!loading && ret !== null && ret !== undefined && (
                                <Badge variant={isGain ? "gain" : "loss"}>
                                    {isGain ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                                    {formatPercent(ret)}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {decodedSymbol} · NSE
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/compare?s1=${decodedSymbol}`}>
                        <Button variant="outline" size="sm">
                            <GitCompare className="h-4 w-4" />
                            Compare
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {error && (
                <div
                    className="rounded-xl border p-4 text-sm"
                    style={{ backgroundColor: "hsl(var(--loss-bg))", borderColor: "hsl(var(--loss))", color: "hsl(var(--loss))" }}
                >
                    ⚠ {error}
                </div>
            )}

            {/* Price + chart */}
            <Card className="animate-fade-up">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                            {loading
                                ? <Skeleton className="h-9 w-36" />
                                : (
                                    <p className="text-3xl font-bold tracking-tight">
                                        {latestPrice ? formatCurrency(latestPrice.close) : "—"}
                                    </p>
                                )}
                            {loading
                                ? <Skeleton className="h-4 w-24 mt-1" />
                                : (
                                    <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                                        Latest close price
                                    </p>
                                )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant={showMA ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowMA((v) => !v)}
                            >
                                MA overlay
                            </Button>
                            <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                                <TabsList>
                                    {PERIODS.map((p) => (
                                        <TabsTrigger key={p.days} value={String(p.days)}>
                                            {p.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    ) : (
                        <PriceChart data={stockData?.data ?? []} showMA={showMA} />
                    )}
                </CardContent>
            </Card>

            {/* Summary stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up-d1">
                {[
                    { label: "52W High", value: summary?.week52_high, icon: TrendingUp, fmt: formatCurrency },
                    { label: "52W Low", value: summary?.week52_low, icon: TrendingDown, fmt: formatCurrency },
                    { label: "Avg Close", value: summary?.avg_close, icon: BarChart2, fmt: formatCurrency },
                    { label: "Trading Days", value: summary?.total_trading_days, icon: Calendar, fmt: (v: number) => formatNumber(v, 0) },
                ].map(({ label, value, icon: Icon, fmt }) => (
                    <Card key={label}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                                        {label}
                                    </p>
                                    {loading || !summary
                                        ? <Skeleton className="h-6 w-24 mt-1.5" />
                                        : <p className="text-xl font-bold mt-0.5">{value !== undefined ? fmt(value as number) : "—"}</p>}
                                </div>
                                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
                                    <Icon className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Latest metrics table */}
            {!loading && latestPrice && (
                <Card className="animate-fade-up-d2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                            Latest Day Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: "Open", value: formatCurrency(latestPrice.open) },
                                { label: "High", value: formatCurrency(latestPrice.high) },
                                { label: "Low", value: formatCurrency(latestPrice.low) },
                                { label: "Close", value: formatCurrency(latestPrice.close) },
                                { label: "Volume", value: formatNumber(latestPrice.volume, 0) },
                                { label: "Daily Return", value: latestPrice.daily_return !== null ? formatPercent(latestPrice.daily_return) : "—", highlight: latestPrice.daily_return !== null ? (latestPrice.daily_return >= 0 ? "gain" : "loss") : undefined },
                                { label: "MA7", value: latestPrice.ma7 ? formatCurrency(latestPrice.ma7) : "—" },
                                { label: "MA20", value: latestPrice.ma20 ? formatCurrency(latestPrice.ma20) : "—" },
                            ].map(({ label, value, highlight }) => (
                                <div
                                    key={label}
                                    className="rounded-lg p-3"
                                    style={{ backgroundColor: "hsl(var(--muted))" }}
                                >
                                    <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
                                    <p
                                        className="text-sm font-bold mt-0.5"
                                        style={{
                                            color: highlight === "gain"
                                                ? "hsl(var(--gain))"
                                                : highlight === "loss"
                                                    ? "hsl(var(--loss))"
                                                    : "hsl(var(--foreground))",
                                        }}
                                    >
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}