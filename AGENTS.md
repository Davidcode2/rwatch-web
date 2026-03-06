# AGENTS.md - rwatch-web

> Documentation for AI agents working on this project. Last updated: 2026-03-06 (test setup flow added)

## Project Purpose & Architecture

**rwatch-web** is a React + TypeScript + Express dashboard for monitoring Kubernetes clusters and rwatch agents. It provides real-time visualization of:

- **Agent metrics**: Memory usage from rwatch agents running on cluster nodes
- **Kubernetes metrics**: CPU/memory usage per node and pod (via metrics-server)

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│  Express API    │────▶│  rwatch-agent   │
│   (Vite build)  │     │   (server.js)   │     │   (in-cluster)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  K8s API Server │
                        │  (metrics-server)│
                        └─────────────────┘
```

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Radix UI + Recharts
- **Backend**: Express server that proxies to rwatch-agent and Kubernetes API
- **Deployment**: Docker multi-stage build → GHCR → Kubernetes via GitOps (app-of-apps)

## Key Files & Their Purposes

### Root Configuration
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `vite.config.ts` | Vite build config with React plugin |
| `vitest.config.ts` | Test configuration (Vitest + jsdom) |
| `tsconfig.app.json` | TypeScript config for app |
| `tsconfig.node.json` | TypeScript config for Node/Express |
| `Dockerfile` | Multi-stage Docker build (builder + production) |
| `components.json` | shadcn/ui configuration |
| `API_CONTRACT.md` | API documentation for metrics endpoints |

### Backend
| File | Purpose |
|------|---------|
| `server.js` | Express server - serves static files + API endpoints. Queries rwatch-agent for health/memory and aggregates metrics. Runs on port 3001. |

### Frontend Source
| Path | Purpose |
|------|---------|
| `src/App.tsx` | Root component, sets dark mode, renders Dashboard |
| `src/main.tsx` | App entry point |
| `src/components/Dashboard.tsx` | Main dashboard - memory stats cards, chart, agents list |
| `src/components/KubernetesMetrics.tsx` | K8s metrics with tabbed view (Nodes/Pods) |
| `src/components/NodesTable.tsx` | Table displaying node CPU/memory metrics |
| `src/components/PodsTable.tsx` | Table displaying pod resource usage |
| `src/hooks/useMetrics.ts` | React hook for polling agent metrics (30s interval) |
| `src/hooks/useK8sMetrics.ts` | React hook for polling K8s metrics (30s interval) |
| `src/types/index.ts` | TypeScript types for agent data |
| `src/types/k8s.ts` | TypeScript types for Kubernetes metrics |
| `src/lib/utils.ts` | Utility functions (cn for Tailwind classes) |
| `src/components/ui/` | shadcn/ui components (card, tabs, table, chart) |

### Tests
| Path | Purpose |
|------|---------|
| `src/test/setup.ts` | Vitest setup (jest-dom matchers) |
| `src/test/components/*.test.tsx` | Component tests |
| `src/test/hooks/*.test.ts` | Hook tests |
| `src/test/backend/*.test.ts` | Backend API tests |

### CI/CD
| Path | Purpose |
|------|---------|
| `.github/workflows/docker-build.yml` | GitHub Actions: bump version → build Docker image → push to GHCR → update app-of-apps repo |

## Running/Building Locally

### Prerequisites
- Node.js 22+
- npm

### Development (separate terminals)

```bash
# Terminal 1 - Start Express backend
npm run server
# Runs on http://localhost:3001

# Terminal 2 - Start Vite dev server
npm run dev
# Runs on http://localhost:5173
```

The backend proxies API requests to the rwatch-agent service. In development, you'll need the agent running or mock the responses.

### Production Build

```bash
# Install dependencies
npm ci

# Build frontend (outputs to dist/)
npm run build

# Start production server (serves dist/ + API)
npm start
# Runs on http://localhost:3001
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment mode |
| `RWATCH_AGENT_SERVICE_HOST` | rwatch-agent.rwatch.svc.cluster.local | Agent service host (K8s) |
| `RWATCH_AGENT_SERVICE_PORT` | 3000 | Agent service port |
| `VITE_API_URL` | '' | Frontend API URL prefix (for dev proxy) |

## Local Test Setup with Dummy Agent

For local development and testing without a Kubernetes cluster, you can run the complete stack using the rwatch agent's dummy mode.

### Prerequisites
- Node.js 22+ and npm
- Rust toolchain (for running the agent)

### Test Setup Flow

**Terminal 1 - Start the rwatch agent in dummy mode:**
```bash
cd /path/to/rwatch/rwatch
source $HOME/.cargo/env  # if needed
cargo run -p rwatch-agent -- --dummy
# Agent runs on http://localhost:3000
```

**Terminal 2 - Start the Express backend:**
```bash
cd /path/to/rwatch-web
API_URL=http://localhost:3000 node server.js
# Backend proxy runs on http://localhost:3001
```

**Terminal 3 - Start the Vite dev server:**
```bash
cd /path/to/rwatch-web
npm run dev
# Frontend runs on http://localhost:5173 (or next available port)
```

### Verification

Test the endpoints to verify everything is working:

```bash
# Agent health
curl http://localhost:3000/health

# Backend proxy (should return dummy metrics)
curl http://localhost:3001/api/metrics/nodes
curl http://localhost:3001/api/metrics/pods
curl http://localhost:3001/api/metrics/summary

# Frontend (should serve the React app)
curl http://localhost:5173/
```

### What Dummy Mode Provides

The dummy agent generates realistic simulated data:
- **3 nodes** with varying CPU (2-4 cores) and memory (8-16 GB) capacities
- **40-50 pods** distributed across namespaces: `default`, `kube-system`, `app-namespace`, `monitoring`
- **Smooth variations** in metrics (±2% variation per request)
- All endpoints return data in production format

This setup allows frontend development without requiring a K8s cluster or real agents.

## Testing Approach

Uses **Vitest** with **React Testing Library** and **jsdom**.

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui
```

### Test Structure
- **Component tests**: Render components, check for expected content, mock hooks
- **Hook tests**: Test hook logic with mocked fetch responses
- **Backend tests**: Test Express API endpoints

### Test Setup
- `src/test/setup.ts` configures jest-dom matchers
- Tests use `vi.fn()` for mocking
- Fetch is mocked for hook tests

## Deployment Process

### Workflow for Agents
**IMPORTANT**: When making changes to this repository:
1. Verify changes work correctly locally (run `npm run build` and test)
2. Commit changes with clear messages
3. **Push directly to origin/main** - This triggers the CI/CD pipeline
4. Do not create PRs for routine changes unless requested

The GitHub Actions workflow will automatically:
- Bump the version
- Build and push the Docker image
- Update the app-of-apps deployment repo

### GitHub Actions Workflow (`.github/workflows/docker-build.yml`)

1. **Bump Version**: Automatically increments patch version in `package.json`
2. **Build**: Docker multi-stage build → creates optimized image
3. **Push**: Pushes to `ghcr.io/davidcode2/rwatch-web:<version>`
4. **Deploy**: Updates `app-of-apps` repo with new image tag

### Docker Build

Multi-stage Dockerfile:
- **Stage 1 (builder)**: Install deps → build frontend → output to `dist/`
- **Stage 2 (production)**: Copy server.js + dist/ → run as non-root user

### Kubernetes Deployment

- Image: `ghcr.io/davidcode2/rwatch-web:<version>`
- Port: 3001
- Service connects to `rwatch-agent` in-cluster
- Deployed via GitOps (app-of-apps repo)

## Recent Changes

### Metrics API (2026-03-05)
Added Kubernetes metrics-server integration:
- `GET /api/metrics/nodes` - Node CPU/memory metrics
- `GET /api/metrics/pods` - Pod resource usage
- `GET /api/metrics/summary` - Aggregated cluster stats

Frontend polls these endpoints every 30 seconds via `useK8sMetrics` hook.

### Tabbed View (2026-03-05)
- Added `KubernetesMetrics` component with Radix UI tabs
- Separated Nodes and Pods into tabbed interface
- Uses `@radix-ui/react-tabs` for accessibility

### Version Management
- Automated patch version bumping in CI
- Currently at v0.1.10

## Known Issues & TODOs

### Current Limitations
1. **Single agent assumption**: Backend currently queries one hardcoded agent URL. Need to support multiple agents for multi-node clusters.
2. **No authentication**: API endpoints are open - consider adding auth for production.
3. **K8s API dependency**: Metrics endpoints require metrics-server running in cluster. Graceful fallback if unavailable.

### TODOs
- [ ] Add support for multiple rwatch agents
- [ ] Implement error retry with exponential backoff
- [ ] Add time range selection for charts
- [ ] Add pod filtering/search in PodsTable
- [ ] Consider WebSocket for real-time updates instead of polling
- [ ] Add unit tests for server.js error handling

### Development Notes
- Tailwind CSS v4 is used (new syntax `@import "tailwindcss"`)
- shadcn/ui components are in `src/components/ui/`
- Uses `@` path alias mapped to `./src`
- Dark mode is hardcoded ON in App.tsx (`document.documentElement.classList.add("dark")`)

---

*Questions about this project? Check the README.md or API_CONTRACT.md for more details.*
