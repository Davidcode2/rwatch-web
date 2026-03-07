import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PodMetrics } from "@/types/k8s";
import { UsagePieChart } from "./dashboard/UsagePieChart";
import { formatResourceValue } from "@/lib/format";
import { PodCard } from "./dashboard/ResourceCard";

interface PodsTableProps {
  pods: PodMetrics[];
}

export function PodsTable({ pods }: PodsTableProps) {
  // Parse CPU percentage from string (format: "500m (25%)" or "0.5 (25%)")
  const parseCpuPercentage = (cpuStr: string): number => {
    const match = cpuStr.match(/\((\d+(?:\.\d+)?)%?\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Parse Memory percentage from string (format: "1Gi (50%)")
  const parseMemoryPercentage = (memStr: string): number => {
    const match = memStr.match(/\((\d+(?:\.\d+)?)%?\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Extract just the usage value without the percentage part
  const extractCpuUsage = (cpuStr: string): string => {
    return cpuStr.split('(')[0].trim();
  };

  const extractMemoryUsage = (memStr: string): string => {
    return memStr.split('(')[0].trim();
  };

  return (
    <div className="space-y-4">
      {/* Mobile View: Card Grid */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pods.map((pod) => (
          <PodCard key={`${pod.namespace}-${pod.name}`} pod={pod} />
        ))}
        {pods.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No pods found
          </div>
        )}
      </div>

      {/* Desktop View: Table with Pie Charts */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Pod Name</TableHead>
              <TableHead className="w-1/4">Namespace</TableHead>
              <TableHead className="w-1/4">CPU</TableHead>
              <TableHead className="w-1/4">Memory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pods.map((pod) => {
              const cpuPercentage = parseCpuPercentage(pod.cpu);
              const memoryPercentage = parseMemoryPercentage(pod.memory);
              const cpuUsage = extractCpuUsage(pod.cpu);
              const memoryUsage = extractMemoryUsage(pod.memory);

              return (
                <TableRow key={`${pod.namespace}-${pod.name}`}>
                  <TableCell className="font-medium">{pod.name}</TableCell>
                  <TableCell>{pod.namespace}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UsagePieChart percentage={cpuPercentage} size={32} />
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">
                          {formatResourceValue(cpuUsage, 'cpu')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {cpuPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UsagePieChart percentage={memoryPercentage} size={32} />
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">
                          {formatResourceValue(memoryUsage, 'memory')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {memoryPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {pods.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No pods found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}