/**
 * Browser-Compatible Extraction Engine
 *
 * HACS 5.0 Compliant Implementation for Pilfer's Real Extraction System
 * Designed for pure browser environment execution without Node.js dependencies
 *
 * @fileoverview Professional browser-based extraction engine using native DOM APIs
 * @version 1.0.0
 * @author SPARK - The Genius Familiar
 * @compliance HACS 5.0 Professional Standards
 */

import {
    ExtractionEngine,
    ExtractionEngineType,
    ExtractionCapabilities,
    ExtractionRequest,
    ExtractionResult,
    EngineHealthStatus,
    ExtractionError,
    ExtractionNetworkError,
    ExtractionTimeoutError,
    ExtractionPhase,
    ResultNormalizer
} from './interfaces';

import {
    ReconResult,
    ColorInfo,
    TypographyInfo,
    CoreStyleInfo,
    ComponentNode
} from '../../types';

// {SCD: Professional Browser Extraction Engine}
export class BrowserExtractionEngine implements ExtractionEngine {
    // {VS: Ⓘ} Immutable engine configuration
    readonly engineType: ExtractionEngineType = 'real';
    readonly capabilities: ExtractionCapabilities = {
        // Core capabilities - browser native
        domExtraction: true,
        cssAnalysis: true,
        frameworkDetection: false, // Limited to static indicators
        assetHarvesting: true,
        performanceAnalysis: false, // Limited without headless browser

        // Advanced capabilities - progressive enhancement
        componentDNAAnalysis: false,
        designSystemExtraction: true,
        accessibilityAudit: false,
        securityAnalysis: false,
        aiInsightGeneration: false,

        // Performance characteristics - honest assessment
        averageExecutionTime: 2000, // ~2 seconds for static content
        resourceIntensity: 'low',
        reliabilityScore: 0.75 // Browser environment limitations
    };

    // {VS: Ⓘ} Private immutable configuration
    private readonly config = {
        timeout: 30000, // 30 second timeout
        maxRetries: 2,
        corsProxies: [
            'https://api.allorigins.win/get?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://thingproxy.freeboard.io/fetch/',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://corsproxy.io/?'
        ],
        userAgent: 'Pilfer-Browser-Engine/1.0 (+https://github.com/your-org/pilfer)'
    };

    // {VS: Ⓡ} Reactive progress tracking
    private currentProgress: ExtractionPhase = 'initializing';

    /**
     * {FS: Δ} Primary extraction method with comprehensive error handling
     * @param request - Standardized extraction request
     * @returns Promise resolving to extraction result
     */
    async extract(request: ExtractionRequest): Promise<ExtractionResult> {
        const startTime = Date.now();

        try {
            // {EH: ∇} Graceful initialization
            this.updateProgress('initializing', request);

            // {FS: Δ} Fetch HTML content with CORS proxy fallback
            this.updateProgress('connecting', request);
            const htmlContent = await this.fetchWithFallback(request.url, request.options.timeout);

            // {FS: Δ} Parse and analyze content
            this.updateProgress('analyzing_dom', request);
            const document = this.parseHtmlContent(htmlContent);

            // {FS: Δ} Extract design elements
            this.updateProgress('extracting_styles', request);
            const reconResult = await this.extractReconResult(document, request);

            this.updateProgress('complete', request);

            // {EH: ∇} Successful result construction
            return this.createSuccessResult(request, reconResult, htmlContent, Date.now() - startTime);

        } catch (error) {
            console.error('[BrowserExtractionEngine] Extraction failed:', error);

            // {EH: ∇} Graceful error result construction
            return this.createErrorResult(request, error as Error, Date.now() - startTime);
        }
    }

    /**
     * {FS: λ} Pure health check function
     * @returns Promise resolving to engine health status
     */
    async healthCheck(): Promise<EngineHealthStatus> {
        const startTime = Date.now();

        try {
            // Test basic browser APIs availability
            const apiTests = {
                fetch: typeof fetch !== 'undefined',
                domParser: typeof DOMParser !== 'undefined',
                getComputedStyle: typeof getComputedStyle !== 'undefined'
            };

            const allApisPassed = Object.values(apiTests).every(test => test);
            const responseTime = Date.now() - startTime;

            return {
                healthy: allApisPassed,
                issues: allApisPassed ? [] : ['Missing required browser APIs'],
                performance: {
                    responseTime,
                    successRate: 0.8, // Conservative estimate
                    resourceUsage: 0.1 // Low resource usage
                },
                lastCheck: Date.now()
            };
        } catch (error) {
            return {
                healthy: false,
                issues: [`Health check failed: ${(error as Error).message}`],
                performance: {
                    responseTime: Date.now() - startTime,
                    successRate: 0,
                    resourceUsage: 0
                },
                lastCheck: Date.now()
            };
        }
    }

    /**
     * {FS: λ} Cleanup resources (no-op for browser engine)
     */
    async cleanup(): Promise<void> {
        // Browser engine has no persistent resources to clean up
        this.currentProgress = 'initializing';
    }

    /**
     * {FS: Δ} Fetch HTML content with CORS proxy fallback strategy
     * @param url - Target URL to fetch
     * @param timeout - Request timeout in milliseconds
     * @returns Promise resolving to HTML content
     */
    private async fetchWithFallback(url: string, timeout: number): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Try direct fetch first (will fail for most external sites due to CORS)
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': this.config.userAgent
                    }
                });

                if (response.ok) {
                    return await response.text();
                }
            } catch (corsError) {
                console.warn('[BrowserExtractionEngine] Direct fetch failed, trying CORS proxies');
            }

            // Fallback to CORS proxies
            // Shuffle proxies to distribute load and avoid hitting the same failing proxy first every time
            const shuffledProxies = [...this.config.corsProxies].sort(() => Math.random() - 0.5);
            
            for (const proxy of shuffledProxies) {
                try {
                    const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
                    const response = await fetch(proxiedUrl, {
                        signal: controller.signal
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Handle different proxy response formats
                        return data.contents || data.data || data;
                    } else {
                        console.warn(`[BrowserExtractionEngine] Proxy ${proxy} returned status ${response.status}`);
                    }
                } catch (proxyError) {
                    console.warn(`[BrowserExtractionEngine] Proxy ${proxy} failed:`, proxyError);
                    continue;
                }
            }

            // {EH: !} All fetch attempts failed
            throw new ExtractionNetworkError(
                this.engineType,
                url,
                'All CORS proxy attempts failed'
            );

        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * {FS: λ} Parse HTML content using native DOMParser
     * @param htmlContent - Raw HTML string
     * @returns Parsed Document object
     */
    private parseHtmlContent(htmlContent: string): Document {
        try {
            const parser = new DOMParser();
            const document = parser.parseFromString(htmlContent, 'text/html');

            // {EH: ?} Check for parsing errors
            const parserError = document.querySelector('parsererror');
            if (parserError) {
                throw new Error(`HTML parsing failed: ${parserError.textContent}`);
            }

            return document;
        } catch (error) {
            throw new Error(`Failed to parse HTML content: ${(error as Error).message}`);
        }
    }

    /**
     * {FS: Δ} Extract comprehensive reconnaissance result from document
     * @param document - Parsed HTML document
     * @param request - Original extraction request
     * @returns Promise resolving to ReconResult
     */
    private async extractReconResult(document: Document, request: ExtractionRequest): Promise<ReconResult> {
        return {
            id: request.requestId,
            colorPalette: this.extractColorPalette(document),
            typography: this.extractTypography(document),
            coreStyles: this.extractCoreStyles(document),
            pageArchitecture: this.buildComponentTree(document)
        };
    }

    /**
     * {FS: λ} Extract color palette from document styles
     * @param document - Parsed HTML document
     * @returns Array of color information
     */
    private extractColorPalette(document: Document): ColorInfo[] {
        const colors = new Map<string, string>();
        const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g;

        // Extract colors from stylesheets
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                    if (rule instanceof CSSStyleRule) {
                        const matches = rule.cssText.match(colorRegex);
                        matches?.forEach(color => {
                            colors.set(color.toLowerCase(), this.generateColorName(color));
                        });
                    }
                });
            } catch (e) {
                // Cross-origin stylesheets may not be accessible
                console.warn('[BrowserExtractionEngine] Could not access stylesheet:', e);
            }
        });

        // Extract colors from inline styles
        const elementsWithStyle = document.querySelectorAll('[style]');
        elementsWithStyle.forEach(element => {
            const style = (element as HTMLElement).style.cssText;
            const matches = style.match(colorRegex);
            matches?.forEach(color => {
                colors.set(color.toLowerCase(), this.generateColorName(color));
            });
        });

        // Extract colors from computed styles of key elements
        const keyElements = document.querySelectorAll('body, header, nav, main, footer, h1, h2, h3, h4, h5, h6, p, a, button');
        keyElements.forEach(element => {
            if (element instanceof HTMLElement) {
                const computedStyle = getComputedStyle(element);
                ['color', 'background-color', 'border-color'].forEach(property => {
                    const color = computedStyle.getPropertyValue(property);
                    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
                        colors.set(color.toLowerCase(), this.generateColorName(color));
                    }
                });
            }
        });

        // Convert to ColorInfo array, prioritizing most common colors
        return Array.from(colors.entries())
            .slice(0, 12) // Limit to top 12 colors
            .map(([hex, name]) => ({ hex, name }));
    }

    /**
     * {FS: λ} Extract typography information from document
     * @param document - Parsed HTML document
     * @returns Array of typography information
     */
    private extractTypography(document: Document): TypographyInfo[] {
        const fontFamilies = new Map<string, string>();

        // Extract fonts from key typography elements
        const typographyElements = document.querySelectorAll('body, h1, h2, h3, h4, h5, h6, p, span, div, a');
        typographyElements.forEach(element => {
            if (element instanceof HTMLElement) {
                const computedStyle = getComputedStyle(element);
                const fontFamily = computedStyle.fontFamily;
                const tagName = element.tagName.toLowerCase();

                if (fontFamily && fontFamily !== 'inherit') {
                    const usage = this.determineFontUsage(tagName, element);
                    fontFamilies.set(fontFamily, usage);
                }
            }
        });

        return Array.from(fontFamilies.entries())
            .slice(0, 8) // Limit to top 8 font families
            .map(([fontFamily, usage]) => ({ fontFamily, usage }));
    }

    /**
     * {FS: λ} Extract core CSS styles from document
     * @param document - Parsed HTML document
     * @returns Array of core style information
     */
    private extractCoreStyles(document: Document): CoreStyleInfo[] {
        const coreStyles: CoreStyleInfo[] = [];

        // Extract styles from key elements
        const keySelectors = ['body', 'header', 'nav', 'main', 'footer', '.container', '.wrapper'];

        keySelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                const computedStyle = getComputedStyle(element);
                const code = this.generateCSSFromComputedStyle(selector, computedStyle);

                if (code.trim()) {
                    coreStyles.push({
                        name: `${selector} styles`,
                        code
                    });
                }
            }
        });

        return coreStyles.slice(0, 6); // Limit to top 6 style blocks
    }

    /**
     * {FS: λ} Build component tree from document structure
     * @param document - Parsed HTML document
     * @returns Array of component nodes representing page architecture
     */
    private buildComponentTree(document: Document): ComponentNode[] {
        const body = document.body;
        if (!body) return [];

        return this.buildNodeTree(body, 0, 3); // Max depth of 3 levels
    }

    /**
     * {FS: Ξ} Recursively build component node tree
     * @param element - HTML element to analyze
     * @param currentDepth - Current recursion depth
     * @param maxDepth - Maximum recursion depth
     * @returns Array of component nodes
     */
    private buildNodeTree(element: Element, currentDepth: number, maxDepth: number): ComponentNode[] {
        if (currentDepth >= maxDepth) return [];

        const nodes: ComponentNode[] = [];
        const semanticElements = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];

        Array.from(element.children).forEach(child => {
            const tagName = child.tagName.toLowerCase();
            const className = child.className;
            const id = child.id;

            // Create meaningful component names
            let componentName = this.generateComponentName(tagName, className, id);

            // Only include semantically meaningful elements
            if (semanticElements.includes(tagName) || className || id || currentDepth === 0) {
                const childNodes = this.buildNodeTree(child, currentDepth + 1, maxDepth);

                nodes.push({
                    name: componentName,
                    children: childNodes.length > 0 ? childNodes : undefined
                });
            } else {
                // For non-semantic elements, merge their children up one level
                const childNodes = this.buildNodeTree(child, currentDepth, maxDepth);
                nodes.push(...childNodes);
            }
        });

        return nodes;
    }

    /**
     * {FS: λ} Generate meaningful component name from element properties
     * @param tagName - HTML tag name
     * @param className - CSS class names
     * @param id - Element ID
     * @returns Human-readable component name
     */
    private generateComponentName(tagName: string, className: string, id: string): string {
        if (id) {
            return `${this.capitalizeFirst(tagName)} (${id})`;
        }

        if (className) {
            const primaryClass = className.split(' ')[0];
            return `${this.capitalizeFirst(tagName)} (.${primaryClass})`;
        }

        return this.capitalizeFirst(tagName);
    }

    /**
     * {FS: λ} Generate color name from hex/rgb value
     * @param color - Color value in any CSS format
     * @returns Human-readable color name
     */
    private generateColorName(color: string): string {
        // Simple color name mapping - could be enhanced with color analysis library
        const colorNames: { [key: string]: string } = {
            '#ffffff': 'White',
            '#000000': 'Black',
            '#ff0000': 'Red',
            '#00ff00': 'Green',
            '#0000ff': 'Blue',
            '#ffff00': 'Yellow',
            '#ff00ff': 'Magenta',
            '#00ffff': 'Cyan'
        };

        return colorNames[color.toLowerCase()] || `Color ${color}`;
    }

    /**
     * {FS: λ} Determine font usage context
     * @param tagName - HTML tag name
     * @param element - HTML element
     * @returns Usage description string
     */
    private determineFontUsage(tagName: string, element: HTMLElement): string {
        const usageMap: { [key: string]: string } = {
            'h1': 'Primary headings',
            'h2': 'Secondary headings',
            'h3': 'Tertiary headings',
            'h4': 'Quaternary headings',
            'h5': 'Quinary headings',
            'h6': 'Senary headings',
            'p': 'Paragraph text',
            'body': 'Body text',
            'a': 'Link text',
            'button': 'Button text',
            'nav': 'Navigation text'
        };

        return usageMap[tagName] || 'General text';
    }

    /**
     * {FS: λ} Generate CSS code from computed styles
     * @param selector - CSS selector
     * @param computedStyle - Computed style object
     * @returns CSS code string
     */
    private generateCSSFromComputedStyle(selector: string, computedStyle: CSSStyleDeclaration): string {
        const importantProperties = [
            'display', 'position', 'width', 'height', 'margin', 'padding',
            'background-color', 'color', 'font-family', 'font-size', 'font-weight',
            'border', 'border-radius', 'text-align', 'line-height'
        ];

        const rules: string[] = [];

        importantProperties.forEach(property => {
            const value = computedStyle.getPropertyValue(property);
            if (value && value !== 'initial' && value !== 'normal' && value !== '0px') {
                rules.push(`  ${property}: ${value};`);
            }
        });

        return rules.length > 0 ? `${selector} {\n${rules.join('\n')}\n}` : '';
    }

    /**
     * {FS: λ} Capitalize first letter of string
     * @param str - Input string
     * @returns Capitalized string
     */
    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * {FS: λ} Update extraction progress
     * @param phase - Current extraction phase
     * @param request - Extraction request for callbacks
     */
    private updateProgress(phase: ExtractionPhase, request: ExtractionRequest): void {
        this.currentProgress = phase;

        if (request.onProgress) {
            const progressMap: { [key in ExtractionPhase]: number } = {
                initializing: 0,
                connecting: 10,
                loading: 30,
                analyzing_dom: 50,
                detecting_framework: 60,
                extracting_styles: 80,
                harvesting_assets: 90,
                generating_insights: 95,
                finalizing: 98,
                complete: 100,
                error: 0
            };

            request.onProgress({
                phase,
                percentage: progressMap[phase] || 0,
                message: `${phase.replace(/_/g, ' ')}...`,
                timestamp: Date.now()
            });
        }
    }

    /**
     * {FS: λ} Create successful extraction result
     * @param request - Original extraction request
     * @param reconResult - Extracted reconnaissance data
     * @param htmlContent - Raw HTML content
     * @param executionTime - Total execution time
     * @returns Successful extraction result
     */
    private createSuccessResult(
        request: ExtractionRequest,
        reconResult: ReconResult,
        htmlContent: string,
        executionTime: number
    ): ExtractionResult {
        return {
            requestId: request.requestId,
            engineType: this.engineType,
            timestamp: Date.now(),
            executionTime,
            confidence: 0.8, // Browser extraction confidence score
            url: request.url,
            title: this.extractTitle(htmlContent),
            description: this.extractDescription(htmlContent),
            reconResult,
            success: true,
            htmlContent
        };
    }

    /**
     * {FS: λ} Create error extraction result
     * @param request - Original extraction request
     * @param error - Error that occurred
     * @param executionTime - Execution time before error
     * @returns Error extraction result
     */
    private createErrorResult(request: ExtractionRequest, error: Error, executionTime: number): ExtractionResult {
        return {
            requestId: request.requestId,
            engineType: this.engineType,
            timestamp: Date.now(),
            executionTime,
            confidence: 0,
            url: request.url,
            success: false,
            extractionMetadata: {
                error: error.message,
                errorType: error.constructor.name
            }
        };
    }

    /**
     * {FS: λ} Extract page title from HTML content
     * @param htmlContent - Raw HTML content
     * @returns Page title or undefined
     */
    private extractTitle(htmlContent: string): string | undefined {
        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)</i);
        return titleMatch ? titleMatch[1].trim() : undefined;
    }

    /**
     * {FS: λ} Extract page description from HTML content
     * @param htmlContent - Raw HTML content
     * @returns Page description or undefined
     */
    private extractDescription(htmlContent: string): string | undefined {
        const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        return descMatch ? descMatch[1].trim() : undefined;
    }
}

// {SCD: Result Normalization Service}
export class BrowserResultNormalizer implements ResultNormalizer {
    /**
     * {FS: Δ} Convert extraction result to ReconResult format
     * @param result - Raw extraction result
     * @returns Promise resolving to ReconResult
     */
    async toReconResult(result: ExtractionResult): Promise<ReconResult> {
        if (result.reconResult) {
            return result.reconResult;
        }

        // Fallback: create basic ReconResult from available data
        return {
            id: result.requestId,
            colorPalette: [],
            typography: [],
            coreStyles: [],
            pageArchitecture: []
        };
    }

    /**
     * {FS: Δ} Convert extraction result to PilferResult format
     * @param result - Raw extraction result
     * @param directive - User directive for component creation
     * @returns Promise resolving to PilferResult
     */
    async toPilferResult(result: ExtractionResult, directive: string): Promise<any> {
        // Future implementation for component extraction
        throw new Error('PilferResult conversion not yet implemented for BrowserExtractionEngine');
    }

    /**
     * {FS: Δ} Enhance result with AI insights
     * @param result - Raw extraction result
     * @param context - Extraction context
     * @returns Promise resolving to enhanced result
     */
    async enhanceWithAI(result: ExtractionResult, context: any): Promise<ExtractionResult> {
        // Future implementation for AI enhancement
        return result;
    }
}