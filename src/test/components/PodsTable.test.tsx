/**
 * Tests for PodsTable component
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PodsTable } from '@/components/PodsTable';
import type { PodMetrics } from '@/types/k8s';

const mockPods: PodMetrics[] = [
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
  },
  {
    name: 'redis-red',
    namespace: 'cache',
    node: 'node-1',
    cpu: '50m',
    memory: '128Mi'
  }
];

describe('PodsTable Component', () => {
  it('should render table with pod data', () => {
    render(<PodsTable pods={mockPods} />);

    expect(screen.getByText('nginx-abc123')).toBeInTheDocument();
    expect(screen.getByText('postgres-xyz789')).toBeInTheDocument();
    expect(screen.getByText('redis-red')).toBeInTheDocument();
  });

  it('should render namespace for each pod', () => {
    render(<PodsTable pods={mockPods} />);

    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('database')).toBeInTheDocument();
    expect(screen.getByText('cache')).toBeInTheDocument();
  });

  it('should render node for each pod', () => {
    render(<PodsTable pods={mockPods} />);

    expect(screen.getByText('node-1')).toBeInTheDocument();
    expect(screen.getByText('node-2')).toBeInTheDocument();
  });

  it('should render CPU and memory values', () => {
    render(<PodsTable pods={mockPods} />);

    expect(screen.getByText('100m')).toBeInTheDocument();
    expect(screen.getByText('500m')).toBeInTheDocument();
    expect(screen.getByText('50m')).toBeInTheDocument();
    expect(screen.getByText('256Mi')).toBeInTheDocument();
    expect(screen.getByText('1024Mi')).toBeInTheDocument();
    expect(screen.getByText('128Mi')).toBeInTheDocument();
  });

  it('should render table headers correctly', () => {
    render(<PodsTable pods={mockPods} />);

    expect(screen.getByText('Pod Name')).toBeInTheDocument();
    expect(screen.getByText('Namespace')).toBeInTheDocument();
    expect(screen.getByText('Node')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
  });

  it('should display "No pods found" when empty', () => {
    render(<PodsTable pods={[]} />);

    expect(screen.getByText('No pods found')).toBeInTheDocument();
  });

  it('should render correct number of rows', () => {
    render(<PodsTable pods={mockPods} />);

    const rows = screen.getAllByRole('row');
    // Header row + 3 data rows = 4 rows
    expect(rows).toHaveLength(4);
  });

  it('should handle single pod', () => {
    render(<PodsTable pods={[mockPods[0]]} />);

    expect(screen.getByText('nginx-abc123')).toBeInTheDocument();
    expect(screen.queryByText('postgres-xyz789')).not.toBeInTheDocument();
  });

  it('should display high resource pod correctly', () => {
    const highResourcePod: PodMetrics = {
      name: 'gpu-operator-xyz',
      namespace: 'ml-workloads',
      node: 'gpu-node-1',
      cpu: '8000m',
      memory: '32768Mi'
    };

    render(<PodsTable pods={[highResourcePod]} />);

    expect(screen.getByText('gpu-operator-xyz')).toBeInTheDocument();
    expect(screen.getByText('8000m')).toBeInTheDocument();
    expect(screen.getByText('32768Mi')).toBeInTheDocument();
  });

  it('should display pods across different namespaces', () => {
    const multiNamespacePods: PodMetrics[] = [
      { name: 'web-app', namespace: 'frontend', node: 'node-1', cpu: '200m', memory: '512Mi' },
      { name: 'api-service', namespace: 'backend', node: 'node-2', cpu: '400m', memory: '1024Mi' },
      { name: 'worker', namespace: 'jobs', node: 'node-3', cpu: '100m', memory: '256Mi' }
    ];

    render(<PodsTable pods={multiNamespacePods} />);

    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.getByText('api-service')).toBeInTheDocument();
    expect(screen.getByText('worker')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('jobs')).toBeInTheDocument();
  });
});