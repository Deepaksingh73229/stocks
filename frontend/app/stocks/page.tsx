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
import { cn } from "@/lib/utils";

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

    // Replaced hardcoded HSL with theme-aware Tailwind classes
    const sectorColors: Record<string, string> = {
        IT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        Banking: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        Energy: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        Telecom: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        FMCG: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 tracking-wide border-b border-border/50 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Markets</h1>
                <p className="text-sm font-medium text-muted-foreground">
                    All tracked NSE companies with live metrics
                </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 bg-card border-border/60 focus-visible:ring-primary/50 shadow-sm"
                        placeholder="Search symbol, name or sector…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                    <span className="text-lg">⚠</span>
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        {loading ? "Loading…" : `${filtered.length} companies`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_1fr_120px_120px_120px] gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b border-border/60 bg-muted/30 text-muted-foreground">
                        <span>Company</span>
                        <span className="hidden sm:block">Sector</span>
                        <span className="text-right">Last Close</span>
                        <span className="text-right">52W High</span>
                        <span className="text-right">Daily Ret.</span>
                    </div>

                    <div className="flex flex-col">
                        {loading
                            ? Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-[1fr_1fr_120px_120px_120px] gap-3 px-5 py-4 border-b border-border/40 items-center">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-36" />
                                    </div>
                                    <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
                                    <Skeleton className="h-4 w-16 ml-auto" />
                                    <Skeleton className="h-4 w-16 ml-auto" />
                                    <Skeleton className="h-5 w-16 ml-auto rounded-md" />
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
                                        className="group grid grid-cols-[1fr_1fr_120px_120px_120px] gap-3 px-5 py-4 border-b border-border/40 items-center transition-colors hover:bg-muted/40 last:border-0 outline-none focus-visible:bg-muted/60"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                {c.symbol.replace(".NS", "")}
                                            </p>
                                            <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                                                {c.name}
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md",
                                                    sectorColors[c.sector] || "bg-secondary text-secondary-foreground"
                                                )}
                                            >
                                                {c.sector}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            {c.summaryLoading ? (
                                                <Skeleton className="h-4 w-16 ml-auto" />
                                            ) : (
                                                <span className="text-sm font-bold text-foreground">
                                                    {c.summary ? formatCurrency(c.summary.latest_close) : "—"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {c.summaryLoading ? (
                                                <Skeleton className="h-4 w-16 ml-auto" />
                                            ) : (
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {c.summary ? formatCurrency(c.summary.week52_high) : "—"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-end">
                                            {c.summaryLoading ? (
                                                <Skeleton className="h-5 w-16 rounded-md" />
                                            ) : ret !== null && ret !== undefined ? (
                                                <Badge variant={isGain ? "gain" : "loss"} className="px-1.5 py-0 font-medium tracking-wide">
                                                    <RetIcon className="h-3 w-3 mr-1 stroke-[2.5]" />
                                                    {formatPercent(ret)}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-medium">—</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}

                        {!loading && filtered.length === 0 && (
                            <div className="py-16 flex flex-col items-center justify-center text-center">
                                <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
                                <p className="text-base font-semibold text-foreground">No matches found</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We couldn't find any companies matching &ldquo;{search}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}