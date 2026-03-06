/**
 * Tests for NodesTable component
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodesTable } from '@/components/NodesTable';
import type { NodeMetrics } from '@/types/k8s';

const mockNodes: NodeMetrics[] = [
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
];

describe('NodesTable Component', () => {
  it('should render table with node data', () => {
    render(<NodesTable nodes={mockNodes} />);

    expect(screen.getByText('node-1')).toBeInTheDocument();
    expect(screen.getByText('node-2')).toBeInTheDocument();
    expect(screen.getByText('450m')).toBeInTheDocument();
    expect(screen.getByText('2048Mi')).toBeInTheDocument();
    expect(screen.getByText('22.5%')).toBeInTheDocument();
    expect(screen.getByText('34.2%')).toBeInTheDocument();
  });

  it('should render table headers correctly', () => {
    render(<NodesTable nodes={mockNodes} />);

    expect(screen.getByText('Node Name')).toBeInTheDocument();
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
  });

  it('should display "No nodes found" when empty', () => {
    render(<NodesTable nodes={[]} />);

    expect(screen.getByText('No nodes found')).toBeInTheDocument();
  });

  it('should render correct number of rows', () => {
    render(<NodesTable nodes={mockNodes} />);

    const rows = screen.getAllByRole('row');
    // Header row + 2 data rows = 3 rows
    expect(rows).toHaveLength(3);
  });

  it('should handle single node', () => {
    render(<NodesTable nodes={[mockNodes[0]]} />);

    expect(screen.getByText('node-1')).toBeInTheDocument();
    expect(screen.queryByText('node-2')).not.toBeInTheDocument();
  });

  it('should display CPU usage with percentage in parentheses', () => {
    render(<NodesTable nodes={[mockNodes[0]]} />);

    // Should show both the absolute value and percentage
    expect(screen.getByText('450m')).toBeInTheDocument();
    expect(screen.getByText(/22\.5%/)).toBeInTheDocument();
  });

  it('should display memory usage with percentage in parentheses', () => {
    render(<NodesTable nodes={[mockNodes[0]]} />);

    expect(screen.getByText('2048Mi')).toBeInTheDocument();
    expect(screen.getByText(/34\.2%/)).toBeInTheDocument();
  });

  it('should display high CPU usage with correct formatting', () => {
    const highCpuNode: NodeMetrics = {
      name: 'high-cpu-node',
      cpu: { usage: '1900m', usage_percentage: 95.0, capacity: '2000m' },
      memory: { usage: '5800Mi', usage_percentage: 96.7, capacity: '6000Mi' }
    };

    render(<NodesTable nodes={[highCpuNode]} />);

    expect(screen.getByText('high-cpu-node')).toBeInTheDocument();
    expect(screen.getByText('1900m')).toBeInTheDocument();
    expect(screen.getByText(/95\.0%/)).toBeInTheDocument();
  });
});
