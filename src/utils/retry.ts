/**
 * Configuration for retry logic
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
};

/**
 * Retries a promise-returning function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let retries = finalConfig.maxRetries;
    let delay = finalConfig.initialDelay;

    while (true) {
        try {
            return await fn();
        } catch (error: any) {
            if (retries === 0) {
                throw error;
            }

            // Check if error is retryable
            const isRetryable = 
                error.message?.includes('429') || // Rate limit
                error.message?.includes('500') || // Server error
                error.message?.includes('502') || // Bad gateway
                error.message?.includes('503') || // Service unavailable
                error.message?.includes('timeout') ||
                error.message?.includes('network') ||
                error.message?.includes('fetch failed');

            if (!isRetryable) {
                throw error;
            }

            console.log(`[Retry] Operation failed. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));

            retries--;
            delay = Math.min(delay * finalConfig.backoffFactor, finalConfig.maxDelay);
        }
    }
}
