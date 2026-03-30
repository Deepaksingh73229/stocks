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
                        <p
                            className="text-xs font-medium uppercase tracking-wider"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                            {label}
                        </p>
                        {loading ? (
                            <>
                                <Skeleton className="h-7 w-24" />
                                <Skeleton className="h-3.5 w-16 mt-1" />
                            </>
                        ) : (
                            <>
                                <p
                                    className={cn(
                                        "text-2xl font-bold tracking-tight",
                                        trend === "gain" && "text-[hsl(var(--gain))]",
                                        trend === "loss" && "text-[hsl(var(--loss))]"
                                    )}
                                    style={
                                        trend === "gain"
                                            ? { color: "hsl(var(--gain))" }
                                            : trend === "loss"
                                                ? { color: "hsl(var(--loss))" }
                                                : { color: "hsl(var(--foreground))" }
                                    }
                                >
                                    {value}
                                </p>
                                {sub && (
                                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                        {sub}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    {Icon && (
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{ backgroundColor: "hsl(var(--muted))" }}
                        >
                            <Icon className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}