import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PodMetrics } from "@/types/k8s";

interface PodsTableProps {
  pods: PodMetrics[];
}

export function PodsTable({ pods }: PodsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pod Name</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead>Node</TableHead>
            <TableHead>CPU</TableHead>
            <TableHead>Memory</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pods.map((pod) => (
            <TableRow key={`${pod.namespace}-${pod.name}`}>
              <TableCell className="font-medium">{pod.name}</TableCell>
              <TableCell>{pod.namespace}</TableCell>
              <TableCell>{pod.node}</TableCell>
              <TableCell>{pod.cpu}</TableCell>
              <TableCell>{pod.memory}</TableCell>
            </TableRow>
          ))}
          {pods.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                No pods found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}