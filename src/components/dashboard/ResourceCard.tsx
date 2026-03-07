import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsagePieChart } from './UsagePieChart';
import { formatResourceValue, getUsageBadgeClass } from '@/lib/format';
import type { NodeMetrics, PodMetrics } from '@/types/k8s';
import { Cpu, MemoryStick } from "lucide-react";

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
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold truncate flex items-center justify-between">
          <span className="truncate">{pod.name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {pod.namespace}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPU Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">CPU</div>
              <div className="font-mono text-sm">
                {formatResourceValue(pod.cpu, 'cpu')}
              </div>
            </div>
          </div>
        </div>

        {/* Memory Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Memory</div>
              <div className="font-mono text-sm">
                {formatResourceValue(pod.memory, 'memory')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}