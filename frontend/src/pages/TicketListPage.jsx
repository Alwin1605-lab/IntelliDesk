import { useState } from "react";
import TicketTable from "@/components/tickets/TicketTable";
import TicketFilters from "@/components/tickets/TicketFilters";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

export default function TicketListPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    category: "",
    dateFrom: "",
    dateTo: "",
  });
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const handleAssign = (ticket) => {
    toast.info(`Assign ticket ${ticket.id} — modal would open here`);
  };

  const handleClose = (ticket) => {
    toast.info(`Close ticket ${ticket.id} — confirmation would appear here`);
  };

  const handleEscalate = (ticket) => {
    toast.info(`Escalate ticket ${ticket.id} — modal would open here`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Manage and track all support tickets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Sort by:</label>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-44"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="priority_desc">Highest Priority</option>
            <option value="priority_asc">Lowest Priority</option>
            <option value="status_asc">Status (A-Z)</option>
          </Select>
        </div>
      </div>

      <TicketFilters filters={filters} onFilterChange={setFilters} />

      <TicketTable
        currentPage={currentPage}
        totalPages={3}
        onPageChange={setCurrentPage}
        onAssign={handleAssign}
        onClose={handleClose}
        onEscalate={handleEscalate}
      />
    </div>
  );
}
