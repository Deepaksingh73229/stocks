"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            NSE/BSE real-time intelligence dashboard
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{
            backgroundColor: "hsl(var(--loss-bg))",
            borderColor: "hsl(var(--loss))",
            color: "hsl(var(--loss))",
          }}
        >
          ⚠ {error} — Make sure the backend is running and data has been ingested.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tracked Companies"
          value={loading ? "—" : String(companies?.total ?? 0)}
          sub="NSE listed stocks"
          icon={Building2}
          loading={loading}
          delay={0}
        />
        <StatCard
          label="Top Gainer"
          value={loading ? "—" : topGainer ? topGainer.symbol.replace(".NS", "") : "—"}
          sub={loading ? "" : topGainer ? formatPercent(topGainer.daily_return) : "No data"}
          icon={TrendingUp}
          trend={topGainer ? "gain" : "neutral"}
          loading={loading}
          delay={1}
        />
        <StatCard
          label="Top Loser"
          value={loading ? "—" : topLoser ? topLoser.symbol.replace(".NS", "") : "—"}
          sub={loading ? "" : topLoser ? formatPercent(topLoser.daily_return) : "No data"}
          icon={TrendingDown}
          trend={topLoser ? "loss" : "neutral"}
          loading={loading}
          delay={2}
        />
        <StatCard
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
        <Card className="animate-fade-up-d2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--gain))" }} />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-20" />
                </div>
              ))
              : movers?.gainers?.length
                ? movers.gainers.map((item, i) => (
                  <MoverCard key={item.symbol} item={item} type="gain" rank={i + 1} />
                ))
                : (
                  <p className="py-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    No data yet. Try ingesting data first.
                  </p>
                )}
          </CardContent>
        </Card>

        {/* Losers */}
        <Card className="animate-fade-up-d3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4" style={{ color: "hsl(var(--loss))" }} />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-20" />
                </div>
              ))
              : movers?.losers?.length
                ? movers.losers.map((item, i) => (
                  <MoverCard key={item.symbol} item={item} type="loss" rank={i + 1} />
                ))
                : (
                  <p className="py-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    No data yet. Try ingesting data first.
                  </p>
                )}
          </CardContent>
        </Card>
      </div>

      {/* Company quick-access grid */}
      {!loading && companies && companies.companies.length > 0 && (
        <Card className="animate-fade-up-d4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Tracked Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {companies.companies.map((c) => (
                <Link
                  key={c.symbol}
                  href={`/stocks/${c.symbol}`}
                  className="group flex flex-col rounded-lg border p-3 transition-colors hover:border-primary/50"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    {c.symbol.replace(".NS", "")}
                  </span>
                  <span className="text-xs truncate mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {c.name}
                  </span>
                  <span
                    className="mt-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit"
                    style={{
                      backgroundColor: "hsl(var(--accent))",
                      color: "hsl(var(--accent-foreground))",
                    }}
                  >
                    {c.sector}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}