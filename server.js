const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

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

// Serve static files in production
if (NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, 'dist')));

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
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
