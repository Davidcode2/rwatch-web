import { useState, useEffect, useCallback } from 'react';
import type { K8sMetricsResponse, PodsMetricsResponse, SummaryResponse } from '@/types/k8s';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useK8sMetrics() {
  const [nodesMetrics, setNodesMetrics] = useState<K8sMetricsResponse | null>(null);
  const [podsMetrics, setPodsMetrics] = useState<PodsMetricsResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    loading, 
    error, 
    refetch: fetchData 
  };
}