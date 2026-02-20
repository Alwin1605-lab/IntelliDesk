import { cn } from "@/lib/utils";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/constants";

export default function PriorityChip({ priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium
      )}
    >
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}
