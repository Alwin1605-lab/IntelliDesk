import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Info } from "lucide-react";
import { TICKET_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";

const defaultRules = [
  { id: 1, category: "Hardware", assignTo: "Round Robin", priority: "auto", slaHours: 24 },
  { id: 2, category: "Software", assignTo: "Skill Based", priority: "auto", slaHours: 16 },
  { id: 3, category: "Network", assignTo: "Least Loaded", priority: "auto", slaHours: 8 },
  { id: 4, category: "Security", assignTo: "Manual", priority: "critical", slaHours: 4 },
];

export default function AssignmentRulesPanel({ rules }) {
  const data = rules || defaultRules;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Shuffle className="h-5 w-5" />
          Auto-Assignment Rules
        </CardTitle>
        <Button size="sm" onClick={() => toast.info("Add new rule")}>
          Add Rule
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Category</p>
                  <Badge variant="outline">{rule.category}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Assignment</p>
                  <p className="text-sm font-medium">{rule.assignTo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Priority</p>
                  <p className="text-sm font-medium capitalize">{rule.priority}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">SLA</p>
                  <p className="text-sm font-medium">{rule.slaHours}h</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info(`Edit rule for ${rule.category}`)}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Rules are applied in order. When a new ticket is created, the system matches the
            category and applies the corresponding assignment strategy and SLA deadline.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
