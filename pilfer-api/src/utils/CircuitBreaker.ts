/**
 * Pilfer Backend API - Circuit Breaker
 *
 * Fault tolerance pattern for handling failing services
 * Prevents cascading failures by temporarily blocking requests to failing engines
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests blocked
 * - HALF_OPEN: Testing if service recovered
 *
 * @version 1.0.0
 */

import { logger } from './logger';
import type { CircuitBreakerConfig, CircuitBreakerState } from '../types';

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failures: 0,
    successCount: 0
  };

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.isOpen()) {
      // Check if we should try again (reset timeout elapsed)
      if (this.shouldAttemptReset()) {
        this.state.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();

      // Success - record it
      this.onSuccess();

      return result;

    } catch (error) {
      // Failure - record it
      this.onFailure();

      throw error;
    }
  }

  /**
   * Check if circuit breaker is open
   */
  isOpen(): boolean {
    return this.state.state === 'OPEN';
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.state.successCount++;

    if (this.state.state === 'HALF_OPEN') {
      // Enough successes in half-open state - close circuit
      if (this.state.successCount >= this.config.successThreshold) {
        this.state.state = 'CLOSED';
        this.state.failures = 0;
        this.state.successCount = 0;
        logger.info('Circuit breaker closed after recovery');
      }
    } else if (this.state.state === 'CLOSED') {
      // Reset failure count on success
      this.state.failures = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === 'HALF_OPEN') {
      // Failure in half-open state - reopen circuit
      this.state.state = 'OPEN';
      this.state.successCount = 0;
      this.state.nextAttemptTime = Date.now() + this.config.resetTimeout;
      logger.warn('Circuit breaker reopened after failed recovery attempt');

    } else if (this.state.state === 'CLOSED') {
      // Too many failures - open circuit
      if (this.state.failures >= this.config.failureThreshold) {
        this.state.state = 'OPEN';
        this.state.nextAttemptTime = Date.now() + this.config.resetTimeout;
        logger.error(`Circuit breaker opened after ${this.state.failures} failures`);
      }
    }
  }

  /**
   * Check if we should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.state.nextAttemptTime) return false;
    return Date.now() >= this.state.nextAttemptTime;
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = {
      state: 'CLOSED',
      failures: 0,
      successCount: 0
    };
    logger.info('Circuit breaker manually reset');
  }
}

export default CircuitBreaker;
