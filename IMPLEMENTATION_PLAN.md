# rwatch-web: Remove Express & Query Rust Backend

## Overview
This plan details the steps to remove Express.js entirely from rwatch-web and have the frontend query the Rust backend directly.

## Current Architecture
- **Frontend**: React + Vite (dev server on port 5173)
- **Express Server**: Port 3001, queries K8s metrics-server, serves static files in production
- **Rust Backend**: Port 3000 (already implements the same API endpoints)

## Target Architecture
- **Frontend**: React + Vite (static build only)
- **Rust Backend**: Port 3000 (serves API + static files in production)
- **No Express**: Completely removed

---

## Files to Delete

### 1. `server.js`
- **Action**: Delete entire file
- **Rationale**: No longer needed; Rust backend handles all API calls

---

## Files to Modify

### 1. `package.json`

#### Remove Dependencies
```json
"@kubernetes/client-node": "^1.4.0",
"cors": "^2.8.6",
"express": "^5.2.1"
```

#### Update Scripts
```json
// REMOVE these scripts:
"server": "node server.js",
"start": "node server.js"

// KEEP these scripts:
"dev": "vite",
"build": "tsc -b && vite build",
"lint": "eslint .",
"preview": "vite preview",
"test": "vitest",
"test:run": "vitest run",
"test:ui": "vitest --ui"
```

### 2. `vite.config.ts`

#### Add Proxy Configuration
Add a `server.proxy` configuration to forward `/api` requests to the Rust backend during development:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 3. `src/hooks/useK8sMetrics.ts`

#### Update API_URL Configuration
The hook already uses `import.meta.env.VITE_API_URL` with a fallback to empty string. This works perfectly with the Vite proxy:

```typescript
// Current (KEEP - no changes needed):
const API_URL = import.meta.env.VITE_API_URL || '';
```

**Why this works:**
- In development: `API_URL = ''` → fetches go to `/api/metrics/*` which Vite proxies to `http://localhost:3000`
- In production (Rust serving static files): `API_URL = ''` → fetches go to same-origin `/api/metrics/*`
- With env override: `VITE_API_URL=http://localhost:3000` → direct API calls

---

## Environment Variables

### For Development (`.env.local` - optional)
```bash
# Only needed if you want to override the default behavior
VITE_API_URL=http://localhost:3000
```

**Note**: With the Vite proxy, you don't need this - the proxy handles it automatically.

### For Production (Docker/Kubernetes)
The Rust backend should:
1. Serve static files from the `dist/` directory
2. Mount API routes at `/api/*`
3. Serve `index.html` for all non-API routes (SPA fallback)

---

## Step-by-Step Implementation

### Step 1: Update vite.config.ts
```bash
# Edit vite.config.ts to add proxy configuration
```

### Step 2: Test Dev Setup
```bash
# Terminal 1: Start Rust backend
cd /path/to/rwatch
cargo run

# Terminal 2: Start Vite dev server
cd /path/to/rwatch-web
npm run dev

# Verify: Frontend at http://localhost:5173 should show metrics from Rust backend
```

### Step 3: Verify Frontend Works
- Check browser devtools Network tab
- Confirm requests to `/api/metrics/*` are proxied to port 3000
- Verify all components render correctly:
  - KubernetesMetrics
  - NodesTable
  - PodsTable
  - K8sMetricsChart

### Step 4: Update package.json
```bash
# Remove Express dependencies and scripts
# Run: npm uninstall express cors @kubernetes/client-node
```

### Step 5: Delete server.js
```bash
rm server.js
```

### Step 6: Test Production Build
```bash
# Build static files
npm run build

# The dist/ folder now contains static files only
# These should be served by the Rust backend in production
```

### Step 7: Update Dockerfile (if needed)
The Dockerfile currently likely copies server.js. Update to:
- Only build static files
- Or have Rust backend serve the static files

---

## Testing Approach

### 1. Development Testing
```bash
# 1. Start Rust backend on port 3000
cargo run --manifest-path ../rwatch/Cargo.toml

# 2. Start Vite dev server
npm run dev

# 3. Verify in browser:
# - http://localhost:5173 loads
# - Metrics display correctly
# - No CORS errors in console
# - Network tab shows /api/metrics/* requests returning 200
```

### 2. Verify All Components
- [ ] KubernetesMetrics component loads without errors
- [ ] NodesTable displays node data
- [ ] PodsTable displays pod data
- [ ] K8sMetricsChart renders charts
- [ ] Auto-refresh works (every 30 seconds)
- [ ] Manual refresh works

### 3. Production Build Testing
```bash
# Build static files
npm run build

# Verify dist/ folder contains:
# - index.html
# - assets/ folder with JS/CSS
# - No server.js references
```

### 4. Integration Testing
If Rust backend serves static files:
```bash
# Build frontend
npm run build

# Copy dist to Rust static folder
cp -r dist/ /path/to/rwatch/static/

# Start Rust backend
# Verify: http://localhost:3000 serves the UI and API
```

---

## API Compatibility Check

The Rust backend must implement these endpoints (already in API_CONTRACT.md):

| Endpoint | Method | Response Type |
|----------|--------|---------------|
| `/api/metrics/nodes` | GET | `K8sMetricsResponse` |
| `/api/metrics/pods` | GET | `PodsMetricsResponse` |
| `/api/metrics/summary` | GET | `SummaryResponse` |

All endpoints return JSON with `timestamp` field.

---

## Rollback Plan

If issues occur:
1. Restore `server.js` from git: `git checkout server.js`
2. Revert `package.json` changes
3. Remove Vite proxy config
4. Run `npm install` to restore dependencies

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `server.js` | Delete | Remove Express server |
| `package.json` | Modify | Remove deps & scripts |
| `vite.config.ts` | Modify | Add proxy for `/api` |
| `src/hooks/useK8sMetrics.ts` | No change | Already compatible |
| All UI components | No change | No modifications needed |

---

## Post-Implementation

After successful implementation:
1. Update README.md to remove Express references
2. Update Dockerfile if it references server.js
3. Verify CI/CD pipelines still work
4. Document that Rust backend now serves static files in production
