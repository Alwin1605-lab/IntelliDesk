import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/tickets/StatusBadge";
import PriorityChip from "@/components/tickets/PriorityChip";
import { cn, formatDate } from "@/lib/utils";
import { GripVertical } from "lucide-react";

const columns = [
  { id: "open", title: "Open", color: "bg-blue-500" },
  { id: "in_progress", title: "Working", color: "bg-yellow-500" },
  { id: "resolved", title: "Done", color: "bg-green-500" },
];

const defaultTickets = {
  open: [
    { id: "TK-010", title: "WiFi not connecting in Building B", priority: "high", category: "Network", createdAt: new Date().toISOString() },
    { id: "TK-011", title: "Request for new monitor", priority: "low", category: "Hardware", createdAt: new Date().toISOString() },
  ],
  in_progress: [
    { id: "TK-008", title: "Outlook keeps crashing", priority: "medium", category: "Software", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "TK-009", title: "VPN access for new employee", priority: "high", category: "VPN", createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
  resolved: [
    { id: "TK-007", title: "Password reset for admin account", priority: "critical", category: "Security", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  ],
};

function KanbanCard({ ticket, onStatusChange }) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("ticketId", ticket.id);
        e.dataTransfer.setData("currentStatus", ticket.status || "open");
      }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
          </div>
          <PriorityChip priority={ticket.priority} />
        </div>
        <p className="text-sm font-medium leading-tight">{ticket.title}</p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
          <span className="text-[10px] text-muted-foreground">{formatDate(ticket.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard({ tickets, onMoveTicket }) {
  const [boardTickets, setBoardTickets] = useState(tickets || defaultTickets);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    setDragOverColumn(null);

    const ticketId = e.dataTransfer.getData("ticketId");
    const sourceColumn = e.dataTransfer.getData("currentStatus");

    if (sourceColumn === targetColumn) return;

    // Find and move ticket
    const sourceTickets = [...(boardTickets[sourceColumn] || [])];
    const ticketIndex = sourceTickets.findIndex((t) => t.id === ticketId);
    if (ticketIndex === -1) return;

    const [movedTicket] = sourceTickets.splice(ticketIndex, 1);
    const targetTickets = [...(boardTickets[targetColumn] || []), { ...movedTicket, status: targetColumn }];

    setBoardTickets({
      ...boardTickets,
      [sourceColumn]: sourceTickets,
      [targetColumn]: targetTickets,
    });

    if (onMoveTicket) {
      onMoveTicket(ticketId, targetColumn);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((column) => {
        const columnTickets = boardTickets[column.id] || [];
        return (
          <div
            key={column.id}
            className={cn(
              "rounded-lg border bg-muted/30 p-3 transition-colors min-h-[400px]",
              dragOverColumn === column.id && "border-primary bg-primary/5"
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("h-3 w-3 rounded-full", column.color)} />
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {columnTickets.length}
              </span>
            </div>
            <div className="space-y-2">
              {columnTickets.map((ticket) => (
                <KanbanCard key={ticket.id} ticket={ticket} />
              ))}
              {columnTickets.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  Drop tickets here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
