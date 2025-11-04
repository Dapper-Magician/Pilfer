/**
 * Pilfer Backend API Client
 *
 * Handles communication with the Pilfer Backend API
 * Provides type-safe methods for extraction, caching, and health checks
 *
 * @version 1.0.0
 */

export interface BackendExtractionRequest {
  url: string;
  options?: {
    preferredEngine?: 'playwright' | 'browser' | 'cached' | 'mock';
    timeout?: number;
    enableJavaScript?: boolean;
    captureScreenshots?: boolean;
    analyzePerformance?: boolean;
    extractAssets?: boolean;
    analysisDepth?: 'shallow' | 'moderate' | 'deep';
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    scrollToLoad?: boolean;
  };
  context?: {
    persona?: string;
    targetFramework?: string;
    targetStyling?: string;
  };
}

export interface BackendExtractionResult {
  requestId: string;
  engineType: string;
  timestamp: number;
  executionTime: number;
  confidence: number;
  url: string;
  title?: string;
  reconResult?: any;
  html?: string;
  framework?: {
    primaryFramework: {
      name: string;
      version: string;
      confidence: number;
      signals: any;
    };
    detectedFrameworks: any[];
    stateManagement: any[];
    routing: any;
    buildTool: any;
  };
  componentAnalysis?: {
    componentTree: any[];
    libraries: Array<{
      name: string;
      confidence: number;
      components: string[];
    }>;
    patterns: Array<{
      type: string;
      name: string;
      occurrences: number;
      confidence: number;
      description: string;
    }>;
    metadata: {
      totalComponents: number;
      maxDepth: number;
      analysisTime: number;
      framework: string;
    };
  };
  assets?: {
    images: any[];
    fonts: any[];
    stylesheets: any[];
    scripts: any[];
    media: any[];
    metadata: {
      totalAssets: number;
      harvestTime: number;
      baseUrl: string;
    };
  };
  networkTraffic?: any[];
  consoleMessages?: any[];
  success: boolean;
}

export interface BackendAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    timestamp: number;
    executionTime: number;
    cacheStatus: 'HIT' | 'MISS' | 'STALE';
  };
}

export interface BackendHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  engines: Record<string, any>;
  dependencies: any;
  cache?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export class PilferAPIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:3001/api/v1', timeout: number = 60000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Extract data from a URL using the backend API
   */
  async extract(request: BackendExtractionRequest): Promise<BackendAPIResponse<BackendExtractionResult>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': this.generateRequestId()
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Backend API extraction failed:', error);

      // Return error response
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown network error',
          details: error
        },
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: Date.now(),
          executionTime: 0,
          cacheStatus: 'MISS'
        }
      };
    }
  }

  /**
   * Check backend health
   */
  async health(): Promise<BackendAPIResponse<BackendHealthResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Backend health check failed:', error);

      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Health check failed',
          details: error
        },
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: Date.now(),
          executionTime: 0,
          cacheStatus: 'MISS'
        }
      };
    }
  }

  /**
   * Check if backend is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.health();
      return result.success && result.data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `pilfer-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

// Export singleton instance
export const apiClient = new PilferAPIClient();
