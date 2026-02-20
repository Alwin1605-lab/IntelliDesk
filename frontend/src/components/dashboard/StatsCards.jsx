import { TrendingUp, TrendingDown, Ticket, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const defaultStats = [
  {
    title: "Total Tickets",
    value: 0,
    change: "+12%",
    trend: "up",
    icon: Ticket,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Open Tickets",
    value: 0,
    change: "+5%",
    trend: "up",
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "High Priority",
    value: 0,
    change: "-8%",
    trend: "down",
    icon: AlertCircle,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    title: "Closed Today",
    value: 0,
    change: "+20%",
    trend: "up",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
];

export default function StatsCards({ stats }) {
  const cards = stats
    ? [
      { ...defaultStats[0], value: stats.total },
      { ...defaultStats[1], value: stats.open },
      { ...defaultStats[2], value: stats.highPriority },
      { ...defaultStats[3], value: stats.closedToday },
    ]
    : defaultStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
              </div>
              <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", card.bg)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {card.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  card.trend === "up" ? "text-green-600" : "text-red-600"
                )}
              >
                {card.change}
              </span>
              <span className="text-xs text-muted-foreground">from last week</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
