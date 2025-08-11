// Development Server Configuration
// Provides local development support with proper CORS and API proxying

import { configManager } from './environments.js';

// Development server utilities
class DevServerManager {
  constructor() {
    this.isDevMode = configManager.config.environment === 'development';
    this.proxyConfig = null;
  }
  
  // Check if we're running in a development environment
  isDevelopment() {
    return this.isDevMode;
  }
  
  // Get proper API URL for current environment
  getApiUrl() {
    if (!this.isDevMode) {
      return configManager.config.api.endpoints.primary;
    }
    
    // In development, try to use the appropriate endpoint based on hosting
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development - try Firebase emulator first, then staging
      return configManager.config.api.endpoints.primary;
    }
    
    if (hostname.includes('app.github.dev')) {
      // GitHub Codespaces - use staging/production endpoint
      return configManager.config.api.endpoints.fallback || configManager.config.api.endpoints.primary;
    }
    
    if (hostname.includes('gitpod.io')) {
      // Gitpod - use staging/production endpoint
      return configManager.config.api.endpoints.fallback || configManager.config.api.endpoints.primary;
    }
    
    // Default to primary endpoint
    return configManager.config.api.endpoints.primary;
  }
  
  // Setup development CORS headers for requests
  getDevHeaders() {
    if (!this.isDevMode) return {};
    
    const headers = {};
    const hostname = window.location.hostname;
    
    // Add development-specific headers
    headers['X-Development-Mode'] = 'true';
    headers['X-Environment'] = configManager.config.environment;
    
    if (hostname.includes('app.github.dev')) {
      headers['X-Codespace-Origin'] = hostname;
    }
    
    if (hostname.includes('gitpod.io')) {
      headers['X-Gitpod-Origin'] = hostname;
    }
    
    return headers;
  }
  
  // Setup proxy configuration for development servers
  getProxyConfig() {
    if (this.proxyConfig) return this.proxyConfig;
    
    if (!this.isDevMode) return null;
    
    const apiUrl = this.getApiUrl();
    
    this.proxyConfig = {
      '/api/*': {
        target: apiUrl,
        changeOrigin: true,
        secure: true,
        headers: this.getDevHeaders(),
        onProxyReq: (proxyReq, req, res) => {
          // Add development headers to proxied requests
          const devHeaders = this.getDevHeaders();
          Object.entries(devHeaders).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
          });
        },
        onError: (err, req, res) => {
          console.error('Proxy error:', err);
          res.writeHead(500, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
          });
          res.end('Proxy error: ' + err.message);
        }
      }
    };
    
    return this.proxyConfig;
  }
  
  // Test API connectivity
  async testConnectivity() {
    if (!this.isDevMode) return { connected: true, environment: 'production' };
    
    const apiUrl = this.getApiUrl();
    const headers = this.getDevHeaders();
    
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          ...headers,
          'X-Environment-Test': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          connected: true,
          environment: data.environment || 'unknown',
          apiUrl,
          responseTime: data.responseTime || 'unknown',
          version: data.version || 'unknown'
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return {
        connected: false,
        apiUrl,
        error: error.message,
        fallbackAvailable: !!configManager.config.api.endpoints.fallback
      };
    }
  }
  
  // Setup development console commands
  setupDevCommands() {
    if (!this.isDevMode) return;
    
    // Make development utilities available globally
    window.DEV_SERVER = {
      manager: this,
      testApi: () => this.testConnectivity(),
      getConfig: () => configManager.config,
      getApiUrl: () => this.getApiUrl(),
      getHeaders: () => this.getDevHeaders(),
      checkCors: async () => {
        const result = await this.testConnectivity();
        if (result.connected) {
          console.log('✅ API connection successful');
          console.log('🔧 Environment:', result.environment);
          console.log('🌐 API URL:', result.apiUrl);
          console.log('⏱️ Response time:', result.responseTime);
        } else {
          console.error('❌ API connection failed');
          console.error('🌐 Tried URL:', result.apiUrl);
          console.error('🔥 Error:', result.error);
          if (result.fallbackAvailable) {
            console.log('💡 Fallback endpoint available, trying automatic fallback...');
          }
        }
        return result;
      }
    };
    
    console.log('🛠️ Development server utilities available:');
    console.log('  - DEV_SERVER.testApi() - Test API connectivity');
    console.log('  - DEV_SERVER.checkCors() - Check CORS configuration');
    console.log('  - DEV_SERVER.getConfig() - Get environment configuration');
    console.log('  - DEV_SERVER.getApiUrl() - Get current API URL');
  }
  
  // Auto-detect development environment issues
  async autoDetectIssues() {
    if (!this.isDevMode) return [];
    
    const issues = [];
    const connectivity = await this.testConnectivity();
    
    if (!connectivity.connected) {
      issues.push({
        type: 'connectivity',
        severity: 'error',
        message: 'Cannot connect to API endpoint',
        details: connectivity.error,
        suggestion: connectivity.fallbackAvailable 
          ? 'Automatic fallback will be attempted'
          : 'Check your network connection and API server status'
      });
    }
    
    // Check for common development issues
    if (window.location.protocol === 'http:' && this.getApiUrl().startsWith('https:')) {
      issues.push({
        type: 'mixed-content',
        severity: 'warning',
        message: 'Mixed content warning: HTTP page loading HTTPS API',
        suggestion: 'Consider using HTTPS for development or HTTP API endpoint'
      });
    }
    
    if (window.location.hostname.includes('app.github.dev') && !connectivity.connected) {
      issues.push({
        type: 'codespace-cors',
        severity: 'info',
        message: 'GitHub Codespace detected - CORS may require backend configuration',
        suggestion: 'The backend should automatically handle Codespace origins'
      });
    }
    
    return issues;
  }
}

// Create singleton instance
const devServer = new DevServerManager();

// Auto-initialize in development
if (devServer.isDevelopment()) {
  // Setup development commands
  devServer.setupDevCommands();
  
  // Auto-detect and report issues
  devServer.autoDetectIssues().then(issues => {
    if (issues.length > 0) {
      console.group('🔧 Development Environment Issues Detected');
      issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${issue.type}: ${issue.message}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      });
      console.groupEnd();
    }
  });
}

export default devServer;
export { DevServerManager };