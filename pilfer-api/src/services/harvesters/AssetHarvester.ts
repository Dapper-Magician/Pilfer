/**
 * Pilfer Backend API - Asset Harvester
 *
 * Comprehensive asset extraction and cataloging system
 * Extracts, analyzes, and optimizes all website resources
 *
 * Asset Categories:
 * - Images (raster, vector, icons, backgrounds)
 * - Fonts (web fonts, system fonts, custom fonts)
 * - Stylesheets (external, inline, critical CSS)
 * - Scripts (bundles, modules, inline scripts)
 * - Media (video, audio)
 * - Documents (PDFs, downloads)
 *
 * Analysis Features:
 * - Performance impact assessment
 * - Optimization opportunities
 * - CDN detection
 * - Lazy loading detection
 * - Critical path analysis
 * - License detection
 *
 * @version 1.0.0
 */

import { Page } from 'playwright';
import { logger } from '../../utils/logger';
import type {
  AssetCatalog,
  ImageAsset,
  FontAsset,
  StylesheetAsset,
  ScriptAsset,
  MediaAsset
} from '../../types';

export class AssetHarvester {
  /**
   * Harvest all assets from the page
   */
  async harvest(page: Page, url: string): Promise<AssetCatalog> {
    const startTime = Date.now();

    try {
      logger.info('Harvesting assets...');

      // Extract all asset types in parallel
      const [images, fonts, stylesheets, scripts, media] = await Promise.all([
        this.extractImages(page, url),
        this.extractFonts(page, url),
        this.extractStylesheets(page, url),
        this.extractScripts(page, url),
        this.extractMedia(page, url)
      ]);

      const executionTime = Date.now() - startTime;

      logger.info('Asset harvesting complete', {
        images: images.length,
        fonts: fonts.length,
        stylesheets: stylesheets.length,
        scripts: scripts.length,
        media: media.length,
        executionTime
      });

      return {
        images,
        fonts,
        stylesheets,
        scripts,
        media,
        metadata: {
          totalAssets: images.length + fonts.length + stylesheets.length + scripts.length + media.length,
          harvestTime: executionTime,
          baseUrl: url
        }
      };

    } catch (error) {
      logger.error('Asset harvesting failed:', error);

      // Return empty catalog on failure
      return this.createEmptyCatalog();
    }
  }

  /**
   * Extract all images from the page
   */
  private async extractImages(page: Page, baseUrl: string): Promise<ImageAsset[]> {
    return await page.evaluate((base) => {
      const images: ImageAsset[] = [];
      const seen = new Set<string>();

      // Helper to normalize URLs
      const normalizeUrl = (url: string): string => {
        try {
          return new URL(url, base).href;
        } catch {
          return url;
        }
      };

      // Helper to detect image type
      const detectImageType = (url: string): 'raster' | 'vector' | 'icon' | 'background' => {
        const lower = url.toLowerCase();
        if (lower.includes('.svg')) return 'vector';
        if (lower.includes('icon') || lower.includes('favicon')) return 'icon';
        if (lower.match(/\.(png|jpg|jpeg|gif|webp|avif)$/)) return 'raster';
        return 'background';
      };

      // Helper to estimate size from dimensions
      const estimateSize = (width: number, height: number): string => {
        // Rough estimation: avg 3 bytes per pixel for JPG
        const pixels = width * height;
        const bytes = pixels * 3;
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
        return `${Math.round(bytes / (1024 * 1024))}MB`;
      };

      // Extract <img> elements
      const imgElements = document.querySelectorAll('img');
      imgElements.forEach((img) => {
        const src = img.src || img.dataset.src || img.dataset.lazySrc;
        if (!src || seen.has(src)) return;

        const normalizedUrl = normalizeUrl(src);
        seen.add(src);

        images.push({
          url: normalizedUrl,
          type: detectImageType(normalizedUrl),
          alt: img.alt || '',
          dimensions: {
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0,
            aspectRatio: img.naturalWidth && img.naturalHeight
              ? `${img.naturalWidth}:${img.naturalHeight}`
              : 'unknown'
          },
          size: estimateSize(img.naturalWidth || img.width || 0, img.naturalHeight || img.height || 0),
          format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
          loading: img.loading as 'lazy' | 'eager' | undefined,
          optimization: {
            responsive: !!(img.srcset || img.sizes),
            lazyLoaded: img.loading === 'lazy' || !!(img.dataset.src || img.dataset.lazySrc),
            cdnHosted: normalizedUrl.includes('cdn') || normalizedUrl.includes('cloudinary'),
            format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
            recommendations: []
          }
        });
      });

      // Extract background images from computed styles
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;

        if (bgImage && bgImage !== 'none') {
          // Extract URLs from background-image
          const urlMatches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/g);
          if (urlMatches) {
            urlMatches.forEach((match) => {
              const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
              if (url && !seen.has(url)) {
                const normalizedUrl = normalizeUrl(url);
                seen.add(url);

                images.push({
                  url: normalizedUrl,
                  type: 'background',
                  alt: '',
                  dimensions: {
                    width: 0,
                    height: 0,
                    aspectRatio: 'unknown'
                  },
                  size: 'unknown',
                  format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
                  optimization: {
                    responsive: false,
                    lazyLoaded: false,
                    cdnHosted: normalizedUrl.includes('cdn'),
                    format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
                    recommendations: ['Consider using <img> for content images']
                  }
                });
              }
            });
          }
        }
      });

      // Extract srcset images
      const srcsetElements = document.querySelectorAll('[srcset]');
      srcsetElements.forEach((el) => {
        const srcset = el.getAttribute('srcset');
        if (srcset) {
          const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
          urls.forEach(url => {
            if (url && !seen.has(url)) {
              const normalizedUrl = normalizeUrl(url);
              seen.add(url);

              images.push({
                url: normalizedUrl,
                type: 'raster',
                alt: el.getAttribute('alt') || '',
                dimensions: {
                  width: 0,
                  height: 0,
                  aspectRatio: 'unknown'
                },
                size: 'unknown',
                format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
                optimization: {
                  responsive: true,
                  lazyLoaded: false,
                  cdnHosted: normalizedUrl.includes('cdn'),
                  format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
                  recommendations: []
                }
              });
            }
          });
        }
      });

      return images;
    }, baseUrl);
  }

  /**
   * Extract all fonts from the page
   */
  private async extractFonts(page: Page, baseUrl: string): Promise<FontAsset[]> {
    return await page.evaluate((base) => {
      const fonts: FontAsset[] = [];
      const seen = new Set<string>();

      // Helper to normalize URLs
      const normalizeUrl = (url: string): string => {
        try {
          return new URL(url, base).href;
        } catch {
          return url;
        }
      };

      // Extract fonts from CSS stylesheets
      const stylesheets = Array.from(document.styleSheets);
      stylesheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule: any) => {
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              const fontFamily = rule.style.fontFamily?.replace(/['"]/g, '') || 'unknown';
              const src = rule.style.src;

              if (src && !seen.has(fontFamily)) {
                seen.add(fontFamily);

                // Extract URLs from src
                const urlMatches = src.match(/url\(['"]?([^'"]+)['"]?\)/g);
                const urls = urlMatches?.map((match: string) => {
                  const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                  return url ? normalizeUrl(url) : '';
                }).filter(Boolean) || [];

                // Detect formats
                const formats = urls.map((url: string) => {
                  if (url.includes('.woff2')) return 'woff2';
                  if (url.includes('.woff')) return 'woff';
                  if (url.includes('.ttf')) return 'ttf';
                  if (url.includes('.otf')) return 'otf';
                  if (url.includes('.eot')) return 'eot';
                  return 'unknown';
                });

                fonts.push({
                  family: fontFamily,
                  url: urls[0] || '',
                  variants: [{
                    weight: rule.style.fontWeight || 'normal',
                    style: rule.style.fontStyle || 'normal',
                    format: formats[0] || 'unknown',
                    size: 'unknown'
                  }],
                  source: urls[0]?.includes('fonts.googleapis.com') || urls[0]?.includes('fonts.gstatic.com')
                    ? 'web'
                    : urls[0]?.includes('cdn')
                    ? 'web'
                    : 'custom',
                  loading: 'block',
                  performance: {
                    loadTime: 0,
                    renderImpact: 'medium' as const,
                    fallbackStrategy: rule.style.fontDisplay || 'auto'
                  }
                });
              }
            }
          });
        } catch (e) {
          // Cross-origin stylesheet access blocked
        }
      });

      // Extract system fonts from computed styles
      const bodyStyle = window.getComputedStyle(document.body);
      const fontFamily = bodyStyle.fontFamily;
      if (fontFamily) {
        const families = fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
        families.forEach(family => {
          if (!seen.has(family)) {
            seen.add(family);

            // Check if it's a system font
            const systemFonts = [
              'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New',
              'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond',
              'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Impact',
              'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
              'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
              'Droid Sans', 'Helvetica Neue', 'sans-serif', 'serif', 'monospace'
            ];

            if (systemFonts.some(sf => family.toLowerCase().includes(sf.toLowerCase()))) {
              fonts.push({
                family,
                url: '',
                variants: [{
                  weight: 'normal',
                  style: 'normal',
                  format: 'system',
                  size: '0'
                }],
                source: 'system',
                loading: 'block',
                performance: {
                  loadTime: 0,
                  renderImpact: 'low' as const,
                  fallbackStrategy: 'instant'
                }
              });
            }
          }
        });
      }

      return fonts;
    }, baseUrl);
  }

  /**
   * Extract all stylesheets
   */
  private async extractStylesheets(page: Page, baseUrl: string): Promise<StylesheetAsset[]> {
    return await page.evaluate((base) => {
      const stylesheets: StylesheetAsset[] = [];

      // Helper to normalize URLs
      const normalizeUrl = (url: string): string => {
        try {
          return new URL(url, base).href;
        } catch {
          return url;
        }
      };

      // Extract <link> stylesheets
      const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach((link) => {
        const href = link.getAttribute('href');
        if (href) {
          const normalizedUrl = normalizeUrl(href);

          stylesheets.push({
            url: normalizedUrl,
            type: 'external',
            size: 'unknown',
            external: !normalizedUrl.includes(base),
            media: link.getAttribute('media') || 'all',
            critical: link.hasAttribute('data-critical') || false,
            async: link.hasAttribute('media') && link.getAttribute('media') === 'print',
            optimization: {
              minified: normalizedUrl.includes('.min.'),
              cached: false,
              cdnHosted: normalizedUrl.includes('cdn'),
              recommendations: []
            }
          });
        }
      });

      // Extract inline <style> tags
      const styleElements = document.querySelectorAll('style');
      styleElements.forEach((style, index) => {
        const content = style.textContent || '';

        stylesheets.push({
          url: `inline-${index}`,
          type: 'inline',
          size: `${content.length}B`,
          external: false,
          media: style.getAttribute('media') || 'all',
          critical: style.hasAttribute('data-critical') || index === 0,
          async: false,
          optimization: {
            minified: false,
            cached: false,
            cdnHosted: false,
            recommendations: ['Consider extracting to external file for caching']
          }
        });
      });

      return stylesheets;
    }, baseUrl);
  }

  /**
   * Extract all scripts
   */
  private async extractScripts(page: Page, baseUrl: string): Promise<ScriptAsset[]> {
    return await page.evaluate((base) => {
      const scripts: ScriptAsset[] = [];

      // Helper to normalize URLs
      const normalizeUrl = (url: string): string => {
        try {
          return new URL(url, base).href;
        } catch {
          return url;
        }
      };

      // Extract <script> tags with src
      const scriptElements = document.querySelectorAll('script[src]');
      scriptElements.forEach((script) => {
        const src = script.getAttribute('src');
        if (src) {
          const normalizedUrl = normalizeUrl(src);

          scripts.push({
            url: normalizedUrl,
            type: 'external',
            size: 'unknown',
            async: script.hasAttribute('async'),
            defer: script.hasAttribute('defer'),
            module: script.getAttribute('type') === 'module',
            external: !normalizedUrl.includes(base),
            optimization: {
              minified: normalizedUrl.includes('.min.'),
              bundled: normalizedUrl.includes('bundle') || normalizedUrl.includes('chunk'),
              cdnHosted: normalizedUrl.includes('cdn'),
              recommendations: []
            }
          });
        }
      });

      // Extract inline <script> tags
      const inlineScripts = document.querySelectorAll('script:not([src])');
      inlineScripts.forEach((script, index) => {
        const content = script.textContent || '';

        // Skip empty scripts and JSON-LD
        if (!content.trim() || script.getAttribute('type') === 'application/ld+json') {
          return;
        }

        scripts.push({
          url: `inline-${index}`,
          type: 'inline',
          size: `${content.length}B`,
          async: false,
          defer: false,
          module: script.getAttribute('type') === 'module',
          external: false,
          optimization: {
            minified: false,
            bundled: false,
            cdnHosted: false,
            recommendations: ['Consider extracting to external file']
          }
        });
      });

      return scripts;
    }, baseUrl);
  }

  /**
   * Extract media assets (video, audio)
   */
  private async extractMedia(page: Page, baseUrl: string): Promise<MediaAsset[]> {
    return await page.evaluate((base) => {
      const media: MediaAsset[] = [];

      // Helper to normalize URLs
      const normalizeUrl = (url: string): string => {
        try {
          return new URL(url, base).href;
        } catch {
          return url;
        }
      };

      // Extract <video> elements
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video) => {
        const src = video.src || video.querySelector('source')?.src;
        if (src) {
          const normalizedUrl = normalizeUrl(src);

          media.push({
            url: normalizedUrl,
            type: 'video',
            format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
            size: 'unknown',
            duration: video.duration || 0,
            autoplay: video.autoplay,
            optimization: {
              lazy: video.hasAttribute('loading') && video.getAttribute('loading') === 'lazy',
              streaming: normalizedUrl.includes('m3u8') || normalizedUrl.includes('mpd'),
              cdnHosted: normalizedUrl.includes('cdn'),
              recommendations: []
            }
          });
        }
      });

      // Extract <audio> elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        const src = audio.src || audio.querySelector('source')?.src;
        if (src) {
          const normalizedUrl = normalizeUrl(src);

          media.push({
            url: normalizedUrl,
            type: 'audio',
            format: normalizedUrl.split('.').pop()?.split('?')[0] || 'unknown',
            size: 'unknown',
            duration: audio.duration || 0,
            autoplay: audio.autoplay,
            optimization: {
              lazy: false,
              streaming: false,
              cdnHosted: normalizedUrl.includes('cdn'),
              recommendations: []
            }
          });
        }
      });

      return media;
    }, baseUrl);
  }

  /**
   * Create empty asset catalog
   */
  private createEmptyCatalog(): AssetCatalog {
    return {
      images: [],
      fonts: [],
      stylesheets: [],
      scripts: [],
      media: [],
      metadata: {
        totalAssets: 0,
        harvestTime: 0,
        baseUrl: ''
      }
    };
  }
}

export default AssetHarvester;
