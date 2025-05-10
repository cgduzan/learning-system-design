import { Infrastructure, Node, NodeType } from '../types/infrastructure';

interface ServiceConfig {
  image: string;
  ports?: string[];
  environment?: Record<string, string>;
  depends_on?: string[];
  volumes?: string[];
  networks?: string[];
}

const DEFAULT_IMAGES: Record<NodeType, string> = {
  'load-balancer': 'nginx:alpine',
  'app-server': 'node:18-alpine',
  'database': 'postgres:15-alpine',
  'cache': 'redis:alpine',
  'message-queue': 'rabbitmq:3-management-alpine',
};

const DEFAULT_PORTS: Record<NodeType, string[]> = {
  'load-balancer': ['80:80'],
  'app-server': ['3000:3000'],
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

  // Process each node
  infrastructure.nodes.forEach((node) => {
    const serviceName = `${node.type}-${node.id}`;
    const serviceConfig: ServiceConfig = {
      image: DEFAULT_IMAGES[node.type],
      ports: DEFAULT_PORTS[node.type],
      environment: DEFAULT_ENV[node.type],
      networks: ['app_network'],
    };

    // Add specific configurations based on node type
    switch (node.type) {
      case 'load-balancer':
        serviceConfig.volumes = ['./nginx.conf:/etc/nginx/nginx.conf:ro'];
        break;
      case 'app-server':
        serviceConfig.volumes = ['./app:/app'];
        serviceConfig.depends_on = infrastructure.edges
          .filter(edge => edge.target === node.id)
          .map(edge => `${infrastructure.nodes.find(n => n.id === edge.source)?.type}-${edge.source}`);
        break;
      case 'database':
        serviceConfig.volumes = ['./postgres-data:/var/lib/postgresql/data'];
        break;
      case 'cache':
        serviceConfig.volumes = ['./redis-data:/data'];
        break;
      case 'message-queue':
        serviceConfig.volumes = ['./rabbitmq-data:/var/lib/rabbitmq'];
        break;
    }

    services[serviceName] = serviceConfig;
  });

  // Generate the docker-compose.yml content
  const composeContent = {
    version: '3.8',
    services,
    networks,
  };

  return JSON.stringify(composeContent, null, 2);
} 