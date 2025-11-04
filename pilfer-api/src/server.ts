/**
 * Pilfer Backend API - Main Server
 *
 * Elite-tier Express server with comprehensive middleware stack
 * Implementing specifications from BACKEND_API_ARCHITECTURE.md
 *
 * @version 1.0.0
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Import routes
import healthRoutes from './routes/health';
import extractRoutes from './routes/extract';

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // ========================================================================
  // SECURITY MIDDLEWARE (Layer 2: Gateway Security)
  // ========================================================================

  // Helmet: Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS: Cross-Origin Resource Sharing
  app.use(cors({
    origin: config.server.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
  }));

  // ========================================================================
  // PERFORMANCE MIDDLEWARE
  // ========================================================================

  // Compression: Gzip/Deflate responses
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // ========================================================================
  // PARSING MIDDLEWARE
  // ========================================================================

  // JSON body parser with size limit
  app.use(express.json({
    limit: '10mb',
    strict: true
  }));

  // URL-encoded body parser
  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  // ========================================================================
  // LOGGING MIDDLEWARE
  // ========================================================================

  // HTTP request logging (development)
  if (config.server.env === 'development') {
    app.use(morgan('dev'));
  }

  // Custom request logger (all environments)
  app.use(requestLogger);

  // ========================================================================
  // RATE LIMITING MIDDLEWARE (Layer 2: DDoS Protection)
  // ========================================================================

  app.use('/api', rateLimiter);

  // ========================================================================
  // ROUTES
  // ========================================================================

  // Health check (no authentication required)
  app.use('/api/v1/health', healthRoutes);

  // Extraction endpoints (authentication required)
  app.use('/api/v1/extract', extractRoutes);

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Pilfer Backend API',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/v1/docs',
      endpoints: {
        health: '/api/v1/health',
        extract: '/api/v1/extract'
      }
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        details: {
          method: req.method,
          path: req.path,
          availableRoutes: [
            'GET /api/v1/health',
            'POST /api/v1/extract'
          ]
        }
      },
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: Date.now(),
        executionTime: 0,
        cacheStatus: 'MISS'
      }
    });
  });

  // ========================================================================
  // ERROR HANDLING MIDDLEWARE (Must be last)
  // ========================================================================

  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    const app = createApp();
    const { port, host } = config.server;

    // Start listening
    const server = app.listen(port, host, () => {
      logger.info('='.repeat(60));
      logger.info('🏴‍☠️ PILFER BACKEND API SERVER STARTED');
      logger.info('='.repeat(60));
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`Server: http://${host}:${port}`);
      logger.info(`Health: http://${host}:${port}/api/v1/health`);
      logger.info(`Extract: http://${host}:${port}/api/v1/extract`);
      logger.info('='.repeat(60));
      logger.info('🚀 Ready to pilfer websites with 95%+ compatibility!');
      logger.info('='.repeat(60));
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connections, cleanup resources, etc.
      // TODO: Implement cleanup logic

      // Exit process
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };
