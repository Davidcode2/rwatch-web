import { useState, useEffect, useCallback } from 'react';
import type { AgentResult, AggregatedMetrics, TimeSeriesData } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useMetrics() {
  const [agents, setAgents] = useState<AgentResult[]>([]);
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [history, setHistory] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [agentsRes, metricsRes] = await Promise.all([
        fetch(`${API_URL}/api/agents`),
        fetch(`${API_URL}/api/metrics`)
      ]);

      if (!agentsRes.ok || !metricsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const agentsData = await agentsRes.json();
      const metricsData = await metricsRes.json();

      setAgents(agentsData);
      setMetrics(metricsData);

      // Add to history (keep last 20 points)
      setHistory(prev => {
        const newPoint: TimeSeriesData = {
          timestamp: new Date().toLocaleTimeString(),
          totalMemory: metricsData.total_memory_bytes,
          usedMemory: metricsData.total_memory_bytes - metricsData.available_memory_bytes,
          availableMemory: metricsData.available_memory_bytes,
          nodeCount: metricsData.total_nodes
        };
        return [...prev.slice(-19), newPoint];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  return { agents, metrics, history, loading, error, refetch: fetchData };
}
