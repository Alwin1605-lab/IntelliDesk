import { MessageSquare, UserPlus, AlertTriangle, CheckCircle, RotateCcw, Clock, FileText } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

const iconMap = {
  created: Clock,
  comment: MessageSquare,
  assigned: UserPlus,
  escalated: AlertTriangle,
  resolved: CheckCircle,
  reopened: RotateCcw,
  status_change: FileText,
};

const colorMap = {
  created: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  comment: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  assigned: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  escalated: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  resolved: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  reopened: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  status_change: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const defaultTimeline = [
  { id: 1, type: "created", user: "John Doe", message: "Ticket created", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 2, type: "assigned", user: "System", message: "Assigned to Alex Johnson", timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString() },
  { id: 3, type: "comment", user: "Alex Johnson", message: "Looking into this issue now", timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, type: "status_change", user: "Alex Johnson", message: "Status changed to In Progress", timestamp: new Date(Date.now() - 86400000 + 1800000).toISOString() },
];

export default function Timeline({ events }) {
  const data = events || defaultTimeline;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Activity Timeline</h3>
      <div className="relative space-y-0">
        {data.map((event, index) => {
          const Icon = iconMap[event.type] || Clock;
          return (
            <div key={event.id} className="relative flex gap-4 pb-6">
              {/* Vertical line */}
              {index < data.length - 1 && (
                <div className="absolute left-[17px] top-9 bottom-0 w-px bg-border" />
              )}
              {/* Icon */}
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 z-10", colorMap[event.type] || colorMap.comment)}>
                <Icon className="h-4 w-4" />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{event.user}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{event.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
