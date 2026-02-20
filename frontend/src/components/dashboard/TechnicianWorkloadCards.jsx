import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const defaultWorkload = [
  { id: 1, name: "Alex Johnson", avatar: null, assigned: 8, capacity: 12, skills: ["Hardware", "Network"] },
  { id: 2, name: "Sarah Chen", avatar: null, assigned: 11, capacity: 12, skills: ["Software", "Email"] },
  { id: 3, name: "Mike Rivera", avatar: null, assigned: 5, capacity: 10, skills: ["Security", "VPN"] },
  { id: 4, name: "Priya Patel", avatar: null, assigned: 9, capacity: 10, skills: ["Database", "Software"] },
];

function getLoadColor(percentage) {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 70) return "bg-yellow-500";
  return "bg-green-500";
}

export default function TechnicianWorkloadCards({ workload }) {
  const data = workload || defaultWorkload;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Technician Workload</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((tech) => {
            const percentage = Math.round((tech.assigned / tech.capacity) * 100);
            return (
              <div key={tech.id} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={tech.avatar} />
                  <AvatarFallback name={tech.name} className="text-xs" />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{tech.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {tech.assigned}/{tech.capacity}
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getLoadColor(percentage))}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    {tech.skills.map((skill) => (
                      <span key={skill} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
