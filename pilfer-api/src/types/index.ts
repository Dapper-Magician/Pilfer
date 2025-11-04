/**
 * Pilfer Backend API - Type Definitions
 *
 * Comprehensive type system for the extraction engine
 * Aligned with BACKEND_API_ARCHITECTURE.md specifications
 *
 * @version 1.0.0
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export enum EngineType {
  PLAYWRIGHT = 'playwright',
  BROWSER = 'browser',
  CACHED = 'cached',
  MOCK = 'mock'
}

export enum SiteType {
  STATIC_HTML = 'static_html',
  SPA_REACT = 'spa_react',
  SPA_VUE = 'spa_vue',
  SPA_ANGULAR = 'spa_angular',
  SSR_NEXT = 'ssr_next',
  SSR_NUXT = 'ssr_nuxt',
  SSG_GATSBY = 'ssg_gatsby',
  WORDPRESS = 'wordpress',
  SHOPIFY = 'shopify',
  CUSTOM_CMS = 'custom_cms',
  API_FIRST = 'api_first'
}

export enum ExtractionStrategy {
  BROWSER_CLIENT_SIDE = 'browser_client_side',
  PLAYWRIGHT_SIMPLE = 'playwright_simple',
  PLAYWRIGHT_FULL = 'playwright_full',
  PLAYWRIGHT_AUTH = 'playwright_auth',
  PLAYWRIGHT_ADVANCED = 'playwright_advanced',
  API_DIRECT = 'api_direct',
  HYBRID = 'hybrid'
}

export enum ExtractionPhase {
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  LOADING = 'loading',
  ANALYZING_DOM = 'analyzing_dom',
  DETECTING_FRAMEWORK = 'detecting_framework',
  EXTRACTING_STYLES = 'extracting_styles',
  HARVESTING_ASSETS = 'harvesting_assets',
  GENERATING_INSIGHTS = 'generating_insights',
  FINALIZING = 'finalizing',
  COMPLETE = 'complete',
  ERROR = 'error'
}

// ============================================================================
// EXTRACTION REQUEST/RESPONSE
// ============================================================================

export interface ExtractionOptions {
  preferredEngine?: EngineType;
  fallbackEngines?: EngineType[];
  timeout?: number;
  enableJavaScript?: boolean;
  captureScreenshots?: boolean;
  analyzePerformance?: boolean;
  extractAssets?: boolean;
  generateInsights?: boolean;
  analysisDepth?: 'shallow' | 'moderate' | 'deep';
  confidenceThreshold?: number;
  enableCaching?: boolean;
  cacheStrategy?: 'aggressive' | 'conservative';
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  scrollToLoad?: boolean;
  userAgent?: string;
}

export interface ExtractionContext {
  persona?: string;
  targetFramework?: string;
  targetStyling?: string;
  previousExtractions?: string[];
  userInsights?: string[];
  aiEnhancementLevel?: 'basic' | 'advanced' | 'expert';
}

export interface ExtractionRequest {
  url: string;
  sessionId: string;
  requestId: string;
  mode: 'fast' | 'balanced' | 'comprehensive';
  options: ExtractionOptions;
  context: ExtractionContext;
  onProgress?: (progress: ExtractionProgress) => void;
  onError?: (error: ExtractionError) => void;
}

export interface ExtractionProgress {
  phase: ExtractionPhase;
  percentage: number;
  message: string;
  timestamp: number;
}

export interface ExtractionResult {
  requestId: string;
  engineType: EngineType;
  timestamp: number;
  executionTime: number;
  confidence: number;
  url: string;

  // Core extraction data
  title?: string;
  description?: string;
  reconResult?: ReconResult;
  html?: string;
  htmlContent?: string;

  // Advanced analysis
  componentTree?: ComponentNode[];
  componentAnalysis?: ComponentAnalysisResult;
  framework?: FrameworkDetectionResult;
  assets?: AssetCatalog;
  performance?: PerformanceMetrics;

  // Network analysis
  networkTraffic?: NetworkRequest[];
  consoleMessages?: ConsoleMessage[];
  screenshots?: Screenshot[];

  // Metadata
  success: boolean;
  extractionMetadata?: {
    error?: string;
    errorType?: string;
    retryCount?: number;
    cacheHit?: boolean;
    fallbackUsed?: boolean;
  };
}

// ============================================================================
// RECON RESULT (Compatible with existing Pilfer UI)
// ============================================================================

export interface ColorInfo {
  hex: string;
  name: string;
}

export interface TypographyInfo {
  fontFamily: string;
  usage: string;
}

export interface CoreStyleInfo {
  name: string;
  code: string;
}

export interface ComponentNode {
  name: string;
  type: string;
  attributes?: Record<string, string>;
  children?: ComponentNode[];
  metadata?: {
    depth: number;
    complexity: number;
    hasState: boolean;
    hasEvents: boolean;
    isCustomElement: boolean;
    classes: string[];
    id?: string;
  };
}

export interface ReconResult {
  id: string;
  colorPalette: ColorInfo[];
  typography: TypographyInfo[];
  coreStyles: CoreStyleInfo[];
  pageArchitecture: ComponentNode[];
}

// ============================================================================
// COMPONENT ANALYSIS
// ============================================================================

export interface ComponentAnalysisResult {
  componentTree: ComponentNode[];
  libraries: ComponentLibrary[];
  patterns: ComponentPattern[];
  metadata: {
    totalComponents: number;
    maxDepth: number;
    analysisTime: number;
    framework: string;
  };
}

export interface ComponentLibrary {
  name: string;
  confidence: number;
  components: string[];
}

export interface ComponentPattern {
  type: 'repeated-component' | 'layout-pattern' | 'ui-pattern' | 'behavioral-pattern';
  name: string;
  occurrences: number;
  confidence: number;
  description: string;
}

// ============================================================================
// FRAMEWORK DETECTION
// ============================================================================

export interface FrameworkIdentity {
  name: string;
  version?: string;
  confidence: number;
}

export interface MetaFramework {
  name: string; // 'next', 'nuxt', 'gatsby', etc.
  version?: string;
  confidence: number;
}

export interface BuildTool {
  name: string; // 'webpack', 'vite', 'rollup', etc.
  version?: string;
  confidence: number;
}

export interface StateManagement {
  name: string; // 'redux', 'zustand', 'pinia', etc.
  version?: string;
  confidence: number;
}

export interface RoutingLibrary {
  name: string; // 'react-router', 'vue-router', etc.
  version?: string;
  confidence: number;
}

export interface DetectionLayerResult {
  layer: 'static' | 'global' | 'bundle' | 'runtime' | 'network' | 'sourcemap';
  signals: Record<string, any>;
  confidence: number;
}

export interface FrameworkDetectionResult {
  primary: FrameworkIdentity;
  meta?: MetaFramework;
  buildTool: BuildTool;
  stateManagement: StateManagement[];
  routing: RoutingLibrary | null;
  confidence: number;
  detectionLayers: DetectionLayerResult[];
}

// ============================================================================
// ASSET CATALOG
// ============================================================================

export interface ImageAsset {
  url: string;
  type: 'raster' | 'vector' | 'icon' | 'background';
  alt: string;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  size: string;
  format: string;
  loading?: 'lazy' | 'eager';
  optimization: {
    responsive: boolean;
    lazyLoaded: boolean;
    cdnHosted: boolean;
    format: string;
    recommendations: string[];
  };
}

export interface FontAsset {
  family: string;
  url: string;
  variants: {
    weight: string;
    style: 'normal' | 'italic';
    format: string;
    size: string;
  }[];
  source: 'system' | 'web' | 'custom';
  loading: 'block' | 'swap' | 'fallback' | 'optional';
  performance: {
    loadTime: number;
    renderImpact: 'low' | 'medium' | 'high';
    fallbackStrategy: string;
  };
}

export interface StylesheetAsset {
  url: string;
  type: 'external' | 'inline';
  size: string;
  external: boolean;
  media: string;
  critical: boolean;
  async: boolean;
  optimization: {
    minified: boolean;
    cached: boolean;
    cdnHosted: boolean;
    recommendations: string[];
  };
}

export interface ScriptAsset {
  url: string;
  type: 'external' | 'inline';
  size: string;
  async: boolean;
  defer: boolean;
  module: boolean;
  external: boolean;
  optimization: {
    minified: boolean;
    bundled: boolean;
    cdnHosted: boolean;
    recommendations: string[];
  };
}

export interface MediaAsset {
  url: string;
  type: 'video' | 'audio';
  format: string;
  size: string;
  duration: number;
  autoplay: boolean;
  optimization: {
    lazy: boolean;
    streaming: boolean;
    cdnHosted: boolean;
    recommendations: string[];
  };
}

export interface AssetCatalog {
  images: ImageAsset[];
  fonts: FontAsset[];
  stylesheets: StylesheetAsset[];
  scripts: ScriptAsset[];
  media: MediaAsset[];
  metadata: {
    totalAssets: number;
    harvestTime: number;
    baseUrl: string;
  };
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

export interface PerformanceMetrics {
  lighthouse?: LighthouseScore;
  webVitals?: WebVitals;
  networkAnalysis: {
    requests: number;
    totalSize: string;
    domains: string[];
    protocols: string[];
  };
  timing?: {
    domContentLoaded: number;
    loadComplete: number;
    timeToInteractive: number;
  };
}

// ============================================================================
// NETWORK MONITORING
// ============================================================================

export interface NetworkRequest {
  url: string;
  method: string;
  statusCode: number;
  resourceType: string;
  size: number;
  timing: {
    start: number;
    duration: number;
  };
  headers: Record<string, string>;
}

export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  text: string;
  timestamp: number;
  location?: {
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
}

export interface Screenshot {
  type: 'full' | 'viewport' | 'element';
  data: string; // Base64 encoded
  timestamp: number;
  dimensions: { width: number; height: number };
}

// ============================================================================
// ENGINE INTERFACES
// ============================================================================

export interface ExtractionEngine {
  readonly type: EngineType;
  readonly capabilities: ExtractionCapabilities;

  extract(request: ExtractionRequest): Promise<ExtractionResult>;
  healthCheck(): Promise<EngineHealthStatus>;
  cleanup(): Promise<void>;
}

export interface ExtractionCapabilities {
  domExtraction: boolean;
  cssAnalysis: boolean;
  frameworkDetection: boolean;
  assetHarvesting: boolean;
  performanceAnalysis: boolean;
  componentDNAAnalysis: boolean;
  designSystemExtraction: boolean;
  accessibilityAudit: boolean;
  securityAnalysis: boolean;
  aiInsightGeneration: boolean;
  averageExecutionTime: number;
  resourceIntensity: 'low' | 'medium' | 'high';
  reliabilityScore: number;
}

export interface EngineHealthStatus {
  healthy: boolean;
  issues: string[];
  performance: {
    responseTime: number;
    successRate: number;
    resourceUsage: number;
  };
  lastCheck: number;
}

// ============================================================================
// SITE CLASSIFICATION
// ============================================================================

export interface ClassificationSignals {
  urlSignals: {
    domain: string;
    path: string;
    fileExtension?: string;
    queryParams: Record<string, string>;
  };
  headerSignals: {
    server?: string;
    poweredBy?: string;
    contentType: string;
    cacheControl?: string;
  };
  htmlSignals: {
    metaTags: Record<string, string>;
    dataAttributes: string[];
    htmlComments: string[];
    scriptSources: string[];
    linkTags: string[];
  };
  jsSignals: {
    bundlePatterns: string[];
    globalObjects: string[];
    importPatterns: string[];
  };
}

export interface SiteClassificationResult {
  primaryType: SiteType;
  confidence: number;
  extractionStrategy: ExtractionStrategy;
  estimatedComplexity: ComplexityScore;
  requiredCapabilities: string[];
}

export interface ComplexityScore {
  score: number; // 0-100
  factors: string[];
  maintainability: 'low' | 'medium' | 'high';
  testability: 'low' | 'medium' | 'high';
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

// ============================================================================
// FRAMEWORK DETECTION
// ============================================================================

export interface FrameworkDetectionResult {
  primaryFramework: DetectedFramework;
  detectedFrameworks: DetectedFramework[];
  stateManagement: StateManagementPattern[];
  routing: RoutingPattern | null;
  buildTool: BuildToolPattern | null;
  metadata: {
    detectionLayers: number;
    executionTime: number;
    signalCount: number;
  };
}

export interface DetectedFramework {
  name: string;
  version: string;
  confidence: number;
  signals: {
    static: number;
    bundle: number;
    runtime: number;
    dom: number;
    behavioral: number;
  };
}

export interface StateManagementPattern {
  type: 'redux' | 'mobx' | 'vuex' | 'pinia' | 'context-api' | 'zustand' | 'recoil' | 'jotai' | 'other';
  confidence: number;
  signals: string[];
}

export interface RoutingPattern {
  type: 'react-router' | 'nextjs-router' | 'vue-router' | 'nuxt-router' | 'angular-router' | 'svelte-routing' | 'other';
  mode: 'hash' | 'history' | 'filesystem';
  confidence: number;
}

export interface BuildToolPattern {
  type: 'webpack' | 'vite' | 'parcel' | 'rollup' | 'esbuild' | 'turbopack' | 'other';
  confidence: number;
  signals: string[];
}

// ============================================================================
// CACHE
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStrategy {
  l1: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  l2: {
    enabled: boolean;
    ttl: number;
  };
  invalidation: 'ttl' | 'manual' | 'hybrid';
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ExtractionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

export class ExtractionTimeoutError extends ExtractionError {
  constructor(message: string, details?: any) {
    super(message, 'EXTRACTION_TIMEOUT', 408, details);
    this.name = 'ExtractionTimeoutError';
  }
}

export class ExtractionNetworkError extends ExtractionError {
  constructor(engineType: string, url: string, message: string) {
    super(
      `Network error during extraction with ${engineType}: ${message}`,
      'NETWORK_ERROR',
      503,
      { engineType, url }
    );
    this.name = 'ExtractionNetworkError';
  }
}

export class AllEnginesFailedError extends ExtractionError {
  constructor(public errors: Error[]) {
    super(
      `All extraction engines failed: ${errors.map(e => e.message).join(', ')}`,
      'ALL_ENGINES_FAILED',
      503,
      { errors }
    );
    this.name = 'AllEnginesFailedError';
  }
}

// ============================================================================
// API TYPES
// ============================================================================

export interface APIResponse<T> {
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

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  engines: Record<EngineType, EngineHealthStatus>;
  dependencies: {
    redis: ServiceHealthStatus;
    postgres: ServiceHealthStatus;
    gemini: ServiceHealthStatus;
  };
}

export interface ServiceHealthStatus {
  healthy: boolean;
  latency: number;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ServerConfig {
  port: number;
  host: string;
  env: 'development' | 'production' | 'test';
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export interface PlaywrightConfig {
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  viewport: {
    width: number;
    height: number;
  };
  timeout: number;
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle';
  javascriptEnabled: boolean;
  userAgent: string;
  locale: string;
  timezone: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
}

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  poolSize: number;
}
