"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-50 border border-red-100 shadow-sm dark:bg-red-900/20 dark:border-red-900/50">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" strokeWidth={2} />
            </div>

            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
                Something went wrong
            </h2>

            <p className="mt-3 text-base font-medium text-muted-foreground max-w-md mx-auto">
                An unexpected error occurred while trying to load this page.
            </p>

            {/* Formatted Error Message Block */}
            <div className="mt-5 max-w-md w-full rounded-xl bg-muted/50 border border-border/50 p-4 text-left shadow-inner">
                <p className="text-xs font-mono text-muted-foreground break-words line-clamp-3">
                    {error.message || "Unknown error boundary triggered."}
                </p>
            </div>

            <Button
                onClick={reset}
                size="lg"
                className="mt-8 shadow-sm font-semibold transition-all hover:scale-[1.02]"
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
            </Button>
        </div>
    );
}