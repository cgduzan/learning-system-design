import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Infrastructure } from './types/infrastructure';
import { generateDockerCompose } from './services/docker-compose';
import { deployInfrastructure, stopDeployment, getDeploymentStatus } from './services/docker';

const app = express();
const port = process.env.PORT || 3000;

// In-memory infrastructure state
let infrastructureState: Infrastructure | null = null;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get current infrastructure
app.get('/api/infrastructure', (req, res) => {
  res.json(infrastructureState || {
    nodes: [
      {
        id: '1',
        type: 'load-balancer',
        position: { x: 250, y: 0 },
      },
      {
        id: '2',
        type: 'app-server',
        position: { x: 100, y: 100 },
      },
      {
        id: '3',
        type: 'app-server',
        position: { x: 400, y: 100 },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
    ],
  });
});

// Set infrastructure and generate docker-compose.yml
app.post('/api/infrastructure', (req, res) => {
  try {
    const infrastructure = req.body as Infrastructure;
    infrastructureState = infrastructure;
    
    // Generate docker-compose.yml
    const composeYml = generateDockerCompose(infrastructure);
    const composePath = path.join(__dirname, '../docker-compose.yml');
    fs.writeFileSync(composePath, composeYml);
    
    res.json({ 
      status: 'ok', 
      message: 'Infrastructure updated and docker-compose.yml generated.',
      composeYml 
    });
  } catch (error) {
    console.error('Error generating Docker Compose:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to generate Docker Compose file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Deploy infrastructure
app.post('/api/deploy', async (req, res) => {
  try {
    const status = await deployInfrastructure();
    res.json(status);
  } catch (error) {
    console.error('Error deploying infrastructure:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Deployment failed',
    });
  }
});

// Stop deployment
app.post('/api/deploy/stop', async (req, res) => {
  try {
    await stopDeployment();
    res.json({ status: 'ok', message: 'Deployment stopped' });
  } catch (error) {
    console.error('Error stopping deployment:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to stop deployment',
    });
  }
});

// Get deployment status
app.get('/api/deploy/status', (req, res) => {
  res.json(getDeploymentStatus());
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 