/**
 * Pilfer Backend API - Health Check Route
 *
 * Provides system health status and monitoring information
 */

import { Router, Request, Response } from 'express';
import { HealthCheckResponse, EngineType } from '../types';
import { logger } from '../utils/logger';
import { ExtractionOrchestrator } from '../services/orchestrator/ExtractionOrchestrator';
import { CacheService } from '../services/cache/CacheService';

const router = Router();

// Initialize services (singletons)
const orchestrator = new ExtractionOrchestrator();
const cacheService = new CacheService();

// Initialize cache service on module load
cacheService.initialize().catch(err => {
  logger.error('Cache service initialization failed:', err);
});

/**
 * GET /api/v1/health
 * Health check endpoint for monitoring and load balancers
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Calculate uptime
    const uptime = process.uptime();

    // Get engine health from orchestrator
    const engines = await orchestrator.getEngineHealth();

    // TODO: Implement actual dependency health checks
    const dependencies = {
      redis: {
        healthy: true,
        latency: 0,
        error: undefined
      },
      postgres: {
        healthy: true,
        latency: 0,
        error: undefined
      },
      gemini: {
        healthy: true,
        latency: 0,
        error: undefined
      }
    };

    // Get cache statistics
    const cacheStats = cacheService.getStats();

    // Determine overall health status
    const allHealthy = Object.values(engines).every(e => e.healthy) &&
                      Object.values(dependencies).every(d => d.healthy);

    const response: HealthCheckResponse = {
      status: allHealthy ? 'healthy' : 'degraded',
      version: '1.0.0',
      uptime,
      engines,
      dependencies,
      cache: cacheStats
    };

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: response,
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: Date.now(),
        executionTime,
        cacheStatus: 'MISS'
      }
    });

  } catch (error) {
    logger.error('Health check failed:', error);

    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check encountered an error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: Date.now(),
        executionTime: 0,
        cacheStatus: 'MISS'
      }
    });
  }
});

export default router;
