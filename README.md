# System Design Learning Platform

This project is a hands-on learning platform for understanding system design concepts through practical experimentation. It allows you to visualize, modify, and test different system architectures to understand their performance characteristics.

## Features

- Interactive UI to visualize system infrastructure
- Real-time load testing capabilities
- Infrastructure modification capabilities:
  - Add/remove load balancers
  - Scale application servers
  - Add/remove databases
  - Implement caching layers
  - Add message queues for async processing
- Performance monitoring and bottleneck detection

## Project Structure

```
.
├── frontend/           # React + TypeScript + Vite frontend
├── backend/           # Node.js backend
├── load-tests/        # Load testing scripts
└── infrastructure/    # Infrastructure configuration files
```

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Vite
  - TailwindCSS (for styling)
  - React Flow (for infrastructure visualization)

- Backend:
  - Node.js
  - Express
  - TypeScript
  - k6 (for load testing)
  - Docker (for containerization)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```
3. Start the development servers:
   ```bash
   # Start frontend
   cd frontend
   npm run dev

   # Start backend
   cd ../backend
   npm run dev
   ```

## Development

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:3000`

## Testing

Load tests can be run using k6:
```bash
cd load-tests
k6 run test.js
``` 