import KanbanBoard from "@/components/technician/KanbanBoard";
import WorkloadMeter from "@/components/technician/WorkloadMeter";
import { toast } from "sonner";

export default function TechnicianPanelPage() {
  const handleMoveTicket = (ticketId, newStatus) => {
    toast.success(`Ticket ${ticketId} moved to ${newStatus.replace("_", " ")}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Board</h1>
        <p className="text-muted-foreground">
          Drag and drop tickets to update their status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <KanbanBoard onMoveTicket={handleMoveTicket} />
        </div>
        <div>
          <WorkloadMeter />
        </div>
      </div>
    </div>
  );
}
