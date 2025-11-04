/**
 * Pilfer Backend API - Configuration Management
 *
 * Centralized configuration loading from environment variables
 * with validation and type safety
 */

import { config as dotenvConfig } from 'dotenv';
import type {
  ServerConfig,
  PlaywrightConfig,
  RedisConfig,
  PostgresConfig
} from '../types';

// Load environment variables
dotenvConfig();

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  const required = ['NODE_ENV'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

/**
 * Server Configuration
 */
export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'pilfer-development-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};

/**
 * Playwright Configuration
 */
export const playwrightConfig: PlaywrightConfig = {
  browser: (process.env.PLAYWRIGHT_BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium',
  headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
  viewport: {
    width: parseInt(process.env.PLAYWRIGHT_VIEWPORT_WIDTH || '1920', 10),
    height: parseInt(process.env.PLAYWRIGHT_VIEWPORT_HEIGHT || '1080', 10)
  },
  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10),
  waitUntil: (process.env.PLAYWRIGHT_WAIT_UNTIL as 'load' | 'domcontentloaded' | 'networkidle') || 'networkidle',
  javascriptEnabled: process.env.PLAYWRIGHT_JAVASCRIPT !== 'false',
  userAgent: process.env.PLAYWRIGHT_USER_AGENT || 'Pilfer-Extraction-Bot/1.0 (+https://github.com/pilfer/pilfer)',
  locale: process.env.PLAYWRIGHT_LOCALE || 'en-US',
  timezone: process.env.PLAYWRIGHT_TIMEZONE || 'America/New_York'
};

/**
 * Redis Configuration
 */
export const redisConfig: RedisConfig = {
  enabled: process.env.REDIS_ENABLED !== 'false',
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'pilfer:',
  ttl: parseInt(process.env.REDIS_TTL || '3600', 10) // 1 hour default
};

/**
 * PostgreSQL Configuration
 */
export const postgresConfig: PostgresConfig = {
  enabled: process.env.POSTGRES_ENABLED !== 'false',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'pilfer',
  user: process.env.POSTGRES_USER || 'pilfer',
  password: process.env.POSTGRES_PASSWORD || 'pilfer',
  ssl: process.env.POSTGRES_SSL === 'true',
  poolSize: parseInt(process.env.POSTGRES_POOL_SIZE || '10', 10),
  maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
  ttl: parseInt(process.env.POSTGRES_TTL || '86400', 10) // 24 hours default
};

/**
 * Feature Flags
 */
export const featureFlags = {
  enableCaching: process.env.ENABLE_CACHING !== 'false',
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  enableFrameworkDetection: process.env.ENABLE_FRAMEWORK_DETECTION !== 'false',
  enablePerformanceAnalysis: process.env.ENABLE_PERFORMANCE_ANALYSIS !== 'false',
  enableAssetHarvesting: process.env.ENABLE_ASSET_HARVESTING !== 'false'
};

/**
 * Export all configuration
 */
export const config = {
  server: serverConfig,
  playwright: playwrightConfig,
  redis: redisConfig,
  postgres: postgresConfig,
  features: featureFlags
};

export default config;
