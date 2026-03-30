"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    BarChart2, TrendingUp, GitCompare, Settings, Activity, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navLinks = [
    { href: "/", label: "Dashboard", icon: BarChart2 },
    { href: "/stocks", label: "Markets", icon: TrendingUp },
    { href: "/compare", label: "Compare", icon: GitCompare },
    { href: "/admin/ingest", label: "Admin", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();
    const [health, setHealth] = useState<{ ok: boolean; version: string } | null>(null);

    useEffect(() => {
        api
            .health()
            .then((h) => setHealth({ ok: h.db_connected, version: h.version }))
            .catch(() => setHealth({ ok: false, version: "—" }));
    }, []);

    return (
        <header
            className="sticky top-0 z-50 border-b backdrop-blur-md"
            style={{
                backgroundColor: "hsl(var(--background) / 0.85)",
                borderColor: "hsl(var(--border))",
            }}
        >
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ backgroundColor: "hsl(var(--primary))" }}
                    >
                        <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span>StockIQ</span>
                </Link>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map(({ href, label, icon: Icon }) => {
                        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                                    active
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                                style={
                                    active
                                        ? {
                                            backgroundColor: "hsl(var(--muted))",
                                            color: "hsl(var(--foreground))",
                                        }
                                        : {}
                                }
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Status indicator */}
                <div className="flex items-center gap-2">
                    {health !== null && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            <Circle
                                className="h-2 w-2 fill-current"
                                style={{ color: health.ok ? "hsl(var(--gain))" : "hsl(var(--loss))" }}
                            />
                            <span className="hidden sm:inline">
                                {health.ok ? "Live" : "Offline"} · v{health.version}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile nav */}
            <div className="flex md:hidden border-t px-4 py-1" style={{ borderColor: "hsl(var(--border))" }}>
                {navLinks.map(({ href, label, icon: Icon }) => {
                    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
                                active ? "text-primary" : "text-muted-foreground"
                            )}
                            style={active ? { color: "hsl(var(--primary))" } : {}}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </header>
    );
}