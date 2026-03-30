"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import { StockPrice } from "@/lib/api";
import { formatShortDate } from "@/lib/utils";

interface CompareChartProps {
    data1: StockPrice[];
    data2: StockPrice[];
    symbol1: string;
    symbol2: string;
}

export function CompareChart({ data1, data2, symbol1, symbol2 }: CompareChartProps) {
    // Normalize to % change from first point
    const normalize = (data: StockPrice[]) => {
        const base = data[0]?.close || 1;
        return data.map((d) => ({
            date: d.date,
            value: Number((((d.close - base) / base) * 100).toFixed(3)),
        }));
    };

    const norm1 = normalize(data1);
    const norm2 = normalize(data2);

    // Merge by date
    const map = new Map<string, { date: string;[key: string]: number | string }>();
    norm1.forEach((d) => {
        map.set(d.date, { date: d.date, [symbol1]: d.value });
    });
    norm2.forEach((d) => {
        const existing = map.get(d.date) || { date: d.date };
        map.set(d.date, { ...existing, [symbol2]: d.value });
    });

    const chartData = Array.from(map.values()).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return (
        <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
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
                    tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    dx={-10}
                />
                <Tooltip
                    formatter={(value, name) => [
                        typeof value === "number"
                            ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
                            : String(value),
                        String(name).replace(".NS", ""),
                    ]}
                    labelFormatter={(label) => formatShortDate(label as string)}
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                        color: "hsl(var(--foreground))",
                        fontSize: "13px",
                        fontWeight: 500,
                    }}
                    itemStyle={{
                        paddingTop: "4px",
                    }}
                    labelStyle={{
                        color: "hsl(var(--muted-foreground))",
                        marginBottom: "4px",
                        fontWeight: 600,
                    }}
                />
                <Legend
                    formatter={(v) => <span style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{v.replace(".NS", "")}</span>}
                    wrapperStyle={{ fontSize: 13, paddingTop: "20px" }}
                    iconType="circle"
                    iconSize={8}
                />
                <Line
                    type="monotone"
                    dataKey={symbol1}
                    stroke="#3b82f6" /* Tailwind blue-500 */
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
                />
                <Line
                    type="monotone"
                    dataKey={symbol2}
                    stroke="#f97316" /* Tailwind orange-500 */
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#f97316" }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}