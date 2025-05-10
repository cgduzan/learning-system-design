import type { Infrastructure, Node, Edge, NodeType } from '../types/infrastructure';
import type { NodeConfig, LoadBalancerConfig, AppServerConfig, DatabaseConfig, CacheConfig, MessageQueueConfig } from '../types/node-config';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

const REQUIRED_CONNECTIONS: Record<NodeType, NodeType[]> = {
  'load-balancer': ['app-server'],
  'app-server': ['database', 'cache'],
  'database': [],
  'cache': [],
  'message-queue': [],
};

const FORBIDDEN_CONNECTIONS: Record<NodeType, NodeType[]> = {
  'load-balancer': ['load-balancer', 'database', 'cache', 'message-queue'],
  'app-server': ['load-balancer', 'app-server'],
  'database': ['load-balancer', 'database', 'cache', 'message-queue'],
  'cache': ['load-balancer', 'database', 'cache', 'message-queue'],
  'message-queue': ['load-balancer', 'database', 'cache', 'message-queue'],
};

export function validateInfrastructure(infrastructure: Infrastructure): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate nodes
  const nodeMap = new Map<string, Node>();
  infrastructure.nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    
    // Validate node configuration
    const nodeErrors = validateNodeConfig(node);
    errors.push(...nodeErrors);

    // Check for duplicate node IDs
    if (infrastructure.nodes.filter((n) => n.id === node.id).length > 1) {
      errors.push({
        type: 'error',
        message: `Duplicate node ID: ${node.id}`,
        nodeId: node.id,
      });
    }
  });

  // Validate edges
  const edgeMap = new Map<string, Edge>();
  infrastructure.edges.forEach((edge) => {
    edgeMap.set(edge.id, edge);

    // Check for duplicate edge IDs
    if (infrastructure.edges.filter((e) => e.id === edge.id).length > 1) {
      errors.push({
        type: 'error',
        message: `Duplicate edge ID: ${edge.id}`,
        edgeId: edge.id,
      });
    }

    // Validate edge connections
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) {
      errors.push({
        type: 'error',
        message: `Edge ${edge.id} references non-existent node(s)`,
        edgeId: edge.id,
      });
      return;
    }

    // Check forbidden connections
    if (FORBIDDEN_CONNECTIONS[sourceNode.type].includes(targetNode.type)) {
      errors.push({
        type: 'error',
        message: `Invalid connection: ${sourceNode.type} cannot connect to ${targetNode.type}`,
        edgeId: edge.id,
      });
    }
  });

  // Check required connections
  infrastructure.nodes.forEach((node) => {
    const requiredTypes = REQUIRED_CONNECTIONS[node.type];
    if (requiredTypes.length === 0) return;

    const connectedTypes = infrastructure.edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => nodeMap.get(edge.target)?.type)
      .filter((type): type is NodeType => type !== undefined);

    const missingTypes = requiredTypes.filter((type) => !connectedTypes.includes(type));
    if (missingTypes.length > 0) {
      errors.push({
        type: 'warning',
        message: `${node.type} should connect to: ${missingTypes.join(', ')}`,
        nodeId: node.id,
      });
    }
  });

  return {
    isValid: errors.filter((error) => error.type === 'error').length === 0,
    errors,
  };
}

function validateNodeConfig(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!node.config) {
    errors.push({
      type: 'error',
      message: `Missing configuration for ${node.type}`,
      nodeId: node.id,
    });
    return errors;
  }

  // Type guard functions
  const isLoadBalancerConfig = (config: NodeConfig): config is LoadBalancerConfig => config.type === 'load-balancer';
  const isAppServerConfig = (config: NodeConfig): config is AppServerConfig => config.type === 'app-server';
  const isDatabaseConfig = (config: NodeConfig): config is DatabaseConfig => config.type === 'database';
  const isCacheConfig = (config: NodeConfig): config is CacheConfig => config.type === 'cache';
  const isMessageQueueConfig = (config: NodeConfig): config is MessageQueueConfig => config.type === 'message-queue';

  switch (node.type) {
    case 'load-balancer':
      if (isLoadBalancerConfig(node.config) && !node.config.port) {
        errors.push({
          type: 'error',
          message: 'Load balancer requires a port',
          nodeId: node.id,
        });
      }
      break;

    case 'app-server':
      if (isAppServerConfig(node.config)) {
        if (!node.config.port) {
          errors.push({
            type: 'error',
            message: 'App server requires a port',
            nodeId: node.id,
          });
        }
        if (!node.config.memoryLimit) {
          errors.push({
            type: 'warning',
            message: 'App server should have a memory limit',
            nodeId: node.id,
          });
        }
      }
      break;

    case 'database':
      if (isDatabaseConfig(node.config)) {
        if (!node.config.username || !node.config.password || !node.config.databaseName) {
          errors.push({
            type: 'error',
            message: 'Database requires username, password, and database name',
            nodeId: node.id,
          });
        }
      }
      break;

    case 'cache':
      if (isCacheConfig(node.config) && !node.config.maxMemory) {
        errors.push({
          type: 'warning',
          message: 'Cache should have a maximum memory limit',
          nodeId: node.id,
        });
      }
      break;

    case 'message-queue':
      if (isMessageQueueConfig(node.config) && (!node.config.queueNames || node.config.queueNames.length === 0)) {
        errors.push({
          type: 'warning',
          message: 'Message queue should have at least one queue name',
          nodeId: node.id,
        });
      }
      break;
  }

  return errors;
} 