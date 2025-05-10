import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface DeploymentStatus {
  status: 'idle' | 'deploying' | 'running' | 'error';
  message?: string;
  services?: {
    name: string;
    status: string;
    ports: string[];
  }[];
}

let currentDeployment: DeploymentStatus = {
  status: 'idle',
};

export async function deployInfrastructure(): Promise<DeploymentStatus> {
  try {
    currentDeployment.status = 'deploying';
    currentDeployment.message = 'Starting deployment...';

    const composePath = path.join(__dirname, '../../docker-compose.yml');
    
    // Stop any existing deployment
    try {
      await execAsync('docker-compose down');
    } catch (error) {
      // Ignore errors if no containers are running
    }

    // Start the new deployment
    await execAsync('docker-compose up -d', {
      cwd: path.dirname(composePath),
    });

    // Get the status of running services
    const { stdout: psOutput } = await execAsync('docker-compose ps --format json');
    const services = psOutput
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));

    currentDeployment = {
      status: 'running',
      message: 'Deployment successful',
      services: services.map((service: any) => ({
        name: service.Service,
        status: service.Status,
        ports: service.Ports ? service.Ports.split(', ') : [],
      })),
    };

    return currentDeployment;
  } catch (error) {
    currentDeployment = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Deployment failed',
    };
    throw error;
  }
}

export async function stopDeployment(): Promise<void> {
  try {
    const composePath = path.join(__dirname, '../../docker-compose.yml');
    await execAsync('docker-compose down', {
      cwd: path.dirname(composePath),
    });
    currentDeployment = {
      status: 'idle',
      message: 'Deployment stopped',
    };
  } catch (error) {
    currentDeployment = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to stop deployment',
    };
    throw error;
  }
}

export function getDeploymentStatus(): DeploymentStatus {
  return currentDeployment;
} 