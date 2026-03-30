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
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";

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
        <div className="space-y-6">
            {/* Back + header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/stocks">
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 shadow-sm hover:bg-secondary/80">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{shortSymbol}</h1>
                            {!loading && ret !== null && ret !== undefined && (
                                <Badge variant={isGain ? "gain" : "loss"} className="px-2 py-0.5 text-xs font-semibold">
                                    {isGain ? <TrendingUp className="h-3.5 w-3.5 mr-1 stroke-[2.5]" /> : <TrendingDown className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />}
                                    {formatPercent(ret)}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                            {decodedSymbol} · NSE
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/compare?s1=${decodedSymbol}`}>
                        <Button variant="outline" size="sm" className="shadow-sm hover:bg-secondary/80">
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare
                        </Button>
                    </Link>
                    <Button variant="outline" size="icon" className="h-9 w-9 shadow-sm hover:bg-secondary/80" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                    <span className="text-lg">⚠</span>
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Price + chart */}
            <Card className="animate-fade-up border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            {loading ? (
                                <Skeleton className="h-10 w-36 mb-1" />
                            ) : (
                                <p className="text-4xl font-extrabold tracking-tight text-foreground">
                                    {latestPrice ? formatCurrency(latestPrice.close) : "—"}
                                </p>
                            )}
                            {loading ? (
                                <Skeleton className="h-4 w-24 mt-2" />
                            ) : (
                                <p className="text-sm font-medium text-muted-foreground mt-1">
                                    Latest close price
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Button
                                variant={showMA ? "default" : "outline"}
                                size="sm"
                                className={showMA ? "shadow-md" : "shadow-sm"}
                                onClick={() => setShowMA((v) => !v)}
                            >
                                MA Overlay
                            </Button>
                            <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))} className="w-fit">
                                <TabsList className="grid w-full grid-cols-4 shadow-sm">
                                    {PERIODS.map((p) => (
                                        <TabsTrigger key={p.days} value={String(p.days)} className="text-xs font-semibold">
                                            {p.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <Skeleton className="h-[350px] w-full rounded-xl" />
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
                    <Card key={label} className="border-border/60 shadow-sm bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                        {label}
                                    </p>
                                    {loading || !summary ? (
                                        <Skeleton className="h-8 w-24 mt-1" />
                                    ) : (
                                        <p className="text-2xl font-extrabold text-foreground tracking-tight">
                                            {value !== undefined ? fmt(value as number) : "—"}
                                        </p>
                                    )}
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground shadow-sm">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Latest metrics table */}
            {!loading && latestPrice && (
                <Card className="animate-fade-up-d2 border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Activity className="h-5 w-5 text-primary" />
                            Latest Day Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: "Open", value: formatCurrency(latestPrice.open) },
                                { label: "High", value: formatCurrency(latestPrice.high) },
                                { label: "Low", value: formatCurrency(latestPrice.low) },
                                { label: "Close", value: formatCurrency(latestPrice.close) },
                                { label: "Volume", value: formatNumber(latestPrice.volume, 0) },
                                {
                                    label: "Daily Return",
                                    value: latestPrice.daily_return !== null ? formatPercent(latestPrice.daily_return) : "—",
                                    highlight: latestPrice.daily_return !== null ? (latestPrice.daily_return >= 0 ? "gain" : "loss") : undefined
                                },
                                { label: "MA7", value: latestPrice.ma7 ? formatCurrency(latestPrice.ma7) : "—" },
                                { label: "MA20", value: latestPrice.ma20 ? formatCurrency(latestPrice.ma20) : "—" },
                            ].map(({ label, value, highlight }) => (
                                <div
                                    key={label}
                                    className="flex flex-col rounded-xl p-4 border border-border/40 bg-muted/30 dark:bg-muted/10 transition-colors hover:bg-muted/50"
                                >
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        {label}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-lg font-bold mt-1 tracking-tight",
                                            highlight === "gain" && "text-emerald-500 dark:text-emerald-400",
                                            highlight === "loss" && "text-rose-500 dark:text-rose-400",
                                            !highlight && "text-foreground"
                                        )}
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