import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PodMetrics } from "@/types/k8s";
import { Cpu, MemoryStick } from "lucide-react";
import { formatResourceValue } from "@/lib/format";
import { PodCard } from "./dashboard/ResourceCard";

interface PodsTableProps {
  pods: PodMetrics[];
}

type SortField = "name" | "cpu" | "memory";
type SortOrder = "asc" | "desc";

export function PodsTable({ pods }: PodsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Filter pods based on search query
  const filteredPods = pods.filter((pod) =>
    pod.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Parse CPU value for sorting
  const parseCpuValue = (cpuStr: string): number => {
    const value = cpuStr.split('(')[0].trim();
    if (value.endsWith('m')) {
      return parseInt(value) / 1000;
    }
    return parseFloat(value);
  };

  // Parse Memory value for sorting (convert to MiB)
  const parseMemoryValue = (memStr: string): number => {
    const value = memStr.split('(')[0].trim();
    if (value.endsWith('Gi')) return parseFloat(value) * 1024;
    if (value.endsWith('Mi')) return parseFloat(value);
    if (value.endsWith('Ki')) return parseFloat(value) / 1024;
    return parseFloat(value);
  };

  // Sort the filtered pods
  const sortedPods = useMemo(() => {
    return [...filteredPods].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "cpu":
          comparison = parseCpuValue(a.cpu) - parseCpuValue(b.cpu);
          break;
        case "memory":
          comparison = parseMemoryValue(a.memory) - parseMemoryValue(b.memory);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredPods, sortField, sortOrder]);

  // Extract just the usage value without the percentage part
  const extractCpuUsage = (cpuStr: string): string => {
    return cpuStr.split('(')[0].trim();
  };

  const extractMemoryUsage = (memStr: string): string => {
    return memStr.split('(')[0].trim();
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pods by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm"
          />
        </div>
        
        {/* Sort dropdown */}
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("-") as [SortField, SortOrder];
            setSortField(field);
            setSortOrder(order);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="cpu-asc">CPU (Low-High)</option>
          <option value="cpu-desc">CPU (High-Low)</option>
          <option value="memory-asc">Memory (Low-High)</option>
          <option value="memory-desc">Memory (High-Low)</option>
        </select>
      </div>

      {/* Mobile View: Card Grid */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedPods.map((pod) => (
          <PodCard key={`${pod.namespace}-${pod.name}`} pod={pod} />
        ))}
        {pods.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No pods found
          </div>
        )}
        {filteredPods.length === 0 && pods.length > 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No pods match your search
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
            {sortedPods.map((pod) => {
              const cpuUsage = extractCpuUsage(pod.cpu);
              const memoryUsage = extractMemoryUsage(pod.memory);

              return (
                <TableRow key={`${pod.namespace}-${pod.name}`}>
                  <TableCell className="font-medium">{pod.name}</TableCell>
                  <TableCell>{pod.namespace}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">
                        {formatResourceValue(cpuUsage, 'cpu')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">
                        {formatResourceValue(memoryUsage, 'memory')}
                      </span>
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
            {filteredPods.length === 0 && pods.length > 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No pods match your search
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}