import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MetricsHistoryPoint } from "@/hooks/useK8sMetrics";

interface K8sMetricsChartProps {
  history?: MetricsHistoryPoint[];
  metric: "cpu" | "memory";
  loading?: boolean;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function K8sMetricsChart({ history = [], metric, loading }: K8sMetricsChartProps) {
  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Loading metrics history...
      </div>
    );
  }

  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Collecting data... Check back in a moment.
      </div>
    );
  }

  const data = history.map((point) => ({
    time: formatTime(point.timestamp),
    value: metric === "cpu" ? point.cpuUsage : point.memoryUsage,
  }));

  const color = metric === "cpu" ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))";
  const label = metric === "cpu" ? "CPU Usage" : "Memory Usage";
  const unit = "%";

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="time"
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickLine={{ stroke: "currentColor" }}
            axisLine={{ stroke: "currentColor" }}
          />
          <YAxis
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickLine={{ stroke: "currentColor" }}
            axisLine={{ stroke: "currentColor" }}
            tickFormatter={(value) => `${value.toFixed(1)}${unit}`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number | undefined) => {
              const numValue = typeof value === "number" ? value : 0;
              return [`${numValue.toFixed(1)}${unit}`, label];
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
