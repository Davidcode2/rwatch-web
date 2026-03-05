import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

import { cn } from "@/lib/utils"

// Format bytes to human readable format
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface LineChartProps {
  data: Array<Record<string, any>>
  config: ChartConfig
  xAxisKey: string
  className?: string
  showLegend?: boolean
  showTooltip?: boolean
}

function LineChart({
  data,
  config,
  xAxisKey,
  className,
  showLegend = true,
  showTooltip = true,
}: LineChartProps) {
  const dataKeys = Object.keys(config)

  return (
    <div className={cn("w-full h-[300px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickLine={{ stroke: "currentColor" }}
            axisLine={{ stroke: "currentColor" }}
          />
          <YAxis
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickLine={{ stroke: "currentColor" }}
            axisLine={{ stroke: "currentColor" }}
            tickFormatter={(value) => formatBytes(value || 0)}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number | undefined) => formatBytes(value || 0)}
            />
          )}
          {showLegend && <Legend />}
          {dataKeys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={config[key].color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { LineChart, type ChartConfig }
