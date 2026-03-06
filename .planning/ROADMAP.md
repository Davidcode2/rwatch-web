# Rwatch-Web Project Roadmap

## Project Overview

**Rwatch-Web** is the React-based web frontend for the rwatch monitoring system. It provides a modern, responsive UI for visualizing Kubernetes cluster metrics and node health information.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Radix UI (shadcn)  
**Version:** 0.1.13  
**Repository:** https://github.com/Davidcode2/rwatch-web  

---

## Architecture

### Component Hierarchy
```
App.tsx (dark mode, root container)
└── Dashboard.tsx
    └── KubernetesMetrics.tsx (main view)
        ├── Summary Cards (Nodes/Pods/Memory)
        ├── K8sMetricsChart.tsx (CPU/Memory visualization)
        └── Tabs (Nodes/Pods)
            ├── NodesTable.tsx
            └── PodsTable.tsx
```

### Custom Hooks
| Hook | Purpose | Poll Interval |
|------|---------|---------------|
| `useMetrics` | Agent health/memory | 5 seconds |
| `useK8sMetrics` | K8s nodes/pods/summary | 30 seconds |

### Data Flow
```
React Components
    ↓
Custom Hooks (useK8sMetrics, useMetrics)
    ↓
fetch() API calls
    ↓
Express proxy (port 3001)
    ↓
rwatch-agent (port 3000) / K8s metrics-server
```

---

## Phases

### Phase 1: Initial Setup ✅ COMPLETE
**Goal:** Basic React app with Vite and Tailwind

**Deliverables:**
- [x] Vite + React + TypeScript project setup
- [x] Tailwind CSS integration
- [x] shadcn/ui components (Card, Tabs, Table)
- [x] Dark mode by default
- [x] Basic folder structure (components, hooks, types)

**Completion Date:** Prior to v0.1.0

---

### Phase 2: Metrics Dashboard ✅ COMPLETE
**Goal:** Display K8s metrics from rwatch backend

**Deliverables:**
- [x] `useK8sMetrics` hook with polling
- [x] Summary cards (nodes, pods, memory)
- [x] Nodes table (name, CPU, memory)
- [x] Pods table (name, namespace, node, CPU, memory)
- [x] Error handling and loading states
- [x] Types for API responses

**Key Components:**
- `KubernetesMetrics.tsx` - Main metrics view
- `NodesTable.tsx` - Node metrics table
- `PodsTable.tsx` - Pod metrics table
- `useK8sMetrics.ts` - Data fetching hook
- `types/k8s.ts` - TypeScript types

**API Integration:**
- `/api/metrics/nodes` → NodeMetricsResponse
- `/api/metrics/pods` → PodMetricsResponse
- `/api/metrics/summary` → SummaryResponse

**Completion Date:** v0.1.13 (current)

---

### Phase 3: Visualization & Charts ⏳ PLANNED
**Goal:** Add charts and historical data visualization

**Deliverables:**
- [x] Recharts integration (already added)
- [x] CPU/Memory usage charts
- [ ] Time-series historical data (needs backend support)
- [ ] Node comparison charts
- [ ] Pod resource usage trends
- [ ] Custom time range selection

**Notes:** Currently maintains 60-point history in memory. For full history, backend needs to support time-series queries.

---

### Phase 4: Enhanced Features ⏳ PLANNED
**Goal:** Production-ready features

**Deliverables:**
- [ ] Real-time WebSocket updates (replace polling)
- [ ] Alerts/notifications for high resource usage
- [ ] Namespace filtering
- [ ] Node detail view (drill-down)
- [ ] Pod detail view (containers, logs)
- [ ] Search and filtering
- [ ] Export data (CSV/JSON)

---

### Phase 5: Advanced Dashboard ⏳ FUTURE
**Goal:** Enterprise dashboard features

**Deliverables:**
- [ ] Custom dashboard layouts
- [ ] Multiple cluster support
- [ ] User authentication/authorization
- [ ] Dark/light theme toggle
- [ ] Mobile-responsive improvements
- [ ] PWA support
- [ ] Grafana integration

---

## Current Status

**Phase:** 2 of 5 (Metrics Dashboard) ✅ COMPLETE  
**Next Phase:** Phase 3 - Visualization & Charts  
**Blockers:** Backend doesn't yet support historical data  

## Decisions

1. **React 19** - Using latest React with concurrent features
2. **Vite** - Fast dev server and optimized builds
3. **Tailwind + shadcn** - Modern, accessible UI components
4. **Recharts** - React-friendly charting library
5. **Polling over WebSockets** - Simpler initial implementation
6. **Separate proxy server** - Express server handles API routing

## Known Limitations

- Polling every 30s (not real-time)
- History limited to 60 data points (in-memory only)
- No authentication
- Single cluster view only
- No mobile-specific UI
