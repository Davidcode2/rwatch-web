import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NodeMetrics } from "@/types/k8s";
import { UsagePieChart } from "./dashboard/UsagePieChart";
import { formatResourceValue, getUsageBadgeClass } from "@/lib/format";
import { NodeCard } from "./dashboard/ResourceCard";

interface NodesTableProps {
  nodes: NodeMetrics[];
}

export function NodesTable({ nodes }: NodesTableProps) {
  return (
    <div className="space-y-4">
      {/* Mobile View: Card Grid */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {nodes.map((node) => (
          <NodeCard key={node.name} node={node} />
        ))}
        {nodes.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No nodes found
          </div>
        )}
      </div>

      {/* Desktop View: Table with Pie Charts */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Node Name</TableHead>
              <TableHead className="w-1/3">CPU Usage</TableHead>
              <TableHead className="w-1/3">Memory Usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.name}>
                <TableCell className="font-medium">{node.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UsagePieChart percentage={node.cpu.usage_percentage} size={32} />
                    <div className="flex flex-col">
                      <span className="font-mono">
                        {formatResourceValue(node.cpu.usage, 'cpu')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of {node.cpu.capacity}
                      </span>
                    </div>
                    <span
                      className={`ml-auto px-2 py-1 rounded-full text-sm font-semibold ${getUsageBadgeClass(
                        node.cpu.usage_percentage
                      )}`}
                    >
                      {node.cpu.usage_percentage.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UsagePieChart percentage={node.memory.usage_percentage} size={32} />
                    <div className="flex flex-col">
                      <span className="font-mono">
                        {formatResourceValue(node.memory.usage, 'memory')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of {node.memory.capacity}
                      </span>
                    </div>
                    <span
                      className={`ml-auto px-2 py-1 rounded-full text-sm font-semibold ${getUsageBadgeClass(
                        node.memory.usage_percentage
                      )}`}
                    >
                      {node.memory.usage_percentage.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {nodes.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No nodes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}