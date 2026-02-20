import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const data = [
    { name: "Mon", time: 45 },
    { name: "Tue", time: 30 },
    { name: "Wed", time: 55 },
    { name: "Thu", time: 25 },
    { name: "Fri", time: 40 },
    { name: "Sat", time: 60 },
    { name: "Sun", time: 35 },
];

export default function ResponseTimeChart() {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Avg Response Time (min)</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}m`}
                        />
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Bar dataKey="time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Response Time" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
