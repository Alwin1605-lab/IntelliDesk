import { useState } from "react";
import { Lock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

const defaultNotes = [
  {
    id: 1,
    author: "Alex Johnson",
    content: "Checked system logs. BSOD caused by incompatible GPU driver (nvlddmkm.sys). Need to rollback driver version.",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

export default function TechnicianNotes({ notes, onAddNote }) {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const data = notes || defaultNotes;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      if (onAddNote) {
        await onAddNote({ content: newNote });
      }
      setNewNote("");
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-yellow-200 dark:border-yellow-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          Technician Notes
          <span className="text-xs font-normal text-muted-foreground">(Internal only)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((note) => (
          <div key={note.id} className="rounded-md bg-yellow-50 dark:bg-yellow-950/20 p-3 border border-yellow-100 dark:border-yellow-900/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{note.author}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(note.createdAt)}
              </span>
            </div>
            <p className="text-sm">{note.content}</p>
          </div>
        ))}

        <form onSubmit={handleSubmit} className="space-y-2 pt-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add internal note..."
            rows={2}
            className="bg-yellow-50/50 dark:bg-yellow-950/10"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="outline" disabled={!newNote.trim() || isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Add Note
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
