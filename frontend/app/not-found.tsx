import Link from "next/link";
import { BarChart2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-muted/50 border border-border/50 shadow-sm">
                <BarChart2 className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
            </div>

            <h1 className="text-7xl font-black tracking-tighter text-foreground">
                404
            </h1>

            <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                Page not found
            </p>

            <p className="mt-2 text-base font-medium text-muted-foreground max-w-sm">
                The page you&apos;re looking for doesn&apos;t exist or the stock symbol is invalid.
            </p>

            <Link href="/" className="mt-8 outline-none">
                <Button size="lg" className="shadow-sm font-semibold transition-all hover:scale-[1.02]">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
    );
}