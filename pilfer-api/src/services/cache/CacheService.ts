/**
 * Pilfer Backend API - Cache Service
 *
 * Two-tier caching architecture for high performance and persistence
 * L1: Redis (in-memory, ultra-fast, volatile)
 * L2: PostgreSQL (persistent, searchable, reliable)
 *
 * Cache Strategy:
 * - Read: L1 → L2 → Original Source
 * - Write: L1 + L2 (write-through)
 * - Invalidation: TTL-based + Manual
 *
 * Performance Targets:
 * - L1 Hit: <10ms
 * - L2 Hit: <50ms
 * - Write: <100ms
 * - Cache Hit Rate: >80%
 *
 * @version 1.0.0
 */

import { createClient, RedisClientType } from 'redis';
import { Pool, QueryResult } from 'pg';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import type {
  ExtractionResult,
  CacheEntry,
  CacheStrategy
} from '../../types';

export class CacheService {
  private redis: RedisClientType | null = null;
  private postgres: Pool | null = null;
  private isInitialized = false;
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Initialize cache connections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Redis (L1 Cache)
      if (config.redis.enabled) {
        logger.info('Initializing Redis L1 cache...');
        this.redis = createClient({
          url: config.redis.url,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('Redis reconnection failed after 10 attempts');
                return new Error('Redis reconnection limit exceeded');
              }
              return retries * 100; // Exponential backoff
            }
          }
        });

        this.redis.on('error', (err) => logger.error('Redis error:', err));
        this.redis.on('connect', () => logger.info('Redis connected'));
        this.redis.on('disconnect', () => logger.warn('Redis disconnected'));

        await this.redis.connect();
        logger.info('Redis L1 cache initialized successfully');
      } else {
        logger.warn('Redis L1 cache is disabled');
      }

      // Initialize PostgreSQL (L2 Cache)
      if (config.postgres.enabled) {
        logger.info('Initializing PostgreSQL L2 cache...');
        this.postgres = new Pool({
          host: config.postgres.host,
          port: config.postgres.port,
          database: config.postgres.database,
          user: config.postgres.user,
          password: config.postgres.password,
          max: config.postgres.maxConnections,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
        });

        this.postgres.on('error', (err) => logger.error('PostgreSQL error:', err));
        this.postgres.on('connect', () => logger.info('PostgreSQL connected'));

        // Create cache table if not exists
        await this.createCacheTable();
        logger.info('PostgreSQL L2 cache initialized successfully');
      } else {
        logger.warn('PostgreSQL L2 cache is disabled');
      }

      this.isInitialized = true;
      logger.info('Cache service initialized successfully');

    } catch (error) {
      logger.error('Cache initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get cached extraction result
   */
  async get(url: string): Promise<ExtractionResult | null> {
    const startTime = Date.now();

    try {
      const cacheKey = this.generateCacheKey(url);

      // Try L1 cache (Redis) first
      if (this.redis && config.redis.enabled) {
        const l1Result = await this.getFromL1(cacheKey);
        if (l1Result) {
          this.cacheHits++;
          const latency = Date.now() - startTime;
          logger.info('L1 cache hit', { url, latency });
          return l1Result;
        }
      }

      // Try L2 cache (PostgreSQL)
      if (this.postgres && config.postgres.enabled) {
        const l2Result = await this.getFromL2(cacheKey);
        if (l2Result) {
          // Promote to L1 cache
          if (this.redis && config.redis.enabled) {
            await this.setToL1(cacheKey, l2Result, config.redis.ttl);
          }

          this.cacheHits++;
          const latency = Date.now() - startTime;
          logger.info('L2 cache hit (promoted to L1)', { url, latency });
          return l2Result;
        }
      }

      // Cache miss
      this.cacheMisses++;
      logger.info('Cache miss', { url });
      return null;

    } catch (error) {
      logger.error('Cache get failed:', error);
      return null; // Graceful degradation
    }
  }

  /**
   * Set extraction result in cache
   */
  async set(url: string, result: ExtractionResult): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(url);

      // Write to both L1 and L2 (write-through strategy)
      const promises: Promise<void>[] = [];

      if (this.redis && config.redis.enabled) {
        promises.push(this.setToL1(cacheKey, result, config.redis.ttl));
      }

      if (this.postgres && config.postgres.enabled) {
        promises.push(this.setToL2(cacheKey, url, result, config.postgres.ttl));
      }

      await Promise.all(promises);
      logger.info('Cache set successful', { url });

    } catch (error) {
      logger.error('Cache set failed:', error);
      // Don't throw - caching is not critical
    }
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(url: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(url);

      const promises: Promise<any>[] = [];

      if (this.redis && config.redis.enabled) {
        promises.push(this.redis.del(cacheKey));
      }

      if (this.postgres && config.postgres.enabled) {
        promises.push(
          this.postgres.query('DELETE FROM extraction_cache WHERE cache_key = $1', [cacheKey])
        );
      }

      await Promise.all(promises);
      logger.info('Cache invalidated', { url });

    } catch (error) {
      logger.error('Cache invalidation failed:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const promises: Promise<any>[] = [];

      if (this.redis && config.redis.enabled) {
        promises.push(this.redis.flushDb());
      }

      if (this.postgres && config.postgres.enabled) {
        promises.push(
          this.postgres.query('TRUNCATE TABLE extraction_cache')
        );
      }

      await Promise.all(promises);
      logger.info('All cache cleared');

    } catch (error) {
      logger.error('Cache clear failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Close cache connections
   */
  async close(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('Redis connection closed');
      }

      if (this.postgres) {
        await this.postgres.end();
        logger.info('PostgreSQL connection closed');
      }

      this.isInitialized = false;

    } catch (error) {
      logger.error('Cache close failed:', error);
    }
  }

  /**
   * L1 Cache Operations (Redis)
   */
  private async getFromL1(cacheKey: string): Promise<ExtractionResult | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(cacheKey);
      if (!data) return null;

      const result: ExtractionResult = JSON.parse(data);
      return result;

    } catch (error) {
      logger.error('L1 cache get failed:', error);
      return null;
    }
  }

  private async setToL1(cacheKey: string, result: ExtractionResult, ttl: number): Promise<void> {
    if (!this.redis) return;

    try {
      const data = JSON.stringify(result);
      await this.redis.setEx(cacheKey, ttl, data);

    } catch (error) {
      logger.error('L1 cache set failed:', error);
    }
  }

  /**
   * L2 Cache Operations (PostgreSQL)
   */
  private async getFromL2(cacheKey: string): Promise<ExtractionResult | null> {
    if (!this.postgres) return null;

    try {
      const query = `
        SELECT result, created_at, expires_at
        FROM extraction_cache
        WHERE cache_key = $1
          AND expires_at > NOW()
      `;

      const queryResult: QueryResult = await this.postgres.query(query, [cacheKey]);

      if (queryResult.rows.length === 0) return null;

      // Update access time
      await this.postgres.query(
        'UPDATE extraction_cache SET accessed_at = NOW(), hits = hits + 1 WHERE cache_key = $1',
        [cacheKey]
      );

      const result: ExtractionResult = queryResult.rows[0].result;
      return result;

    } catch (error) {
      logger.error('L2 cache get failed:', error);
      return null;
    }
  }

  private async setToL2(cacheKey: string, url: string, result: ExtractionResult, ttl: number): Promise<void> {
    if (!this.postgres) return;

    try {
      const query = `
        INSERT INTO extraction_cache (cache_key, url, result, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '${ttl} seconds')
        ON CONFLICT (cache_key)
        DO UPDATE SET
          result = EXCLUDED.result,
          expires_at = EXCLUDED.expires_at,
          created_at = NOW(),
          hits = 0
      `;

      await this.postgres.query(query, [cacheKey, url, result]);

    } catch (error) {
      logger.error('L2 cache set failed:', error);
    }
  }

  /**
   * Create cache table in PostgreSQL
   */
  private async createCacheTable(): Promise<void> {
    if (!this.postgres) return;

    try {
      const query = `
        CREATE TABLE IF NOT EXISTS extraction_cache (
          id SERIAL PRIMARY KEY,
          cache_key VARCHAR(255) UNIQUE NOT NULL,
          url TEXT NOT NULL,
          result JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          accessed_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL,
          hits INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_cache_key ON extraction_cache(cache_key);
        CREATE INDEX IF NOT EXISTS idx_expires_at ON extraction_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_url ON extraction_cache(url);
      `;

      await this.postgres.query(query);
      logger.info('Cache table created/verified');

    } catch (error) {
      logger.error('Cache table creation failed:', error);
      throw error;
    }
  }

  /**
   * Generate cache key from URL
   */
  private generateCacheKey(url: string): string {
    // Use crypto hash for consistent key generation
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(url).digest('hex');
  }
}

export default CacheService;
