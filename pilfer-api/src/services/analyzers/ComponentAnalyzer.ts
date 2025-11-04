/**
 * Pilfer Backend API - Component Analyzer
 *
 * Deep component tree analysis and pattern detection
 * Extracts hierarchical component structure from DOM with framework-aware analysis
 *
 * Analysis Capabilities:
 * - Component tree extraction (hierarchical structure)
 * - Framework-specific component identification
 * - Component library detection (Material-UI, Ant Design, Bootstrap, etc.)
 * - Reusable pattern identification
 * - Component complexity analysis
 * - Props/attributes extraction
 * - State binding detection
 * - Event handler detection
 *
 * Supported Frameworks:
 * - React (component names from React DevTools, data attributes)
 * - Vue (component registration, v-* directives)
 * - Angular (component selectors, ng-* attributes)
 * - Svelte (component class names, svelte-* attributes)
 * - Web Components (custom elements)
 *
 * @version 1.0.0
 */

import { Page } from 'playwright';
import { logger } from '../../utils/logger';
import type {
  ComponentNode,
  ComponentAnalysisResult,
  ComponentPattern,
  ComponentLibrary,
  FrameworkDetectionResult
} from '../../types';

export class ComponentAnalyzer {
  /**
   * Analyze component tree and patterns
   */
  async analyze(
    page: Page,
    frameworkDetection: FrameworkDetectionResult
  ): Promise<ComponentAnalysisResult> {
    const startTime = Date.now();

    try {
      logger.info('Analyzing component tree...');

      const framework = frameworkDetection.primaryFramework.name;

      // Extract component tree with framework-specific logic
      const componentTree = await this.extractComponentTree(page, framework);

      // Detect component libraries in parallel
      const [libraries, patterns] = await Promise.all([
        this.detectComponentLibraries(page, framework),
        this.detectPatterns(componentTree)
      ]);

      const executionTime = Date.now() - startTime;

      logger.info('Component analysis complete', {
        totalComponents: this.countComponents(componentTree),
        libraries: libraries.length,
        patterns: patterns.length,
        executionTime
      });

      return {
        componentTree,
        libraries,
        patterns,
        metadata: {
          totalComponents: this.countComponents(componentTree),
          maxDepth: this.calculateDepth(componentTree),
          analysisTime: executionTime,
          framework
        }
      };

    } catch (error) {
      logger.error('Component analysis failed:', error);

      return this.createEmptyResult();
    }
  }

  /**
   * Extract component tree with framework-specific logic
   */
  private async extractComponentTree(page: Page, framework: string): Promise<ComponentNode[]> {
    return await page.evaluate((fw) => {
      const tree: ComponentNode[] = [];

      /**
       * Helper: Get component name from element
       */
      const getComponentName = (element: Element, framework: string): string => {
        // React detection
        if (framework.toLowerCase().includes('react') || framework.toLowerCase().includes('next')) {
          // Check for React Fiber properties
          const fiberKey = Object.keys(element).find(key =>
            key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
          );

          if (fiberKey) {
            const fiber = (element as any)[fiberKey];
            if (fiber?.type?.name) return fiber.type.name;
            if (fiber?.elementType?.name) return fiber.elementType.name;
            if (fiber?._debugSource?.fileName) {
              const match = fiber._debugSource.fileName.match(/\/([^/]+)\.(?:jsx?|tsx?)$/);
              if (match) return match[1];
            }
          }

          // Check for data-reactroot or data-reactid
          if (element.hasAttribute('data-reactroot')) return 'Root';
          if (element.hasAttribute('data-reactid')) return 'ReactComponent';
        }

        // Vue detection
        if (framework.toLowerCase().includes('vue') || framework.toLowerCase().includes('nuxt')) {
          // Check for __vue__ property
          const vue = (element as any).__vue__;
          if (vue?.$options?.name) return vue.$options.name;
          if (vue?.$options?._componentTag) return vue.$options._componentTag;

          // Check for v-cloak or data-v-* attributes
          if (element.hasAttribute('v-cloak')) return 'VueComponent';
          const vAttr = Array.from(element.attributes).find(attr => attr.name.startsWith('data-v-'));
          if (vAttr) return 'VueComponent';
        }

        // Angular detection
        if (framework.toLowerCase().includes('angular')) {
          // Check for ng-version
          if (element.hasAttribute('ng-version')) return 'AngularRoot';

          // Check for component selector
          const ngComponent = (element as any).__ngContext__;
          if (ngComponent) return 'AngularComponent';

          // Check for ng-* attributes
          const ngAttr = Array.from(element.attributes).find(attr => attr.name.startsWith('ng-'));
          if (ngAttr) return 'AngularComponent';
        }

        // Svelte detection
        if (framework.toLowerCase().includes('svelte')) {
          // Check for svelte-* class names
          const svelteClass = Array.from(element.classList).find(cls => cls.startsWith('svelte-'));
          if (svelteClass) return 'SvelteComponent';
        }

        // Web Component detection (custom elements)
        if (element.tagName.includes('-')) {
          return element.tagName.toLowerCase();
        }

        // Fallback: use tag name
        return element.tagName.toLowerCase();
      };

      /**
       * Helper: Check if element is a component boundary
       */
      const isComponentBoundary = (element: Element, framework: string): boolean => {
        const tagName = element.tagName.toLowerCase();

        // Custom elements are always components
        if (tagName.includes('-')) return true;

        // React component indicators
        if (framework.toLowerCase().includes('react') || framework.toLowerCase().includes('next')) {
          if (element.hasAttribute('data-reactroot')) return true;
          if (element.hasAttribute('data-reactid')) return true;
          const reactKey = Object.keys(element).find(key =>
            key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
          );
          if (reactKey) return true;
        }

        // Vue component indicators
        if (framework.toLowerCase().includes('vue') || framework.toLowerCase().includes('nuxt')) {
          if ((element as any).__vue__) return true;
          if (element.hasAttribute('v-cloak')) return true;
          if (Array.from(element.attributes).some(attr => attr.name.startsWith('data-v-'))) return true;
        }

        // Angular component indicators
        if (framework.toLowerCase().includes('angular')) {
          if ((element as any).__ngContext__) return true;
          if (Array.from(element.attributes).some(attr => attr.name.startsWith('ng-'))) return true;
        }

        // Svelte component indicators
        if (framework.toLowerCase().includes('svelte')) {
          if (Array.from(element.classList).some(cls => cls.startsWith('svelte-'))) return true;
        }

        // Semantic HTML5 elements are often component boundaries
        const semanticElements = [
          'header', 'footer', 'nav', 'main', 'article', 'section', 'aside'
        ];
        if (semanticElements.includes(tagName)) return true;

        // Common component wrapper classes
        const componentClasses = ['component', 'widget', 'module', 'block', 'card'];
        if (componentClasses.some(cls =>
          Array.from(element.classList).some(c => c.toLowerCase().includes(cls))
        )) {
          return true;
        }

        return false;
      };

      /**
       * Helper: Extract component attributes and props
       */
      const extractAttributes = (element: Element): Record<string, string> => {
        const attrs: Record<string, string> = {};

        Array.from(element.attributes).forEach(attr => {
          // Skip internal framework attributes
          if (attr.name.startsWith('__')) return;
          if (attr.name.startsWith('_')) return;

          attrs[attr.name] = attr.value;
        });

        return attrs;
      };

      /**
       * Helper: Calculate component complexity score
       */
      const calculateComplexity = (element: Element): number => {
        let score = 1; // Base score

        // Child elements
        score += element.children.length;

        // Attributes
        score += element.attributes.length * 0.5;

        // Event handlers (approximate)
        score += Array.from(element.attributes)
          .filter(attr => attr.name.startsWith('on') || attr.name.startsWith('@'))
          .length * 2;

        // Conditional rendering indicators
        if (element.hasAttribute('v-if') || element.hasAttribute('v-show')) score += 3;
        if (element.hasAttribute('*ngIf') || element.hasAttribute('*ngFor')) score += 3;

        // List rendering indicators
        if (element.hasAttribute('v-for') || element.hasAttribute('*ngFor')) score += 5;

        return Math.round(score);
      };

      /**
       * Recursive tree builder
       */
      const buildTree = (element: Element, depth: number = 0): ComponentNode | null => {
        // Limit depth to prevent infinite recursion
        if (depth > 20) return null;

        // Skip script, style, and meta tags
        const skipTags = ['script', 'style', 'link', 'meta', 'noscript'];
        if (skipTags.includes(element.tagName.toLowerCase())) return null;

        const isComponent = isComponentBoundary(element, fw);

        // If not a component boundary, process children directly
        if (!isComponent && depth > 0) {
          const children: ComponentNode[] = [];
          Array.from(element.children).forEach(child => {
            const childNode = buildTree(child, depth + 1);
            if (childNode) children.push(childNode);
          });
          return children.length === 1 ? children[0] : null;
        }

        // Build component node
        const node: ComponentNode = {
          name: getComponentName(element, fw),
          type: element.tagName.toLowerCase(),
          attributes: extractAttributes(element),
          children: [],
          metadata: {
            depth,
            complexity: calculateComplexity(element),
            hasState: !!(element as any).__vue__ || !!(element as any).__reactFiber,
            hasEvents: Array.from(element.attributes).some(attr =>
              attr.name.startsWith('on') || attr.name.startsWith('@') || attr.name.startsWith('v-on')
            ),
            isCustomElement: element.tagName.includes('-'),
            classes: Array.from(element.classList),
            id: element.id || undefined
          }
        };

        // Process children
        Array.from(element.children).forEach(child => {
          const childNode = buildTree(child, depth + 1);
          if (childNode) node.children!.push(childNode);
        });

        return node;
      };

      // Start from body or main app container
      const appRoot = document.querySelector('#root, #app, #__next, #__nuxt, [ng-version], body');
      if (appRoot) {
        const rootNode = buildTree(appRoot, 0);
        if (rootNode) tree.push(rootNode);
      }

      return tree;
    }, framework);
  }

  /**
   * Detect component libraries
   */
  private async detectComponentLibraries(page: Page, framework: string): Promise<ComponentLibrary[]> {
    return await page.evaluate((fw) => {
      const libraries: ComponentLibrary[] = [];
      const win = window as any;

      // Material-UI (React)
      if (win.MaterialUI || document.querySelector('[class*="MuiButton"], [class*="MuiCard"]')) {
        libraries.push({
          name: 'Material-UI',
          confidence: 0.9,
          components: Array.from(document.querySelectorAll('[class*="Mui"]'))
            .map(el => Array.from(el.classList).find(c => c.startsWith('Mui'))?.replace(/Mui(\w+)-.*/, '$1'))
            .filter((v, i, a) => v && a.indexOf(v) === i) as string[]
        });
      }

      // Ant Design (React)
      if (win.antd || document.querySelector('[class*="ant-"]')) {
        libraries.push({
          name: 'Ant Design',
          confidence: 0.9,
          components: Array.from(document.querySelectorAll('[class*="ant-"]'))
            .map(el => Array.from(el.classList).find(c => c.startsWith('ant-'))?.replace(/ant-(\w+)-?.*/, '$1'))
            .filter((v, i, a) => v && a.indexOf(v) === i) as string[]
        });
      }

      // Bootstrap
      if (win.bootstrap || document.querySelector('[class*="btn"], [class*="navbar"], [class*="card"]')) {
        const bootstrapClasses = ['btn', 'navbar', 'card', 'modal', 'alert', 'badge', 'dropdown'];
        const hasBootstrap = bootstrapClasses.some(cls =>
          document.querySelector(`[class*="${cls}"]`)
        );

        if (hasBootstrap) {
          libraries.push({
            name: 'Bootstrap',
            confidence: 0.8,
            components: bootstrapClasses.filter(cls => document.querySelector(`[class*="${cls}"]`))
          });
        }
      }

      // Tailwind CSS
      const tailwindIndicators = ['flex', 'grid', 'px-', 'py-', 'bg-', 'text-'];
      const hasTailwind = tailwindIndicators.some(indicator =>
        Array.from(document.querySelectorAll('[class]')).some(el =>
          Array.from(el.classList).some(c => c.includes(indicator))
        )
      );

      if (hasTailwind) {
        libraries.push({
          name: 'Tailwind CSS',
          confidence: 0.7,
          components: ['utility-classes']
        });
      }

      // Vuetify (Vue)
      if (win.Vuetify || document.querySelector('[class*="v-btn"], [class*="v-card"]')) {
        libraries.push({
          name: 'Vuetify',
          confidence: 0.9,
          components: Array.from(document.querySelectorAll('[class*="v-"]'))
            .map(el => Array.from(el.classList).find(c => c.startsWith('v-'))?.replace(/v-(\w+).*/, '$1'))
            .filter((v, i, a) => v && a.indexOf(v) === i) as string[]
        });
      }

      // Element UI (Vue)
      if (win.ELEMENT || document.querySelector('[class*="el-"]')) {
        libraries.push({
          name: 'Element UI',
          confidence: 0.9,
          components: Array.from(document.querySelectorAll('[class*="el-"]'))
            .map(el => Array.from(el.classList).find(c => c.startsWith('el-'))?.replace(/el-(\w+).*/, '$1'))
            .filter((v, i, a) => v && a.indexOf(v) === i) as string[]
        });
      }

      // Chakra UI (React)
      if (document.querySelector('[class*="chakra-"]')) {
        libraries.push({
          name: 'Chakra UI',
          confidence: 0.85,
          components: Array.from(document.querySelectorAll('[class*="chakra-"]'))
            .map(el => Array.from(el.classList).find(c => c.startsWith('chakra-'))?.replace(/chakra-(\w+).*/, '$1'))
            .filter((v, i, a) => v && a.indexOf(v) === i) as string[]
        });
      }

      return libraries;
    }, framework);
  }

  /**
   * Detect reusable patterns in component tree
   */
  private async detectPatterns(tree: ComponentNode[]): Promise<ComponentPattern[]> {
    const patterns: ComponentPattern[] = [];

    // Helper to flatten tree
    const flatten = (nodes: ComponentNode[]): ComponentNode[] => {
      const result: ComponentNode[] = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.children) {
          result.push(...flatten(node.children));
        }
      });
      return result;
    };

    const allComponents = flatten(tree);

    // Detect repeated component names (indicating reusable components)
    const componentCounts = new Map<string, number>();
    allComponents.forEach(comp => {
      const count = componentCounts.get(comp.name) || 0;
      componentCounts.set(comp.name, count + 1);
    });

    componentCounts.forEach((count, name) => {
      if (count >= 3) { // Repeated 3+ times = pattern
        patterns.push({
          type: 'repeated-component',
          name: name,
          occurrences: count,
          confidence: Math.min(count / 10, 1.0),
          description: `Component "${name}" appears ${count} times, indicating a reusable pattern`
        });
      }
    });

    // Detect common UI patterns
    const hasHeader = allComponents.some(c => c.name.toLowerCase().includes('header'));
    const hasFooter = allComponents.some(c => c.name.toLowerCase().includes('footer'));
    const hasNav = allComponents.some(c => c.name.toLowerCase().includes('nav'));
    const hasSidebar = allComponents.some(c => c.name.toLowerCase().includes('sidebar'));

    if (hasHeader && hasFooter && hasNav) {
      patterns.push({
        type: 'layout-pattern',
        name: 'Standard Web Layout',
        occurrences: 1,
        confidence: 0.95,
        description: 'Standard web layout with header, navigation, and footer'
      });
    }

    if (hasSidebar) {
      patterns.push({
        type: 'layout-pattern',
        name: 'Sidebar Layout',
        occurrences: 1,
        confidence: 0.9,
        description: 'Layout includes sidebar navigation'
      });
    }

    // Detect card/grid patterns
    const cards = allComponents.filter(c => c.name.toLowerCase().includes('card'));
    if (cards.length >= 3) {
      patterns.push({
        type: 'ui-pattern',
        name: 'Card Grid',
        occurrences: cards.length,
        confidence: 0.85,
        description: `Grid of ${cards.length} card components`
      });
    }

    // Detect form patterns
    const forms = allComponents.filter(c =>
      c.name.toLowerCase().includes('form') ||
      c.name.toLowerCase().includes('input') ||
      c.type === 'form'
    );
    if (forms.length >= 2) {
      patterns.push({
        type: 'ui-pattern',
        name: 'Form Pattern',
        occurrences: forms.length,
        confidence: 0.8,
        description: 'Form-based user input pattern detected'
      });
    }

    return patterns;
  }

  /**
   * Count total components in tree
   */
  private countComponents(tree: ComponentNode[]): number {
    let count = tree.length;
    tree.forEach(node => {
      if (node.children) {
        count += this.countComponents(node.children);
      }
    });
    return count;
  }

  /**
   * Calculate maximum depth of component tree
   */
  private calculateDepth(tree: ComponentNode[], currentDepth: number = 0): number {
    if (tree.length === 0) return currentDepth;

    let maxDepth = currentDepth;
    tree.forEach(node => {
      if (node.children && node.children.length > 0) {
        const childDepth = this.calculateDepth(node.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    });

    return maxDepth;
  }

  /**
   * Create empty result on failure
   */
  private createEmptyResult(): ComponentAnalysisResult {
    return {
      componentTree: [],
      libraries: [],
      patterns: [],
      metadata: {
        totalComponents: 0,
        maxDepth: 0,
        analysisTime: 0,
        framework: 'unknown'
      }
    };
  }
}

export default ComponentAnalyzer;
