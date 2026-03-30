"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
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
        <div className="min-w-[160px] rounded-xl border border-border bg-card p-3.5 shadow-xl text-xs space-y-2">
            <p className="font-semibold text-muted-foreground mb-3 border-b border-border/50 pb-2">
                {label ? formatShortDate(label) : ""}
            </p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full inline-block shadow-sm"
                            style={{ backgroundColor: p.color }}
                        />
                        <span className="font-medium text-muted-foreground">{p.name}</span>
                    </div>
                    <span className="font-bold text-foreground">
                        {p.name.includes("MA") ? formatCurrency(p.value) : formatCurrency(p.value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function PriceChart({ data, showMA = true }: PriceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-sm font-medium text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50">
                No chart data available for this period.
            </div>
        );
    }

    const firstClose = data[0]?.close || 0;
    const lastClose = data[data.length - 1]?.close || 0;
    const isPositive = lastClose >= firstClose;

    // Using standard Tailwind hex codes for perfect SVG rendering in both themes
    const strokeColor = isPositive ? "#10b981" : "#f43f5e"; // emerald-500 : rose-500
    const fillId = isPositive ? "gainGrad" : "lossGrad";

    const chartData = data.map((d) => ({
        date: d.date,
        Close: Number(d.close.toFixed(2)),
        MA7: d.ma7 ? Number(d.ma7.toFixed(2)) : null,
        MA20: d.ma20 ? Number(d.ma20.toFixed(2)) : null,
    }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                    vertical={false}
                />
                <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatShortDate(v)}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    dy={10}
                />
                <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    domain={["auto", "auto"]}
                    dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />

                {showMA && (
                    <Legend
                        wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
                        formatter={(v) => <span style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{v}</span>}
                        iconType="circle"
                        iconSize={8}
                    />
                )}

                <Area
                    type="monotone"
                    dataKey="Close"
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    fill={`url(#${fillId})`}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
                />

                {showMA && (
                    <>
                        <Area
                            type="monotone"
                            dataKey="MA7"
                            stroke="#3b82f6" /* blue-500 */
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="none"
                            dot={false}
                            activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                            name="MA7"
                        />
                        <Area
                            type="monotone"
                            dataKey="MA20"
                            stroke="#f97316" /* orange-500 */
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="none"
                            dot={false}
                            activeDot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                            name="MA20"
                        />
                    </>
                )}
            </AreaChart>
        </ResponsiveContainer>
    );
}