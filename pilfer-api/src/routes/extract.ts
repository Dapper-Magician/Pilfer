/**
 * Pilfer Backend API - Extraction Route
 *
 * Main extraction endpoint with sophisticated orchestration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ExtractionRequest, ExtractionResult, APIResponse } from '../types';
import { logger } from '../utils/logger';
import { ExtractionOrchestrator } from '../services/orchestrator/ExtractionOrchestrator';

const router = Router();

// Initialize orchestrator (singleton)
const orchestrator = new ExtractionOrchestrator();

/**
 * Request validation schema using Zod
 */
const extractRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  options: z.object({
    preferredEngine: z.enum(['playwright', 'browser', 'cached', 'mock']).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
    enableJavaScript: z.boolean().optional(),
    captureScreenshots: z.boolean().optional(),
    analyzePerformance: z.boolean().optional(),
    extractAssets: z.boolean().optional(),
    analysisDepth: z.enum(['shallow', 'moderate', 'deep']).optional(),
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).optional(),
    scrollToLoad: z.boolean().optional()
  }).optional(),
  context: z.object({
    persona: z.string().optional(),
    targetFramework: z.string().optional(),
    targetStyling: z.string().optional()
  }).optional()
});

/**
 * POST /api/v1/extract
 * Main extraction endpoint
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  try {
    // Validate request body
    const validationResult = extractRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request format',
          details: validationResult.error.errors
        },
        metadata: {
          requestId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
          cacheStatus: 'MISS'
        }
      });
    }

    const { url, options = {}, context = {} } = validationResult.data;

    logger.info('Extraction request received', {
      requestId,
      url,
      options
    });

    // Build extraction request
    const extractionRequest: ExtractionRequest = {
      url,
      sessionId: `session-${Date.now()}`,
      requestId,
      mode: 'balanced',
      options: {
        preferredEngine: options.preferredEngine,
        timeout: options.timeout || 30000,
        enableJavaScript: options.enableJavaScript !== false,
        captureScreenshots: options.captureScreenshots || false,
        analyzePerformance: options.analyzePerformance || false,
        extractAssets: options.extractAssets !== false,
        analysisDepth: options.analysisDepth || 'moderate',
        waitUntil: options.waitUntil || 'networkidle',
        scrollToLoad: options.scrollToLoad || false
      },
      context: {
        persona: context.persona,
        targetFramework: context.targetFramework,
        targetStyling: context.targetStyling
      }
    };

    // Execute extraction with orchestrator
    const result = await orchestrator.extract(extractionRequest);

    const response: APIResponse<ExtractionResult> = {
      success: result.success,
      data: result.success ? result : undefined,
      error: result.success ? undefined : {
        code: 'EXTRACTION_FAILED',
        message: result.extractionMetadata?.error || 'Extraction failed',
        details: result.extractionMetadata
      },
      metadata: {
        requestId,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        cacheStatus: 'MISS'
      }
    };

    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Extraction request failed:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: APIResponse<ExtractionResult> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Extraction request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      metadata: {
        requestId,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        cacheStatus: 'MISS'
      }
    };

    res.status(500).json(response);
  }
});

export default router;
