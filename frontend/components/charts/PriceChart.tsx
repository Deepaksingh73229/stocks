"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { StockPrice } from "@/lib/api";
import { formatCurrency, formatShortDate } from "@/lib/utils";

interface PriceChartProps {
    data: StockPrice[];
    showMA?: boolean;
}

interface TooltipPayload {
    value: number;
    name: string;
    color: string;
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
}) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div
            className="rounded-xl border p-3 shadow-xl text-xs space-y-1"
            style={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--card-foreground))",
            }}
        >
            <p className="font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                {label ? formatShortDate(label) : ""}
            </p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>{p.name}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(p.value)}</span>
                </div>
            ))}
        </div>
    );
}

export function PriceChart({ data, showMA = true }: PriceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                No chart data available
            </div>
        );
    }

    const firstClose = data[0]?.close || 0;
    const lastClose = data[data.length - 1]?.close || 0;
    const isPositive = lastClose >= firstClose;
    const strokeColor = isPositive ? "hsl(var(--gain))" : "hsl(var(--loss))";
    const fillId = isPositive ? "gainGrad" : "lossGrad";

    const chartData = data.map((d) => ({
        date: d.date,
        Close: Number(d.close.toFixed(2)),
        MA7: d.ma7 ? Number(d.ma7.toFixed(2)) : null,
        MA20: d.ma20 ? Number(d.ma20.toFixed(2)) : null,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 84%, 55%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(0, 84%, 55%)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                    vertical={false}
                />
                <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatShortDate(v)}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                {showMA && (
                    <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "hsl(var(--muted-foreground))" }}
                    />
                )}
                <Area
                    type="monotone"
                    dataKey="Close"
                    stroke={strokeColor}
                    strokeWidth={2}
                    fill={`url(#${fillId})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                />
                {showMA && (
                    <>
                        <Area
                            type="monotone"
                            dataKey="MA7"
                            stroke="hsl(217, 91%, 60%)"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                            fill="none"
                            dot={false}
                            name="MA7"
                        />
                        <Area
                            type="monotone"
                            dataKey="MA20"
                            stroke="hsl(28, 100%, 55%)"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                            fill="none"
                            dot={false}
                            name="MA20"
                        />
                    </>
                )}
            </AreaChart>
        </ResponsiveContainer>
    );
}