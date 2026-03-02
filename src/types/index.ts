export interface HealthResponse {
  status: string
  uptime: number
  version: string
}

export interface Memory {
  total: number
  used: number
  free: number
  available: number
}

export interface AgentData {
  url: string
  health: HealthResponse
  memory: Memory
}

export interface AgentResult {
  success: boolean
  url: string
  data?: AgentData
  error?: string
}

export interface AggregatedMetrics {
  total_nodes: number
  healthy_nodes: number
  failed_nodes: number
  total_memory_bytes: number
  available_memory_bytes: number
}

export interface TimeSeriesData {
  timestamp: string
  totalMemory: number
  usedMemory: number
  availableMemory: number
  nodeCount: number
}
