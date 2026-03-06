import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NodeMetrics } from "@/types/k8s";

interface NodesTableProps {
  nodes: NodeMetrics[];
}

export function NodesTable({ nodes }: NodesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Node Name</TableHead>
            <TableHead>CPU Usage</TableHead>
            <TableHead>Memory Usage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => (
            <TableRow key={node.name}>
              <TableCell className="font-medium">{node.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{node.cpu.usage}</span>
                  <span className="text-muted-foreground">
                    ({node.cpu.usage_percentage.toFixed(1)}%)
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{node.memory.usage}</span>
                  <span className="text-muted-foreground">
                    ({node.memory.usage_percentage.toFixed(1)}%)
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
  );
}
