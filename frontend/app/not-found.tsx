import Link from "next/link";
import { BarChart2, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "hsl(var(--muted))" }}
            >
                <BarChart2 className="h-8 w-8" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">404</h1>
            <p className="mt-2 text-lg font-medium">Page not found</p>
            <p className="mt-1 text-sm max-w-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                The page you&apos;re looking for doesn&apos;t exist or the stock symbol is invalid.
            </p>
            <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "hsl(var(--primary))" }}
            >
                <Home className="h-4 w-4" />
                Back to Dashboard
            </Link>
        </div>
    );
}