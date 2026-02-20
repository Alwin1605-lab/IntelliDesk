import { AlertTriangle, Clock, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function SlaAlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !alerts || alerts.length === 0) return null;

  return (
    <div className="relative rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20 p-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            SLA Breach Warning
          </h4>
          <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
            {alerts.length} ticket{alerts.length > 1 ? "s" : ""} approaching SLA breach deadline
          </p>
          <div className="mt-2 space-y-1">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-400">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{alert.id}</span>
                <span className="truncate">{alert.title}</span>
                <span className="ml-auto font-medium whitespace-nowrap">{alert.timeLeft} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
