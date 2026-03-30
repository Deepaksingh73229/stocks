"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { GainerLoserItem } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface MoverCardProps {
    item: GainerLoserItem;
    type: "gain" | "loss";
    rank: number;
}

export function MoverCard({ item, type, rank }: MoverCardProps) {
    const isGain = type === "gain";
    const Icon = isGain ? TrendingUp : TrendingDown;

    return (
        <Link href={`/stocks/${item.symbol}`}>
            <div
                className="group flex items-center justify-between rounded-lg p-3 transition-colors cursor-pointer hover:bg-muted"
                style={{ "--hover-bg": "hsl(var(--muted))" } as React.CSSProperties}
            >
                <div className="flex items-center gap-3">
                    <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                    >
                        {rank}
                    </span>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                            {item.symbol.replace(".NS", "")}
                        </p>
                        <p className="text-xs truncate max-w-[120px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {item.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                            {formatCurrency(item.latest_close)}
                        </p>
                        <Badge variant={isGain ? "gain" : "loss"} className="text-[11px]">
                            <Icon className="h-3 w-3 mr-0.5" />
                            {formatPercent(item.daily_return)}
                        </Badge>
                    </div>
                </div>
            </div>
        </Link>
    );
}