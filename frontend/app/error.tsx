"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
            <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "hsl(var(--loss-bg))" }}
            >
                <AlertTriangle className="h-7 w-7" style={{ color: "hsl(var(--loss))" }} />
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p
                className="mt-2 text-sm max-w-md"
                style={{ color: "hsl(var(--muted-foreground))" }}
            >
                {error.message || "An unexpected error occurred. Please try again."}
            </p>
            <button
                onClick={reset}
                className="mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                }}
            >
                <RefreshCw className="h-4 w-4" />
                Try again
            </button>
        </div>
    );
}