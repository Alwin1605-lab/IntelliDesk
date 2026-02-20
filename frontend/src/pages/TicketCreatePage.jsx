import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TicketForm from "@/components/tickets/TicketForm";
import AiSuggestionPanel from "@/components/tickets/AiSuggestionPanel";
import { ticketsAPI } from "@/api/tickets";
import { chatbotAPI } from "@/api/chatbot";
import { toast } from "sonner";

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [predictedPriority, setPredictedPriority] = useState("");
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleDescriptionChange = useCallback(
    (description) => {
      if (debounceTimer) clearTimeout(debounceTimer);

      if (description.length < 30) {
        setSuggestions(null);
        return;
      }

      const timer = setTimeout(async () => {
        setIsFetchingSuggestions(true);
        try {
          const [suggestionsRes, priorityRes] = await Promise.allSettled([
            chatbotAPI.getSuggestions(description),
            chatbotAPI.predictPriority({ description }),
          ]);

          if (suggestionsRes.status === "fulfilled") {
            setSuggestions(suggestionsRes.value.data.suggestions || []);
          }
          if (priorityRes.status === "fulfilled") {
            setPredictedPriority(priorityRes.value.data.priority || "");
          }
        } catch {
          // Silently fail — AI suggestions are optional
        } finally {
          setIsFetchingSuggestions(false);
        }
      }, 1000);

      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await ticketsAPI.create(formData);
      toast.success("Ticket created successfully!");
      navigate(`/tickets/${response.data.id || response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Ticket</h1>
        <p className="text-muted-foreground">
          Describe your issue and we'll help you resolve it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TicketForm
            onSubmit={handleSubmit}
            onDescriptionChange={handleDescriptionChange}
            predictedPriority={predictedPriority}
            isSubmitting={isSubmitting}
          />
        </div>
        <div>
          <AiSuggestionPanel
            suggestions={suggestions}
            isLoading={isFetchingSuggestions}
          />
        </div>
      </div>
    </div>
  );
}
