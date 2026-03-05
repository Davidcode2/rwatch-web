export interface NodeMetrics {
  name: string;
  cpu: {
    usage: string;
    usagePercentage: number;
    capacity: string;
  };
  memory: {
    usage: string;
    usagePercentage: number;
    capacity: string;
  };
}

export interface PodMetrics {
  name: string;
  namespace: string;
  node: string;
  cpu: string;
  memory: string;
}

export interface ClusterSummary {
  nodes: {
    count: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  pods: {
    count: number;
    cpuUsage: string;
    memoryUsage: string;
  };
}

export interface K8sMetricsResponse {
  nodes: NodeMetrics[];
  timestamp: string;
}

export interface PodsMetricsResponse {
  pods: PodMetrics[];
  timestamp: string;
}

export interface SummaryResponse {
  nodes: {
    count: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  pods: {
    count: number;
    cpuUsage: string;
    memoryUsage: string;
  };
}