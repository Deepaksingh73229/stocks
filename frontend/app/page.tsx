"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Building2, BarChart3, RefreshCw } from "lucide-react";

import { api, TopMoversResponse, CompanyListResponse } from "@/lib/api";
import { StatCard } from "@/components/stocks/StatCard";
import { MoverCard } from "@/components/stocks/MoverCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  const [movers, setMovers] = useState<TopMoversResponse | null>(null);
  const [companies, setCompanies] = useState<CompanyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, c] = await Promise.all([api.movers(5), api.companies()]);
      setMovers(m);
      setCompanies(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const topGainer = movers?.gainers?.[0];
  const topLoser = movers?.losers?.[0];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex flex-col tracking-wide">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Market Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            NSE/BSE Real-Time Intelligence Dashboard
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="w-fit shadow-sm hover:bg-secondary/80 transition-colors"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
          <span className="text-lg">⚠</span>
          <p>
            <span className="font-semibold">{error}</span> — Make sure the backend is running and data has been ingested.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow bg-card/80 backdrop-blur-sm"
          label="Tracked Companies"
          value={loading ? "—" : String(companies?.total ?? 0)}
          sub="NSE listed stocks"
          icon={Building2}
          loading={loading}
          delay={0}
        />

        <StatCard
          className="border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-shadow bg-card/80 backdrop-blur-sm"
          label="Top Gainer"
          value={loading ? "—" : topGainer ? topGainer.symbol.replace(".NS", "") : "—"}
          sub={loading ? "" : topGainer ? formatPercent(topGainer.daily_return) : "No data"}
          icon={TrendingUp}
          trend={topGainer ? "gain" : "neutral"}
          loading={loading}
          delay={1}
        />

        <StatCard
          className="border-t-4 border-t-rose-500 shadow-sm hover:shadow-md transition-shadow bg-card/80 backdrop-blur-sm"
          label="Top Loser"
          value={loading ? "—" : topLoser ? topLoser.symbol.replace(".NS", "") : "—"}
          sub={loading ? "" : topLoser ? formatPercent(topLoser.daily_return) : "No data"}
          icon={TrendingDown}
          trend={topLoser ? "loss" : "neutral"}
          loading={loading}
          delay={2}
        />

        <StatCard
          className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition-shadow bg-card/80 backdrop-blur-sm"
          label="Best Close"
          value={loading ? "—" : topGainer ? formatCurrency(topGainer.latest_close) : "—"}
          sub={loading ? "" : topGainer?.name ?? ""}
          icon={BarChart3}
          loading={loading}
          delay={3}
        />
      </div>

      {/* Movers grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gainers */}
        <Card className="animate-fade-up-d2 border-border/60 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-transparent">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))
              : movers?.gainers?.length
                ? movers.gainers.map((item, i) => (
                  <MoverCard key={item.symbol} item={item} type="gain" rank={i + 1} />
                ))
                : (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No gainers data yet.</p>
                    <p className="text-xs mt-1">Try ingesting data first.</p>
                  </div>
                )}
          </CardContent>
        </Card>

        {/* Losers */}
        <Card className="animate-fade-up-d3 border-border/60 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-transparent">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))
              : movers?.losers?.length
                ? movers.losers.map((item, i) => (
                  <MoverCard key={item.symbol} item={item} type="loss" rank={i + 1} />
                ))
                : (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingDown className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No losers data yet.</p>
                    <p className="text-xs mt-1">Try ingesting data first.</p>
                  </div>
                )}
          </CardContent>
        </Card>
      </div>

      {/* Company quick-access grid */}
      {!loading && companies && companies.companies.length > 0 && (
        <Card className="animate-fade-up-d4 border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-base font-semibold">All Tracked Companies</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {companies.companies.map((c) => (
                <Link
                  key={c.symbol}
                  href={`/stocks/${c.symbol}`}
                  className="group flex flex-col rounded-xl border border-border/50 bg-card p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:hover:shadow-primary/5"
                >
                  <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {c.symbol.replace(".NS", "")}
                  </span>
                  <span className="text-xs truncate mt-1 text-muted-foreground font-medium">
                    {c.name}
                  </span>
                  <div className="mt-4 flex items-center">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                      {c.sector}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}