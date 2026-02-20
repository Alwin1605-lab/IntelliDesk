import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { TICKET_STATUS, STATUS_LABELS } from "@/lib/constants";

export default function UpdateStatusModal({ open, onOpenChange, ticket, onUpdate }) {
  const [status, setStatus] = useState(ticket?.status || "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (onUpdate) {
        await onUpdate(ticket.id, status, note);
      }
      onOpenChange(false);
      setNote("");
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Ticket Status</DialogTitle>
          <DialogDescription>
            Change the status of ticket {ticket?.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(TICKET_STATUS).map(([key, value]) => (
                <option key={key} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this status change..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
