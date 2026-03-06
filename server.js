import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { KubeConfig, Metrics } from '@kubernetes/client-node';

// ES modules don't have __dirname, so we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());

// Configuration
const AGENT_SERVICE_HOST = process.env.RWATCH_AGENT_SERVICE_HOST || 'rwatch-agent.rwatch.svc.cluster.local';
const AGENT_SERVICE_PORT = process.env.RWATCH_AGENT_SERVICE_PORT || '3000';
const AGENT_URL = `http://${AGENT_SERVICE_HOST}:${AGENT_SERVICE_PORT}`;

// Kubernetes client initialization
let metricsApi = null;
let k8sInitialized = false;

function initializeK8sClient() {
  try {
    const kc = new KubeConfig();
    
    // Try in-cluster config first, fall back to default (for local dev)
    if (process.env.KUBERNETES_SERVICE_HOST) {
      kc.loadFromCluster();
      console.log('K8s client initialized from in-cluster config');
    } else {
      kc.loadFromDefault();
      console.log('K8s client initialized from default config');
    }
    
    metricsApi = new Metrics(kc);
    k8sInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize K8s client:', error.message);
    k8sInitialized = false;
    return false;
  }
}

// Initialize K8s client on startup
initializeK8sClient();

// Helper to parse resource quantities (e.g., "450m", "2048Mi", "2Gi")
function parseResourceQuantity(quantity) {
  if (!quantity) return 0;
  
  const units = {
    'n': 1e-9,
    'u': 1e-6,
    'm': 1e-3,
    '': 1,
    'k': 1e3,
    'Ki': 1024,
    'M': 1e6,
    'Mi': 1024 * 1024,
    'G': 1e9,
    'Gi': 1024 * 1024 * 1024,
    'T': 1e12,
    'Ti': 1024 * 1024 * 1024 * 1024,
  };
  
  const match = quantity.toString().match(/^([0-9.]+)([A-Za-z]*)$/);
  if (!match) return parseFloat(quantity) || 0;
  
  const [, num, unit] = match;
  return parseFloat(num) * (units[unit] || 1);
}

// Format bytes to human readable (for memory)
function formatBytes(bytes, decimals = 0) {
  if (bytes === 0) return '0';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['', 'Ki', 'Mi', 'Gi', 'Ti'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}

// Format CPU cores
function formatCPU(cores) {
  if (cores < 1) {
    return Math.round(cores * 1000) + 'm';
  }
  return Math.round(cores * 100) / 100 + '';
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'up', version: '0.1.0' });
});

// Query a single agent
async function queryAgent(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Get all agents data
async function getAllAgents() {
  try {
    const [health, memory] = await Promise.all([
      queryAgent(`${AGENT_URL}/health`),
      queryAgent(`${AGENT_URL}/memory`)
    ]);

    return {
      success: true,
      url: AGENT_URL,
      health,
      memory
    };
  } catch (error) {
    return {
      success: false,
      url: AGENT_URL,
      error: error.message
    };
  }
}

// API endpoint to get agents data
app.get('/api/agents', async (req, res) => {
  try {
    const agentData = await getAllAgents();
    res.json([agentData]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get aggregated metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const agents = await getAllAgents();

    if (!agents.success) {
      return res.status(503).json({ error: 'Failed to query agents' });
    }

    const metrics = {
      total_nodes: 1,
      healthy_nodes: agents.success ? 1 : 0,
      failed_nodes: agents.success ? 0 : 1,
      total_memory_bytes: agents.memory?.total ? agents.memory.total * 1024 : 0,
      available_memory_bytes: agents.memory?.available ? agents.memory.available * 1024 : 0,
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Kubernetes Metrics-Server Endpoints
// ============================================

// GET /api/metrics/nodes - node CPU/memory from metrics-server
app.get('/api/metrics/nodes', async (req, res) => {
  try {
    if (!k8sInitialized || !metricsApi) {
      return res.status(503).json({ 
        error: 'Kubernetes metrics-server not available', 
        timestamp: new Date().toISOString() 
      });
    }

    // Get metrics from metrics-server only
    const metricsResponse = await metricsApi.getNodeMetrics();
    const nodes = [];

    for (const metric of metricsResponse) {
      const cpuUsage = parseResourceQuantity(metric.usage.cpu);
      const memoryUsage = parseResourceQuantity(metric.usage.memory);

      nodes.push({
        name: metric.metadata.name,
        cpu: {
          usage: formatCPU(cpuUsage),
          usageRaw: cpuUsage
        },
        memory: {
          usage: formatBytes(memoryUsage),
          usageRaw: memoryUsage
        }
      });
    }

    res.json({
      nodes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching node metrics:', error);
    res.status(503).json({ 
      error: 'Kubernetes metrics-server not available', 
      timestamp: new Date().toISOString() 
    });
  }
});

// GET /api/metrics/pods - pod metrics with namespace filter
app.get('/api/metrics/pods', async (req, res) => {
  try {
    if (!k8sInitialized || !metricsApi) {
      return res.status(503).json({ 
        error: 'Kubernetes metrics-server not available', 
        timestamp: new Date().toISOString() 
      });
    }

    const namespace = req.query.namespace;
    
    // Get pod metrics from metrics-server
    let podMetrics;
    if (namespace) {
      podMetrics = await metricsApi.getPodMetrics(namespace);
    } else {
      podMetrics = await metricsApi.getPodMetrics();
    }

    const pods = [];

    for (const pod of podMetrics) {
      // Calculate total usage across all containers
      let totalCpu = 0;
      let totalMemory = 0;

      if (pod.containers && Array.isArray(pod.containers)) {
        for (const container of pod.containers) {
          totalCpu += parseResourceQuantity(container.usage.cpu);
          totalMemory += parseResourceQuantity(container.usage.memory);
        }
      }

      pods.push({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        node: pod.metadata.nodeName || 'unknown',
        cpu: formatCPU(totalCpu),
        memory: formatBytes(totalMemory)
      });
    }

    res.json({
      pods,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pod metrics:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch pod metrics', 
      timestamp: new Date().toISOString() 
    });
  }
});

// GET /api/metrics/summary - aggregated stats from metrics-server
app.get('/api/metrics/summary', async (req, res) => {
  try {
    if (!k8sInitialized || !metricsApi) {
      return res.status(503).json({ 
        error: 'Kubernetes metrics-server not available', 
        timestamp: new Date().toISOString() 
      });
    }

    // Get node metrics from metrics-server
    const nodeMetrics = await metricsApi.getNodeMetrics();
    let totalCpuUsage = 0;
    let totalMemoryUsage = 0;

    for (const metric of nodeMetrics) {
      totalCpuUsage += parseResourceQuantity(metric.usage.cpu);
      totalMemoryUsage += parseResourceQuantity(metric.usage.memory);
    }

    // Get pod metrics
    const podMetrics = await metricsApi.getPodMetrics();
    let totalPodCpu = 0;
    let totalPodMemory = 0;

    for (const pod of podMetrics) {
      if (pod.containers && Array.isArray(pod.containers)) {
        for (const container of pod.containers) {
          totalPodCpu += parseResourceQuantity(container.usage.cpu);
          totalPodMemory += parseResourceQuantity(container.usage.memory);
        }
      }
    }

    res.json({
      nodes: {
        count: nodeMetrics.length,
        cpuUsage: totalCpuUsage,
        memoryUsage: totalMemoryUsage
      },
      pods: {
        count: podMetrics.length,
        cpuUsage: formatCPU(totalPodCpu),
        memoryUsage: formatBytes(totalPodMemory)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching summary metrics:', error);
    res.status(503).json({ 
      error: 'Kubernetes metrics-server not available', 
      timestamp: new Date().toISOString() 
    });
  }
});

// Serve static files in production
if (NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, 'dist')));

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rwatch Web server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Agent service: ${AGENT_URL}`);
});
