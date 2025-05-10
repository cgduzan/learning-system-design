import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { fetchInfrastructure } from '../services/infrastructure';
import { LoadBalancerNode } from './nodes/LoadBalancerNode';
import { AppServerNode } from './nodes/AppServerNode';

const nodeTypes = {
  'load-balancer': LoadBalancerNode,
  'app-server': AppServerNode,
};

export default function InfrastructureViewer() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInfrastructure = async () => {
      console.log('Fetching infrastructure data...');
      try {
        const data = await fetchInfrastructure();
        console.log('Received infrastructure data:', data);
        // Convert infrastructure nodes to React Flow nodes
        const reactFlowNodes = data.nodes.map((node) => ({
          ...node,
          data: { label: node.type },
        }));
        console.log('Converted nodes:', reactFlowNodes);
        setNodes(reactFlowNodes);
        setEdges(data.edges);
        setLoading(false);
      } catch (err) {
        console.error('Error loading infrastructure:', err);
        setError(err instanceof Error ? err.message : 'Failed to load infrastructure');
        setLoading(false);
      }
    };

    loadInfrastructure();
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  if (loading) {
    return <div className="h-full w-full flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="h-full w-full flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
} 