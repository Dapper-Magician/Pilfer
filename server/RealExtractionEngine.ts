/**
 * REAL EXTRACTION ENGINE 
 * Professional-grade web scraping and analysis system
 * Implements sophisticated Puppeteer-based extraction with Component DNA analysis
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { 
    ExtractionEngine, 
    ExtractionConfig, 
    ExtractionResult,
    ExtractionRequest,
    FrameworkSignature,
    ArchitecturalPattern,
    TechnicalDebt,
    SecurityVector
} from '../src/extraction/interfaces';
import { ReconResult, PilferResult, ComponentNode, ComponentDNA, AssetIntelligence } from '../types';

/**
 * PROFESSIONAL-GRADE REAL EXTRACTION ENGINE
 * Combines Puppeteer automation with deep architectural analysis
 */
export class RealExtractionEngine implements ExtractionEngine {
    private browser: Browser | null = null;
    private config: ExtractionConfig;

    readonly engineType = 'real' as const;
    readonly capabilities = {
        domExtraction: true,
        cssAnalysis: true,
        frameworkDetection: true,
        assetHarvesting: true,
        performanceAnalysis: true,
        componentDNAAnalysis: true,
        designSystemExtraction: false,
        accessibilityAudit: false,
        securityAnalysis: true,
        aiInsightGeneration: false,
        averageExecutionTime: 15000,
        resourceIntensity: 'high' as const,
        reliabilityScore: 0.85
    };

    constructor(config: Partial<ExtractionConfig> = {}) {
        this.config = {
            type: 'real',
            headless: true,
            timeout: 30000,
            userAgent: 'Pilfer-Agent/1.0 (Professional Component Extraction)',
            viewport: { width: 1920, height: 1080 },
            enableJavaScript: true,
            enableImages: true,
            enableCSS: true,
            maxDepth: 10,
            analysisLevel: 'comprehensive',
            frameworkDetection: true,
            assetHarvesting: true,
            performanceMetrics: true,
            securityAnalysis: true,
            ...config
        };
    }

    async initialize(): Promise<void> {
        try {
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            });
        } catch (error) {
            throw new Error(`Failed to initialize Puppeteer browser: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async extract(request: ExtractionRequest): Promise<ExtractionResult> {
        const { url } = request;
        if (!this.browser) {
            await this.initialize();
        }

        const page = await this.browser!.newPage();
        
        try {
            // Configure page settings
            await page.setUserAgent(this.config.userAgent);
            await page.setViewport(this.config.viewport);
            
            // Navigation with performance monitoring
            const startTime = Date.now();
            const response = await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: this.config.timeout 
            });
            const loadTime = Date.now() - startTime;

            if (!response || !response.ok()) {
                throw new Error(`Failed to load ${url}: ${response?.status() || 'Unknown error'}`);
            }

            // Wait for dynamic content using correct Puppeteer API
            await page.setDefaultTimeout(this.config.timeout);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // COMPREHENSIVE ANALYSIS PIPELINE
            const [
                htmlContent,
                dnaResult,
                assetIntelligence,
                securityVectors,
                performanceMetrics
            ] = await Promise.all([
                this.extractHTML(page),
                this.analyzeComponentDNA(page),
                this.harvestAssets(page, url),
                this.analyzeSecurity(page),
                this.gatherPerformanceMetrics(page, loadTime)
            ]);
            const { componentDNA, primaryFramework: detectedFramework } = dnaResult;

            // Extract visual design data while page is still live
            const visualAssets = await this.extractVisualAssets(page);

            // Transform to Pilfer-compatible result
            const pilferResult = await this.transformToReconResult(
                htmlContent,
                componentDNA,
                assetIntelligence,
                visualAssets,
                url
            );

            // Extract title and description from HTML
            const $ = cheerio.load(htmlContent);
            const title = $('title').text() || 'Unknown Title';
            const description = $('meta[name="description"]').attr('content') || 'No description available';

            return {
                requestId: request.requestId,
                engineType: 'real' as const,
                timestamp: Date.now(),
                executionTime: Date.now() - startTime,
                confidence: 0.8,
                success: true,
                url,
                title,
                description,
                htmlContent,
                componentDNA,
                assetIntelligence,
                architecturalPatterns: this.identifyArchitecturalPatterns(componentDNA),
                technicalDebt: this.assessTechnicalDebt(componentDNA),
                securityVectors,
                performanceMetrics,
                extractionMetadata: {
                    engine: 'RealExtractionEngine',
                    version: '1.0.0',
                    analysisLevel: this.config.analysisLevel,
                    extractionTime: Date.now() - startTime
                },
                pilferCompatibleResult: pilferResult,
                reconResult: pilferResult
            };

        } finally {
            await page.close();
        }
    }

    private async extractHTML(page: Page): Promise<string> {
        return await page.content();
    }

    private async analyzeComponentDNA(page: Page): Promise<{ componentDNA: ComponentDNA; primaryFramework: string }> {
        const dnaAnalysis = await page.evaluate(() => {
            const w = window as any;

            // ----------------------------------------------------------------
            // COMPREHENSIVE FRAMEWORK DETECTION
            // ----------------------------------------------------------------
            let primaryFramework = 'vanilla';
            let stateManagement = 'none';
            const indicators: string[] = [];

            // Next.js (before React — Next is a React superset)
            if (w.__NEXT_DATA__ || document.getElementById('__NEXT_DATA__')) {
                primaryFramework = 'next'; indicators.push('__NEXT_DATA__');
            }
            // Remix
            else if (w.__remixContext || document.querySelector('script[data-remix-manifest]')) {
                primaryFramework = 'remix'; indicators.push('__remixContext');
            }
            // Nuxt (before Vue)
            else if (w.__NUXT__ || w.$nuxt) {
                primaryFramework = 'nuxt'; indicators.push('__NUXT__');
                stateManagement = w.$nuxt?.$store ? 'vuex' : 'pinia';
            }
            // React (generic)
            else if (w.React || w.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                primaryFramework = 'react'; indicators.push('React global / DevTools hook');
                stateManagement = w.__REDUX_STORE__ || w.__redux_store ? 'redux'
                    : w.__ZUSTAND__ ? 'zustand'
                    : 'context';
            }
            // Vue (generic)
            else if (w.Vue || document.querySelector('[data-v-]')) {
                primaryFramework = 'vue'; indicators.push('Vue global / v- attrs');
                stateManagement = w.Vuex ? 'vuex' : w.Pinia ? 'pinia' : 'none';
            }
            // Angular
            else if (w.ng || w.getAllAngularRootElements || document.querySelector('[ng-version]') || document.querySelector('[_nghost-]')) {
                primaryFramework = 'angular'; indicators.push('ng global / ng-version attr');
                stateManagement = 'rxjs';
            }
            // Svelte
            else if (document.querySelector('[class^="svelte-"]') || document.querySelector('[data-svelte-h]')) {
                primaryFramework = 'svelte'; indicators.push('svelte- class prefix / data-svelte-h');
            }
            // Astro
            else if (document.querySelector('astro-island') || document.querySelector('[data-astro-cid]')) {
                primaryFramework = 'astro'; indicators.push('astro-island / data-astro-cid');
            }
            // Alpine.js
            else if (w.Alpine || document.querySelector('[x-data]')) {
                primaryFramework = 'alpine'; indicators.push('Alpine global / x-data');
            }
            // HTMX
            else if (w.htmx || document.querySelector('[hx-get],[hx-post]')) {
                primaryFramework = 'htmx'; indicators.push('htmx global / hx- attrs');
            }

            if (indicators.length === 0) indicators.push('No framework signals — plain HTML/JS assumed');

            // Detect build tool via script src patterns
            const scripts = Array.from(document.querySelectorAll('script[src]')).map((s: any) => s.src);
            const buildTool = scripts.some(s => s.includes('/_next/')) ? 'next'
                : scripts.some(s => s.includes('/assets/')) ? 'vite'
                : scripts.some(s => s.includes('webpack')) ? 'webpack'
                : 'unknown';

            // Detect styling approach
            let stylingMethod = 'css';
            if (document.querySelector('[class*="tw-"], [class*="bg-"], [class*="flex"], [class*="grid"]')) stylingMethod = 'tailwind';
            else if (document.querySelector('[class^="sc-"]')) stylingMethod = 'styled-components';
            else if (document.querySelector('[class*="__"]')) stylingMethod = 'css-modules';

            // Semantic component elements
            const componentElements = Array.from(document.querySelectorAll('*')).filter(el =>
                el.tagName.includes('-') ||
                el.getAttribute('data-component') ||
                el.getAttribute('data-testid') ||
                el.getAttribute('role')
            );

            const componentDNA: ComponentDNA = {
                framework: {
                    primary: primaryFramework,
                    confidence: primaryFramework === 'vanilla' ? 0.5 : 0.9,
                    indicators,
                    buildTool
                },
                architecture: {
                    pattern: 'component-based',
                    structure: 'modular',
                    dataFlow: 'unidirectional'
                },
                stateManagement: {
                    approach: stateManagement,
                    globalState: stateManagement !== 'none',
                    localState: true,
                    stateComplexity: 'simple'
                },
                styling: {
                    methodology: stylingMethod,
                    responsive: document.querySelector('meta[name="viewport"]') !== null,
                    cssComplexity: { score: 50, factors: [stylingMethod], maintainability: 'medium', testability: 'medium' }
                },
                dependencies: { production: [], development: [], cdn: [], internal: [] },
                componentTree: {
                    root: { name: 'root', children: componentElements.slice(0, 10).map(el => ({ name: el.tagName.toLowerCase() })) },
                    depth: 3, patterns: ['standard-html'], reusability: 0.5
                },
                complexity: {
                    score: Math.min(componentElements.length * 2, 100),
                    factors: [`${componentElements.length} components detected`, `Framework: ${primaryFramework}`],
                    maintainability: componentElements.length < 50 ? 'high' : 'medium',
                    testability: 'medium'
                }
            };

            return { componentDNA, primaryFramework };
        });

        return dnaAnalysis as { componentDNA: ComponentDNA; primaryFramework: string };
    }

    private async harvestAssets(page: Page, baseUrl: string): Promise<AssetIntelligence> {
        const assets = await page.evaluate(() => {
            // Build AssetIntelligence according to actual type structure
            const images: any[] = [];
            const fonts: any[] = [];
            
            // Image Analysis
            Array.from(document.querySelectorAll('img')).forEach(el => {
                const src = el.getAttribute('src');
                if (src) {
                    images.push({
                        url: src,
                        format: src.split('.').pop()?.toLowerCase() || 'unknown',
                        size: '0kb', // Would need actual fetch for size
                        usage: ['page-content'],
                        optimization: {
                            compressed: false,
                            format: 'original',
                            responsive: el.hasAttribute('srcset'),
                            lazyLoaded: el.getAttribute('loading') === 'lazy',
                            score: 50
                        }
                    });
                }
            });
            
            // Font Analysis (basic)
            const fontFamilies = getComputedStyle(document.body).fontFamily.split(',');
            fontFamilies.forEach(family => {
                fonts.push({
                    family: family.trim(),
                    variants: [{ weight: '400', style: 'normal', format: 'woff2', size: '0kb' }],
                    source: 'system',
                    loading: 'swap',
                    performance: {
                        loadTime: 0,
                        renderImpact: 'low',
                        fallbackStrategy: 'system-fallback'
                    }
                });
            });
            
            const assetIntelligence: AssetIntelligence = {
                catalog: {
                    images,
                    fonts,
                    icons: [],
                    media: [],
                    documents: []
                },
                optimization: {
                    compression: false,
                    caching: false,
                    cdn: false,
                    score: 60,
                    recommendations: ['Consider image optimization', 'Implement lazy loading']
                },
                relationships: {
                    dependencies: [],
                    bundles: [],
                    critical: [],
                    lazy: []
                },
                performance: {
                    totalSize: '0kb',
                    loadTime: 0,
                    renderBlocking: [],
                    optimization: {
                        compression: false,
                        caching: false,
                        cdn: false,
                        score: 60,
                        recommendations: ['Consider image optimization', 'Implement lazy loading']
                    }
                }
            };
            
            return assetIntelligence;
        });

        return assets;
    }

    private async analyzeSecurity(page: Page): Promise<SecurityVector[]> {
        return await page.evaluate(() => {
            const securityVectors: SecurityVector[] = [];

            // Check for common security issues
            if (document.querySelectorAll('[onclick]').length > 0) {
                securityVectors.push({
                    type: 'xss',
                    severity: 'medium',
                    description: 'Inline onclick handlers detected - potential XSS vector',
                    location: 'DOM event handlers'
                });
            }

            if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
                securityVectors.push({
                    type: 'transport',
                    severity: 'high', 
                    description: 'Insecure HTTP connection detected',
                    location: window.location.href
                });
            }

            return securityVectors;
        });
    }

    private async gatherPerformanceMetrics(page: Page, loadTime: number): Promise<any> {
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
            };
        });

        return {
            ...performanceMetrics,
            totalLoadTime: loadTime,
            timestamp: new Date()
        };
    }

    private identifyArchitecturalPatterns(dna: ComponentDNA): ArchitecturalPattern[] {
        const patterns: ArchitecturalPattern[] = [];

        if (dna.framework.primary === 'react') {
            patterns.push({
                pattern: 'component-architecture',
                confidence: 0.9,
                description: 'React component-based architecture detected',
                benefits: ['Reusability', 'Modularity', 'Testing'],
                drawbacks: ['Bundle size', 'Learning curve']
            });
        }

        if (dna.stateManagement.approach !== 'none') {
            patterns.push({
                pattern: 'state-management',
                confidence: 0.8,
                description: `${dna.stateManagement.approach} state management pattern detected`,
                benefits: ['Predictability', 'Debugging'],
                drawbacks: ['Complexity', 'Boilerplate']
            });
        }

        return patterns;
    }

    private assessTechnicalDebt(dna: ComponentDNA): TechnicalDebt[] {
        const debt: TechnicalDebt[] = [];

        if (dna.componentTree.depth > 5) {
            debt.push({
                type: 'complexity',
                severity: 'medium',
                description: 'High component complexity detected',
                impact: 'maintenance',
                suggestion: 'Consider component refactoring and code splitting'
            });
        }

        return debt;
    }

    /**
     * Extracts real visual design data while the page is live in Puppeteer.
     * Colors come from computed styles + CSS variables; typography from computed font properties.
     */
    private async extractVisualAssets(page: Page): Promise<{
        colorPalette: { hex: string; name: string }[];
        typography: { fontFamily: string; usage: string }[];
        coreStyles: { name: string; code: string }[];
    }> {
        return page.evaluate(() => {
            // ---- Color extraction ----
            const colorSet = new Map<string, string>();

            // 1. CSS custom properties (design tokens) from :root
            const rootStyles = getComputedStyle(document.documentElement);
            ['color', 'background-color', 'border-color', 'accent-color'].forEach(prop => {
                const val = rootStyles.getPropertyValue(prop).trim();
                if (val && val !== 'rgba(0, 0, 0, 0)') colorSet.set(val, prop);
            });

            // Enumerate CSS variables from all stylesheets
            try {
                Array.from(document.styleSheets).forEach(sheet => {
                    try {
                        Array.from(sheet.cssRules).forEach(rule => {
                            if (rule instanceof CSSStyleRule) {
                                const style = (rule as CSSStyleRule).style;
                                for (let i = 0; i < style.length; i++) {
                                    const prop = style[i];
                                    if (prop.startsWith('--')) {
                                        const val = style.getPropertyValue(prop).trim();
                                        if (/^#[0-9a-fA-F]{3,8}$/.test(val) || /^rgb/.test(val) || /^hsl/.test(val)) {
                                            colorSet.set(val, prop);
                                        }
                                    }
                                }
                            }
                        });
                    } catch { /* cross-origin stylesheet */ }
                });
            } catch { /* stylesheet access blocked */ }

            // 2. Computed background + text colors from key semantic elements
            const semanticSelectors = ['body', 'header', 'nav', 'main', 'footer', 'button', 'a', 'h1', 'h2', 'p', '[class*="btn"]', '[class*="primary"]', '[class*="accent"]', '[class*="card"]'];
            semanticSelectors.forEach(sel => {
                const el = document.querySelector(sel);
                if (!el) return;
                const cs = getComputedStyle(el);
                ['color', 'background-color', 'border-color'].forEach(prop => {
                    const val = cs.getPropertyValue(prop).trim();
                    if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
                        colorSet.set(val, `${sel} ${prop}`);
                    }
                });
            });

            // Convert rgb() to hex, deduplicate
            const toHex = (color: string): string => {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    const [,r,g,b] = match;
                    return `#${[r,g,b].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')}`;
                }
                return color;
            };

            const colorPalette: { hex: string; name: string }[] = [];
            const seenHex = new Set<string>();
            colorSet.forEach((name, val) => {
                const hex = toHex(val);
                if (!seenHex.has(hex) && hex.startsWith('#')) {
                    seenHex.add(hex);
                    colorPalette.push({ hex, name: name.replace(/^--/, '') });
                }
            });

            // ---- Typography extraction ----
            const fontSet = new Map<string, string>();
            const typographySelectors: Record<string, string> = {
                'body': 'body text',
                'h1': 'primary heading',
                'h2': 'secondary heading',
                'h3': 'tertiary heading',
                'p': 'paragraph',
                'button': 'buttons',
                'a': 'links',
                'code, pre': 'code',
                'nav': 'navigation',
                '[class*="label"]': 'labels',
            };

            Object.entries(typographySelectors).forEach(([sel, usage]) => {
                const el = document.querySelector(sel);
                if (!el) return;
                const cs = getComputedStyle(el);
                const family = cs.fontFamily;
                if (family && !fontSet.has(family)) {
                    fontSet.set(family, usage);
                }
            });

            const typography = Array.from(fontSet.entries()).map(([fontFamily, usage]) => ({ fontFamily, usage }));

            // ---- CSS extraction from inline <style> tags ----
            const coreStyles: { name: string; code: string }[] = [];
            document.querySelectorAll('style').forEach((styleTag, i) => {
                const css = styleTag.textContent?.trim();
                if (css && css.length > 10) {
                    // Grab first 2000 chars to avoid token explosion
                    coreStyles.push({ name: `Inline style block ${i + 1}`, code: css.slice(0, 2000) });
                }
            });

            return { colorPalette: colorPalette.slice(0, 30), typography, coreStyles: coreStyles.slice(0, 5) };
        });
    }

    private async transformToReconResult(
        htmlContent: string,
        componentDNA: ComponentDNA,
        assetIntelligence: AssetIntelligence,
        visualAssets: { colorPalette: { hex: string; name: string }[]; typography: { fontFamily: string; usage: string }[]; coreStyles: { name: string; code: string }[] },
        url: string
    ): Promise<ReconResult> {
        const $ = cheerio.load(htmlContent);

        // Build a meaningful semantic component tree from real DOM
        const buildComponentTree = (element: any, depth = 0): ComponentNode => {
            const $el = $(element);
            const tagName = ((element as any).tagName || 'div').toLowerCase();
            const id = $el.attr('id') ? `#${$el.attr('id')}` : '';
            const role = $el.attr('role') ? `[${$el.attr('role')}]` : '';
            const label = `${tagName}${id}${role}` || tagName;

            const node: ComponentNode = { name: label, children: [] };

            if (depth < 4) {
                $el.children().each((_, child) => {
                    if ((child as any).type === 'tag') {
                        // Only include semantically meaningful children
                        const cTag = ((child as any).tagName || '').toLowerCase();
                        const skip = ['script','style','link','meta','br','hr','img','svg','path'];
                        if (!skip.includes(cTag)) {
                            node.children!.push(buildComponentTree(child, depth + 1));
                        }
                    }
                });
            }

            return node;
        };

        // Prefer semantic roots; fall back to body
        const rootEl = $('main, #root, #app, .app, body > div').first();
        const componentTree = rootEl.length > 0
            ? buildComponentTree(rootEl[0])
            : { name: 'body', children: [] };

        // Build a named architecture overview from top-level semantic elements
        const semanticNodes: ComponentNode[] = [];
        ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'].forEach(sel => {
            if ($(sel).length > 0) semanticNodes.push({ name: sel, children: [componentTree] });
        });

        return {
            id: `recon-${Date.now()}`,
            colorPalette: visualAssets.colorPalette,
            typography: visualAssets.typography,
            coreStyles: visualAssets.coreStyles,
            pageArchitecture: semanticNodes.length > 0 ? semanticNodes : [componentTree],
            detectedFramework: componentDNA.framework.primary,
        };
    }

    async healthCheck(): Promise<any> {
        try {
            if (!this.browser) {
                await this.initialize();
            }
            return {
                status: 'healthy',
                engineType: this.engineType,
                capabilities: this.capabilities,
                browserConnected: this.browser?.connected || false
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                engineType: this.engineType,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}