import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import PriorityChip from "./PriorityChip";
import QuickActions from "./QuickActions";
import { formatDate } from "@/lib/utils";
import useAuthStore from "@/stores/authStore";
import { ROLES } from "@/lib/constants";

export default function TicketTable({ tickets, totalPages, currentPage, onPageChange, onAssign, onClose, onEscalate }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = [ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN].includes(user?.role);

  const defaultTickets = [
    { id: "TK-001", title: "Laptop not booting after update", category: "Hardware", priority: "high", status: "open", assignee: "Alex Johnson", createdAt: new Date().toISOString() },
    { id: "TK-002", title: "VPN connection drops frequently", category: "Network", priority: "medium", status: "in_progress", assignee: "Sarah Chen", createdAt: new Date().toISOString() },
    { id: "TK-003", title: "Email sync failure on mobile", category: "Email", priority: "low", status: "resolved", assignee: null, createdAt: new Date().toISOString() },
    { id: "TK-004", title: "Adobe license expired", category: "Software", priority: "critical", status: "open", assignee: null, createdAt: new Date().toISOString() },
    { id: "TK-005", title: "Cannot access shared drive", category: "Access/Permissions", priority: "high", status: "in_progress", assignee: "Mike Rivera", createdAt: new Date().toISOString() },
    { id: "TK-006", title: "Printer showing offline status", category: "Printer", priority: "low", status: "closed", assignee: "Priya Patel", createdAt: new Date().toISOString() },
  ];

  const data = tickets || defaultTickets;
  const pages = totalPages || 1;
  const page = currentPage || 1;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created</TableHead>
              {canManage && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="h-32 text-center text-muted-foreground">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              data.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <TableCell className="font-mono text-xs font-medium">{ticket.id}</TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {ticket.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {ticket.assignee || (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                  {canManage && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <QuickActions
                        ticket={ticket}
                        onAssign={onAssign || (() => {})}
                        onClose={onClose || (() => {})}
                        onEscalate={onEscalate || (() => {})}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => onPageChange?.(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
