import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

const defaultData = [
  { name: "Hardware", value: 25 },
  { name: "Software", value: 35 },
  { name: "Network", value: 20 },
  { name: "Email", value: 10 },
  { name: "Other", value: 10 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value} tickets ({((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function CategoryPieChart({ data }) {
  const chartData = data || defaultData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = chartData.map((item) => ({ ...item, total }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tickets by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
