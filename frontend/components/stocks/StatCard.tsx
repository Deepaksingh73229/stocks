import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    sub?: string;
    icon?: LucideIcon;
    trend?: "gain" | "loss" | "neutral";
    loading?: boolean;
    className?: string;
    delay?: number;
}

export function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    trend = "neutral",
    loading = false,
    className,
    delay = 0,
}: StatCardProps) {
    const animClass =
        delay === 0
            ? "animate-fade-up"
            : delay === 1
                ? "animate-fade-up-d1"
                : delay === 2
                    ? "animate-fade-up-d2"
                    : delay === 3
                        ? "animate-fade-up-d3"
                        : "animate-fade-up-d4";

    return (
        <Card className={cn(animClass, "overflow-hidden", className)}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            {label}
                        </p>

                        {loading ? (
                            <div className="space-y-2 mt-1">
                                <Skeleton className="h-8 w-28 rounded-md" />
                                <Skeleton className="h-3.5 w-20 rounded-sm" />
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <p
                                    className={cn(
                                        "text-2xl font-extrabold tracking-tight",
                                        trend === "gain" && "text-emerald-500 dark:text-emerald-400",
                                        trend === "loss" && "text-rose-500 dark:text-rose-400",
                                        trend === "neutral" && "text-foreground"
                                    )}
                                >
                                    {value}
                                </p>
                                {sub && (
                                    <p className="text-xs font-medium text-muted-foreground mt-1">
                                        {sub}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {Icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground shadow-sm">
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}