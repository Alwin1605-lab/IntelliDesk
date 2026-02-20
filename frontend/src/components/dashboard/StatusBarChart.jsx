import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultData = [
  { name: "Mon", open: 12, inProgress: 8, resolved: 15, closed: 10 },
  { name: "Tue", open: 15, inProgress: 10, resolved: 12, closed: 8 },
  { name: "Wed", open: 8, inProgress: 12, resolved: 18, closed: 14 },
  { name: "Thu", open: 10, inProgress: 15, resolved: 10, closed: 12 },
  { name: "Fri", open: 20, inProgress: 8, resolved: 14, closed: 16 },
  { name: "Sat", open: 5, inProgress: 4, resolved: 8, closed: 6 },
  { name: "Sun", open: 3, inProgress: 2, resolved: 5, closed: 4 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((item) => (
          <p key={item.name} className="text-xs" style={{ color: item.color }}>
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StatusBarChart({ data }) {
  const chartData = data || defaultData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tickets by Status (This Week)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-foreground capitalize">{value}</span>
                )}
              />
              <Bar dataKey="open" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="inProgress" fill="var(--chart-4)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="resolved" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="closed" fill="var(--chart-3)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
