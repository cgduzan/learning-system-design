import type { NodeType } from './infrastructure';

export interface BaseNodeConfig {
  port?: number;
  healthCheckPath?: string;
  memoryLimit?: string;
  cpuLimit?: string;
}

export interface LoadBalancerConfig extends BaseNodeConfig {
  type: 'load-balancer';
  port: number;
}

export interface AppServerConfig extends BaseNodeConfig {
  type: 'app-server';
  port: number;
}

export interface DatabaseConfig extends BaseNodeConfig {
  type: 'database';
  username: string;
  password: string;
  databaseName: string;
}

export interface CacheConfig extends BaseNodeConfig {
  type: 'cache';
  maxMemory: string;
}

export interface MessageQueueConfig extends BaseNodeConfig {
  type: 'message-queue';
  queueNames: string[];
}

export type NodeConfig =
  | LoadBalancerConfig
  | AppServerConfig
  | DatabaseConfig
  | CacheConfig
  | MessageQueueConfig;

export const DEFAULT_CONFIGS: Record<NodeType, NodeConfig> = {
  'load-balancer': {
    type: 'load-balancer',
    port: 8080,
    healthCheckPath: '/health',
  },
  'app-server': {
    type: 'app-server',
    port: 3000,
    healthCheckPath: '/health',
    memoryLimit: '512M',
    cpuLimit: '0.5',
  },
  'database': {
    type: 'database',
    username: 'admin',
    password: 'password',
    databaseName: 'app',
    port: 5432,
  },
  'cache': {
    type: 'cache',
    maxMemory: '256M',
    port: 6379,
  },
  'message-queue': {
    type: 'message-queue',
    queueNames: ['default'],
    port: 5672,
  },
}; 