
// ============================================================================
// BACKEND EXTRACTION COMPONENTS
// ============================================================================

/**
 * Framework Badge - Shows detected framework with confidence
 */
export function FrameworkBadge({ framework }: { framework?: {
    primaryFramework: {
        name: string;
        version: string;
        confidence: number;
    };
    stateManagement?: any[];
    routing?: any;
    buildTool?: any;
} }) {
    if (!framework) return null;

    const { primaryFramework, stateManagement, routing, buildTool } = framework;
    const confidencePercent = Math.round(primaryFramework.confidence * 100);

    // Get confidence color
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return '#00ff88';
        if (confidence >= 0.7) return '#ffaa00';
        return '#ff4444';
    };

    return (
        <div className="framework-badge-container">
            <div className="framework-badge" style={{ borderColor: getConfidenceColor(primaryFramework.confidence) }}>
                <div className="framework-header">
                    <span className="framework-icon">⚡</span>
                    <h4>{primaryFramework.name}</h4>
                    <span className="confidence-badge" style={{ backgroundColor: getConfidenceColor(primaryFramework.confidence) }}>
                        {confidencePercent}% confidence
                    </span>
                </div>
                {primaryFramework.version && (
                    <p className="framework-version">Version: {primaryFramework.version}</p>
                )}

                <div className="framework-details">
                    {stateManagement && stateManagement.length > 0 && (
                        <div className="framework-detail">
                            <span className="detail-label">State:</span>
                            <span className="detail-value">{stateManagement[0].type}</span>
                        </div>
                    )}
                    {routing && (
                        <div className="framework-detail">
                            <span className="detail-label">Routing:</span>
                            <span className="detail-value">{routing.type}</span>
                        </div>
                    )}
                    {buildTool && (
                        <div className="framework-detail">
                            <span className="detail-label">Build:</span>
                            <span className="detail-value">{buildTool.type}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Extraction Metadata Badge - Shows cache status and timing
 */
export function ExtractionMetadataBadge({ cacheStatus, executionTime }: {
    cacheStatus?: 'HIT' | 'MISS' | 'STALE';
    executionTime?: number;
}) {
    if (!cacheStatus && !executionTime) return null;

    return (
        <div className="extraction-metadata">
            {cacheStatus && (
                <span className={`cache-badge cache-${cacheStatus.toLowerCase()}`}>
                    {cacheStatus === 'HIT' ? '⚡ Cache Hit' : cacheStatus === 'MISS' ? '📡 Fresh Extract' : '⏱️ Stale Cache'}
                </span>
            )}
            {executionTime && (
                <span className="timing-badge">
                    ⏱️ {executionTime < 1000 ? `${executionTime}ms` : `${(executionTime / 1000).toFixed(2)}s`}
                </span>
            )}
        </div>
    );
}

/**
 * Asset Stats - Quick overview of extracted assets
 */
export function AssetStats({ assets }: { assets?: {
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
} }) {
    if (!assets) return null;

    const { images, fonts, stylesheets, scripts, media, metadata } = assets;

    return (
        <div className="asset-stats-container">
            <h4>📦 Asset Harvest</h4>
            <div className="asset-stats-grid">
                <div className="asset-stat">
                    <span className="asset-icon">🖼️</span>
                    <span className="asset-count">{images.length}</span>
                    <span className="asset-label">Images</span>
                </div>
                <div className="asset-stat">
                    <span className="asset-icon">🔤</span>
                    <span className="asset-count">{fonts.length}</span>
                    <span className="asset-label">Fonts</span>
                </div>
                <div className="asset-stat">
                    <span className="asset-icon">🎨</span>
                    <span className="asset-count">{stylesheets.length}</span>
                    <span className="asset-label">CSS</span>
                </div>
                <div className="asset-stat">
                    <span className="asset-icon">⚙️</span>
                    <span className="asset-count">{scripts.length}</span>
                    <span className="asset-label">Scripts</span>
                </div>
                <div className="asset-stat">
                    <span className="asset-icon">🎬</span>
                    <span className="asset-count">{media.length}</span>
                    <span className="asset-label">Media</span>
                </div>
                <div className="asset-stat total">
                    <span className="asset-icon">📊</span>
                    <span className="asset-count">{metadata.totalAssets}</span>
                    <span className="asset-label">Total</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Component Analysis Stats - Overview of detected components
 */
export function ComponentAnalysisStats({ componentAnalysis }: { componentAnalysis?: {
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
} }) {
    if (!componentAnalysis) return null;

    const { libraries, patterns, metadata } = componentAnalysis;

    return (
        <div className="component-analysis-container">
            <h4>🧩 Component Intelligence</h4>

            <div className="component-stats">
                <div className="stat-item">
                    <span className="stat-label">Components Detected:</span>
                    <span className="stat-value">{metadata.totalComponents}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Tree Depth:</span>
                    <span className="stat-value">{metadata.maxDepth} levels</span>
                </div>
            </div>

            {libraries.length > 0 && (
                <div className="detected-libraries">
                    <h5>📚 Component Libraries</h5>
                    <div className="library-badges">
                        {libraries.map((lib, i) => (
                            <span key={i} className="library-badge" title={`${Math.round(lib.confidence * 100)}% confidence`}>
                                {lib.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {patterns.length > 0 && (
                <div className="detected-patterns">
                    <h5>🔍 Patterns Identified</h5>
                    {patterns.slice(0, 3).map((pattern, i) => (
                        <div key={i} className="pattern-item">
                            <span className="pattern-name">{pattern.name}</span>
                            <span className="pattern-count">×{pattern.occurrences}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Backend Extraction Panel - Main component for displaying all backend data
 */
export function BackendExtractionPanel({ backendData }: {
    backendData: {
        framework?: any;
        assets?: any;
        componentAnalysis?: any;
        cacheStatus?: 'HIT' | 'MISS' | 'STALE';
        executionTime?: number;
    } | null;
}) {
    if (!backendData) return null;

    return (
        <div className="backend-extraction-panel">
            <div className="panel-header">
                <h3>🔬 Advanced Extraction Intelligence</h3>
                <ExtractionMetadataBadge
                    cacheStatus={backendData.cacheStatus}
                    executionTime={backendData.executionTime}
                />
            </div>

            <div className="panel-content">
                <FrameworkBadge framework={backendData.framework} />
                <AssetStats assets={backendData.assets} />
                <ComponentAnalysisStats componentAnalysis={backendData.componentAnalysis} />
            </div>
        </div>
    );
}
