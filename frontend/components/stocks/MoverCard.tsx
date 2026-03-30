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
        <Link href={`/stocks/${item.symbol}`} className="block outline-none">
            <div className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all cursor-pointer hover:bg-secondary/40 hover:border-border/50 hover:shadow-sm">

                {/* Left Side: Rank & Info */}
                <div className="flex items-center gap-3.5 overflow-hidden">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground dark:group-hover:bg-muted/50">
                        {rank}
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {item.symbol.replace(".NS", "")}
                        </p>
                        <p className="text-xs truncate font-medium text-muted-foreground pr-2">
                            {item.name}
                        </p>
                    </div>
                </div>

                {/* Right Side: Price & Badge */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                            {formatCurrency(item.latest_close)}
                        </p>
                        <div className="mt-1 flex justify-end">
                            <Badge
                                variant={isGain ? "gain" : "loss"}
                                className="text-[11px] px-1.5 py-0 font-medium tracking-wide"
                            >
                                <Icon className="h-3 w-3 mr-1 stroke-[2.5]" />
                                {formatPercent(item.daily_return)}
                            </Badge>
                        </div>
                    </div>
                </div>

            </div>
        </Link>
    );
}