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
  const [status, setStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [composeConfig, setComposeConfig] = useState<string | null>(null);
  const [isComposeExpanded, setIsComposeExpanded] = useState(true);

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

  const handleApplyInfrastructure = async () => {
    setApplying(true);
    setStatus(null);
    setError(null);
    setComposeConfig(null);
    try {
      const response = await fetch('http://localhost:3000/api/infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map(({ data: ignored, ...rest }) => rest), // remove React Flow data
          edges,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setStatus(result.message || 'Infrastructure applied!');
        setComposeConfig(result.composeYml);
      } else {
        setError(result.message || 'Failed to apply infrastructure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply infrastructure');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="h-full w-full flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="h-full w-full flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-2 flex items-center gap-4 bg-gray-100 border-b">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleApplyInfrastructure}
          disabled={applying}
        >
          {applying ? 'Applying...' : 'Apply Infrastructure'}
        </button>
        {status && <span className="text-green-600">{status}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className={`${composeConfig ? (isComposeExpanded ? 'w-2/3' : 'w-full') : 'w-full'} transition-all duration-300`}>
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
        {composeConfig && (
          <div 
            className={`${isComposeExpanded ? 'w-1/3' : 'w-12'} border-l flex flex-col transition-all duration-300`}
            onClick={() => !isComposeExpanded && setIsComposeExpanded(true)}
          >
            <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${!isComposeExpanded && 'hidden'}`}>Generated Docker Compose</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposeExpanded(!isComposeExpanded);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title={isComposeExpanded ? 'Collapse' : 'Expand'}
              >
                {isComposeExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {isComposeExpanded && (
              <div className="flex-1 overflow-auto">
                <pre className="bg-gray-800 text-gray-100 p-4 whitespace-pre">
                  {composeConfig}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 