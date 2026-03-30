export default function Loading() {
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex items-center gap-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                <div
                    className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }}
                />
                <span className="text-sm font-medium">Loading…</span>
            </div>
        </div>
    );
}