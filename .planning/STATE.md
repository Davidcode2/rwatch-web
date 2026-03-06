# Rwatch-Web Project State

**Last Updated:** 2026-03-06  
**Current Phase:** Phase 2 - Metrics Dashboard ✅ COMPLETE  
**Next Phase:** Phase 3 - Visualization & Charts

---

## Current Status

### ✅ What's Working

1. **Dashboard UI**
   - Dark mode by default
   - Summary cards (Total Nodes, Total Pods, Cluster Memory)
   - Tabbed interface (Nodes/Pods)
   - Responsive layout with Tailwind CSS

2. **Data Fetching**
   - `useK8sMetrics` hook polling every 30s
   - `useMetrics` hook polling every 5s (legacy)
   - Parallel API requests with `Promise.all()`
   - Error handling with error state display
   - Loading states

3. **Components**
   - `KubernetesMetrics.tsx` - Main container
   - `NodesTable.tsx` - Displays node CPU/memory
   - `PodsTable.tsx` - Displays pod resource usage
   - `K8sMetricsChart.tsx` - Charts with CPU/Memory toggle
   - UI components from shadcn (Card, Tabs, Table)

4. **Charts**
   - Recharts integration
   - CPU/Memory usage visualization
   - 60-point rolling history
   - Toggle between metrics

5. **Type Safety**
   - Full TypeScript coverage
   - Types for all API responses
   - Generic hooks

---

## Recent Changes (v0.1.13)

### Added
- `K8sMetricsChart.tsx` - Time-series chart component
- Chart toggle (CPU/Memory) in KubernetesMetrics
- Historical data tracking (60 points)
- Improved loading states

### Modified
- `package.json` - Dependency updates

---

## Blockers & Concerns

### 🔴 Blockers
None currently.

### 🟡 Concerns
1. **Historical data** - Limited to 60 points in memory
2. **Polling frequency** - 30s may be too slow for some use cases
3. **No WebSockets** - Not real-time
4. **No auth** - Dashboard is open
5. **Single cluster** - No multi-cluster support

### 🟢 Under Control
- TypeScript coverage is good
- Component structure is clean
- Error handling is in place
- UI is responsive

---

## Next Steps

### Immediate (Next Session)
1. Add namespace filtering to pods view
2. Implement search functionality
3. Add refresh button for manual updates

### Short Term (This Week)
1. Add node detail drill-down view
2. Add pod detail view with container info
3. Implement export to CSV

### Medium Term (This Month)
1. WebSocket integration for real-time updates
2. User authentication
3. Dark/light theme toggle
4. Mobile-specific UI improvements

---

## Technical Debt

1. **Polling vs WebSockets** - Should migrate to WebSockets for efficiency
2. **State management** - Currently using useState, may need Zustand/Redux as app grows
3. **Testing** - Limited test coverage (only basic setup in vitest.config.ts)
4. **Error boundaries** - Need React error boundaries for production

---

## Metrics

**Lines of Code:**
- Components: ~800 lines
- Hooks: ~200 lines
- Types: ~100 lines
- Total: ~1100 lines

**Dependencies:**
- react, react-dom (v19)
- vite (build tool)
- tailwindcss (styling)
- recharts (charts)
- @radix-ui/* (accessible UI primitives)
- lucide-react (icons)

**Dev Dependencies:**
- TypeScript
- ESLint
- Vitest (testing framework)
- @testing-library/react

---

## API Integration

### Backend Connection
```
rwatch-web (port 5173 dev / 80 production)
    ↓
Express proxy (port 3001)
    ↓
rwatch-agent (port 3000)
```

### Endpoints Used
| Endpoint | Response Type | Usage |
|----------|--------------|-------|
| `/api/metrics/nodes` | `NodeMetricsResponse` | Nodes table |
| `/api/metrics/pods` | `PodMetricsResponse` | Pods table |
| `/api/metrics/summary` | `SummaryResponse` | Summary cards |

---

## File Structure

```
src/
├── components/
│   ├── Dashboard.tsx
│   ├── KubernetesMetrics.tsx
│   ├── NodesTable.tsx
│   ├── PodsTable.tsx
│   ├── K8sMetricsChart.tsx
│   └── ui/              # shadcn components
│       ├── card.tsx
│       ├── tabs.tsx
│       ├── table.tsx
│       └── chart.tsx
├── hooks/
│   ├── useMetrics.ts    # Legacy agent metrics
│   └── useK8sMetrics.ts # K8s metrics
├── types/
│   ├── index.ts         # Main types
│   └── k8s.ts          # K8s-specific types
├── lib/
│   └── utils.ts        # Utility functions
├── App.tsx
└── main.tsx
```

---

## Deployment Status

| Environment | Status | Notes |
|-------------|--------|-------|
| Local dev | ✅ Working | `npm run dev` on port 5173 |
| Docker | ✅ Working | Dockerfile present |
| Kubernetes | ✅ Deployed | Served via nginx |
| CI/CD | ✅ Working | GitHub Actions |

---

## Relationship with Rwatch Backend

**Dependency:** Requires rwatch-agent running and accessible  
**API Contract:** See `API_CONTRACT.md` in repository root  
**Version Compatibility:** Currently syncs with rwatch v0.1.5

**Data Flow:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  rwatch-web     │────▶│  Express proxy  │────▶│  rwatch-agent   │
│  (React UI)     │     │  (server.js)    │     │  (Rust daemon)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    │                     │                     │
                              ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
                              │  K8s API  │        │/proc/meminfo│       │ /health   │
                              │ (metrics) │        │ (memory)   │        │ (status)  │
                              └───────────┘        └───────────┘        └───────────┘
```
