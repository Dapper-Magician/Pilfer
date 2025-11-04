/**
 * Pilfer Backend API - Extraction Orchestrator
 *
 * Elite-tier orchestration with Strategy Pattern + Circuit Breaker
 * Implements sophisticated extraction coordination from BACKEND_API_ARCHITECTURE.md
 *
 * Design Patterns:
 * - Strategy Pattern: Dynamic engine selection
 * - Circuit Breaker: Fault tolerance for failing engines
 * - Chain of Responsibility: Fallback chains
 * - Template Method: Consistent extraction workflow
 *
 * @version 1.0.0
 */

import { logger } from '../../utils/logger';
import { SiteClassifier } from '../classifier/SiteClassifier';
import { PlaywrightExtractionEngine } from '../extractors/PlaywrightEngine';
import { CircuitBreaker } from '../../utils/CircuitBreaker';
import type {
  ExtractionRequest,
  ExtractionResult,
  ExtractionEngine,
  EngineType,
  ExtractionStrategy,
  AllEnginesFailedError
} from '../../types';

/**
 * Extraction Orchestrator
 *
 * Central coordinator for extraction operations
 */
export class ExtractionOrchestrator {
  private engines: Map<EngineType, ExtractionEngine>;
  private circuitBreakers: Map<EngineType, CircuitBreaker>;
  private classifier: SiteClassifier;

  constructor() {
    // Initialize engines
    this.engines = new Map();
    this.engines.set('playwright' as EngineType, new PlaywrightExtractionEngine());

    // Initialize circuit breakers for each engine
    this.circuitBreakers = new Map();
    this.engines.forEach((engine, type) => {
      this.circuitBreakers.set(type, new CircuitBreaker({
        failureThreshold: 5,      // Open after 5 failures
        successThreshold: 2,      // Close after 2 successes
        timeout: 60000,           // 60 second timeout
        resetTimeout: 300000      // Try again after 5 minutes
      }));
    });

    this.classifier = new SiteClassifier();

    logger.info('Extraction Orchestrator initialized');
  }

  /**
   * Main extraction method with orchestration
   */
  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      logger.info(`Orchestrating extraction for ${request.url}`);

      // Step 1: Classify site
      const classification = await this.classifier.classify(request.url);
      logger.info(`Site classified: ${classification.primaryType} (${classification.confidence * 100}% confidence)`);

      // Step 2: Select extraction strategy
      const strategy = classification.extractionStrategy;

      // Step 3: Build fallback chain
      const fallbackChain = this.buildFallbackChain(strategy);
      logger.debug(`Fallback chain: ${fallbackChain.map(e => e.type).join(' → ')}`);

      // Step 4: Execute with fallback
      const result = await this.executeWithFallback(request, fallbackChain);

      const executionTime = Date.now() - startTime;
      logger.info(`Extraction completed in ${executionTime}ms`);

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Extraction orchestration failed:', error);

      // Return structured error
      return {
        requestId: request.requestId,
        engineType: 'playwright' as EngineType,
        timestamp: Date.now(),
        executionTime,
        confidence: 0,
        url: request.url,
        success: false,
        extractionMetadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
        }
      };
    }
  }

  /**
   * Build fallback chain based on strategy
   */
  private buildFallbackChain(strategy: ExtractionStrategy): ExtractionEngine[] {
    const chain: ExtractionEngine[] = [];

    // Primary engine based on strategy
    switch (strategy) {
      case ExtractionStrategy.PLAYWRIGHT_SIMPLE:
      case ExtractionStrategy.PLAYWRIGHT_FULL:
      case ExtractionStrategy.PLAYWRIGHT_ADVANCED:
      case ExtractionStrategy.PLAYWRIGHT_AUTH:
        const playwrightEngine = this.engines.get('playwright' as EngineType);
        if (playwrightEngine) chain.push(playwrightEngine);
        break;

      case ExtractionStrategy.BROWSER_CLIENT_SIDE:
        // TODO: Add browser engine when implemented
        const browserEngine = this.engines.get('browser' as EngineType);
        if (browserEngine) chain.push(browserEngine);
        break;

      case ExtractionStrategy.HYBRID:
        // Try both engines
        const browserEng = this.engines.get('browser' as EngineType);
        const playwrightEng = this.engines.get('playwright' as EngineType);
        if (browserEng) chain.push(browserEng);
        if (playwrightEng) chain.push(playwrightEng);
        break;
    }

    // Always add Playwright as ultimate fallback if not already in chain
    const playwrightEngine = this.engines.get('playwright' as EngineType);
    if (playwrightEngine && !chain.includes(playwrightEngine)) {
      chain.push(playwrightEngine);
    }

    return chain;
  }

  /**
   * Execute extraction with fallback chain
   */
  private async executeWithFallback(
    request: ExtractionRequest,
    fallbackChain: ExtractionEngine[]
  ): Promise<ExtractionResult> {
    const errors: Error[] = [];

    for (const engine of fallbackChain) {
      const circuitBreaker = this.circuitBreakers.get(engine.type);

      // Skip if circuit breaker is open
      if (circuitBreaker && circuitBreaker.isOpen()) {
        logger.warn(`Circuit breaker open for ${engine.type}, skipping`);
        continue;
      }

      try {
        logger.info(`Attempting extraction with ${engine.type} engine`);

        // Execute with circuit breaker protection
        const result = circuitBreaker
          ? await circuitBreaker.execute(() => engine.extract(request))
          : await engine.extract(request);

        // Check if result is valid
        if (this.isResultValid(result)) {
          logger.info(`Extraction successful with ${engine.type} engine`);
          return result;
        } else {
          logger.warn(`${engine.type} engine returned invalid result`);
        }

      } catch (error) {
        logger.error(`${engine.type} engine failed:`, error);
        errors.push(error as Error);
        // Continue to next engine in fallback chain
      }
    }

    // All engines failed
    throw new AllEnginesFailedError(errors);
  }

  /**
   * Validate extraction result
   */
  private isResultValid(result: ExtractionResult): boolean {
    if (!result.success) return false;
    if (!result.reconResult) return false;

    // Basic validation
    const hasMinimalData =
      result.reconResult.colorPalette.length > 0 ||
      result.reconResult.typography.length > 0 ||
      result.reconResult.pageArchitecture.length > 0;

    return hasMinimalData;
  }

  /**
   * Get engine health status
   */
  async getEngineHealth(): Promise<Record<EngineType, any>> {
    const health: Record<string, any> = {};

    for (const [type, engine] of this.engines.entries()) {
      const circuitBreaker = this.circuitBreakers.get(type);

      health[type] = {
        ...(await engine.healthCheck()),
        circuitBreakerState: circuitBreaker ? circuitBreaker.getState() : null
      };
    }

    return health;
  }

  /**
   * Cleanup all engines
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up extraction engines...');

    const cleanupPromises = Array.from(this.engines.values()).map(engine =>
      engine.cleanup().catch(err =>
        logger.error(`Failed to cleanup ${engine.type} engine:`, err)
      )
    );

    await Promise.all(cleanupPromises);

    logger.info('All extraction engines cleaned up');
  }
}

export default ExtractionOrchestrator;
