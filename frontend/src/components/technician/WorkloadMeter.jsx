import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function WorkloadMeter({ assigned = 7, capacity = 12 }) {
  const percentage = Math.round((assigned / capacity) * 100);
  const remaining = capacity - assigned;

  let statusColor = "text-green-600 dark:text-green-400";
  let barColor = "bg-green-500";
  let statusText = "Light";

  if (percentage >= 90) {
    statusColor = "text-red-600 dark:text-red-400";
    barColor = "bg-red-500";
    statusText = "Overloaded";
  } else if (percentage >= 70) {
    statusColor = "text-yellow-600 dark:text-yellow-400";
    barColor = "bg-yellow-500";
    statusText = "Heavy";
  } else if (percentage >= 50) {
    statusColor = "text-blue-600 dark:text-blue-400";
    barColor = "bg-blue-500";
    statusText = "Moderate";
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">My Workload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{assigned}</p>
            <p className="text-sm text-muted-foreground">Active tickets</p>
          </div>
          <div className="text-right">
            <p className={cn("text-sm font-semibold", statusColor)}>{statusText}</p>
            <p className="text-xs text-muted-foreground">{remaining} slots remaining</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% capacity</span>
            <span>{capacity} max</span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-lg font-bold">3</p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-lg font-bold">3</p>
            <p className="text-[10px] text-muted-foreground">Working</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-lg font-bold">1</p>
            <p className="text-[10px] text-muted-foreground">Done</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
