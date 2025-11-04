/**
 * Pilfer Backend API - Error Handler Middleware
 *
 * Centralized error handling with structured responses
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ExtractionError } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id']
  });

  // Determine status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';

  if (err instanceof ExtractionError) {
    statusCode = err.statusCode;
    errorCode = err.code;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message,
      details: (err as any).details || undefined
    },
    metadata: {
      requestId: req.headers['x-request-id'] || 'unknown',
      timestamp: Date.now(),
      executionTime: 0,
      cacheStatus: 'MISS'
    }
  });
}
