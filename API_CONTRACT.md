# rwatch-web Metrics API Contract

## Overview
New endpoints for querying Kubernetes metrics-server data alongside existing memory metrics.

## Endpoints

### 1. Get Cluster Nodes Metrics
```
GET /api/metrics/nodes
```

**Response:**
```json
{
  "nodes": [
    {
      "name": "node-1",
      "cpu": {
        "usage": "450m",
        "usagePercentage": 22.5,
        "capacity": "2000m"
      },
      "memory": {
        "usage": "2048Mi",
        "usagePercentage": 34.2,
        "capacity": "6000Mi"
      }
    }
  ],
  "timestamp": "2026-03-05T22:30:00Z"
}
```

### 2. Get Cluster Pods Metrics
```
GET /api/metrics/pods
```

**Response:**
```json
{
  "pods": [
    {
      "name": "nginx-abc123",
      "namespace": "default",
      "node": "node-1",
      "cpu": "100m",
      "memory": "256Mi"
    }
  ],
  "timestamp": "2026-03-05T22:30:00Z"
}
```

### 3. Get Summary Stats
```
GET /api/metrics/summary
```

**Response:**
```json
{
  "nodes": { "count": 3, "cpuUsage": 45.2, "memoryUsage": 62.1 },
  "pods": { "count": 24, "cpuUsage": "2400m", "memoryUsage": "8192Mi" }
}
```

## Implementation Notes
- Backend queries Kubernetes metrics-server API (/apis/metrics.k8s.io/v1beta1/)
- Frontend polls every 30 seconds
- Error response: `{ "error": "message", "timestamp": "..." }`
