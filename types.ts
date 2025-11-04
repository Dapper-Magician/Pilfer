// Chat type matching the actual Gemini SDK (@google/genai) structure
// Based on SDK types at node_modules/@google/genai/dist/genai.d.ts
export interface Chat {
    // Non-streaming message sending - returns GenerateContentResponse with text getter
    sendMessage: (params: { message: string; config?: any }) => Promise<{ 
        text: string | undefined;  // The SDK returns string | undefined from the text getter
        [key: string]: any; // Allow other properties from GenerateContentResponse
    }>;
    // Streaming message sending - returns Promise of AsyncGenerator
    sendMessageStream: (params: { message: string; config?: any }) => Promise<AsyncGenerator<{ 
        text: string | undefined;  // Each chunk has a text getter
        [key: string]: any;
    }, any, any>>;
    // Get conversation history - returns Content[] array
    getHistory: (curated?: boolean) => any[];  // Returns Content[] - using any[] to avoid complex type imports
}

export interface ColorInfo { hex: string; name: string; }
export interface TypographyInfo { fontFamily: string; usage: string; }
export interface CoreStyleInfo { name: string; code: string; }
export interface ComponentNode { name: string; children?: ComponentNode[]; }

export interface ReconResult { id: string; colorPalette: ColorInfo[]; typography: TypographyInfo[]; coreStyles: CoreStyleInfo[]; pageArchitecture: ComponentNode[]; }
export interface PilferResult { id:string; name: string; techStack: string[]; architecturalNotes: string; code: string; rationale: string; tags: string[]; }
export interface RefactorResult { id: string; name: string; explanation: string; refactoredCode: string; tags: string[]; }
export interface ComparativeResult { id: string; summary: string; subject1: { title: string; notes: string; }, subject2: { title: string; notes: string; } }
export interface BlueprintResult { id: string; name: string; explanation: string; diagram: string; tags: string[]; }
export interface UnitTestResult { testFramework: string; tests: string; explanation: string; }

export type LiveResultType = 'Recon' | AuditType | 'Compare' | 'Blueprint';
export interface LiveResult { id: string; type: LiveResultType; title: string; content: string; }
export interface HistoryEntry { id: string; type: LiveResultType; title: string; timestamp: number; url?: string; }

// New Session Management Types
export interface SessionWorkspace {
    sessionId: string;
    createdAt: number;
    lastActivity: number;
    url: string;
    activeResults: HistoryEntry[];
}

// Advanced Extraction Intelligence Types
export interface ComponentDNA {
    framework: FrameworkSignature;
    architecture: ArchitecturalPattern;
    stateManagement: StateManagementPattern;
    styling: StylingApproach;
    dependencies: DependencyMap;
    componentTree: ComponentHierarchy;
    complexity: ComplexityMetrics;
}

export interface FrameworkSignature {
    primary: string; // 'react', 'vue', 'angular', 'svelte', 'vanilla'
    version?: string;
    confidence: number; // 0-1
    indicators: string[]; // Evidence found
    buildTool?: string; // webpack, vite, rollup, etc.
    bundleAnalysis?: BundleAnalysis;
}

export interface ArchitecturalPattern {
    pattern: string; // 'component-based', 'mvc', 'flux', 'jamstack'
    structure: 'monolithic' | 'modular' | 'micro-frontend';
    routingStrategy?: string;
    dataFlow: 'unidirectional' | 'bidirectional' | 'mixed';
}

export interface StateManagementPattern {
    approach: string; // 'redux', 'context', 'zustand', 'jotai', 'none'
    globalState: boolean;
    localState: boolean;
    stateComplexity: 'simple' | 'moderate' | 'complex';
}

export interface StylingApproach {
    methodology: string; // 'css-modules', 'styled-components', 'tailwind', 'sass'
    responsive: boolean;
    designSystem?: DesignSystemAnalysis;
    cssComplexity: ComplexityMetrics;
}

export interface DependencyMap {
    production: PackageInfo[];
    development: PackageInfo[];
    cdn: CDNResource[];
    internal: InternalDependency[];
}

export interface PackageInfo {
    name: string;
    version?: string;
    purpose: string;
    size?: string;
    critical: boolean;
}

export interface CDNResource {
    url: string;
    type: 'script' | 'stylesheet' | 'font' | 'image';
    provider: string;
    integrity?: string;
}

export interface InternalDependency {
    path: string;
    type: 'component' | 'utility' | 'hook' | 'service';
    usage: string[];
}

export interface ComponentHierarchy {
    root: ComponentNode;
    depth: number;
    patterns: string[];
    reusability: number; // 0-1
}

export interface ComplexityMetrics {
    score: number; // 0-100
    factors: string[];
    maintainability: 'low' | 'medium' | 'high';
    testability: 'low' | 'medium' | 'high';
}

export interface DesignSystemAnalysis {
    tokens: DesignToken[];
    components: string[];
    consistency: number; // 0-1
    maturity: 'basic' | 'developing' | 'mature';
}

export interface DesignToken {
    category: string;
    name: string;
    value: string;
    usage: string[];
}

export interface BundleAnalysis {
    totalSize: string;
    chunks: ChunkInfo[];
    optimization: OptimizationAnalysis;
}

export interface ChunkInfo {
    name: string;
    size: string;
    type: 'vendor' | 'main' | 'async' | 'css';
}

export interface OptimizationAnalysis {
    minified: boolean;
    gzipped: boolean;
    treeshaking: boolean;
    codesplitting: boolean;
    score: number; // 0-100
}

// Advanced Asset Intelligence Types
export interface AssetIntelligence {
    catalog: AssetCatalog;
    optimization: AssetOptimization;
    relationships: AssetRelationshipMap;
    performance: AssetPerformanceAnalysis;
}

export interface AssetCatalog {
    images: ImageAsset[];
    fonts: FontAsset[];
    icons: IconAsset[];
    media: MediaAsset[];
    documents: DocumentAsset[];
}

export interface ImageAsset {
    url: string;
    format: string;
    dimensions?: { width: number; height: number };
    size: string;
    usage: string[];
    optimization: ImageOptimization;
}

export interface ImageOptimization {
    compressed: boolean;
    format: 'original' | 'webp' | 'avif' | 'optimized';
    responsive: boolean;
    lazyLoaded: boolean;
    score: number;
}

export interface FontAsset {
    family: string;
    variants: FontVariant[];
    source: 'system' | 'web' | 'custom';
    loading: 'block' | 'swap' | 'fallback' | 'optional';
    performance: FontPerformance;
}

export interface FontVariant {
    weight: string;
    style: 'normal' | 'italic';
    format: string;
    size: string;
}

export interface FontPerformance {
    loadTime: number;
    renderImpact: 'low' | 'medium' | 'high';
    fallbackStrategy: string;
}

export interface IconAsset {
    name: string;
    type: 'svg' | 'font-icon' | 'image';
    system?: string; // 'heroicons', 'feather', 'material', etc.
    usage: string[];
}

export interface MediaAsset {
    type: 'video' | 'audio';
    format: string;
    duration?: number;
    size: string;
    streaming: boolean;
}

export interface DocumentAsset {
    type: 'pdf' | 'doc' | 'json' | 'xml';
    size: string;
    purpose: string;
}

export interface AssetRelationshipMap {
    dependencies: AssetDependency[];
    bundles: AssetBundle[];
    critical: string[];
    lazy: string[];
}

export interface AssetDependency {
    parent: string;
    children: string[];
    type: 'required' | 'optional' | 'conditional';
}

export interface AssetBundle {
    name: string;
    assets: string[];
    size: string;
    loadPriority: 'high' | 'medium' | 'low';
}

export interface AssetPerformanceAnalysis {
    totalSize: string;
    loadTime: number;
    renderBlocking: string[];
    optimization: AssetOptimization;
}

export interface AssetOptimization {
    compression: boolean;
    caching: boolean;
    cdn: boolean;
    score: number; // 0-100
    recommendations: string[];
}

// Enhanced Extraction Result Types
export interface AdvancedExtractionResult {
    id: string;
    url: string;
    timestamp: number;
    componentDNA: ComponentDNA;
    assetIntelligence: AssetIntelligence;
    performance: PerformanceMetrics;
    insights: ExtractionInsights;
    confidence: number;
}

export interface PerformanceMetrics {
    lighthouse?: LighthouseScore;
    webVitals?: WebVitals;
    networkAnalysis: NetworkAnalysis;
}

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

export interface NetworkAnalysis {
    requests: number;
    totalSize: string;
    domains: string[];
    protocols: string[];
}

export interface ExtractionInsights {
    technicalInsights: string[];
    designInsights: string[];
    performanceInsights: string[];
    securityInsights: string[];
    recommendedImprovements: string[];
}

export interface HistoricalSession extends SessionWorkspace {
    reconResult: ReconResult | null;
    deepDiveResults: { [id: string]: PilferResult };
    comparativeResults: { [id: string]: ComparativeResult };
    refactorResults: { [id: string]: RefactorResult };
    blueprintResults: { [id: string]: BlueprintResult };
}

export type AppStatus = 'IDLE' | 'CASING' | 'HEISTING' | 'PLANNING_HEIST' | 'AWAITING_CONFIRMATION';
export type AnalysisMode = 'single' | 'compare';
export type AuditType = 'heist' | 'accessibility' | 'performance' | 'security' | 'refactor' | 'blueprint';
export type FrameworkTarget = 'react' | 'vue' | 'svelte' | 'web_component' | 'plain_js';
export type StylingTarget = 'plain_css' | 'tailwind' | 'styled_components' | 'css_modules';
export type StateTarget = 'hooks' | 'redux' | 'vuex' | 'svelte_stores' | 'none';
export type Persona = 'ghost' | 'professor' | 'cleaner';
export type Theme = 'default' | 'matrix-green' | 'arcade-neon';
export type Layout = 'default' | 'compact';

export interface AppState {
    appState: AppStatus;
    url: string;
    reconResult: ReconResult | null;
    deepDiveResults: { [id: string]: PilferResult };
    comparativeResults: { [id: string]: ComparativeResult };
    refactorResults: { [id: string]: RefactorResult };
    blueprintResults: { [id: string]: BlueprintResult };
    sessionHistory: HistoryEntry[];
    // Session Management
    currentSession: SessionWorkspace;
    historicalSessions: HistoricalSession[];
    showOnlyCurrentSession: boolean;
    // Backend Extraction Data
    backendExtractionData: BackendExtractionData | null;
    theme: Theme;
    fontSize: number;
    layout: Layout;
    directive: string;
    pageSource: string;
    code: string;
    apiDocs: string;
    compareCode1: string;
    compareCode2: string;
    compareDirective: string;
    analysisMode: AnalysisMode;
    auditType: AuditType;
    frameworkTarget: FrameworkTarget;
    stylingTarget: StylingTarget;
    stateTarget: StateTarget;
    persona: Persona;
    error: string | null;
    chat: Chat | null;
    chatHistory: any[];
    isHistoryOpen: boolean;
    isCommandPaletteOpen: boolean;
    isSettingsOpen: boolean;
    safehouseState: {
        isOpen: boolean;
        component: PilferResult | null;
    };
    liveResult: LiveResult | null;
    heistPlan: {
        plan: string;
        isAwaitingConfirmation: boolean;
    } | null;
}

// Backend Extraction Data Types
export interface BackendExtractionData {
    framework?: {
        primaryFramework: {
            name: string;
            version: string;
            confidence: number;
        };
        detectedFrameworks: any[];
        stateManagement: any[];
        routing: any;
        buildTool: any;
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
    cacheStatus?: 'HIT' | 'MISS' | 'STALE';
    executionTime?: number;
}

export type AppAction =
    | { type: 'SET_FIELD'; payload: { field: keyof AppState; value: any } }
    | { type: 'SET_APP_STATE'; payload: AppStatus }
    | { type: 'SET_CHAT'; payload: Chat }
    | { type: 'LOAD_SESSION'; payload: Partial<AppState> }
    | { type: 'STREAM_START'; payload: { id: string, type: LiveResultType, title: string } }
    | { type: 'STREAM_UPDATE'; payload: string }
    | { type: 'STREAM_END' }
    | { type: 'SET_RECON_RESULT'; payload: ReconResult }
    | { type: 'SET_BACKEND_EXTRACTION_DATA'; payload: BackendExtractionData }
    | { type: 'ADD_RESULT'; payload: { id: string, type: LiveResultType, result: any } }
    | { type: 'ADD_HISTORY_ENTRY'; payload: HistoryEntry }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'TOGGLE_PANEL'; payload: { panel: 'history' | 'command' | 'settings', isOpen: boolean } }
    | { type: 'OPEN_SAFEHOUSE', payload: PilferResult }
    | { type: 'CLOSE_SAFEHOUSE' }
    | { type: 'RESET_SESSION' }
    | { type: 'SET_HEIST_PLAN'; payload: { plan: string; isAwaitingConfirmation: boolean; } }
    | { type: 'CLEAR_HEIST_PLAN' }
    // Session Management Actions
    | { type: 'START_NEW_SESSION'; payload?: { url?: string } }
    | { type: 'CLEAR_CURRENT_SESSION' }
    | { type: 'ARCHIVE_CURRENT_SESSION' }
    | { type: 'RESTORE_HISTORICAL_SESSION'; payload: string } // sessionId
    | { type: 'TOGGLE_SESSION_VIEW' }
    | { type: 'DELETE_HISTORICAL_SESSION'; payload: string }; // sessionId
