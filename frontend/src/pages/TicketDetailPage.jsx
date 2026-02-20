import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Play, CheckCircle, RotateCcw } from "lucide-react";
import TicketHeader from "@/components/tickets/TicketHeader";
import Timeline from "@/components/tickets/Timeline";
import CommentsSection from "@/components/tickets/CommentsSection";
import TechnicianNotes from "@/components/tickets/TechnicianNotes";
import AttachmentViewer from "@/components/tickets/AttachmentViewer";
import useAuthStore from "@/stores/authStore";
import { ROLES } from "@/lib/constants";
import { toast } from "sonner";

const mockTicketData = {
  id: "TK-001",
  title: "Laptop not booting after Windows update",
  description:
    "After the latest Windows 11 update (KB5034765), my Dell Latitude 5540 shows a Blue Screen of Death (BSOD) during startup. The error code displayed is SYSTEM_SERVICE_EXCEPTION. I've tried restarting multiple times but the issue persists. This is blocking all my work.",
  category: "Hardware",
  priority: "high",
  status: "open",
  assignee: "Alex Johnson",
  createdBy: "John Doe",
  department: "Engineering",
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  updatedAt: new Date(Date.now() - 43200000).toISOString(),
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isTechnician = [ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN].includes(user?.role);

  // Local state for interactivity
  const [ticket, setTicket] = useState(mockTicketData);
  const [timelineEvents, setTimelineEvents] = useState([
    { id: 1, type: "created", user: "John Doe", date: mockTicketData.createdAt },
  ]);

  useEffect(() => {
    // In a real app, fetch ticket here
    // setTicket({...fetchedTicket});
  }, [id]);

  const addTimelineEvent = (type, user, details) => {
    const newEvent = {
      id: Date.now(),
      type,
      user,
      date: new Date().toISOString(),
      details
    };
    setTimelineEvents(prev => [newEvent, ...prev]);
  };

  const handleStartWork = () => {
    setTicket(prev => ({ ...prev, status: "in_progress" }));
    addTimelineEvent("status_change", user?.name || "Technician", "Changed status to In Progress");
    toast.success("Started working on ticket");
  };

  const handleResolve = () => {
    setTicket(prev => ({ ...prev, status: "resolved" }));
    addTimelineEvent("status_change", user?.name || "Technician", "Changed status to Resolved");
    toast.success("Ticket marked as resolved");
  };

  const handleReopen = () => {
    setTicket(prev => ({ ...prev, status: "open" }));
    addTimelineEvent("status_change", user?.name || "Technician", "Reopened ticket");
    toast.info("Ticket reopened");
  };

  return (
    <div className="space-y-6">
      <TicketHeader ticket={ticket} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isTechnician && (
            <div className="flex flex-wrap gap-2">
              {ticket.status === "open" && (
                <Button onClick={handleStartWork} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Work
                </Button>
              )}
              {(ticket.status === "open" || ticket.status === "in_progress") && (
                <Button onClick={handleResolve} variant="outline" className="gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950">
                  <CheckCircle className="h-4 w-4" />
                  Resolve
                </Button>
              )}
              {(ticket.status === "resolved" || ticket.status === "closed") && (
                <Button onClick={handleReopen} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reopen
                </Button>
              )}
            </div>
          )}

          <Separator />

          {/* Timeline - passing local state if needed (assuming Timeline component can accept props, otherwise it stays static for now) */}
          <Timeline events={timelineEvents} />

          <Separator />

          {/* Comments */}
          <CommentsSection ticketId={ticket.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket details card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-sm font-semibold">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{ticket.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created by</span>
                  <span className="font-medium">{ticket.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{ticket.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assignee</span>
                  <span className="font-medium">{ticket.assignee || "Unassigned"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technician Notes */}
          {isTechnician && <TechnicianNotes ticketId={ticket.id} />}

          {/* Attachments */}
          <AttachmentViewer ticketId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
