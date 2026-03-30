"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Render a dimensionally identical placeholder to prevent layout shift during hydration
    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/50 shadow-sm">
                <span className="sr-only">Toggle theme placeholder</span>
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="icon"
            className="relative h-9 w-9 rounded-xl border-border/50 shadow-sm hover:bg-secondary/80 transition-colors outline-none overflow-hidden"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            <Sun className="h-4 w-4 text-amber-500 transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 text-blue-400 transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}