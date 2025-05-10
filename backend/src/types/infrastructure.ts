import type { NodeConfig } from './node-config';

export type NodeType = 'load-balancer' | 'app-server' | 'database' | 'cache' | 'message-queue';

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  data?: Record<string, any>;
  config?: NodeConfig;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data?: Record<string, any>;
}

export interface Infrastructure {
  nodes: Node[];
  edges: Edge[];
} 