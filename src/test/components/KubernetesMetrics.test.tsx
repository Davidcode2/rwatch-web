/**
 * Tests for KubernetesMetrics component - particularly tab switching
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KubernetesMetrics } from '@/components/KubernetesMetrics';
import type { K8sMetricsResponse, PodsMetricsResponse, SummaryResponse } from '@/types/k8s';

// Mock the useK8sMetrics hook
vi.mock('@/hooks/useK8sMetrics', () => ({
  useK8sMetrics: vi.fn()
}));

import { useK8sMetrics } from '@/hooks/useK8sMetrics';

const mockNodesMetrics: K8sMetricsResponse = {
  nodes: [
    {
      name: 'node-1',
      cpu: { usage: '450m', usagePercentage: 22.5, capacity: '2000m' },
      memory: { usage: '2048Mi', usagePercentage: 34.2, capacity: '6000Mi' }
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
    }
  ],
  timestamp: '2026-03-05T22:30:00Z'
};

const mockSummary: SummaryResponse = {
  nodes: { count: 2, cpuUsage: 31.25, memoryUsage: 51.25 },
  pods: { count: 24, cpuUsage: '2400m', memoryUsage: '8192Mi' }
};

describe('KubernetesMetrics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useK8sMetrics as any).mockReturnValue({
      nodesMetrics: mockNodesMetrics,
      podsMetrics: mockPodsMetrics,
      summary: mockSummary,
      history: [],
      loading: false,
      error: null
    });
  });

  it('should render summary cards when loaded', () => {
    render(<KubernetesMetrics />);

    expect(screen.getByText('Total Nodes')).toBeInTheDocument();
    expect(screen.getByText('Total Pods')).toBeInTheDocument();
    expect(screen.getByText('Cluster Memory')).toBeInTheDocument();
  });

  it('should display node count from summary', () => {
    render(<KubernetesMetrics />);

    // Node count should be displayed
    const nodeCount = screen.getByText('2');
    expect(nodeCount).toBeInTheDocument();
  });

  it('should display pod count from summary', () => {
    render(<KubernetesMetrics />);

    // Pod count should be displayed
    const podCount = screen.getByText('24');
    expect(podCount).toBeInTheDocument();
  });

  it('should render tabs for Nodes and Pods', () => {
    render(<KubernetesMetrics />);

    expect(screen.getByRole('tab', { name: /Nodes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Pods/i })).toBeInTheDocument();
  });

  it('should show Nodes tab content by default', () => {
    render(<KubernetesMetrics />);

    // By default, Nodes tab should be active
    const nodesTab = screen.getByRole('tab', { name: /Nodes/i });
    expect(nodesTab).toBeInTheDocument();
    
    // The NodesTable should be visible
    expect(screen.getByText('node-1')).toBeInTheDocument();
  });

  it('should switch to Pods tab when clicked', async () => {
    render(<KubernetesMetrics />);

    // Click on Pods tab
    const podsTab = screen.getByRole('tab', { name: /Pods/i });
    fireEvent.click(podsTab);

    // After clicking, PodsTable should be visible
    await waitFor(() => {
      expect(screen.getByText('nginx-abc123')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (useK8sMetrics as any).mockReturnValue({
      nodesMetrics: null,
      podsMetrics: null,
      summary: null,
      history: [],
      loading: true,
      error: null
    });

    render(<KubernetesMetrics />);

    // Loading dots should be visible
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('should display error state', () => {
    (useK8sMetrics as any).mockReturnValue({
      nodesMetrics: null,
      podsMetrics: null,
      summary: null,
      history: [],
      loading: false,
      error: 'Failed to connect to cluster'
    });

    render(<KubernetesMetrics />);

    expect(screen.getByText('Error Loading Metrics')).toBeInTheDocument();
    expect(screen.getByText('Failed to connect to cluster')).toBeInTheDocument();
  });

  it('should display avg CPU usage in summary card', () => {
    render(<KubernetesMetrics />);

    // Should show avg CPU percentage
    expect(screen.getByText(/31\.2% avg CPU/)).toBeInTheDocument();
  });

  it('should display memory usage in summary card', () => {
    render(<KubernetesMetrics />);

    // Should show memory usage
    expect(screen.getByText('8192Mi memory')).toBeInTheDocument();
  });

  it('should render node count in Nodes tab trigger', () => {
    render(<KubernetesMetrics />);

    // Tab should show count of nodes
    const nodesTab = screen.getByRole('tab', { name: /Nodes \(1\)/i });
    expect(nodesTab).toBeInTheDocument();
  });

  it('should render pod count in Pods tab trigger', () => {
    render(<KubernetesMetrics />);

    // Tab should show count of pods
    const podsTab = screen.getByRole('tab', { name: /Pods \(1\)/i });
    expect(podsTab).toBeInTheDocument();
  });

  it('should show loading indicator while fetching', () => {
    (useK8sMetrics as any).mockReturnValue({
      nodesMetrics: null,
      podsMetrics: null,
      summary: null,
      history: [],
      loading: true,
      error: null
    });

    render(<KubernetesMetrics />);

    expect(screen.getByText('Loading node metrics...')).toBeInTheDocument();
  });

  it('should display CPU usage percentage in cluster memory card', () => {
    render(<KubernetesMetrics />);

    // The cluster memory card should show avg memory usage
    expect(screen.getByText(/51\.3%/)).toBeInTheDocument();
  });

  it('should show empty state for no nodes', () => {
    (useK8sMetrics as any).mockReturnValue({
      nodesMetrics: { nodes: [], timestamp: '2026-03-05T22:30:00Z' },
      podsMetrics: mockPodsMetrics,
      summary: { nodes: { count: 0, cpuUsage: 0, memoryUsage: 0 }, pods: { count: 1, cpuUsage: '100m', memoryUsage: '256Mi' } },
      history: [],
      loading: false,
      error: null
    });

    render(<KubernetesMetrics />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should show empty state for no pods', () => {
    (useK8sMetrics as any).mockReturnValue({
      nodesMetrics: mockNodesMetrics,
      podsMetrics: { pods: [], timestamp: '2026-03-05T22:30:00Z' },
      summary: { nodes: { count: 1, cpuUsage: 22.5, memoryUsage: 34.2 }, pods: { count: 0, cpuUsage: '0m', memoryUsage: '0Mi' } },
      history: [],
      loading: false,
      error: null
    });

    render(<KubernetesMetrics />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});