import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsagePieChart } from './UsagePieChart';
import { formatResourceValue, getUsageBadgeClass } from '@/lib/format';
import type { NodeMetrics, PodMetrics } from '@/types/k8s';

interface ResourceCardProps {
  name: string;
  namespace?: string;
  cpuUsage: string;
  cpuPercentage: number;
  memoryUsage: string;
  memoryPercentage: number;
}

export function ResourceCard({
  name,
  namespace,
  cpuUsage,
  cpuPercentage,
  memoryUsage,
  memoryPercentage,
}: ResourceCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold truncate flex items-center justify-between">
          <span className="truncate">{name}</span>
          {namespace && (
            <span className="text-xs font-normal text-muted-foreground">
              {namespace}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPU Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UsagePieChart percentage={cpuPercentage} size={36} />
            <div>
              <div className="text-sm text-muted-foreground">CPU</div>
              <div className="font-mono text-sm">
                {formatResourceValue(cpuUsage, 'cpu')}
              </div>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-sm font-semibold ${getUsageBadgeClass(
              cpuPercentage
            )}`}
          >
            {cpuPercentage.toFixed(1)}%
          </span>
        </div>

        {/* Memory Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UsagePieChart percentage={memoryPercentage} size={36} />
            <div>
              <div className="text-sm text-muted-foreground">Memory</div>
              <div className="font-mono text-sm">
                {formatResourceValue(memoryUsage, 'memory')}
              </div>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-sm font-semibold ${getUsageBadgeClass(
              memoryPercentage
            )}`}
          >
            {memoryPercentage.toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface NodeCardProps {
  node: NodeMetrics;
}

export function NodeCard({ node }: NodeCardProps) {
  return (
    <ResourceCard
      name={node.name}
      cpuUsage={node.cpu.usage}
      cpuPercentage={node.cpu.usage_percentage}
      memoryUsage={node.memory.usage}
      memoryPercentage={node.memory.usage_percentage}
    />
  );
}

interface PodCardProps {
  pod: PodMetrics;
}

export function PodCard({ pod }: PodCardProps) {
  // Parse CPU percentage from string (format: "500m (25%)")
  const parseCpuPercentage = (cpuStr: string): number => {
    const match = cpuStr.match(/\((\d+(?:\.\d+)?)%?\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Parse Memory percentage from string (format: "1Gi (50%)")
  const parseMemoryPercentage = (memStr: string): number => {
    const match = memStr.match(/\((\d+(?:\.\d+)?)%?\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  return (
    <ResourceCard
      name={pod.name}
      namespace={pod.namespace}
      cpuUsage={pod.cpu}
      cpuPercentage={parseCpuPercentage(pod.cpu)}
      memoryUsage={pod.memory}
      memoryPercentage={parseMemoryPercentage(pod.memory)}
    />
  );
}