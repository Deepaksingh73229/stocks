"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GitCompare, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { api, CompareResponse, Company } from "@/lib/api";
import { CompareChart } from "@/components/charts/CompareChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";

function CompareContent() {
    const searchParams = useSearchParams();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [symbol1, setSymbol1] = useState(searchParams.get("s1") || "");
    const [symbol2, setSymbol2] = useState(searchParams.get("s2") || "");
    const [days, setDays] = useState(90);
    const [result, setResult] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.companies().then((r) => setCompanies(r.companies)).catch(() => { });
    }, []);

    const handleCompare = async () => {
        if (!symbol1 || !symbol2) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.compare(symbol1, symbol2, days);
            setResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Compare failed");
        } finally {
            setLoading(false);
        }
    };

    const swap = () => {
        setSymbol1(symbol2);
        setSymbol2(symbol1);
        setResult(null);
    };

    const s1Data = result?.series.find((s) => s.symbol === symbol1);
    const s2Data = result?.series.find((s) => s.symbol === symbol2);

    const corrLabel =
        result?.correlation !== null && result?.correlation !== undefined
            ? Math.abs(result.correlation) > 0.7
                ? "Strong"
                : Math.abs(result.correlation) > 0.4
                    ? "Moderate"
                    : "Weak"
            : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 tracking-wide border-b border-border/50 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Compare Stocks</h1>
                <p className="text-sm font-medium text-muted-foreground">
                    Side-by-side performance comparison with correlation analysis
                </p>
            </div>

            {/* Controls */}
            <Card className="animate-fade-up border-border/60 shadow-sm bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Stock 1
                            </label>
                            <Select value={symbol1} onValueChange={setSymbol1}>
                                <SelectTrigger className="shadow-sm">
                                    <SelectValue placeholder="Select first stock…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.symbol} value={c.symbol}>
                                            <span className="font-semibold">{c.symbol.replace(".NS", "")}</span> <span className="text-muted-foreground">— {c.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="outline" size="icon" onClick={swap} className="self-end mb-0.5 shadow-sm hover:bg-secondary/80">
                            <ArrowRightLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Stock 2
                            </label>
                            <Select value={symbol2} onValueChange={setSymbol2}>
                                <SelectTrigger className="shadow-sm">
                                    <SelectValue placeholder="Select second stock…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.symbol} value={c.symbol}>
                                            <span className="font-semibold">{c.symbol.replace(".NS", "")}</span> <span className="text-muted-foreground">— {c.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Period
                            </label>
                            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                                <SelectTrigger className="w-full sm:w-32 shadow-sm font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="90">90 Days</SelectItem>
                                    <SelectItem value="180">180 Days</SelectItem>
                                    <SelectItem value="365">1 Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleCompare}
                            disabled={!symbol1 || !symbol2 || symbol1 === symbol2 || loading}
                            className="self-end w-full sm:w-auto shadow-sm"
                        >
                            <GitCompare className="h-4 w-4 mr-2" />
                            {loading ? "Comparing…" : "Compare"}
                        </Button>
                    </div>

                    {symbol1 && symbol2 && symbol1 === symbol2 && (
                        <p className="mt-3 text-xs font-medium text-rose-500 flex items-center gap-1.5 animate-in fade-in">
                            <span className="text-base leading-none">⚠</span> Please select two different stocks.
                        </p>
                    )}
                </CardContent>
            </Card>

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                    <span className="text-lg">⚠</span>
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Chart */}
            {(loading || result) && (
                <Card className="animate-fade-up border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <CardTitle className="text-base font-semibold">
                                Performance <span className="text-muted-foreground font-medium text-sm">(% change from start)</span>
                            </CardTitle>
                            {result?.correlation !== null && result?.correlation !== undefined && (
                                <div className="flex items-center gap-2 bg-background border border-border/50 px-3 py-1.5 rounded-lg shadow-sm">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Correlation:</span>
                                    <Badge variant={Math.abs(result.correlation) > 0.5 ? "gain" : "secondary"} className="text-xs font-bold px-2 py-0">
                                        {corrLabel} ({formatNumber(result.correlation, 3)})
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loading ? (
                            <Skeleton className="h-[320px] w-full rounded-xl" />
                        ) : s1Data && s2Data ? (
                            <CompareChart
                                data1={s1Data.data}
                                data2={s2Data.data}
                                symbol1={symbol1}
                                symbol2={symbol2}
                            />
                        ) : null}
                    </CardContent>
                </Card>
            )}

            {/* Side-by-side summaries */}
            {result && s1Data?.summary && s2Data?.summary && (
                <div className="grid gap-4 sm:grid-cols-2 animate-fade-up-d1">
                    {[
                        { sym: symbol1, series: s1Data, color: "bg-blue-500" },
                        { sym: symbol2, series: s2Data, color: "bg-orange-500" },
                    ].map(({ sym, series, color }) => {
                        const sm = series.summary!;
                        const ret = sm.latest_daily_return;
                        const isGain = ret !== null && ret !== undefined && ret >= 0;
                        return (
                            <Card key={sym} className="border-border/60 shadow-sm overflow-hidden">
                                <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                                    <CardTitle className="flex items-center justify-between text-base font-bold">
                                        <div className="flex items-center gap-2.5">
                                            <span className={cn("h-3.5 w-3.5 rounded-full shadow-sm", color)} />
                                            {sym.replace(".NS", "")}
                                        </div>
                                        {ret !== null && ret !== undefined && (
                                            <Badge variant={isGain ? "gain" : "loss"} className="px-2 py-0.5 font-medium">
                                                {isGain ? <TrendingUp className="h-3.5 w-3.5 mr-1 stroke-[2.5]" /> : <TrendingDown className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />}
                                                {formatPercent(ret)}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Last Close", value: formatCurrency(sm.latest_close) },
                                            { label: "Avg Close", value: formatCurrency(sm.avg_close) },
                                            { label: "52W High", value: formatCurrency(sm.week52_high) },
                                            { label: "52W Low", value: formatCurrency(sm.week52_low) },
                                            { label: "Trading Days", value: formatNumber(sm.total_trading_days, 0) },
                                            { label: "Daily Return", value: ret !== null && ret !== undefined ? formatPercent(ret) : "—" },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex flex-col rounded-xl p-3.5 border border-border/40 bg-muted/30 dark:bg-muted/10 transition-colors hover:bg-muted/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                                                <p className="text-sm font-bold mt-1 text-foreground tracking-tight">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!result && !loading && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 py-20 text-center animate-fade-up-d1">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <GitCompare className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <p className="text-lg font-bold text-foreground">Select two stocks to compare</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1 max-w-sm">
                        View normalized performance, correlation, and key metrics side-by-side
                    </p>
                </div>
            )}
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading comparison module...</p>
            </div>
        }>
            <CompareContent />
        </Suspense>
    );
}