import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30 border border-border/50 shadow-sm">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
                <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">
                    Loading data...
                </p>
            </div>
        </div>
    );
}