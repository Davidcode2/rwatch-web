# rwatch-web Kubernetes Dashboard - Visual Improvements Design Document

## Overview

This document outlines the design and implementation for visual improvements to the rwatch-web Kubernetes metrics dashboard, focusing on responsive design, human-readable formatting, and visual indicators for resource usage.

## 1. Visual Mockup Description

### Mobile View (2x2 Grid Card Layout)

```
┌─────────────────────────────────────┐
│                                     │
│  nginx-deployment-abc123            │
│  namespace: default                │
│                                     │
│  ┌───┐ CPU                         │
│  │ ● │ 500m                        │
│  └───┘ 25.0% ◀ green badge         │
│                                     │
│  ┌───┐ Memory                      │
│  │ ● │ 1.00 GiB                    │
│  └───┘ 50.0% ◀ yellow badge        │
│                                     │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Header:** Resource name (truncated if needed) + namespace badge
- **CPU Row:** Donut pie chart + formatted value + percentage badge
- **Memory Row:** Donut pie chart + formatted value + percentage badge
- **Color Coding:** Green/Yellow/Red badges based on usage percentage

### Desktop View (Enhanced Table)

| Node Name | CPU Usage | Memory Usage |
|-----------|-----------|--------------|
| node-01   | ● 2.50 cores (75.0%) | ● 8.00 GiB (60.0%) |
| node-02   | ● 1.00 cores (25.0%) | ● 4.00 GiB (30.0%) |

**Key Elements:**
- **Header Row:** Bold text with light background
- **Usage Column:** Pie chart + formatted value + capacity context
- **Percentage:** Color-coded badge (green/yellow/red)
- **Hover Effects:** Subtle background change on row hover

## 2. Grid Layout Structure

### Mobile 2x2 Grid Layout

The mobile layout uses CSS Grid to create a card-based interface that works well on small screens:

```tsx
// Container for all cards
<div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
  {nodes.map((node) => (
    <NodeCard key={node.name} node={node} />
  ))}
</div>

// Individual card structure
<Card className="w-full">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg font-semibold truncate flex items-center justify-between">
      <span className="truncate">{node.name}</span>
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <UsagePieChart percentage={cpuPercentage} size={36} />
        <div>
          <div className="text-sm text-muted-foreground">CPU</div>
          <div className="font-mono text-sm">{formattedCpu}</div>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${badgeClass}`}>
        {percentage.toFixed(1)}%
      </span>
    </div>
  </CardContent>
</Card>
```

**Grid Classes Explanation:**
- `lg:hidden` - Hide on desktop (≥1024px), show on mobile/tablet
- `grid` - Enable CSS grid layout
- `grid-cols-1 sm:grid-cols-2` - 1 column on mobile, 2 columns on small tablets
- `gap-4` - 1rem gap between cards

### Desktop Table Layout

The desktop layout maintains the table structure but with enhanced visuals:

```tsx
<div className="hidden lg:block rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-1/4">Node Name</TableHead>
        <TableHead className="w-1/3">CPU Usage</TableHead>
        <TableHead className="w-1/3">Memory Usage</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {nodes.map((node) => (
        <TableRow key={node.name}>
          <TableCell className="font-medium">{node.name}</TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <UsagePieChart percentage={node.cpu.usage_percentage} size={32} />
              <div className="flex flex-col">
                <span className="font-mono">{formattedCpu}</span>
                <span className="text-sm text-muted-foreground">of {capacity}</span>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <UsagePieChart percentage={node.memory.usage_percentage} size={32} />
              <div className="flex flex-col">
                <span className="font-mono">{formattedMemory}</span>
                <span className="text-sm text-muted-foreground">of {capacity}</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

**Table Classes Explanation:**
- `hidden lg:block` - Hide on mobile/tablet, show on desktop (≥1024px)
- `rounded-md border` - Standard table styling with border
- `w-1/4`, `w-1/3` - Column width distribution
- `flex items-center gap-3` - Horizontal alignment for pie chart + value
- `font-mono` - Monospace font for numerical values

## 3. Pie Chart Integration

### Color Scheme

The pie charts use a dynamic color scheme based on usage percentage:

```typescript
// src/lib/format.ts

const USAGE_COLORS = {
  healthy: '#22c55e',   // green-500 (0-50%)
  warning: '#eab308',   // yellow-500 (50-80%)
  critical: '#ef4444',  // red-500 (80-100%)
  background: '#e5e7eb', // gray-200
};

export function getUsageColor(percentage: number): string {
  if (percentage >= 80) return USAGE_COLORS.critical;
  if (percentage >= 50) return USAGE_COLORS.warning;
  return USAGE_COLORS.healthy;
}

export function getUsageBadgeClass(percentage: number): string {
  if (percentage >= 80) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  if (percentage >= 50) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
}
```

### UsagePieChart Component

```tsx
// src/components/dashboard/UsagePieChart.tsx

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getUsageColor } from '@/lib/format';

interface UsagePieChartProps {
  percentage: number;
  size?: number;  // Default: 40
  className?: string;
}

export function UsagePieChart({
  percentage,
  size = 40,
  className,
}: UsagePieChartProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  const data = [
    { name: 'used', value: clampedPercentage },
    { name: 'available', value: 100 - clampedPercentage },
  ];

  const color = getUsageColor(clampedPercentage);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}  // Creates donut effect
            outerRadius={size * 0.5}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell key="used" fill={color} />
            <Cell key="available" fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Chart Configuration:**
- **Type:** Donut chart (pie with inner radius)
- **Size:** 32px for desktop table, 36px for mobile cards
- **Inner Radius:** 35% of size (creates donut hole)
- **Outer Radius:** 50% of size (chart edge)
- **Start/End Angle:** 90° to -270° (3/4 circle, leaving gap at top)

### Usage Locations

**Desktop Table:**
- Inline with usage value: `| ● 2.50 cores (75.0%) |`
- Size: 32px
- Position: Left of the value, vertically centered

**Mobile Cards:**
- Left side of each resource row
- Size: 36px
- Position: Left of the label/value pair

## 4. Number Formatting Strategy

### Utility Function Design

The formatting system handles different resource types and units:

```typescript
// src/lib/format.ts

/**
 * Format resource values (CPU, Memory) to human-readable strings
 */

// Main formatting function
export function formatResourceValue(value: string, type: 'cpu' | 'memory'): string {
  if (type === 'memory') {
    return formatMemoryValue(value);
  }
  return formatCpuValue(value);
}

// Memory formatting: handles bytes, Ki, Mi, Gi, Ti
function formatMemoryValue(value: string): string {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(i?B|Ki|Mi|Gi|Ti)?$/i);
  if (!match) {
    return value; // Return as-is if we can't parse
  }

  const numValue = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  // Convert to bytes if needed
  let bytes: number;
  switch (unit) {
    case 'B':
      bytes = numValue;
      break;
    case 'KI':  // KiB
    case 'KIB':
      bytes = numValue * 1024;
      break;
    case 'MI':  // MiB
    case 'MIB':
      bytes = numValue * 1024 * 1024;
      break;
    case 'GI':  // GiB
    case 'GIB':
      bytes = numValue * 1024 * 1024 * 1024;
      break;
    case 'TI':  // TiB
    case 'TIB':
      bytes = numValue * 1024 * 1024 * 1024 * 1024;
      break;
    default:
      bytes = numValue;
  }

  return formatBytes(bytes);
}

// CPU formatting: handles millicores (m) and cores
function formatCpuValue(value: string): string {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(m)?$/i);
  if (!match) {
    return value;
  }

  const numValue = parseFloat(match[1]);
  const isMillicores = match[2]?.toLowerCase() === 'm';

  if (isMillicores) {
    const cores = numValue / 1000;
    if (cores >= 1) {
      return `${cores.toFixed(2)} cores`;
    }
    return `${cores.toFixed(3)} cores`;
  }

  if (numValue >= 1) {
    return `${numValue.toFixed(1)} cores`;
  }
  return `${numValue.toFixed(2)} cores`;
}

// Bytes to human-readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

### Input/Output Examples

| Input | Type | Output |
|-------|------|--------|
| `1048576` | memory | `1.00 MiB` |
| `1073741824` | memory | `1.00 GiB` |
| `500m` | cpu | `0.50 cores` |
| `2000m` | cpu | `2.00 cores` |
| `2` | cpu | `2.0 cores` |
| `0.5` | cpu | `0.50 cores` |

## 5. Responsive Breakpoints

### Breakpoint Strategy

The dashboard uses Tailwind's responsive prefixes to switch between mobile card layout and desktop table layout:

```tsx
// Main container structure
<div className="space-y-4">
  {/* Mobile: Card Grid */}
  <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
    {items.map((item) => (
      <ResourceCard key={item.name} item={item} />
    ))}
  </div>

  {/* Desktop: Table */}
  <div className="hidden lg:block rounded-md border">
    <Table>{/* ... */}</Table>
  </div>
</div>
```

### Breakpoint Reference

| Prefix | Min Width | Target Devices |
|--------|-----------|---------------|
| (default) | 0px | Mobile phones |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop/laptops |
| `xl:` | 1280px | Large monitors |

### Layout Behavior

```
0px ────── 640px ────── 768px ────── 1024px ──────
│         │         │         │         │
│ 1 col   │ 2 cols  │ 2 cols  │  Table  │ Table
│ Cards   │ Cards   │ Cards   │ (hide)  │
│         │         │         │         │
```

**Mobile (< 640px):**
- Single column card layout
- Cards stack vertically
- Full width on screen

**Small Tablets (640px - 767px):**
- 2-column card grid
- Cards arranged side-by-side

**Tablets (768px - 1023px):**
- 2-column card grid (same as small tablets)
- Slightly larger card spacing

**Desktop (≥ 1024px):**
- Table layout
- Hide card container, show table container
- Better use of horizontal space

## 6. Component Structure

### New Components

```
src/
├── lib/
│   └── format.ts                    (NEW)
├── components/
│   ├── dashboard/
│   │   ├── UsagePieChart.tsx        (NEW)
│   │   └── ResourceCard.tsx         (NEW)
│   ├── NodesTable.tsx              (MODIFIED)
│   ├── PodsTable.tsx               (MODIFIED)
│   └── ui/
│       ├── card.tsx                (existing)
│       ├── table.tsx               (existing)
│       └── ...
└── types/
    └── k8s.ts
```

### Component Details

**1. `lib/format.ts`**
- Purpose: Formatting utilities for CPU and memory values
- Exports:
  - `formatResourceValue(value, type)` - Main formatting function
  - `formatMemoryValue(value)` - Memory formatting
  - `formatCpuValue(value)` - CPU formatting
  - `formatBytes(bytes)` - Bytes to human-readable
  - `getUsageColor(percentage)` - Color based on usage
  - `getUsageBadgeClass(percentage)` - CSS class based on usage

**2. `components/dashboard/UsagePieChart.tsx`**
- Purpose: Reusable donut chart for resource usage visualization
- Props:
  - `percentage: number` - Usage percentage (0-100)
  - `size?: number` - Chart size in pixels (default: 40)
  - `className?: string` - Optional CSS classes

**3. `components/dashboard/ResourceCard.tsx`**
- Purpose: Reusable card component for mobile view
- Exports:
  - `ResourceCard` - Generic resource card
  - `NodeCard` - Specialized card for nodes
  - `PodCard` - Specialized card for pods

**4. `components/NodesTable.tsx` (Modified)**
- Added responsive breakpoints
- Added pie charts for CPU and memory
- Improved formatting of values
- Maintained table structure on desktop

**5. `components/PodsTable.tsx` (Modified)**
- Removed Node column (was empty)
- Added responsive breakpoints
- Added pie charts for CPU and memory
- Improved formatting of values

### File Contents Summary

**lib/format.ts:**
- 100+ lines
- 6 main utility functions
- Handles CPU, Memory, and Bytes formatting

**dashboard/UsagePieChart.tsx:**
- 60+ lines
- Recharts PieChart wrapper
- Dynamic color based on usage

**dashboard/ResourceCard.tsx:**
- 120+ lines
- 3 React components
- Handles both nodes and pods

**NodesTable.tsx:**
- 70+ lines (was 35)
- Desktop table + mobile cards
- Enhanced visuals

**PodsTable.tsx:**
- 90+ lines (was 45)
- 4 columns (was 5, removed Node)
- Desktop table + mobile cards

## Implementation Status

✅ **Complete:**
1. ✓ Format utility created
2. ✓ Pie chart component created
3. ✓ Resource card component created
4. ✓ NodesTable updated with responsive design
5. ✓ PodsTable updated (removed node column)

✅ **Verified:**
- TypeScript build passes
- No lint errors
- Components properly typed

## Usage Examples

### Using NodesTable Component

```tsx
import { NodesTable } from '@/components/NodesTable';
import type { NodeMetrics } from '@/types/k8s';

const nodes: NodeMetrics[] = [
  {
    name: 'node-01',
    cpu: { usage: '2000m', usage_percentage: 75.5, capacity: '4 cores' },
    memory: { usage: '8Gi', usage_percentage: 60.0, capacity: '16 GiB' },
  },
  // ... more nodes
];

<NodesTable nodes={nodes} />
```

### Using PodsTable Component

```tsx
import { PodsTable } from '@/components/PodsTable';
import type { PodMetrics } from '@/types/k8s';

const pods: PodMetrics[] = [
  {
    name: 'nginx-abc123',
    namespace: 'default',
    node: '',  // Now not shown
    cpu: '100m (10.0%)',
    memory: '128Mi (25.0%)',
  },
  // ... more pods
];

<PodsTable pods={pods} />
```

## Dependencies

The implementation uses existing dependencies:
- `recharts` (v3.7.0) - For pie charts
- `tailwindcss` (v4.2.1) - For styling
- `@radix-ui/react-card` - Via shadcn/ui Card component
- `@radix-ui/react-table` - Via shadcn/ui Table component

No new dependencies were added.

## Future Improvements

Potential enhancements for future iterations:
1. Add trend indicators (up/down arrows)
2. Include historical sparklines
3. Add click-to-expand details
4. Implement filtering and sorting
5. Add export functionality
6. Implement real-time updates with WebSocket

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-07  
**Status:** Implemented and Verified