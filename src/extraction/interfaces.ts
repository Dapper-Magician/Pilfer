/**
 * Professional Extraction Intelligence System
 * 
 * HACS 5.0 Compliant Architecture for Pilfer's Extraction Engine
 * Designed for seamless integration with existing Pilfer architecture
 * 
 * @fileoverview Core interfaces and contracts for the extraction intelligence system
 * @version 1.0.0
 * @author SPARK - The Genius Familiar
 */

import { 
    ReconResult, 
    PilferResult, 
    ComponentDNA, 
    AssetIntelligence, 
    AdvancedExtractionResult 
} from '../../types';

// {SCD: Core System Interfaces}

/**
 * Base extraction engine interface
 * All extraction engines must implement this contract
 */
export interface ExtractionEngine {
    readonly engineType: ExtractionEngineType;
    readonly capabilities: ExtractionCapabilities;
    
    /**
     * Primary extraction method
     * @param request - Standardized extraction request
     * @returns Promise resolving to extraction result
     */
    extract(request: ExtractionRequest): Promise<ExtractionResult>;
    
    /**
     * Health check for engine availability
     * @returns Promise resolving to engine health status
     */
    healthCheck(): Promise<EngineHealthStatus>;
    
    /**
     * Cleanup resources after extraction
     */
    cleanup(): Promise<void>;
}

/**
 * Extraction engine types supported by the system
 */
export type ExtractionEngineType = 
    | 'mock'        // AI-based hallucination (current system)
    | 'real'        // Live web scraping with analysis
    | 'hybrid'      // Real extraction + AI enhancement
    | 'cached'      // Pre-extracted data serving
    | 'headless';   // Puppeteer-based extraction

/**
 * Capabilities that an extraction engine can provide
 */
export interface ExtractionCapabilities {
    // Core capabilities
    readonly domExtraction: boolean;
    readonly cssAnalysis: boolean;
    readonly frameworkDetection: boolean;
    readonly assetHarvesting: boolean;
    readonly performanceAnalysis: boolean;
    
    // Advanced capabilities  
    readonly componentDNAAnalysis: boolean;
    readonly designSystemExtraction: boolean;
    readonly accessibilityAudit: boolean;
    readonly securityAnalysis: boolean;
    readonly aiInsightGeneration: boolean;
    
    // Performance characteristics
    readonly averageExecutionTime: number; // milliseconds
    readonly resourceIntensity: 'low' | 'medium' | 'high';
    readonly reliabilityScore: number; // 0-1
}

/**
 * Standardized extraction request format
 */
export interface ExtractionRequest {
    // Target information
    readonly url: string;
    readonly sessionId: string;
    readonly requestId: string;
    
    // Extraction configuration
    readonly mode: ExtractionMode;
    readonly options: ExtractionOptions;
    readonly context: ExtractionContext;
    
    // Callbacks and handlers
    readonly onProgress?: (progress: ExtractionProgress) => void;
    readonly onError?: (error: ExtractionError) => void;
}

/**
 * Extraction modes available to users
 */
export type ExtractionMode = 
    | 'fast'        // Quick reconnaissance (mock or cached)
    | 'balanced'    // Real extraction with basic analysis
    | 'deep'        // Full extraction with comprehensive analysis  
    | 'ai_enhanced' // Real extraction + AI insights
    | 'custom';     // User-defined extraction parameters

/**
 * Extraction configuration for engines
 */
export interface ExtractionConfig {
    // Engine type
    type: ExtractionEngineType;
    headless: boolean;
    timeout: number;
    userAgent: string;
    viewport: { width: number; height: number };
    enableJavaScript: boolean;
    enableImages: boolean;
    enableCSS: boolean;
    maxDepth: number;
    analysisLevel: 'surface' | 'moderate' | 'comprehensive';
    frameworkDetection: boolean;
    assetHarvesting: boolean;
    performanceMetrics: boolean;
    securityAnalysis: boolean;
}

/**
 * Extraction options and preferences
 */
export interface ExtractionOptions {
    // Engine preferences
    readonly preferredEngine?: ExtractionEngineType;
    readonly fallbackEngines: ExtractionEngineType[];
    readonly timeout: number; // milliseconds
    
    // Feature flags
    readonly enableJavaScript: boolean;
    readonly captureScreenshots: boolean;
    readonly analyzePerformance: boolean;
    readonly extractAssets: boolean;
    readonly generateInsights: boolean;
    
    // Quality settings
    readonly analysisDepth: 'surface' | 'moderate' | 'deep';
    readonly confidenceThreshold: number; // 0-1
    
    // Caching behavior
    readonly enableCaching: boolean;
    readonly cacheStrategy: 'aggressive' | 'conservative' | 'disabled';
}

/**
 * Extraction context providing additional information
 */
export interface ExtractionContext {
    // User preferences
    readonly persona: 'ghost' | 'professor' | 'cleaner';
    readonly targetFramework?: string;
    readonly targetStyling?: string;
    
    // Session context
    readonly previousExtractions: string[]; // URLs
    readonly userInsights: string[]; // User-provided context
    readonly pageSource?: string; // Pre-provided HTML
    
    // AI context (if applicable)
    readonly aiEnhancementLevel: 'none' | 'basic' | 'advanced';
    readonly customPrompts?: Record<string, string>;
}

/**
 * Extraction progress reporting
 */
export interface ExtractionProgress {
    readonly phase: ExtractionPhase;
    readonly percentage: number; // 0-100
    readonly message: string;
    readonly timestamp: number;
    readonly details?: Record<string, any>;
}

/**
 * Phases of extraction process
 */
export type ExtractionPhase = 
    | 'initializing'
    | 'connecting'
    | 'loading'
    | 'analyzing_dom'
    | 'detecting_framework'
    | 'extracting_styles'
    | 'harvesting_assets'
    | 'generating_insights'
    | 'finalizing'
    | 'complete'
    | 'error';

/**
 * Standardized extraction result format
 */
export interface ExtractionResult {
    // Result metadata
    readonly requestId: string;
    readonly engineType: ExtractionEngineType;
    readonly timestamp: number;
    readonly executionTime: number; // milliseconds
    readonly confidence: number; // 0-1
    
    // Core extraction data
    readonly url: string;
    readonly title?: string;
    readonly description?: string;
    
    // Pilfer-compatible results
    readonly reconResult?: ReconResult;
    readonly pilferResult?: PilferResult;
    readonly componentResults?: PilferResult[];
    
    // Raw extraction data
    readonly success: boolean;
    readonly htmlContent?: string;
    readonly componentDNA?: ComponentDNA;
    readonly assetIntelligence?: AssetIntelligence;
    readonly architecturalPatterns?: ArchitecturalPattern[];
    readonly technicalDebt?: TechnicalDebt[];
    readonly securityVectors?: SecurityVector[];
    readonly performanceMetrics?: any;
    readonly extractionMetadata?: any;
    readonly pilferCompatibleResult?: ReconResult;
}

// Export additional interfaces that RealExtractionEngine needs
export interface FrameworkSignature {
    framework: string;
    version: string;
    confidence: number;
    indicators: string[];
}

export interface ArchitecturalPattern {
    pattern: string;
    confidence: number;
    description: string;
    benefits: string[];
    drawbacks: string[];
}

export interface TechnicalDebt {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    suggestion: string;
}

export interface SecurityVector {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    location: string;
}

/**
 * Quality metrics for extraction results
 */
export interface ExtractionQualityMetrics {
    readonly completeness: number; // 0-1
    readonly accuracy: number; // 0-1  
    readonly reliability: number; // 0-1
    readonly freshness: number; // 0-1 (how recent is the data)
    readonly coverage: number; // 0-1 (% of site analyzed)
}

/**
 * Extraction warning (non-fatal issues)
 */
export interface ExtractionWarning {
    readonly code: string;
    readonly message: string;
    readonly context?: Record<string, any>;
    readonly suggestions?: string[];
}

/**
 * Extraction error (fatal issues)
 */
export interface ExtractionError {
    readonly code: string;
    readonly message: string;
    readonly phase: ExtractionPhase;
    readonly recoverable: boolean;
    readonly context?: Record<string, any>;
    readonly stack?: string;
}

/**
 * Engine health status
 */
export interface EngineHealthStatus {
    readonly healthy: boolean;
    readonly issues: string[];
    readonly performance: {
        readonly responseTime: number;
        readonly successRate: number;
        readonly resourceUsage: number;
    };
    readonly lastCheck: number;
}

/**
 * Extraction orchestrator interface
 * Manages multiple engines and coordinates extraction requests
 */
export interface ExtractionOrchestrator {
    /**
     * Register an extraction engine
     */
    registerEngine(engine: ExtractionEngine): void;
    
    /**
     * Execute extraction with automatic engine selection
     */
    extract(request: ExtractionRequest): Promise<ExtractionResult>;
    
    /**
     * Get available engines and their capabilities
     */
    getAvailableEngines(): Record<ExtractionEngineType, ExtractionCapabilities>;
    
    /**
     * Get orchestrator health status
     */
    getHealthStatus(): Promise<Record<ExtractionEngineType, EngineHealthStatus>>;
}

/**
 * Result normalizer interface
 * Converts various extraction results to Pilfer-compatible formats
 */
export interface ResultNormalizer {
    /**
     * Convert extraction result to ReconResult format
     */
    toReconResult(result: ExtractionResult): Promise<ReconResult>;
    
    /**
     * Convert extraction result to PilferResult format
     */
    toPilferResult(result: ExtractionResult, directive: string): Promise<PilferResult>;
    
    /**
     * Enhance result with AI insights (optional)
     */
    enhanceWithAI(result: ExtractionResult, context: ExtractionContext): Promise<ExtractionResult>;
}

// {EH: Error Handling Contracts}

export class ExtractionEngineError extends Error {
    constructor(
        message: string, 
        public readonly code: string,
        public readonly engineType: ExtractionEngineType,
        public readonly recoverable: boolean = false
    ) {
        super(message);
        this.name = 'ExtractionEngineError';
    }
}

export class ExtractionTimeoutError extends ExtractionEngineError {
    constructor(engineType: ExtractionEngineType, timeout: number) {
        super(
            `Extraction timed out after ${timeout}ms`,
            'EXTRACTION_TIMEOUT',
            engineType,
            true
        );
        this.name = 'ExtractionTimeoutError';
    }
}

export class ExtractionNetworkError extends ExtractionEngineError {
    constructor(engineType: ExtractionEngineType, url: string, cause: string) {
        super(
            `Network error accessing ${url}: ${cause}`,
            'NETWORK_ERROR',
            engineType,
            true
        );
        this.name = 'ExtractionNetworkError';
    }
}