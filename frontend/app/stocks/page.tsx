"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api, Company, SummaryResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface CompanyWithSummary extends Company {
    summary?: SummaryResponse | null;
    summaryLoading?: boolean;
}

export default function StocksPage() {
    const [companies, setCompanies] = useState<CompanyWithSummary[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const res = await api.companies();
                const initial = res.companies.map((c) => ({ ...c, summaryLoading: true }));
                setCompanies(initial);
                setLoading(false);

                // Load summaries in parallel batches
                const summaries = await Promise.allSettled(
                    res.companies.map((c) => api.summary(c.symbol))
                );
                setCompanies(
                    res.companies.map((c, i) => ({
                        ...c,
                        summary: summaries[i].status === "fulfilled" ? summaries[i].value : null,
                        summaryLoading: false,
                    }))
                );
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load");
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const filtered = companies.filter(
        (c) =>
            c.symbol.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.sector.toLowerCase().includes(search.toLowerCase())
    );

    const sectorColors: Record<string, string> = {
        IT: "hsl(217, 91%, 94%)",
        Banking: "hsl(280, 65%, 94%)",
        Energy: "hsl(28, 100%, 93%)",
        Telecom: "hsl(142, 71%, 94%)",
        FMCG: "hsl(0, 84%, 94%)",
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
                <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    All tracked NSE companies with live metrics
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                <Input
                    className="pl-9"
                    placeholder="Search symbol, name or sector…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {error && (
                <div
                    className="rounded-xl border p-4 text-sm"
                    style={{ backgroundColor: "hsl(var(--loss-bg))", borderColor: "hsl(var(--loss))", color: "hsl(var(--loss))" }}
                >
                    ⚠ {error}
                </div>
            )}

            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                        {loading ? "Loading…" : `${filtered.length} companies`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table header */}
                    <div
                        className="grid grid-cols-[1fr_1fr_120px_120px_120px] gap-3 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b"
                        style={{ color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }}
                    >
                        <span>Company</span>
                        <span className="hidden sm:block">Sector</span>
                        <span className="text-right">Last Close</span>
                        <span className="text-right">52W High</span>
                        <span className="text-right">Daily Ret.</span>
                    </div>

                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_120px_120px_120px] gap-3 px-5 py-3.5 border-b items-center" style={{ borderColor: "hsl(var(--border))" }}>
                                <div className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-36" /></div>
                                <Skeleton className="h-5 w-16 hidden sm:block" />
                                <Skeleton className="h-4 w-20 ml-auto" />
                                <Skeleton className="h-4 w-20 ml-auto" />
                                <Skeleton className="h-5 w-16 ml-auto" />
                            </div>
                        ))
                        : filtered.map((c) => {
                            const ret = c.summary?.latest_daily_return;
                            const isGain = ret !== null && ret !== undefined && ret >= 0;
                            const isLoss = ret !== null && ret !== undefined && ret < 0;
                            const RetIcon = isGain ? TrendingUp : isLoss ? TrendingDown : Minus;

                            return (
                                <Link
                                    key={c.symbol}
                                    href={`/stocks/${c.symbol}`}
                                    className="grid grid-cols-[1fr_1fr_120px_120px_120px] gap-3 px-5 py-3.5 border-b items-center transition-colors hover:bg-muted/50 last:border-0"
                                    style={{ borderColor: "hsl(var(--border))" }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{c.symbol.replace(".NS", "")}</p>
                                        <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{c.name}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <span
                                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: sectorColors[c.sector] || "hsl(var(--muted))",
                                                color: "hsl(var(--foreground))",
                                            }}
                                        >
                                            {c.sector}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        {c.summaryLoading
                                            ? <Skeleton className="h-4 w-20 ml-auto" />
                                            : <span className="text-sm font-medium">{c.summary ? formatCurrency(c.summary.latest_close) : "—"}</span>}
                                    </div>
                                    <div className="text-right">
                                        {c.summaryLoading
                                            ? <Skeleton className="h-4 w-20 ml-auto" />
                                            : <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{c.summary ? formatCurrency(c.summary.week52_high) : "—"}</span>}
                                    </div>
                                    <div className="flex items-center justify-end">
                                        {c.summaryLoading
                                            ? <Skeleton className="h-5 w-16" />
                                            : ret !== null && ret !== undefined
                                                ? (
                                                    <Badge variant={isGain ? "gain" : "loss"}>
                                                        <RetIcon className="h-3 w-3 mr-0.5" />
                                                        {formatPercent(ret)}
                                                    </Badge>
                                                )
                                                : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>}
                                    </div>
                                </Link>
                            );
                        })}

                    {!loading && filtered.length === 0 && (
                        <p className="py-12 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                            No companies match &ldquo;{search}&rdquo;
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}