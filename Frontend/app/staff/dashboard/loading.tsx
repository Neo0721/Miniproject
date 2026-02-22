export default function Loading() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground animate-pulse">Loading Staff Dashboard...</p>
        </div>
    )
}
