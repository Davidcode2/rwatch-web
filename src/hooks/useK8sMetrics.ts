import { useState, useEffect, useCallback, useRef } from 'react';
import type { K8sMetricsResponse, PodsMetricsResponse, SummaryResponse } from '@/types/k8s';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface MetricsHistoryPoint {
  timestamp: string;
  cpuUsage: number; // Average CPU usage percentage across nodes
  memoryUsage: number; // Average memory usage percentage across nodes
  nodeCount: number;
  podCount: number;
}

const MAX_HISTORY_POINTS = 60;

export function useK8sMetrics() {
  const [nodesMetrics, setNodesMetrics] = useState<K8sMetricsResponse | null>(null);
  const [podsMetrics, setPodsMetrics] = useState<PodsMetricsResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MetricsHistoryPoint[]>([]);
  const historyRef = useRef<MetricsHistoryPoint[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [nodesRes, podsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/metrics/nodes`),
        fetch(`${API_URL}/api/metrics/pods`),
        fetch(`${API_URL}/api/metrics/summary`)
      ]);

      if (!nodesRes.ok || !podsRes.ok || !summaryRes.ok) {
        throw new Error('Failed to fetch Kubernetes metrics');
      }

      const nodesData = await nodesRes.json();
      const podsData = await podsRes.json();
      const summaryData = await summaryRes.json();

      setNodesMetrics(nodesData);
      setPodsMetrics(podsData);
      setSummary(summaryData);

      // Add to history
      const newPoint: MetricsHistoryPoint = {
        timestamp: new Date().toISOString(),
        cpuUsage: summaryData.nodes?.cpuUsage ?? 0,
        memoryUsage: summaryData.nodes?.memoryUsage ?? 0,
        nodeCount: summaryData.nodes?.count ?? 0,
        podCount: summaryData.pods?.count ?? 0,
      };

      historyRef.current = [...historyRef.current, newPoint].slice(-MAX_HISTORY_POINTS);
      setHistory(historyRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  return { 
    nodesMetrics, 
    podsMetrics, 
    summary, 
    history,
    loading, 
    error, 
    refetch: fetchData 
  };
}