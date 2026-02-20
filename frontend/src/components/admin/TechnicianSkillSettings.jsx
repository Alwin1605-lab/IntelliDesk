import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Plus, X } from "lucide-react";
import { TICKET_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";

const defaultTechnicians = [
  { id: 1, name: "Alex Johnson", skills: ["Hardware", "Network", "VPN"] },
  { id: 2, name: "Sarah Chen", skills: ["Software", "Email", "Database"] },
  { id: 3, name: "Mike Rivera", skills: ["Security", "VPN", "Network"] },
  { id: 4, name: "Priya Patel", skills: ["Database", "Software", "Access/Permissions"] },
];

export default function TechnicianSkillSettings({ technicians }) {
  const data = technicians || defaultTechnicians;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Technician Skills & Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((tech) => (
          <div
            key={tech.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback name={tech.name} className="text-xs" />
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{tech.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tech.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 text-xs">
                    {skill}
                    <button
                      onClick={() => toast.info(`Remove ${skill} from ${tech.name}`)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={() => toast.info(`Add skill to ${tech.name}`)}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
