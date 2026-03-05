import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useK8sMetrics } from "@/hooks/useK8sMetrics";
import { Server, Box, HardDrive } from "lucide-react";
import { NodesTable } from "./NodesTable";
import { PodsTable } from "./PodsTable";

export function KubernetesMetrics() {
  const { nodesMetrics, podsMetrics, summary, loading, error } = useK8sMetrics();

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Metrics</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : summary?.nodes.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `${summary?.nodes?.cpuUsage?.toFixed(1) ?? '0.0'}% avg CPU`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pods</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : summary?.pods.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `${summary?.pods?.memoryUsage ?? '0Mi'} memory`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cluster Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${summary?.nodes?.memoryUsage?.toFixed(1) ?? '0.0'}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `Avg usage across nodes`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Nodes and Pods */}
      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nodes" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Nodes ({loading ? "..." : nodesMetrics?.nodes.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pods" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Pods ({loading ? "..." : podsMetrics?.pods.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Node Metrics</CardTitle>
              <CardDescription>
                CPU and memory usage per node
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Loading node metrics...
                </div>
              ) : (
                <NodesTable nodes={nodesMetrics?.nodes || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pods" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pod Metrics</CardTitle>
              <CardDescription>
                Resource usage per pod
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Loading pod metrics...
                </div>
              ) : (
                <PodsTable pods={podsMetrics?.pods || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}