import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import useAuthStore from "@/stores/authStore";

const defaultComments = [
  {
    id: 1,
    user: { name: "John Doe", role: "user" },
    content: "I've been experiencing this issue since the last Windows update. The laptop shows a blue screen and restarts.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    user: { name: "Alex Johnson", role: "technician" },
    content: "Thank you for the details. This seems like a driver compatibility issue. Could you please try booting in Safe Mode? Press F8 during startup.",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

export default function CommentsSection({ comments, onAddComment, ticketId }) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const data = comments || defaultComments;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (onAddComment) {
        await onAddComment({ content: newComment });
      }
      setNewComment("");
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Comments ({data.length})</h3>

      {/* Comments list */}
      <div className="space-y-4">
        {data.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback name={comment.user.name} className="text-xs" />
            </Avatar>
            <div className="flex-1 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize">
                  {comment.user.role}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDateTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback name={user?.name} className="text-xs" />
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!newComment.trim() || isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Comment
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
