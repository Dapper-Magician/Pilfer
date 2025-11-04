/**
 * Pilfer Backend API - Framework Detector
 *
 * Multi-layer framework detection system with 95%+ accuracy target
 * Analyzes DOM signatures, bundle patterns, window objects, and runtime behavior
 *
 * Detection Layers:
 * 1. Static Analysis: HTML source patterns, meta tags, comments
 * 2. Bundle Analysis: JavaScript bundle naming and structure
 * 3. Runtime Analysis: Window object properties, global variables
 * 4. DOM Analysis: Component attributes, data attributes, class patterns
 * 5. Behavioral Analysis: Hydration patterns, routing behavior
 *
 * Supported Frameworks:
 * - React (CRA, Vite, Next.js)
 * - Vue (Vue 2, Vue 3, Nuxt)
 * - Angular (AngularJS, Angular 2+)
 * - Svelte (SvelteKit)
 * - Solid.js
 * - Preact
 * - Alpine.js
 * - WordPress
 * - Shopify
 * - Custom/Static
 *
 * @version 1.0.0
 */

import { Page } from 'playwright';
import { logger } from '../../utils/logger';
import type {
  FrameworkDetectionResult,
  DetectedFramework,
  StateManagementPattern,
  RoutingPattern,
  BuildToolPattern
} from '../../types';

export class FrameworkDetector {
  /**
   * Perform comprehensive framework detection
   */
  async detect(page: Page, html: string): Promise<FrameworkDetectionResult> {
    const startTime = Date.now();

    try {
      // Run all detection layers in parallel
      const [
        staticSignals,
        bundleSignals,
        runtimeSignals,
        domSignals,
        behavioralSignals
      ] = await Promise.all([
        this.analyzeStaticSignals(html),
        this.analyzeBundleSignals(page, html),
        this.analyzeRuntimeSignals(page),
        this.analyzeDOMSignals(page),
        this.analyzeBehavioralSignals(page)
      ]);

      // Aggregate signals and calculate framework scores
      const frameworks = this.calculateFrameworkScores({
        staticSignals,
        bundleSignals,
        runtimeSignals,
        domSignals,
        behavioralSignals
      });

      // Select primary framework (highest confidence)
      const primaryFramework = frameworks.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      // Detect patterns
      const [stateManagement, routing, buildTool] = await Promise.all([
        this.detectStateManagement(page, primaryFramework),
        this.detectRouting(page, primaryFramework),
        this.detectBuildTool(html, bundleSignals)
      ]);

      const executionTime = Date.now() - startTime;

      logger.info('Framework detection complete', {
        primaryFramework: primaryFramework.name,
        confidence: primaryFramework.confidence,
        executionTime
      });

      return {
        primaryFramework,
        detectedFrameworks: frameworks,
        stateManagement,
        routing,
        buildTool,
        metadata: {
          detectionLayers: 5,
          executionTime,
          signalCount: this.countTotalSignals({
            staticSignals,
            bundleSignals,
            runtimeSignals,
            domSignals,
            behavioralSignals
          })
        }
      };

    } catch (error) {
      logger.error('Framework detection failed:', error);

      // Return default result on failure
      return this.createDefaultResult(Date.now() - startTime);
    }
  }

  /**
   * Layer 1: Static HTML Analysis
   */
  private async analyzeStaticSignals(html: string): Promise<Record<string, number>> {
    const signals: Record<string, number> = {
      react: 0,
      vue: 0,
      angular: 0,
      svelte: 0,
      solid: 0,
      preact: 0,
      alpine: 0,
      nextjs: 0,
      nuxt: 0,
      sveltekit: 0,
      wordpress: 0,
      shopify: 0
    };

    // React signals
    if (html.includes('data-reactroot') || html.includes('data-react-helmet')) {
      signals.react += 30;
    }
    if (html.includes('__NEXT_DATA__')) {
      signals.nextjs += 40;
      signals.react += 20;
    }
    if (html.match(/react[.-]?\d+/i)) {
      signals.react += 15;
    }

    // Vue signals
    if (html.includes('data-v-') || html.includes('v-cloak')) {
      signals.vue += 30;
    }
    if (html.includes('__NUXT__') || html.includes('nuxt-link')) {
      signals.nuxt += 40;
      signals.vue += 20;
    }
    if (html.match(/vue[.-]?\d+/i)) {
      signals.vue += 15;
    }

    // Angular signals
    if (html.includes('ng-app') || html.includes('ng-controller')) {
      signals.angular += 35;
    }
    if (html.match(/angular[.-]?\d+/i)) {
      signals.angular += 15;
    }
    if (html.includes('[ng-version]')) {
      signals.angular += 25;
    }

    // Svelte signals
    if (html.includes('svelte-') || html.match(/class="svelte-\w+"/)) {
      signals.svelte += 30;
    }
    if (html.includes('sveltekit:')) {
      signals.sveltekit += 40;
      signals.svelte += 20;
    }

    // Solid.js signals
    if (html.includes('_$HY') || html.includes('solid-js')) {
      signals.solid += 30;
    }

    // Preact signals
    if (html.includes('preact')) {
      signals.preact += 20;
    }

    // Alpine.js signals
    if (html.includes('x-data') || html.includes('x-show') || html.includes('alpine')) {
      signals.alpine += 25;
    }

    // WordPress signals
    if (html.includes('wp-content') || html.includes('wp-includes')) {
      signals.wordpress += 35;
    }
    if (html.includes('generator" content="WordPress')) {
      signals.wordpress += 25;
    }

    // Shopify signals
    if (html.includes('cdn.shopify.com') || html.includes('shopify-section')) {
      signals.shopify += 35;
    }
    if (html.includes('Shopify.theme')) {
      signals.shopify += 25;
    }

    return signals;
  }

  /**
   * Layer 2: Bundle Analysis
   */
  private async analyzeBundleSignals(page: Page, html: string): Promise<Record<string, number>> {
    const signals: Record<string, number> = {
      react: 0,
      vue: 0,
      angular: 0,
      svelte: 0,
      solid: 0,
      preact: 0,
      alpine: 0,
      nextjs: 0,
      nuxt: 0,
      sveltekit: 0,
      wordpress: 0,
      shopify: 0
    };

    // Extract script src URLs from HTML
    const scriptMatches = html.matchAll(/<script[^>]*src=["']([^"']+)["']/gi);
    const scriptUrls = Array.from(scriptMatches).map(match => match[1]);

    // Analyze bundle naming patterns
    for (const url of scriptUrls) {
      const lowerUrl = url.toLowerCase();

      // React bundles
      if (lowerUrl.includes('react') || lowerUrl.includes('react-dom')) {
        signals.react += 25;
      }
      if (lowerUrl.includes('next') || lowerUrl.match(/_next\/static\//)) {
        signals.nextjs += 30;
        signals.react += 15;
      }

      // Vue bundles
      if (lowerUrl.includes('vue') || lowerUrl.includes('vue-router')) {
        signals.vue += 25;
      }
      if (lowerUrl.includes('nuxt') || lowerUrl.match(/_nuxt\//)) {
        signals.nuxt += 30;
        signals.vue += 15;
      }

      // Angular bundles
      if (lowerUrl.includes('angular') || lowerUrl.match(/main\.\w+\.js/)) {
        signals.angular += 20;
      }
      if (lowerUrl.includes('polyfills') && lowerUrl.includes('zone')) {
        signals.angular += 15;
      }

      // Svelte bundles
      if (lowerUrl.includes('svelte')) {
        signals.svelte += 25;
      }
      if (lowerUrl.includes('sveltekit') || lowerUrl.match(/_app\//)) {
        signals.sveltekit += 30;
      }

      // Build tool signatures
      if (lowerUrl.match(/webpack|bundle|chunk/)) {
        signals.react += 5; // Webpack commonly used with React
      }
      if (lowerUrl.includes('vite')) {
        signals.vue += 5; // Vite commonly used with Vue
        signals.react += 5; // But also with React
      }

      // WordPress
      if (lowerUrl.includes('wp-content') || lowerUrl.includes('wp-includes')) {
        signals.wordpress += 20;
      }

      // Shopify
      if (lowerUrl.includes('cdn.shopify.com')) {
        signals.shopify += 20;
      }
    }

    return signals;
  }

  /**
   * Layer 3: Runtime Analysis (Window Object)
   */
  private async analyzeRuntimeSignals(page: Page): Promise<Record<string, number>> {
    return await page.evaluate(() => {
      const signals: Record<string, number> = {
        react: 0,
        vue: 0,
        angular: 0,
        svelte: 0,
        solid: 0,
        preact: 0,
        alpine: 0,
        nextjs: 0,
        nuxt: 0,
        sveltekit: 0,
        wordpress: 0,
        shopify: 0
      };

      const win = window as any;

      // React detection
      if (win.React || win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        signals.react += 40;
      }
      if (win.next || win.__NEXT_DATA__) {
        signals.nextjs += 45;
        signals.react += 25;
      }

      // Vue detection
      if (win.Vue || win.__VUE__) {
        signals.vue += 40;
      }
      if (win.__NUXT__ || win.$nuxt) {
        signals.nuxt += 45;
        signals.vue += 25;
      }

      // Angular detection
      if (win.ng || win.angular || win.getAllAngularRootElements) {
        signals.angular += 40;
      }

      // Svelte detection
      if (win.__SVELTE__) {
        signals.svelte += 35;
      }
      if (win.__sveltekit) {
        signals.sveltekit += 45;
        signals.svelte += 25;
      }

      // Solid.js detection
      if (win.solidjs) {
        signals.solid += 35;
      }

      // Preact detection
      if (win.preact) {
        signals.preact += 35;
      }

      // Alpine.js detection
      if (win.Alpine) {
        signals.alpine += 40;
      }

      // WordPress detection
      if (win.wp || win.wpApiSettings) {
        signals.wordpress += 30;
      }

      // Shopify detection
      if (win.Shopify || win.ShopifyAnalytics) {
        signals.shopify += 40;
      }

      return signals;
    });
  }

  /**
   * Layer 4: DOM Analysis
   */
  private async analyzeDOMSignals(page: Page): Promise<Record<string, number>> {
    return await page.evaluate(() => {
      const signals: Record<string, number> = {
        react: 0,
        vue: 0,
        angular: 0,
        svelte: 0,
        solid: 0,
        preact: 0,
        alpine: 0,
        nextjs: 0,
        nuxt: 0,
        sveltekit: 0,
        wordpress: 0,
        shopify: 0
      };

      // React: Look for data-reactroot, _reactRootContainer
      if (document.querySelector('[data-reactroot], [data-reactid]')) {
        signals.react += 35;
      }
      const reactRoots = document.querySelectorAll('[id*="react"], [class*="react"]');
      if (reactRoots.length > 0) {
        signals.react += Math.min(reactRoots.length * 2, 20);
      }

      // Next.js: __next div
      if (document.getElementById('__next')) {
        signals.nextjs += 40;
        signals.react += 20;
      }

      // Vue: data-v- attributes
      const vueElements = document.querySelectorAll('[data-v-], [v-cloak]');
      if (vueElements.length > 0) {
        signals.vue += Math.min(vueElements.length * 3, 35);
      }

      // Nuxt: __nuxt, __layout
      if (document.getElementById('__nuxt') || document.getElementById('__layout')) {
        signals.nuxt += 40;
        signals.vue += 20;
      }

      // Angular: ng- attributes
      const ngElements = document.querySelectorAll('[ng-app], [ng-controller], [ng-version]');
      if (ngElements.length > 0) {
        signals.angular += Math.min(ngElements.length * 5, 35);
      }

      // Svelte: svelte-xyz class names
      const svelteElements = document.querySelectorAll('[class*="svelte-"]');
      if (svelteElements.length > 0) {
        signals.svelte += Math.min(svelteElements.length * 3, 35);
      }

      // Alpine.js: x- attributes
      const alpineElements = document.querySelectorAll('[x-data], [x-show], [x-if]');
      if (alpineElements.length > 0) {
        signals.alpine += Math.min(alpineElements.length * 4, 35);
      }

      // WordPress: wp- classes
      const wpElements = document.querySelectorAll('[class*="wp-"]');
      if (wpElements.length > 5) {
        signals.wordpress += 25;
      }

      // Shopify: shopify- classes
      const shopifyElements = document.querySelectorAll('[class*="shopify-"]');
      if (shopifyElements.length > 0) {
        signals.shopify += 25;
      }

      return signals;
    });
  }

  /**
   * Layer 5: Behavioral Analysis
   */
  private async analyzeBehavioralSignals(page: Page): Promise<Record<string, number>> {
    // This would analyze routing behavior, hydration patterns, etc.
    // For now, returning empty signals (can be enhanced later)
    return {
      react: 0,
      vue: 0,
      angular: 0,
      svelte: 0,
      solid: 0,
      preact: 0,
      alpine: 0,
      nextjs: 0,
      nuxt: 0,
      sveltekit: 0,
      wordpress: 0,
      shopify: 0
    };
  }

  /**
   * Calculate framework confidence scores from all signals
   */
  private calculateFrameworkScores(signals: {
    staticSignals: Record<string, number>;
    bundleSignals: Record<string, number>;
    runtimeSignals: Record<string, number>;
    domSignals: Record<string, number>;
    behavioralSignals: Record<string, number>;
  }): DetectedFramework[] {
    const { staticSignals, bundleSignals, runtimeSignals, domSignals, behavioralSignals } = signals;

    // Aggregate scores with weights
    const weights = {
      static: 0.15,
      bundle: 0.20,
      runtime: 0.35,
      dom: 0.25,
      behavioral: 0.05
    };

    const frameworkNames = Object.keys(staticSignals);
    const frameworks: DetectedFramework[] = [];

    for (const name of frameworkNames) {
      const weightedScore =
        staticSignals[name] * weights.static +
        bundleSignals[name] * weights.bundle +
        runtimeSignals[name] * weights.runtime +
        domSignals[name] * weights.dom +
        behavioralSignals[name] * weights.behavioral;

      // Normalize to 0-1 confidence score (max possible score is ~150)
      const confidence = Math.min(weightedScore / 150, 1.0);

      // Only include frameworks with >5% confidence
      if (confidence > 0.05) {
        frameworks.push({
          name: this.normalizeFrameworkName(name),
          version: 'unknown', // Version detection can be enhanced
          confidence: Math.round(confidence * 100) / 100,
          signals: {
            static: staticSignals[name],
            bundle: bundleSignals[name],
            runtime: runtimeSignals[name],
            dom: domSignals[name],
            behavioral: behavioralSignals[name]
          }
        });
      }
    }

    // Sort by confidence descending
    frameworks.sort((a, b) => b.confidence - a.confidence);

    // If no frameworks detected with >5% confidence, return "static" default
    if (frameworks.length === 0) {
      frameworks.push({
        name: 'static',
        version: 'n/a',
        confidence: 0.85,
        signals: { static: 0, bundle: 0, runtime: 0, dom: 0, behavioral: 0 }
      });
    }

    return frameworks;
  }

  /**
   * Detect state management patterns
   */
  private async detectStateManagement(
    page: Page,
    framework: DetectedFramework
  ): Promise<StateManagementPattern[]> {
    const patterns = await page.evaluate((frameworkName) => {
      const win = window as any;
      const detected: StateManagementPattern[] = [];

      // Redux
      if (win.__REDUX_DEVTOOLS_EXTENSION__ || win.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
        detected.push({
          type: 'redux',
          confidence: 0.9,
          signals: ['Redux DevTools detected']
        });
      }

      // MobX
      if (win.__mobxInstanceCount || win.__mobxGlobal) {
        detected.push({
          type: 'mobx',
          confidence: 0.85,
          signals: ['MobX global detected']
        });
      }

      // Vuex
      if (win.__VUE_DEVTOOLS_GLOBAL_HOOK__?.store) {
        detected.push({
          type: 'vuex',
          confidence: 0.9,
          signals: ['Vuex store detected']
        });
      }

      // Pinia
      if (win.__PINIA__) {
        detected.push({
          type: 'pinia',
          confidence: 0.9,
          signals: ['Pinia detected']
        });
      }

      // Context API (React)
      if (frameworkName.includes('react') || frameworkName.includes('next')) {
        detected.push({
          type: 'context-api',
          confidence: 0.6,
          signals: ['React Context (assumed)']
        });
      }

      return detected;
    }, framework.name);

    return patterns;
  }

  /**
   * Detect routing patterns
   */
  private async detectRouting(
    page: Page,
    framework: DetectedFramework
  ): Promise<RoutingPattern | null> {
    const routing = await page.evaluate((frameworkName) => {
      const win = window as any;

      // React Router
      if (win.__reactRouterVersion || document.querySelector('[data-react-router]')) {
        return {
          type: 'react-router',
          mode: 'history',
          confidence: 0.85
        };
      }

      // Next.js routing
      if (frameworkName.includes('next')) {
        return {
          type: 'nextjs-router',
          mode: 'filesystem',
          confidence: 0.95
        };
      }

      // Vue Router
      if (win.$router || document.querySelector('[data-vue-router]')) {
        return {
          type: 'vue-router',
          mode: 'history',
          confidence: 0.85
        };
      }

      // Nuxt routing
      if (frameworkName.includes('nuxt')) {
        return {
          type: 'nuxt-router',
          mode: 'filesystem',
          confidence: 0.95
        };
      }

      // Angular Router
      if (win.ng?.probe && frameworkName.includes('angular')) {
        return {
          type: 'angular-router',
          mode: 'history',
          confidence: 0.85
        };
      }

      return null;
    }, framework.name);

    return routing as RoutingPattern | null;
  }

  /**
   * Detect build tool
   */
  private async detectBuildTool(
    html: string,
    bundleSignals: Record<string, number>
  ): Promise<BuildToolPattern | null> {
    // Webpack signatures
    if (html.match(/webpack|__webpack_require__|webpackJsonp/i)) {
      return {
        type: 'webpack',
        confidence: 0.9,
        signals: ['Webpack runtime detected']
      };
    }

    // Vite signatures
    if (html.includes('/@vite/') || html.includes('vite-plugin')) {
      return {
        type: 'vite',
        confidence: 0.9,
        signals: ['Vite module imports detected']
      };
    }

    // Parcel signatures
    if (html.includes('parcel-bundler')) {
      return {
        type: 'parcel',
        confidence: 0.85,
        signals: ['Parcel detected']
      };
    }

    // Rollup signatures
    if (html.includes('rollup')) {
      return {
        type: 'rollup',
        confidence: 0.8,
        signals: ['Rollup detected']
      };
    }

    // esbuild signatures
    if (html.includes('esbuild')) {
      return {
        type: 'esbuild',
        confidence: 0.85,
        signals: ['esbuild detected']
      };
    }

    return null;
  }

  /**
   * Normalize framework names for consistency
   */
  private normalizeFrameworkName(name: string): string {
    const nameMap: Record<string, string> = {
      react: 'React',
      vue: 'Vue',
      angular: 'Angular',
      svelte: 'Svelte',
      solid: 'Solid.js',
      preact: 'Preact',
      alpine: 'Alpine.js',
      nextjs: 'Next.js',
      nuxt: 'Nuxt',
      sveltekit: 'SvelteKit',
      wordpress: 'WordPress',
      shopify: 'Shopify'
    };

    return nameMap[name] || name;
  }

  /**
   * Count total signal strength
   */
  private countTotalSignals(signals: {
    staticSignals: Record<string, number>;
    bundleSignals: Record<string, number>;
    runtimeSignals: Record<string, number>;
    domSignals: Record<string, number>;
    behavioralSignals: Record<string, number>;
  }): number {
    const { staticSignals, bundleSignals, runtimeSignals, domSignals, behavioralSignals } = signals;

    const sum = (obj: Record<string, number>) =>
      Object.values(obj).reduce((total, val) => total + val, 0);

    return (
      sum(staticSignals) +
      sum(bundleSignals) +
      sum(runtimeSignals) +
      sum(domSignals) +
      sum(behavioralSignals)
    );
  }

  /**
   * Create default result on failure
   */
  private createDefaultResult(executionTime: number): FrameworkDetectionResult {
    return {
      primaryFramework: {
        name: 'unknown',
        version: 'unknown',
        confidence: 0.1,
        signals: { static: 0, bundle: 0, runtime: 0, dom: 0, behavioral: 0 }
      },
      detectedFrameworks: [],
      stateManagement: [],
      routing: null,
      buildTool: null,
      metadata: {
        detectionLayers: 0,
        executionTime,
        signalCount: 0
      }
    };
  }
}

export default FrameworkDetector;
