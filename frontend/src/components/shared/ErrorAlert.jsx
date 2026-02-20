import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorAlert({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center",
        className
      )}
    >
      <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-destructive">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
