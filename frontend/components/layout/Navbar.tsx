"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "../themes/theme-toggle";
import { BarChart2, TrendingUp, GitCompare, Settings, Activity } from "lucide-react";

const navLinks = [
    { href: "/", label: "Dashboard", icon: BarChart2 },
    { href: "/stocks", label: "Markets", icon: TrendingUp },
    { href: "/compare", label: "Compare", icon: GitCompare },
    { href: "/admin/ingest", label: "Admin", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-all">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity outline-none">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Activity className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <span className="text-foreground">Stocks</span>
                </Link>

                {/* Nav links (Desktop) */}
                <nav className="hidden md:flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
                    {navLinks.map(({ href, label, icon: Icon }) => {
                        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all outline-none",
                                    active
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center">
                    <ThemeToggle />
                </div>
            </div>

            {/* Mobile nav (Bottom bar style for better UX) */}
            <div className="flex md:hidden border-t border-border/60 bg-background/95 pb-safe">
                {navLinks.map(({ href, label, icon: Icon }) => {
                    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold transition-colors outline-none",
                                active
                                    ? "text-primary bg-primary/5"
                                    : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", active ? "stroke-[2.5]" : "")} />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </header>
    );
}