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
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

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
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Compare Stocks</h1>
                <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Side-by-side performance comparison with correlation analysis
                </p>
            </div>

            {/* Controls */}
            <Card className="animate-fade-up">
                <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Stock 1
                            </label>
                            <Select value={symbol1} onValueChange={setSymbol1}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select first stock…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.symbol} value={c.symbol}>
                                            {c.symbol.replace(".NS", "")} — {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="ghost" size="icon" onClick={swap} className="self-end mb-0.5">
                            <ArrowRightLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Stock 2
                            </label>
                            <Select value={symbol2} onValueChange={setSymbol2}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select second stock…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.symbol} value={c.symbol}>
                                            {c.symbol.replace(".NS", "")} — {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Period
                            </label>
                            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                    <SelectItem value="180">180 days</SelectItem>
                                    <SelectItem value="365">1 year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleCompare}
                            disabled={!symbol1 || !symbol2 || symbol1 === symbol2 || loading}
                            className="self-end"
                        >
                            <GitCompare className="h-4 w-4" />
                            {loading ? "Comparing…" : "Compare"}
                        </Button>
                    </div>

                    {symbol1 && symbol2 && symbol1 === symbol2 && (
                        <p className="mt-2 text-xs" style={{ color: "hsl(var(--loss))" }}>
                            Please select two different stocks.
                        </p>
                    )}
                </CardContent>
            </Card>

            {error && (
                <div
                    className="rounded-xl border p-4 text-sm"
                    style={{ backgroundColor: "hsl(var(--loss-bg))", borderColor: "hsl(var(--loss))", color: "hsl(var(--loss))" }}
                >
                    ⚠ {error}
                </div>
            )}

            {/* Chart */}
            {(loading || result) && (
                <Card className="animate-fade-up">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="text-base">
                                Performance (% change from start)
                            </CardTitle>
                            {result?.correlation !== null && result?.correlation !== undefined && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Correlation:</span>
                                    <Badge variant={Math.abs(result.correlation) > 0.5 ? "gain" : "secondary"}>
                                        {corrLabel} ({formatNumber(result.correlation, 3)})
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-80 w-full rounded-xl" />
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
                        { sym: symbol1, series: s1Data, color: "hsl(217, 91%, 60%)" },
                        { sym: symbol2, series: s2Data, color: "hsl(28, 100%, 55%)" },
                    ].map(({ sym, series, color }) => {
                        const sm = series.summary!;
                        const ret = sm.latest_daily_return;
                        const isGain = ret !== null && ret !== undefined && ret >= 0;
                        return (
                            <Card key={sym}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                                        {sym.replace(".NS", "")}
                                        {ret !== null && ret !== undefined && (
                                            <Badge variant={isGain ? "gain" : "loss"}>
                                                {isGain ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                                                {formatPercent(ret)}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Last Close", value: formatCurrency(sm.latest_close) },
                                            { label: "Avg Close", value: formatCurrency(sm.avg_close) },
                                            { label: "52W High", value: formatCurrency(sm.week52_high) },
                                            { label: "52W Low", value: formatCurrency(sm.week52_low) },
                                            { label: "Trading Days", value: formatNumber(sm.total_trading_days, 0) },
                                            { label: "Daily Return", value: ret !== null && ret !== undefined ? formatPercent(ret) : "—" },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="rounded-lg p-3" style={{ backgroundColor: "hsl(var(--muted))" }}>
                                                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
                                                <p className="text-sm font-semibold mt-0.5">{value}</p>
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
                <div
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center animate-fade-up-d1"
                    style={{ borderColor: "hsl(var(--border))" }}
                >
                    <GitCompare className="h-10 w-10 mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <p className="font-medium" style={{ color: "hsl(var(--foreground))" }}>Select two stocks to compare</p>
                    <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                        View normalized performance, correlation, and key metrics side-by-side
                    </p>
                </div>
            )}
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={<div className="py-12 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Loading…</div>}>
            <CompareContent />
        </Suspense>
    );
}