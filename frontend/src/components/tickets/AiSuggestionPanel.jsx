import { Lightbulb, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AiSuggestionPanel({ suggestions, isLoading, onApplySuggestion }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing your issue...
          </div>
        ) : suggestions && suggestions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Based on your description, here are some recommended fixes:
            </p>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="rounded-lg border bg-background p-3 space-y-2"
              >
                <h4 className="text-sm font-medium">{suggestion.title}</h4>
                <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                <div className="flex items-center gap-2">
                  {suggestion.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => window.open(suggestion.link, "_blank")}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View Article
                    </Button>
                  )}
                  {onApplySuggestion && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onApplySuggestion(suggestion)}
                    >
                      Try This Fix
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Start typing your issue description and AI will suggest possible fixes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
