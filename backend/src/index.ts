import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Infrastructure endpoints
app.get('/api/infrastructure', (req, res) => {
  // TODO: Return current infrastructure state
  res.json({
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 