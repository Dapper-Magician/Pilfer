/**
 * Pilfer Backend API - Rate Limiter Middleware
 *
 * Protects API from abuse with configurable rate limiting
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.server.rateLimit.windowMs,
  max: config.server.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      details: {
        limit: config.server.rateLimit.maxRequests,
        windowMs: config.server.rateLimit.windowMs
      }
    },
    metadata: {
      requestId: 'rate-limited',
      timestamp: Date.now(),
      executionTime: 0,
      cacheStatus: 'MISS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address for rate limiting
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  // Skip successful requests from rate limit count (optional)
  skip: (req) => {
    // Skip health checks from rate limiting
    return req.path === '/api/v1/health';
  }
});
