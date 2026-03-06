/**
 * Tests for useK8sMetrics hook
 * These tests mock fetch responses to avoid needing a real backend
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useK8sMetrics } from '@/hooks/useK8sMetrics';
import type { K8sMetricsResponse, PodsMetricsResponse, SummaryResponse } from '@/types/k8s';

// Mock fetch globally
global.fetch = vi.fn();

const mockNodesMetrics: K8sMetricsResponse = {
  nodes: [
    {
      name: 'node-1',
      cpu: { usage: '450m', usage_percentage: 22.5, capacity: '2000m' },
      memory: { usage: '2048Mi', usage_percentage: 34.2, capacity: '6000Mi' }
    },
    {
      name: 'node-2',
      cpu: { usage: '800m', usage_percentage: 40.0, capacity: '2000m' },
      memory: { usage: '4096Mi', usage_percentage: 68.3, capacity: '6000Mi' }
    }
  ],
  timestamp: '2026-03-05T22:30:00Z'
};

const mockPodsMetrics: PodsMetricsResponse = {
  pods: [
    {
      name: 'nginx-abc123',
      namespace: 'default',
      node: 'node-1',
      cpu: '100m',
      memory: '256Mi'
    },
    {
      name: 'postgres-xyz789',
      namespace: 'database',
      node: 'node-2',
      cpu: '500m',
      memory: '1024Mi'
    }
  ],
  timestamp: '2026-03-05T22:30:00Z'
};

const mockSummary: SummaryResponse = {
  nodes: { count: 2, cpuUsage: 31.25, memoryUsage: 51.25 },
  pods: { count: 24, cpuUsage: '2400m', memoryUsage: '8192Mi' }
};

describe('useK8sMetrics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/metrics/nodes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNodesMetrics)
        } as Response);
      }
      if (url.includes('/api/metrics/pods')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPodsMetrics)
        } as Response);
      }
      if (url.includes('/api/metrics/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSummary)
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch data successfully on mount', async () => {
    const { result } = renderHook(() => useK8sMetrics());

    // Initially should be loading
    expect(result.current.loading).toBe(true);

    // Wait for the data to be fetched
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.nodesMetrics).toEqual(mockNodesMetrics);
    expect(result.current.podsMetrics).toEqual(mockPodsMetrics);
    expect(result.current.summary).toEqual(mockSummary);
  });

  it('should have error state when fetch fails', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch' })
      } as Response)
    );

    const { result } = renderHook(() => useK8sMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch Kubernetes metrics');
    });
  });

  it('should have error state when network fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useK8sMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  it('should return null states initially', () => {
    const { result } = renderHook(() => useK8sMetrics());

    // Before any fetch completes, loading should be true and data null
    expect(result.current.loading).toBe(true);
    expect(result.current.nodesMetrics).toBeNull();
    expect(result.current.podsMetrics).toBeNull();
    expect(result.current.summary).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should expose refetch function', async () => {
    const { result } = renderHook(() => useK8sMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refetch should be available
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle partial failures correctly', async () => {
    let callCount = 0;
    (global.fetch as any).mockImplementation((url: string) => {
      callCount++;
      if (url.includes('/api/metrics/nodes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNodesMetrics)
        } as Response);
      }
      // Fail pods
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Pod fetch failed' })
      } as Response);
    });

    const { result } = renderHook(() => useK8sMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch Kubernetes metrics');
    });
  });
});
