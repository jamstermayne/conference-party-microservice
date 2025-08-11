// Environment Configuration for Velocity Conference App
// Handles development, staging, and production environments properly

// Environment detection utilities
class EnvironmentDetector {
  static detectEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // Production detection
    if (hostname === 'conference-party-app.web.app' || 
        hostname === 'conference-party-app.firebaseapp.com') {
      return 'production';
    }
    
    // Staging detection (Firebase preview channels)
    if (hostname.includes('conference-party-app--') && hostname.includes('.web.app')) {
      return 'staging';
    }
    
    // Development detection
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.includes('app.github.dev') || // GitHub Codespaces
        hostname.includes('gitpod.io') ||      // Gitpod
        hostname.includes('repl.it') ||        // Replit
        hostname.includes('codesandbox.io') || // CodeSandbox
        protocol === 'file:') {               // Local file
      return 'development';
    }
    
    // Default to production for security
    return 'production';
  }
  
  static isLocalhost() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  
  static isCodespace() {
    return window.location.hostname.includes('app.github.dev');
  }
  
  static isGitpod() {
    return window.location.hostname.includes('gitpod.io');
  }
  
  static getDevServerPort() {
    const port = window.location.port;
    return port ? parseInt(port) : (window.location.protocol === 'https:' ? 443 : 80);
  }
}

// Base configuration that applies to all environments
const baseConfig = {
  app: {
    name: 'Velocity Conference App',
    version: '1.0.0',
    description: 'Professional networking for gaming industry events'
  },
  
  features: {
    analytics: true,
    errorReporting: true,
    performanceMonitoring: true,
    debugging: false,
    networkInspector: false,
    hotReload: false
  },
  
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    storageQuota: 50 * 1024 * 1024 // 50MB
  },
  
  auth: {
    providers: ['google', 'linkedin'],
    persistSession: true,
    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  pwa: {
    installPromptDelay: 30000, // 30 seconds
    updateCheckInterval: 60000, // 1 minute
    cacheStrategy: 'cache-first'
  }
};

// Development environment configuration
const developmentConfig = {
  ...baseConfig,
  
  environment: 'development',
  
  api: {
    // Try local development server first, fallback to staging
    endpoints: {
      primary: 'http://localhost:5001/conference-party-app/us-central1/api',
      fallback: 'https://us-central1-conference-party-app-staging.cloudfunctions.net/api',
      production: 'https://us-central1-conference-party-app.cloudfunctions.net/api'
    },
    timeout: 30000,
    retries: 3,
    retryDelay: 1000
  },
  
  features: {
    ...baseConfig.features,
    debugging: true,
    networkInspector: true,
    hotReload: true,
    mockData: true
  },
  
  logging: {
    level: 'debug',
    console: true,
    remote: false
  },
  
  cache: {
    ...baseConfig.cache,
    ttl: 30 * 1000, // 30 seconds in dev for faster testing
    bypassCache: true
  },
  
  cors: {
    credentials: true,
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Dev-Origin']
  }
};

// Staging environment configuration
const stagingConfig = {
  ...baseConfig,
  
  environment: 'staging',
  
  api: {
    endpoints: {
      primary: 'https://us-central1-conference-party-app-staging.cloudfunctions.net/api',
      fallback: 'https://us-central1-conference-party-app.cloudfunctions.net/api'
    },
    timeout: 15000,
    retries: 3,
    retryDelay: 2000
  },
  
  features: {
    ...baseConfig.features,
    debugging: true,
    networkInspector: true
  },
  
  logging: {
    level: 'info',
    console: true,
    remote: true
  },
  
  cache: {
    ...baseConfig.cache,
    ttl: 2 * 60 * 1000 // 2 minutes
  }
};

// Production environment configuration
const productionConfig = {
  ...baseConfig,
  
  environment: 'production',
  
  api: {
    endpoints: {
      primary: 'https://us-central1-conference-party-app.cloudfunctions.net/api'
    },
    timeout: 10000,
    retries: 2,
    retryDelay: 3000
  },
  
  features: {
    ...baseConfig.features,
    debugging: false,
    networkInspector: false
  },
  
  logging: {
    level: 'error',
    console: false,
    remote: true
  },
  
  cache: {
    ...baseConfig.cache,
    ttl: 10 * 60 * 1000 // 10 minutes
  }
};

// Environment configuration map
const configurations = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig
};

// Active configuration management
class ConfigurationManager {
  constructor() {
    this.environment = EnvironmentDetector.detectEnvironment();
    this.config = this.loadConfiguration();
    this.initializeEnvironment();
  }
  
  loadConfiguration() {
    const config = configurations[this.environment];
    
    if (!config) {
      console.warn(`Unknown environment: ${this.environment}, falling back to production`);
      return productionConfig;
    }
    
    // Apply environment-specific overrides
    return this.applyEnvironmentOverrides(config);
  }
  
  applyEnvironmentOverrides(config) {
    // Apply hostname-specific overrides for development environments
    if (this.environment === 'development') {
      const hostname = window.location.hostname;
      
      // GitHub Codespaces specific configuration
      if (EnvironmentDetector.isCodespace()) {
        config.api.endpoints.primary = config.api.endpoints.fallback; // Use staging for Codespaces
        config.cors.headers.push('X-Codespace-Origin');
      }
      
      // Gitpod specific configuration
      if (EnvironmentDetector.isGitpod()) {
        config.api.endpoints.primary = config.api.endpoints.fallback; // Use staging for Gitpod
        config.cors.headers.push('X-Gitpod-Origin');
      }
      
      // Local development specific configuration
      if (EnvironmentDetector.isLocalhost()) {
        // Keep local development server as primary
        config.features.mockData = false; // Use real data when possible
      }
    }
    
    return config;
  }
  
  initializeEnvironment() {
    // Set global debugging based on environment
    if (this.config.features.debugging) {
      window.DEBUG = true;
      console.info(`🛠️ Development mode enabled for ${this.environment}`);
    }
    
    // Initialize network inspector if enabled
    if (this.config.features.networkInspector) {
      window.NETWORK_INSPECTOR = true;
    }
    
    // Log configuration in development
    if (this.environment === 'development') {
      console.group('🔧 Environment Configuration');
      console.info('Environment:', this.environment);
      console.info('Primary API:', this.config.api.endpoints.primary);
      console.info('Features:', this.config.features);
      console.info('Cache TTL:', this.config.cache.ttl);
      console.groupEnd();
    }
  }
  
  // API endpoint resolution with automatic fallback
  async resolveApiEndpoint() {
    const { endpoints } = this.config.api;
    
    // Try primary endpoint first
    try {
      await this.testEndpoint(endpoints.primary);
      return endpoints.primary;
    } catch (error) {
      console.warn(`Primary endpoint failed: ${endpoints.primary}`, error);
    }
    
    // Try fallback endpoint
    if (endpoints.fallback) {
      try {
        await this.testEndpoint(endpoints.fallback);
        return endpoints.fallback;
      } catch (error) {
        console.warn(`Fallback endpoint failed: ${endpoints.fallback}`, error);
      }
    }
    
    // Try production endpoint as last resort
    if (endpoints.production && endpoints.production !== endpoints.primary) {
      try {
        await this.testEndpoint(endpoints.production);
        return endpoints.production;
      } catch (error) {
        console.error(`Production endpoint failed: ${endpoints.production}`, error);
      }
    }
    
    // Return primary if all tests fail (will use local fallback data)
    return endpoints.primary;
  }
  
  async testEndpoint(endpoint) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'X-Environment-Test': 'true'
        }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return true;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
  
  // Get current configuration
  getConfig() {
    return this.config;
  }
  
  // Get specific configuration section
  get(section) {
    return this.config[section];
  }
  
  // Check if feature is enabled
  isFeatureEnabled(feature) {
    return this.config.features[feature] === true;
  }
  
  // Get API configuration
  getApiConfig() {
    return this.config.api;
  }
  
  // Update configuration at runtime (development only)
  updateConfig(updates) {
    if (this.environment !== 'development') {
      console.warn('Configuration updates only allowed in development');
      return;
    }
    
    Object.assign(this.config, updates);
    console.info('Configuration updated:', updates);
  }
}

// Create and initialize configuration manager
const configManager = new ConfigurationManager();
const config = configManager.getConfig();

// Export configuration and utilities
export default config;
export { 
  configManager, 
  EnvironmentDetector,
  ConfigurationManager 
};

// Make available globally for debugging
if (config.features.debugging) {
  window.CONFIG = config;
  window.CONFIG_MANAGER = configManager;
  window.ENV_DETECTOR = EnvironmentDetector;
}

// Export individual configuration sections for convenience
export const {
  environment,
  api: apiConfig,
  features,
  logging,
  cache: cacheConfig,
  auth: authConfig,
  pwa: pwaConfig,
  cors: corsConfig
} = config;