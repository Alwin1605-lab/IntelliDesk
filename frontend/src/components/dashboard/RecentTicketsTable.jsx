import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const defaultTickets = [
  { id: "TK-001", title: "Laptop not booting", category: "Hardware", priority: "high", status: "open", createdAt: new Date().toISOString() },
  { id: "TK-002", title: "VPN connection timeout", category: "Network", priority: "medium", status: "in_progress", createdAt: new Date().toISOString() },
  { id: "TK-003", title: "Email sync failing", category: "Email", priority: "low", status: "resolved", createdAt: new Date().toISOString() },
  { id: "TK-004", title: "Software license expired", category: "Software", priority: "critical", status: "open", createdAt: new Date().toISOString() },
  { id: "TK-005", title: "Printer paper jam", category: "Hardware", priority: "low", status: "closed", createdAt: new Date().toISOString() },
];

export default function RecentTicketsTable({ tickets }) {
  const navigate = useNavigate();
  const data = tickets || defaultTickets;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Tickets</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")}>
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {ticket.title}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ticket.category}</Badge>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                    {PRIORITY_LABELS[ticket.priority]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(ticket.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
