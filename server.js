import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Support multiple ways to configure the backend API URL:
// 1. API_URL environment variable (full URL)
// 2. Kubernetes service env vars: RWATCH_AGENT_SERVICE_HOST and RWATCH_AGENT_SERVICE_PORT
// 3. Default to the Kubernetes DNS name
const AGENT_HOST = process.env.RWATCH_AGENT_SERVICE_HOST || 'rwatch-agent.rwatch.svc.cluster.local';
const AGENT_PORT = process.env.RWATCH_AGENT_SERVICE_PORT || '3000';
const DEFAULT_API_URL = `http://${AGENT_HOST}:${AGENT_PORT}`;
const API_URL = process.env.API_URL || DEFAULT_API_URL;

console.log('🔧 Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   API_URL: ${API_URL}`);
console.log(`   (Using ${process.env.API_URL ? 'API_URL env var' : process.env.RWATCH_AGENT_SERVICE_HOST ? 'K8s service env vars' : 'default DNS name'})`);

// Proxy API requests to the rwatch backend
const apiProxy = createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api',
  },
  onError: (err, req, res) => {
    console.error(`❌ Proxy error: ${err.message}`);
    console.error(`   Target: ${API_URL}`);
    console.error(`   Path: ${req.path}`);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Backend service is not reachable',
        target: API_URL,
        timestamp: new Date().toISOString()
      });
    }
  },
  onProxyReq: (proxyReq, req) => {
    console.log(`➡️  Proxying ${req.method} ${req.path} → ${API_URL}${req.path}`);
  },
  onProxyRes: (proxyRes, req) => {
    console.log(`⬅️  Response ${proxyRes.statusCode} from ${req.path}`);
  },
  timeout: 5000,
  proxyTimeout: 5000,
});

app.use('/api', apiProxy);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'up',
    apiUrl: API_URL,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Rwatch Web Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 API Proxy: ${API_URL}`);
});
