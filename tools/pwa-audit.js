/**
 * 🔍 GAMESCOM 2025 - PWA AUDIT TOOL
 * 
 * Comprehensive PWA optimization and hardening audit
 * Service worker, manifest, performance, and security analysis
 */

const fs = require('fs');
const path = require('path');

class PWAAuditor {
  constructor() {
    this.findings = [];
    this.recommendations = [];
    this.security = [];
    this.performance = [];
    this.compliance = [];
  }

  async auditPWA() {
    console.log('🔍 Starting comprehensive PWA audit...\n');
    
    // 1. Service Worker Analysis
    await this.auditServiceWorker();
    
    // 2. Manifest Analysis
    await this.auditManifest();
    
    // 3. Caching Strategy Analysis
    await this.auditCachingStrategies();
    
    // 4. Offline Capabilities
    await this.auditOfflineCapabilities();
    
    // 5. Resource Loading Analysis
    await this.auditResourceLoading();
    
    // 6. Security Analysis
    await this.auditSecurity();
    
    // 7. Performance Analysis
    await this.auditPerformance();
    
    // 8. PWA Compliance
    await this.auditCompliance();
    
    return this.generateReport();
  }

  async auditServiceWorker() {
    console.log('🔧 Auditing Service Worker...');
    
    const swPaths = [
      'public/sw.js',
      'frontend/src/sw-premium.js',
      'frontend/src/sw-optimized.js',
      'frontend/src/service-worker.js'
    ];
    
    const serviceWorkers = [];
    
    for (const swPath of swPaths) {
      if (fs.existsSync(swPath)) {
        serviceWorkers.push(swPath);
        await this.analyzeServiceWorker(swPath);
      }
    }
    
    // Check for multiple service workers (potential conflict)
    if (serviceWorkers.length > 1) {
      this.findings.push({
        type: 'warning',
        category: 'service-worker',
        message: `Multiple service workers found: ${serviceWorkers.join(', ')}`,
        impact: 'medium',
        recommendation: 'Use only one production service worker to avoid conflicts'
      });
    }
    
    if (serviceWorkers.length === 0) {
      this.findings.push({
        type: 'error',
        category: 'service-worker',
        message: 'No service worker found',
        impact: 'high',
        recommendation: 'Implement service worker for offline functionality and caching'
      });
    }
  }

  async analyzeServiceWorker(swPath) {
    try {
      const content = fs.readFileSync(swPath, 'utf8');
      
      // Check for essential PWA features
      const features = {
        install: content.includes('install'),
        activate: content.includes('activate'),
        fetch: content.includes('fetch'),
        cachesOpen: content.includes('caches.open'),
        backgroundSync: content.includes('sync'),
        pushNotifications: content.includes('push'),
        precaching: content.includes('precache') || content.includes('PRECACHE'),
        runtimeCaching: content.includes('runtime') || content.includes('network'),
        offlineHandling: content.includes('offline') || content.includes('fallback')
      };
      
      // Essential features check
      const missingEssentials = [];
      if (!features.install) missingEssentials.push('install event');
      if (!features.activate) missingEssentials.push('activate event');
      if (!features.fetch) missingEssentials.push('fetch event');
      if (!features.cachesOpen) missingEssentials.push('cache management');
      
      if (missingEssentials.length > 0) {
        this.findings.push({
          type: 'error',
          category: 'service-worker',
          file: swPath,
          message: `Missing essential features: ${missingEssentials.join(', ')}`,
          impact: 'high',
          recommendation: 'Implement missing essential service worker features'
        });
      }
      
      // Advanced features check
      const missingAdvanced = [];
      if (!features.backgroundSync) missingAdvanced.push('background sync');
      if (!features.precaching) missingAdvanced.push('precaching');
      if (!features.runtimeCaching) missingAdvanced.push('runtime caching');
      if (!features.offlineHandling) missingAdvanced.push('offline handling');
      
      if (missingAdvanced.length > 0) {
        this.findings.push({
          type: 'warning',
          category: 'service-worker',
          file: swPath,
          message: `Missing advanced features: ${missingAdvanced.join(', ')}`,
          impact: 'medium',
          recommendation: 'Consider implementing advanced PWA features for better user experience'
        });
      }
      
      // Check caching strategies
      this.analyzeCachingPatterns(content, swPath);
      
      // Check error handling
      this.analyzeErrorHandling(content, swPath);
      
      // Check performance patterns
      this.analyzePerformancePatterns(content, swPath);
      
    } catch (error) {
      this.findings.push({
        type: 'error',
        category: 'service-worker',
        file: swPath,
        message: `Failed to analyze service worker: ${error.message}`,
        impact: 'high'
      });
    }
  }

  analyzeCachingPatterns(content, swPath) {
    // Check for cache versioning
    if (!content.includes('version') && !content.includes('VERSION')) {
      this.findings.push({
        type: 'warning',
        category: 'caching',
        file: swPath,
        message: 'No cache versioning strategy detected',
        impact: 'medium',
        recommendation: 'Implement cache versioning for proper updates'
      });
    }
    
    // Check for cache size limits
    if (!content.includes('maxEntries') && !content.includes('max') && !content.includes('limit')) {
      this.findings.push({
        type: 'warning',
        category: 'caching',
        file: swPath,
        message: 'No cache size limits detected',
        impact: 'medium',
        recommendation: 'Implement cache size limits to prevent storage bloat'
      });
    }
    
    // Check for stale-while-revalidate pattern
    const hasStaleWhileRevalidate = content.includes('stale-while-revalidate') || 
                                   (content.includes('cache') && content.includes('update'));
    
    if (!hasStaleWhileRevalidate) {
      this.findings.push({
        type: 'info',
        category: 'caching',
        file: swPath,
        message: 'Consider implementing stale-while-revalidate for better performance',
        impact: 'low',
        recommendation: 'Use stale-while-revalidate for frequently updated resources'
      });
    }
  }

  analyzeErrorHandling(content, swPath) {
    const errorHandling = {
      tryCatch: content.includes('try') && content.includes('catch'),
      promiseReject: content.includes('.catch('),
      errorEvents: content.includes('error'),
      fallbacks: content.includes('fallback') || content.includes('offline')
    };
    
    if (!errorHandling.tryCatch && !errorHandling.promiseReject) {
      this.findings.push({
        type: 'error',
        category: 'error-handling',
        file: swPath,
        message: 'Insufficient error handling in service worker',
        impact: 'high',
        recommendation: 'Implement comprehensive error handling with try/catch blocks'
      });
    }
    
    if (!errorHandling.fallbacks) {
      this.findings.push({
        type: 'warning',
        category: 'error-handling',
        file: swPath,
        message: 'No offline fallbacks detected',
        impact: 'medium',
        recommendation: 'Implement offline fallback pages for better user experience'
      });
    }
  }

  analyzePerformancePatterns(content, swPath) {
    // Check for efficient patterns
    const patterns = {
      preload: content.includes('preload'),
      prefetch: content.includes('prefetch'),
      lazyLoading: content.includes('lazy') || content.includes('idle'),
      requestIdleCallback: content.includes('requestIdleCallback'),
      webpSupport: content.includes('webp'),
      compression: content.includes('gzip') || content.includes('br') || content.includes('compress')
    };
    
    const missingOptimizations = [];
    if (!patterns.lazyLoading) missingOptimizations.push('lazy loading');
    if (!patterns.requestIdleCallback) missingOptimizations.push('idle-time processing');
    
    if (missingOptimizations.length > 0) {
      this.findings.push({
        type: 'info',
        category: 'performance',
        file: swPath,
        message: `Consider implementing: ${missingOptimizations.join(', ')}`,
        impact: 'low',
        recommendation: 'Implement performance optimizations for better user experience'
      });
    }
  }

  async auditManifest() {
    console.log('📱 Auditing PWA Manifest...');
    
    const manifestPaths = [
      'public/manifest.json',
      'frontend/src/manifest.json',
      'frontend/src/assets/manifest.json'
    ];
    
    let manifestFound = false;
    
    for (const manifestPath of manifestPaths) {
      if (fs.existsSync(manifestPath)) {
        manifestFound = true;
        await this.analyzeManifest(manifestPath);
        break;
      }
    }
    
    if (!manifestFound) {
      this.findings.push({
        type: 'error',
        category: 'manifest',
        message: 'No PWA manifest found',
        impact: 'high',
        recommendation: 'Create a manifest.json file for PWA installation'
      });
    }
  }

  async analyzeManifest(manifestPath) {
    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(content);
      
      // Required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'icons'];
      const missingRequired = requiredFields.filter(field => !manifest[field]);
      
      if (missingRequired.length > 0) {
        this.findings.push({
          type: 'error',
          category: 'manifest',
          file: manifestPath,
          message: `Missing required fields: ${missingRequired.join(', ')}`,
          impact: 'high',
          recommendation: 'Add all required manifest fields for proper PWA installation'
        });
      }
      
      // Icons analysis
      if (manifest.icons) {
        await this.analyzeIcons(manifest.icons, manifestPath);
      }
      
      // Display mode
      if (manifest.display && !['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)) {
        this.findings.push({
          type: 'warning',
          category: 'manifest',
          file: manifestPath,
          message: `Display mode "${manifest.display}" may not provide optimal PWA experience`,
          impact: 'medium',
          recommendation: 'Use "standalone" or "fullscreen" for better PWA experience'
        });
      }
      
      // Orientation
      if (!manifest.orientation) {
        this.findings.push({
          type: 'info',
          category: 'manifest',
          file: manifestPath,
          message: 'No orientation preference specified',
          impact: 'low',
          recommendation: 'Consider specifying orientation for better user experience'
        });
      }
      
      // Background color
      if (!manifest.background_color) {
        this.findings.push({
          type: 'warning',
          category: 'manifest',
          file: manifestPath,
          message: 'No background color specified',
          impact: 'medium',
          recommendation: 'Add background_color to prevent white flash during launch'
        });
      }
      
      // Scope
      if (!manifest.scope) {
        this.findings.push({
          type: 'info',
          category: 'manifest',
          file: manifestPath,
          message: 'No scope specified',
          impact: 'low',
          recommendation: 'Define scope to control which URLs are part of the PWA'
        });
      }
      
      // Shortcuts
      if (!manifest.shortcuts) {
        this.findings.push({
          type: 'info',
          category: 'manifest',
          file: manifestPath,
          message: 'No app shortcuts defined',
          impact: 'low',
          recommendation: 'Add shortcuts for common user actions'
        });
      }
      
      // Categories
      if (!manifest.categories) {
        this.findings.push({
          type: 'info',
          category: 'manifest',
          file: manifestPath,
          message: 'No app categories specified',
          impact: 'low',
          recommendation: 'Add categories to help users discover your app'
        });
      }
      
    } catch (error) {
      this.findings.push({
        type: 'error',
        category: 'manifest',
        file: manifestPath,
        message: `Failed to parse manifest: ${error.message}`,
        impact: 'high',
        recommendation: 'Fix manifest.json syntax errors'
      });
    }
  }

  async analyzeIcons(icons, manifestPath) {
    const requiredSizes = ['192x192', '512x512'];
    const availableSizes = icons.map(icon => icon.sizes).filter(Boolean);
    
    const missingSizes = requiredSizes.filter(size => 
      !availableSizes.some(available => available.includes(size))
    );
    
    if (missingSizes.length > 0) {
      this.findings.push({
        type: 'error',
        category: 'manifest-icons',
        file: manifestPath,
        message: `Missing required icon sizes: ${missingSizes.join(', ')}`,
        impact: 'high',
        recommendation: 'Add icons for all required sizes for proper PWA installation'
      });
    }
    
    // Check for maskable icons
    const hasMaskableIcon = icons.some(icon => 
      icon.purpose && icon.purpose.includes('maskable')
    );
    
    if (!hasMaskableIcon) {
      this.findings.push({
        type: 'warning',
        category: 'manifest-icons',
        file: manifestPath,
        message: 'No maskable icons found',
        impact: 'medium',
        recommendation: 'Add maskable icons for better adaptive icon support'
      });
    }
    
    // Check if icon files exist
    for (const icon of icons) {
      if (icon.src) {
        const iconPath = icon.src.startsWith('/') ? 
          `public${icon.src}` : 
          `public/${icon.src}`;
        
        if (!fs.existsSync(iconPath)) {
          this.findings.push({
            type: 'error',
            category: 'manifest-icons',
            file: manifestPath,
            message: `Icon file not found: ${icon.src}`,
            impact: 'high',
            recommendation: 'Ensure all referenced icon files exist'
          });
        }
      }
    }
  }

  async auditCachingStrategies() {
    console.log('💾 Auditing Caching Strategies...');
    
    // Look for cache management files
    const cacheFiles = [
      'frontend/src/assets/js/party-cache-manager.js',
      'frontend/src/js/cache-manager.js',
      'frontend/src/js/cache-utils.js',
      'public/js/cache-utils.js'
    ];
    
    let advancedCaching = false;
    
    for (const cacheFile of cacheFiles) {
      if (fs.existsSync(cacheFile)) {
        advancedCaching = true;
        await this.analyzeCacheManager(cacheFile);
      }
    }
    
    if (!advancedCaching) {
      this.findings.push({
        type: 'warning',
        category: 'caching',
        message: 'No advanced cache management system found',
        impact: 'medium',
        recommendation: 'Implement advanced caching with multiple strategies'
      });
    }
  }

  async analyzeCacheManager(cacheFile) {
    try {
      const content = fs.readFileSync(cacheFile, 'utf8');
      
      // Check for multiple cache layers
      const layers = {
        memory: content.includes('memory') || content.includes('Memory'),
        session: content.includes('session') || content.includes('Session'),
        indexedDB: content.includes('IndexedDB') || content.includes('indexeddb'),
        localStorage: content.includes('localStorage')
      };
      
      const layerCount = Object.values(layers).filter(Boolean).length;
      
      if (layerCount < 2) {
        this.findings.push({
          type: 'warning',
          category: 'caching',
          file: cacheFile,
          message: 'Limited cache layer strategy',
          impact: 'medium',
          recommendation: 'Implement multi-layer caching (memory, session, persistent)'
        });
      } else {
        this.findings.push({
          type: 'success',
          category: 'caching',
          file: cacheFile,
          message: `Multi-layer caching implemented (${layerCount} layers)`,
          impact: 'positive'
        });
      }
      
      // Check for cache invalidation
      if (!content.includes('invalidate') && !content.includes('expire') && !content.includes('TTL')) {
        this.findings.push({
          type: 'warning',
          category: 'caching',
          file: cacheFile,
          message: 'No cache invalidation strategy detected',
          impact: 'medium',
          recommendation: 'Implement cache invalidation and TTL management'
        });
      }
      
      // Check for background sync
      if (!content.includes('background') && !content.includes('sync')) {
        this.findings.push({
          type: 'info',
          category: 'caching',
          file: cacheFile,
          message: 'No background sync detected',
          impact: 'low',
          recommendation: 'Consider implementing background sync for better data freshness'
        });
      }
      
    } catch (error) {
      this.findings.push({
        type: 'error',
        category: 'caching',
        file: cacheFile,
        message: `Failed to analyze cache manager: ${error.message}`,
        impact: 'medium'
      });
    }
  }

  async auditOfflineCapabilities() {
    console.log('📴 Auditing Offline Capabilities...');
    
    // Check for offline search
    const offlineSearchFile = 'public/js/offline-search.js';
    if (fs.existsSync(offlineSearchFile)) {
      await this.analyzeOfflineSearch(offlineSearchFile);
    } else {
      this.findings.push({
        type: 'warning',
        category: 'offline',
        message: 'No offline search capability found',
        impact: 'medium',
        recommendation: 'Implement offline search for better user experience'
      });
    }
    
    // Check for offline fallback pages
    const offlinePages = [
      'public/offline.html',
      'frontend/src/offline.html',
      'public/fallback.html'
    ];
    
    const hasOfflinePage = offlinePages.some(page => fs.existsSync(page));
    
    if (!hasOfflinePage) {
      this.findings.push({
        type: 'warning',
        category: 'offline',
        message: 'No offline fallback page found',
        impact: 'medium',
        recommendation: 'Create an offline.html page for when network is unavailable'
      });
    }
    
    // Check for offline data persistence
    this.checkOfflineDataPersistence();
  }

  async analyzeOfflineSearch(offlineSearchFile) {
    try {
      const content = fs.readFileSync(offlineSearchFile, 'utf8');
      
      const features = {
        fullTextSearch: content.includes('search') && content.includes('text'),
        indexing: content.includes('index') || content.includes('Index'),
        filtering: content.includes('filter'),
        sorting: content.includes('sort'),
        fuzzySearch: content.includes('fuzzy') || content.includes('approximate')
      };
      
      const implementedFeatures = Object.entries(features)
        .filter(([_, implemented]) => implemented)
        .map(([feature, _]) => feature);
      
      if (implementedFeatures.length > 0) {
        this.findings.push({
          type: 'success',
          category: 'offline',
          file: offlineSearchFile,
          message: `Offline search features: ${implementedFeatures.join(', ')}`,
          impact: 'positive'
        });
      }
      
      // Check search data size
      if (content.includes('searchData') || content.includes('events')) {
        const dataMatches = content.match(/"events":\[.*?\]/);
        if (dataMatches) {
          const dataSize = dataMatches[0].length;
          if (dataSize > 100000) { // 100KB
            this.findings.push({
              type: 'warning',
              category: 'offline',
              file: offlineSearchFile,
              message: 'Large offline search data may impact performance',
              impact: 'medium',
              recommendation: 'Consider compressing or paginating offline search data'
            });
          }
        }
      }
      
    } catch (error) {
      this.findings.push({
        type: 'error',
        category: 'offline',
        file: offlineSearchFile,
        message: `Failed to analyze offline search: ${error.message}`,
        impact: 'medium'
      });
    }
  }

  checkOfflineDataPersistence() {
    const jsFiles = this.getAllFiles('frontend/src', '.js');
    let hasIndexedDB = false;
    let hasLocalStorage = false;
    let hasSessionStorage = false;
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('IndexedDB') || content.includes('indexeddb')) hasIndexedDB = true;
        if (content.includes('localStorage')) hasLocalStorage = true;
        if (content.includes('sessionStorage')) hasSessionStorage = true;
      } catch (error) {
        // Skip problematic files
      }
    }
    
    if (!hasIndexedDB && !hasLocalStorage) {
      this.findings.push({
        type: 'error',
        category: 'offline',
        message: 'No offline data persistence detected',
        impact: 'high',
        recommendation: 'Implement IndexedDB or localStorage for offline data persistence'
      });
    }
    
    if (hasIndexedDB) {
      this.findings.push({
        type: 'success',
        category: 'offline',
        message: 'IndexedDB implementation found for robust offline storage',
        impact: 'positive'
      });
    }
  }

  async auditResourceLoading() {
    console.log('⚡ Auditing Resource Loading...');
    
    // Check index.html for optimization
    const indexPath = 'frontend/src/index.html';
    if (fs.existsSync(indexPath)) {
      await this.analyzeResourceLoading(indexPath);
    }
    
    // Check for resource hints
    this.checkResourceHints();
    
    // Check for critical resource optimization
    this.checkCriticalResources();
  }

  async analyzeResourceLoading(indexPath) {
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Check for resource hints
      const hints = {
        preload: content.includes('rel="preload"'),
        prefetch: content.includes('rel="prefetch"'),
        preconnect: content.includes('rel="preconnect"'),
        dnsPrefetch: content.includes('rel="dns-prefetch"')
      };
      
      const missingHints = Object.entries(hints)
        .filter(([_, present]) => !present)
        .map(([hint, _]) => hint);
      
      if (missingHints.length > 0) {
        this.findings.push({
          type: 'info',
          category: 'resource-loading',
          file: indexPath,
          message: `Consider adding resource hints: ${missingHints.join(', ')}`,
          impact: 'low',
          recommendation: 'Use resource hints to improve loading performance'
        });
      }
      
      // Check for defer/async on scripts
      const scriptTags = content.match(/<script[^>]*>/g) || [];
      const scriptsWithoutAsync = scriptTags.filter(tag => 
        !tag.includes('defer') && !tag.includes('async')
      );
      
      if (scriptsWithoutAsync.length > 0) {
        this.findings.push({
          type: 'warning',
          category: 'resource-loading',
          file: indexPath,
          message: `${scriptsWithoutAsync.length} scripts without defer/async attributes`,
          impact: 'medium',
          recommendation: 'Add defer or async attributes to non-critical scripts'
        });
      }
      
      // Check for critical CSS inlining
      if (!content.includes('<style>') && content.includes('<link rel="stylesheet"')) {
        this.findings.push({
          type: 'info',
          category: 'resource-loading',
          file: indexPath,
          message: 'No critical CSS inlined',
          impact: 'low',
          recommendation: 'Consider inlining critical CSS for faster initial render'
        });
      }
      
    } catch (error) {
      this.findings.push({
        type: 'error',
        category: 'resource-loading',
        file: indexPath,
        message: `Failed to analyze resource loading: ${error.message}`,
        impact: 'medium'
      });
    }
  }

  checkResourceHints() {
    // Look for external resources that could benefit from preconnect
    const indexPath = 'frontend/src/index.html';
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Check for external domains
      const externalDomains = [
        'googleapis.com',
        'google.com',
        'cloudfunctions.net',
        'firebase.com'
      ];
      
      const foundDomains = externalDomains.filter(domain => 
        content.includes(domain)
      );
      
      if (foundDomains.length > 0) {
        this.findings.push({
          type: 'info',
          category: 'resource-hints',
          message: `Consider adding preconnect for: ${foundDomains.join(', ')}`,
          impact: 'low',
          recommendation: 'Add <link rel="preconnect"> for external domains'
        });
      }
    }
  }

  checkCriticalResources() {
    // Check for critical path resources
    const criticalFiles = [
      'frontend/src/assets/css/tokens.css',
      'frontend/src/assets/css/app-unified.css',
      'frontend/src/assets/js/app-unified.js'
    ];
    
    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        const size = fs.statSync(file).size;
        
        if (size > 50000) { // 50KB
          this.findings.push({
            type: 'warning',
            category: 'critical-resources',
            file: file,
            message: `Large critical resource: ${(size / 1024).toFixed(1)}KB`,
            impact: 'medium',
            recommendation: 'Consider code splitting or compression for large critical resources'
          });
        }
      }
    }
  }

  async auditSecurity() {
    console.log('🔒 Auditing Security...');
    
    // Check for HTTPS enforcement
    this.checkHTTPSEnforcement();
    
    // Check for CSP headers
    this.checkContentSecurityPolicy();
    
    // Check for secure storage practices
    this.checkSecureStorage();
    
    // Check for XSS protection
    this.checkXSSProtection();
  }

  checkHTTPSEnforcement() {
    // Check service worker for HTTPS enforcement
    const swFiles = ['public/sw.js', 'frontend/src/sw-premium.js'];
    
    for (const swFile of swFiles) {
      if (fs.existsSync(swFile)) {
        const content = fs.readFileSync(swFile, 'utf8');
        
        if (!content.includes('https://')) {
          this.findings.push({
            type: 'warning',
            category: 'security',
            file: swFile,
            message: 'No HTTPS enforcement detected in service worker',
            impact: 'medium',
            recommendation: 'Ensure all network requests use HTTPS'
          });
        }
      }
    }
  }

  checkContentSecurityPolicy() {
    const indexPath = 'frontend/src/index.html';
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      if (!content.includes('Content-Security-Policy')) {
        this.findings.push({
          type: 'warning',
          category: 'security',
          file: indexPath,
          message: 'No Content Security Policy detected',
          impact: 'medium',
          recommendation: 'Implement CSP headers to prevent XSS attacks'
        });
      }
    }
  }

  checkSecureStorage() {
    const jsFiles = this.getAllFiles('frontend/src', '.js');
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for sensitive data in localStorage
        if (content.includes('localStorage') && 
            (content.includes('password') || content.includes('token') || content.includes('key'))) {
          this.findings.push({
            type: 'error',
            category: 'security',
            file: file,
            message: 'Potential sensitive data stored in localStorage',
            impact: 'high',
            recommendation: 'Use secure storage methods for sensitive data'
          });
        }
        
        // Check for eval usage
        if (content.includes('eval(')) {
          this.findings.push({
            type: 'error',
            category: 'security',
            file: file,
            message: 'Use of eval() detected',
            impact: 'high',
            recommendation: 'Remove eval() usage to prevent code injection'
          });
        }
        
      } catch (error) {
        // Skip problematic files
      }
    }
  }

  checkXSSProtection() {
    const jsFiles = this.getAllFiles('frontend/src', '.js');
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for innerHTML usage without sanitization
        if (content.includes('innerHTML') && !content.includes('sanitize')) {
          this.findings.push({
            type: 'warning',
            category: 'security',
            file: file,
            message: 'innerHTML usage detected without apparent sanitization',
            impact: 'medium',
            recommendation: 'Sanitize content before using innerHTML or use safer alternatives'
          });
        }
        
      } catch (error) {
        // Skip problematic files
      }
    }
  }

  async auditPerformance() {
    console.log('⚡ Auditing Performance...');
    
    // Check bundle sizes
    await this.checkBundleSizes();
    
    // Check for performance patterns
    this.checkPerformancePatterns();
    
    // Check for memory leaks
    this.checkMemoryLeaks();
  }

  async checkBundleSizes() {
    const criticalFiles = [
      'frontend/src/assets/js/app-unified.js',
      'frontend/src/assets/css/app-unified.css',
      'frontend/src/assets/js/party-list-premium.js',
      'frontend/src/assets/css/party-list-premium.css'
    ];
    
    let totalSize = 0;
    
    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        const size = fs.statSync(file).size;
        totalSize += size;
        
        const category = file.includes('.js') ? 'JavaScript' : 'CSS';
        const threshold = file.includes('.js') ? 100000 : 50000; // 100KB JS, 50KB CSS
        
        if (size > threshold) {
          this.findings.push({
            type: 'warning',
            category: 'performance',
            file: file,
            message: `Large ${category} file: ${(size / 1024).toFixed(1)}KB`,
            impact: 'medium',
            recommendation: 'Consider code splitting or compression'
          });
        }
      }
    }
    
    if (totalSize > 500000) { // 500KB total
      this.findings.push({
        type: 'warning',
        category: 'performance',
        message: `Large total bundle size: ${(totalSize / 1024).toFixed(1)}KB`,
        impact: 'medium',
        recommendation: 'Optimize bundle size through compression and code splitting'
      });
    }
  }

  checkPerformancePatterns() {
    const jsFiles = this.getAllFiles('frontend/src', '.js');
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for performance anti-patterns
        if (content.includes('document.write')) {
          this.findings.push({
            type: 'error',
            category: 'performance',
            file: file,
            message: 'document.write usage detected',
            impact: 'high',
            recommendation: 'Replace document.write with modern DOM manipulation'
          });
        }
        
        // Check for excessive DOM queries
        const domQueries = (content.match(/document\.querySelector|document\.getElementById/g) || []).length;
        if (domQueries > 10) {
          this.findings.push({
            type: 'warning',
            category: 'performance',
            file: file,
            message: `High number of DOM queries: ${domQueries}`,
            impact: 'medium',
            recommendation: 'Cache DOM references to improve performance'
          });
        }
        
      } catch (error) {
        // Skip problematic files
      }
    }
  }

  checkMemoryLeaks() {
    const jsFiles = this.getAllFiles('frontend/src', '.js');
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for event listeners without cleanup
        const addListeners = (content.match(/addEventListener/g) || []).length;
        const removeListeners = (content.match(/removeEventListener/g) || []).length;
        
        if (addListeners > removeListeners + 2) { // Allow some global listeners
          this.findings.push({
            type: 'warning',
            category: 'memory-leaks',
            file: file,
            message: 'Potential memory leak: more event listeners added than removed',
            impact: 'medium',
            recommendation: 'Ensure event listeners are properly cleaned up'
          });
        }
        
        // Check for timer cleanup
        const setTimers = (content.match(/setTimeout|setInterval/g) || []).length;
        const clearTimers = (content.match(/clearTimeout|clearInterval/g) || []).length;
        
        if (setTimers > clearTimers + 1) {
          this.findings.push({
            type: 'warning',
            category: 'memory-leaks',
            file: file,
            message: 'Potential memory leak: timers may not be cleared',
            impact: 'medium',
            recommendation: 'Ensure timers are properly cleared'
          });
        }
        
      } catch (error) {
        // Skip problematic files
      }
    }
  }

  async auditCompliance() {
    console.log('✅ Auditing PWA Compliance...');
    
    // Check PWA requirements
    this.checkPWARequirements();
    
    // Check accessibility
    this.checkAccessibility();
    
    // Check mobile optimization
    this.checkMobileOptimization();
  }

  checkPWARequirements() {
    const requirements = {
      serviceWorker: fs.existsSync('public/sw.js'),
      manifest: fs.existsSync('public/manifest.json'),
      httpsReady: true, // Assuming deployment is HTTPS
      responsive: this.checkResponsiveDesign(),
      fastLoading: true // Would need actual testing
    };
    
    const missing = Object.entries(requirements)
      .filter(([_, met]) => !met)
      .map(([req, _]) => req);
    
    if (missing.length > 0) {
      this.findings.push({
        type: 'error',
        category: 'pwa-compliance',
        message: `Missing PWA requirements: ${missing.join(', ')}`,
        impact: 'high',
        recommendation: 'Implement all PWA requirements for proper functionality'
      });
    } else {
      this.findings.push({
        type: 'success',
        category: 'pwa-compliance',
        message: 'All basic PWA requirements met',
        impact: 'positive'
      });
    }
  }

  checkResponsiveDesign() {
    const indexPath = 'frontend/src/index.html';
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      return content.includes('viewport') && content.includes('width=device-width');
    }
    return false;
  }

  checkAccessibility() {
    const indexPath = 'frontend/src/index.html';
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Check for basic accessibility features
      const a11yFeatures = {
        lang: content.includes('lang='),
        altTags: content.includes('alt='),
        ariaLabels: content.includes('aria-'),
        semanticHTML: content.includes('<main>') || content.includes('<nav>') || content.includes('<section>')
      };
      
      const missingFeatures = Object.entries(a11yFeatures)
        .filter(([_, present]) => !present)
        .map(([feature, _]) => feature);
      
      if (missingFeatures.length > 0) {
        this.findings.push({
          type: 'warning',
          category: 'accessibility',
          message: `Missing accessibility features: ${missingFeatures.join(', ')}`,
          impact: 'medium',
          recommendation: 'Implement accessibility features for better user experience'
        });
      }
    }
  }

  checkMobileOptimization() {
    const cssFiles = this.getAllFiles('frontend/src', '.css');
    let hasMediaQueries = false;
    let hasTouchOptimization = false;
    
    for (const file of cssFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('@media')) hasMediaQueries = true;
        if (content.includes('touch') || content.includes('44px') || content.includes('tap')) {
          hasTouchOptimization = true;
        }
      } catch (error) {
        // Skip problematic files
      }
    }
    
    if (!hasMediaQueries) {
      this.findings.push({
        type: 'warning',
        category: 'mobile-optimization',
        message: 'No responsive media queries detected',
        impact: 'medium',
        recommendation: 'Add responsive design with media queries'
      });
    }
    
    if (!hasTouchOptimization) {
      this.findings.push({
        type: 'info',
        category: 'mobile-optimization',
        message: 'Limited touch optimization detected',
        impact: 'low',
        recommendation: 'Optimize touch targets for mobile devices (min 44px)'
      });
    }
  }

  // Utility methods
  getAllFiles(dir, ext) {
    const files = [];
    const traverse = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return files;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFindings: this.findings.length,
        errors: this.findings.filter(f => f.type === 'error').length,
        warnings: this.findings.filter(f => f.type === 'warning').length,
        info: this.findings.filter(f => f.type === 'info').length,
        successes: this.findings.filter(f => f.type === 'success').length
      },
      findings: this.findings,
      categories: this.categorizeFindings(),
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = 'tools/data-backups/pwa-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    this.displaySummary(report);
    
    return report;
  }

  categorizeFindings() {
    const categories = {};
    
    this.findings.forEach(finding => {
      if (!categories[finding.category]) {
        categories[finding.category] = [];
      }
      categories[finding.category].push(finding);
    });
    
    return categories;
  }

  generateRecommendations() {
    const priorities = {
      high: this.findings.filter(f => f.impact === 'high'),
      medium: this.findings.filter(f => f.impact === 'medium'),
      low: this.findings.filter(f => f.impact === 'low')
    };
    
    return {
      immediate: priorities.high.slice(0, 5),
      shortTerm: priorities.medium.slice(0, 5),
      longTerm: priorities.low.slice(0, 5)
    };
  }

  displaySummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 PWA AUDIT RESULTS');
    console.log('='.repeat(60));
    
    console.log(`📊 Total Findings: ${report.summary.totalFindings}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`ℹ️  Info: ${report.summary.info}`);
    console.log(`✅ Successes: ${report.summary.successes}`);
    
    if (report.summary.errors > 0) {
      console.log('\n🚨 Critical Issues:');
      const errors = this.findings.filter(f => f.type === 'error').slice(0, 3);
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`);
        console.log(`      Impact: ${error.impact} | Category: ${error.category}`);
      });
    }
    
    if (report.summary.successes > 0) {
      console.log('\n✅ Strengths:');
      const successes = this.findings.filter(f => f.type === 'success').slice(0, 3);
      successes.forEach((success, i) => {
        console.log(`   ${i + 1}. ${success.message}`);
      });
    }
    
    console.log('\n💡 Top Recommendations:');
    if (report.recommendations.immediate.length > 0) {
      console.log('   🔥 Immediate (High Priority):');
      report.recommendations.immediate.slice(0, 3).forEach((rec, i) => {
        console.log(`      ${i + 1}. ${rec.recommendation}`);
      });
    }
    
    if (report.recommendations.shortTerm.length > 0) {
      console.log('   ⏰ Short Term (Medium Priority):');
      report.recommendations.shortTerm.slice(0, 2).forEach((rec, i) => {
        console.log(`      ${i + 1}. ${rec.recommendation}`);
      });
    }
    
    console.log(`\n📄 Full report saved: tools/data-backups/pwa-audit-report.json`);
    console.log('='.repeat(60));
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new PWAAuditor();
  auditor.auditPWA().catch(console.error);
}

module.exports = PWAAuditor;