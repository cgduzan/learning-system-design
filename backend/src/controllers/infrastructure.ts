import { Request, Response } from 'express';
import { generateDockerCompose } from '../services/docker-compose';
import { validateInfrastructure } from '../services/validation';
import type { Infrastructure } from '../types/infrastructure';

export async function applyInfrastructure(req: Request, res: Response) {
  try {
    const infrastructure = req.body as Infrastructure;

    // Validate infrastructure
    const validationResult = validateInfrastructure(infrastructure);
    if (!validationResult.isValid) {
      return res.status(400).json({
        message: 'Invalid infrastructure configuration',
        errors: validationResult.errors,
      });
    }

    // Generate Docker Compose configuration
    const composeYml = await generateDockerCompose(infrastructure);

    res.json({
      message: 'Infrastructure configuration is valid',
      composeYml,
      validation: validationResult,
    });
  } catch (error) {
    console.error('Error applying infrastructure:', error);
    res.status(500).json({
      message: 'Failed to apply infrastructure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 