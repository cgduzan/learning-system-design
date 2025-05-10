import type { Node, Edge } from '../types/infrastructure';

const API_URL = 'http://localhost:3000/api';

export interface InfrastructureResponse {
  nodes: Node[];
  edges: Edge[];
}

export async function fetchInfrastructure(): Promise<InfrastructureResponse> {
  try {
    const response = await fetch(`${API_URL}/infrastructure`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching infrastructure:', error);
    throw error;
  }
} 