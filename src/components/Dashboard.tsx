import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, type ChartConfig } from "@/components/ui/chart";
import { useMetrics } from "@/hooks/useMetrics";
import { KubernetesMetrics } from "@/components/KubernetesMetrics";
import { Activity, Server, MemoryStick, AlertCircle } from "lucide-react";

const chartConfig: ChartConfig = {
  usedMemory: {
    label: "Used Memory",
    color: "hsl(var(--chart-1))",
  },
  availableMemory: {
    label: "Available Memory",
    color: "hsl(var(--chart-2))",
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

export function Dashboard() {
  const { agents, metrics, history, loading, error } = useMetrics();

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-destructive">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>Error: {error}</span>
      </div>
    );
  }

  const usedMemory = metrics ? metrics.total_memory_bytes - metrics.available_memory_bytes : 0;
  const memoryUsagePercent = calculatePercentage(usedMemory, metrics?.total_memory_bytes || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rwatch Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          {loading ? "Loading..." : "Live"}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_nodes || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.healthy_nodes || 0} healthy, {metrics?.failed_nodes || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memory</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(metrics?.total_memory_bytes || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cluster total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Memory</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(usedMemory)}
            </div>
            <p className="text-xs text-muted-foreground">
              {memoryUsagePercent}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Memory</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(metrics?.available_memory_bytes || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {100 - memoryUsagePercent}% free
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Memory Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage Over Time</CardTitle>
          <CardDescription>
            Real-time memory usage across all nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <LineChart
              data={history}
              config={chartConfig}
              xAxisKey="timestamp"
              className="h-[350px]"
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              {loading ? "Loading data..." : "No data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>
            Status of individual rwatch agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agents.map((agent, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.success ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium">{agent.url}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {agent.success ? (
                    <span>
                      {formatBytes((agent.data?.memory.total || 0) * 1024)} total
                    </span>
                  ) : (
                    <span className="text-destructive">{agent.error}</span>
                  )}
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No agents found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kubernetes Metrics */}
      <KubernetesMetrics />
    </div>
  );
}
