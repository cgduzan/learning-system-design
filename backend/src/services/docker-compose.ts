import { Infrastructure, Node, NodeType } from '../types/infrastructure';

interface ServiceConfig {
  image: string;
  ports?: string[];
  environment?: Record<string, string>;
  depends_on?: string[];
  volumes?: string[];
  networks?: string[];
  command?: string[];
  restart?: string;
}

const DEFAULT_IMAGES: Record<NodeType, string> = {
  'load-balancer': 'nginx:alpine',
  'app-server': 'node:18-alpine',
  'database': 'postgres:15-alpine',
  'cache': 'redis:alpine',
  'message-queue': 'rabbitmq:3-management-alpine',
};

const DEFAULT_PORTS: Record<NodeType, string[]> = {
  'load-balancer': ['8080:80'],
  'app-server': [],
  'database': ['5432:5432'],
  'cache': ['6379:6379'],
  'message-queue': ['5672:5672', '15672:15672'],
};

const DEFAULT_ENV: Record<NodeType, Record<string, string>> = {
  'load-balancer': {},
  'app-server': {
    NODE_ENV: 'production',
  },
  'database': {
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
    POSTGRES_DB: 'app',
  },
  'cache': {},
  'message-queue': {
    RABBITMQ_DEFAULT_USER: 'guest',
    RABBITMQ_DEFAULT_PASS: 'guest',
  },
};

export function generateDockerCompose(infrastructure: Infrastructure): string {
  const services: Record<string, ServiceConfig> = {};
  const networks: Record<string, { driver: string }> = {
    app_network: { driver: 'bridge' },
  };

  // Track used ports for app servers
  let appServerPortIndex = 0;

  // Process each node
  infrastructure.nodes.forEach((node) => {
    const serviceName = `${node.type}-${node.id}`;
    const serviceConfig: ServiceConfig = {
      image: DEFAULT_IMAGES[node.type],
      environment: DEFAULT_ENV[node.type],
      networks: ['app_network'],
      restart: 'unless-stopped',
    };

    // Add specific configurations based on node type
    switch (node.type) {
      case 'load-balancer':
        serviceConfig.ports = DEFAULT_PORTS['load-balancer'];
        serviceConfig.volumes = ['./nginx.conf:/etc/nginx/nginx.conf:ro'];
        serviceConfig.command = ['nginx', '-g', 'daemon off;'];
        serviceConfig.depends_on = infrastructure.edges
          .filter(edge => edge.source === node.id)
          .map(edge => `${infrastructure.nodes.find(n => n.id === edge.target)?.type}-${edge.target}`);
        break;
      case 'app-server':
        // No port mapping needed - only accessible through load balancer
        serviceConfig.command = [
          'sh',
          '-c',
          'mkdir -p /app && ' +
          'echo "<html><body><h1>Hello from app server</h1><p>Server ID: ' + node.id + '</p></body></html>" > /app/index.html && ' +
          'node -e "const http = require(\'http\'); const fs = require(\'fs\'); const server = http.createServer((req, res) => { res.writeHead(200, {\'Content-Type\': \'text/html\'}); res.end(fs.readFileSync(\'/app/index.html\')); }); server.listen(3000, \'0.0.0.0\', () => console.log(\'Server running on port 3000\'));"'
        ];
        break;
      case 'database':
        serviceConfig.ports = DEFAULT_PORTS['database'];
        serviceConfig.volumes = ['./postgres-data:/var/lib/postgresql/data'];
        break;
      case 'cache':
        serviceConfig.ports = DEFAULT_PORTS['cache'];
        serviceConfig.volumes = ['./redis-data:/data'];
        break;
      case 'message-queue':
        serviceConfig.ports = DEFAULT_PORTS['message-queue'];
        serviceConfig.volumes = ['./rabbitmq-data:/var/lib/rabbitmq'];
        break;
    }

    services[serviceName] = serviceConfig;
  });

  // Generate the docker-compose.yml content
  const composeContent = {
    services,
    networks,
  };

  return JSON.stringify(composeContent, null, 2);
} 