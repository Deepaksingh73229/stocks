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
        <div className="space-y-5 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Data Ingestion</h1>
                <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Fetch and process stock data from yfinance into the database
                </p>
            </div>

            {/* Warning */}
            <div
                className="flex items-start gap-3 rounded-xl border p-4 text-sm"
                style={{
                    backgroundColor: "hsl(28 100% 55% / 0.08)",
                    borderColor: "hsl(28 100% 55% / 0.3)",
                    color: "hsl(var(--foreground))",
                }}
            >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "hsl(28, 100%, 55%)" }} />
                <p>
                    Synchronous ingestion may take 30–60 seconds depending on the number of symbols and period.
                    Use &ldquo;Background&rdquo; mode for large datasets.
                </p>
            </div>

            {/* Config */}
            <Card className="animate-fade-up">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Download className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                        Ingestion Settings
                    </CardTitle>
                    <CardDescription>Configure which symbols and time period to fetch</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Period */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Period</label>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="max-w-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIODS.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Symbols mode */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Symbols</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setUseCustom(false)}
                                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                                style={{
                                    borderColor: !useCustom ? "hsl(var(--primary))" : "hsl(var(--border))",
                                    backgroundColor: !useCustom ? "hsl(var(--accent))" : "transparent",
                                    color: !useCustom ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                                }}
                            >
                                Default ({DEFAULT_SYMBOLS.length} stocks)
                            </button>
                            <button
                                onClick={() => setUseCustom(true)}
                                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                                style={{
                                    borderColor: useCustom ? "hsl(var(--primary))" : "hsl(var(--border))",
                                    backgroundColor: useCustom ? "hsl(var(--accent))" : "transparent",
                                    color: useCustom ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                                }}
                            >
                                Custom
                            </button>
                        </div>

                        {useCustom ? (
                            <div className="space-y-1.5">
                                <Input
                                    placeholder="RELIANCE.NS, TCS.NS, INFY.NS"
                                    value={customSymbols}
                                    onChange={(e) => setCustomSymbols(e.target.value)}
                                />
                                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    Enter comma-separated yfinance symbols (e.g. RELIANCE.NS for NSE)
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {DEFAULT_SYMBOLS.map((s) => (
                                    <Badge key={s} variant="secondary" className="font-mono text-xs">
                                        {s.replace(".NS", "")}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mode */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Run Mode</label>
                        <div className="flex gap-2">
                            {(["sync", "background"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors capitalize"
                                    style={{
                                        borderColor: mode === m ? "hsl(var(--primary))" : "hsl(var(--border))",
                                        backgroundColor: mode === m ? "hsl(var(--accent))" : "transparent",
                                        color: mode === m ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                                    }}
                                >
                                    {m === "sync" ? <Play className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                    {m === "sync" ? "Synchronous" : "Background"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleIngest}
                        disabled={loading || (useCustom && !customSymbols.trim())}
                        className="w-full sm:w-auto"
                    >
                        {loading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Ingesting…</>
                            : <><Download className="h-4 w-4" /> Start Ingestion</>}
                    </Button>
                </CardContent>
            </Card>

            {/* Result */}
            {error && (
                <div
                    className="rounded-xl border p-4 text-sm flex items-start gap-2"
                    style={{ backgroundColor: "hsl(var(--loss-bg))", borderColor: "hsl(var(--loss))", color: "hsl(var(--loss))" }}
                >
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            {result && (
                <Card className="animate-fade-up">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(var(--gain))" }} />
                            Ingestion Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "hsl(var(--gain-bg))" }}>
                                <p className="text-2xl font-bold" style={{ color: "hsl(var(--gain))" }}>
                                    {result.symbols_processed.length || "—"}
                                </p>
                                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Processed</p>
                            </div>
                            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: result.symbols_failed.length > 0 ? "hsl(var(--loss-bg))" : "hsl(var(--muted))" }}>
                                <p className="text-2xl font-bold" style={{ color: result.symbols_failed.length > 0 ? "hsl(var(--loss))" : "hsl(var(--foreground))" }}>
                                    {result.symbols_failed.length || "0"}
                                </p>
                                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Failed</p>
                            </div>
                            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
                                <p className="text-2xl font-bold">{result.duration_seconds > 0 ? `${result.duration_seconds.toFixed(1)}s` : "—"}</p>
                                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Duration</p>
                            </div>
                        </div>

                        {result.symbols_processed.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Processed</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.symbols_processed.map((s) => (
                                        <Badge key={s} variant="gain" className="font-mono text-xs">
                                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                            {s.replace(".NS", "")}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.symbols_failed.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "hsl(var(--loss))" }}>Failed</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.symbols_failed.map((s) => (
                                        <Badge key={s} variant="loss" className="font-mono text-xs">
                                            <XCircle className="h-2.5 w-2.5 mr-1" />
                                            {s.replace(".NS", "")}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{result.message}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}