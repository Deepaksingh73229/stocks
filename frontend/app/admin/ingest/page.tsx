"use client";

import { useState } from "react";
import {
    Download, Play, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle,
} from "lucide-react";
import { api, IngestResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "WIPRO.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS",
];

const PERIODS = [
    { label: "1 Month", value: "1mo" },
    { label: "3 Months", value: "3mo" },
    { label: "6 Months", value: "6mo" },
    { label: "1 Year", value: "1y" },
    { label: "2 Years", value: "2y" },
];

export default function IngestPage() {
    const [period, setPeriod] = useState("1y");
    const [customSymbols, setCustomSymbols] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IngestResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"sync" | "background">("sync");

    const handleIngest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        const symbols = useCustom
            ? customSymbols.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined;

        try {
            if (mode === "background") {
                const res = await api.ingestBackground(symbols, period);
                setResult({
                    message: res.message,
                    symbols_processed: [],
                    symbols_failed: [],
                    duration_seconds: 0,
                });
            } else {
                const res = await api.ingest(symbols, period);
                setResult(res);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ingestion failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col gap-1 tracking-wide border-b border-border/50 pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Data Ingestion</h1>
                <p className="text-sm font-medium text-muted-foreground">
                    Fetch and process stock data from yfinance into the database
                </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50/80 p-4 text-sm text-orange-800 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400 shadow-sm animate-in fade-in">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="font-medium leading-relaxed">
                    Synchronous ingestion may take 30–60 seconds depending on the number of symbols and period.
                    Use <span className="font-bold">Background</span> mode for large datasets.
                </p>
            </div>

            {/* Config */}
            <Card className="animate-fade-up border-border/60 shadow-sm bg-card/80 backdrop-blur-sm">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-5">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        Ingestion Settings
                    </CardTitle>
                    <CardDescription className="font-medium">Configure which symbols and time period to fetch</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {/* Period */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</label>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="max-w-xs shadow-sm font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIODS.map((p) => (
                                    <SelectItem key={p.value} value={p.value} className="font-medium">{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Symbols mode */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Symbols</label>
                        <div className="inline-flex bg-muted/50 p-1 rounded-lg border border-border/50">
                            <button
                                onClick={() => setUseCustom(false)}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all",
                                    !useCustom ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                )}
                            >
                                Default <span className="opacity-70 font-medium">({DEFAULT_SYMBOLS.length})</span>
                            </button>
                            <button
                                onClick={() => setUseCustom(true)}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all",
                                    useCustom ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                )}
                            >
                                Custom
                            </button>
                        </div>

                        {useCustom ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Input
                                    placeholder="RELIANCE.NS, TCS.NS, INFY.NS"
                                    value={customSymbols}
                                    onChange={(e) => setCustomSymbols(e.target.value)}
                                    className="shadow-sm font-mono text-sm"
                                />
                                <p className="text-xs font-medium text-muted-foreground">
                                    Enter comma-separated yfinance symbols (e.g. RELIANCE.NS for NSE)
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in">
                                {DEFAULT_SYMBOLS.map((s) => (
                                    <Badge key={s} variant="secondary" className="font-mono text-xs bg-muted/60 border-border/40 hover:bg-muted">
                                        {s.replace(".NS", "")}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mode */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Run Mode</label>
                        <div className="inline-flex bg-muted/50 p-1 rounded-lg border border-border/50">
                            {(["sync", "background"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={cn(
                                        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all capitalize",
                                        mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                    )}
                                >
                                    {m === "sync" ? <Play className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                    {m === "sync" ? "Synchronous" : "Background"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                        <Button
                            onClick={handleIngest}
                            disabled={loading || (useCustom && !customSymbols.trim())}
                            className="w-full sm:w-auto shadow-sm"
                            size="lg"
                        >
                            {loading
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ingesting Data…</>
                                : <><Download className="h-4 w-4 mr-2" /> Start Ingestion</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Result */}
            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            {result && (
                <Card className="animate-fade-up border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-border/40 bg-emerald-50/50 dark:bg-emerald-950/20 pb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                            Ingestion Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 text-center dark:border-emerald-500/10 dark:bg-emerald-500/5">
                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                    {result.symbols_processed.length || "—"}
                                </p>
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-400/70 mt-1">Processed</p>
                            </div>
                            <div className={cn(
                                "rounded-xl border p-4 text-center transition-colors",
                                result.symbols_failed.length > 0
                                    ? "border-rose-200/60 bg-rose-50/50 dark:border-rose-500/10 dark:bg-rose-500/5"
                                    : "border-border/50 bg-muted/20"
                            )}>
                                <p className={cn(
                                    "text-3xl font-black",
                                    result.symbols_failed.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                                )}>
                                    {result.symbols_failed.length || "0"}
                                </p>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Failed</p>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-center">
                                <p className="text-3xl font-black text-foreground">
                                    {result.duration_seconds > 0 ? `${result.duration_seconds.toFixed(1)}s` : "—"}
                                </p>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Duration</p>
                            </div>
                        </div>

                        {result.symbols_processed.length > 0 && (
                            <div>
                                <p className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1 w-fit">Processed Symbols</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.symbols_processed.map((s) => (
                                        <Badge key={s} variant="gain" className="font-mono text-[11px] px-2 py-0.5">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            {s.replace(".NS", "")}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.symbols_failed.length > 0 && (
                            <div>
                                <p className="text-xs font-bold mb-3 uppercase tracking-wider text-rose-500 dark:text-rose-400 border-b border-border/40 pb-1 w-fit">Failed Symbols</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.symbols_failed.map((s) => (
                                        <Badge key={s} variant="loss" className="font-mono text-[11px] px-2 py-0.5">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            {s.replace(".NS", "")}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg bg-muted/30 p-3 text-sm font-medium text-muted-foreground border border-border/40">
                            {result.message}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}