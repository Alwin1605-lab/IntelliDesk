import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import PriorityChip from "./PriorityChip";
import { formatDateTime } from "@/lib/utils";

export default function TicketHeader({ ticket }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            <PriorityChip priority={ticket.priority} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created {formatDateTime(ticket.createdAt)}
            </span>
            {ticket.assignee && (
              <span className="flex items-center gap-1">
                Assigned to <strong className="text-foreground">{ticket.assignee}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
