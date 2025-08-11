// Network Inspector - Comprehensive API debugging tool
import { toast } from './ui.js';

class NetworkInspector {
  constructor() {
    this.logs = [];
    this.isEnabled = true;
    this.setupConsoleLogging();
    this.interceptFetch();
  }
  
  setupConsoleLogging() {
    // Enhanced console logging with timestamps and colors
    console.log('%c🔍 Network Inspector Enabled', 'color: #6b7bff; font-weight: bold; font-size: 14px;');
    console.log('%c   • All API calls will be logged with full details', 'color: #9ea2aa;');
    console.log('%c   • CORS, timeout, and error details will be shown', 'color: #9ea2aa;');
    console.log('%c   • Use networkInspector.showLogs() to see history', 'color: #9ea2aa;');
  }
  
  interceptFetch() {
    const originalFetch = window.fetch;
    const inspector = this;
    
    window.fetch = async function(url, options = {}) {
      const startTime = performance.now();
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      
      // Log the outgoing request
      inspector.logRequest(callId, url, options);
      
      try {
        const response = await originalFetch(url, options);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        // Log successful response
        await inspector.logResponse(callId, url, response.clone(), duration, null);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        // Log error response
        inspector.logResponse(callId, url, null, duration, error);
        
        throw error;
      }
    };
  }
  
  logRequest(callId, url, options) {
    const timestamp = new Date().toISOString().substr(11, 12);
    const method = options.method || 'GET';
    
    console.group(`%c🔵 ${method} ${timestamp}`, 'color: #3b82f6; font-weight: bold;');
    console.log(`%c📍 URL: ${url}`, 'color: #059669; font-weight: bold;');
    console.log(`%c🆔 Call ID: ${callId}`, 'color: #6b7280;');
    
    if (options.headers) {
      console.log('%c📋 Headers:', 'color: #7c3aed; font-weight: bold;');
      console.table(options.headers);
    }
    
    if (options.body) {
      console.log('%c📦 Body:', 'color: #db2777; font-weight: bold;');
      try {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        console.log(body);
      } catch {
        console.log(options.body);
      }
    }
    
    // Store log entry
    this.logs.push({
      id: callId,
      timestamp: new Date(),
      type: 'request',
      method,
      url,
      options: { ...options }
    });
  }
  
  async logResponse(callId, url, response, duration, error) {
    const timestamp = new Date().toISOString().substr(11, 12);
    
    if (error) {
      // Error response
      console.log(`%c❌ ERROR ${timestamp} (${duration}ms)`, 'color: #dc2626; font-weight: bold;');
      console.log(`%c🔥 Error Type: ${error.name}`, 'color: #dc2626;');
      console.log(`%c💬 Error Message: ${error.message}`, 'color: #dc2626;');
      
      // Analyze error type
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('%c🌐 NETWORK ERROR: Unable to reach server', 'color: #dc2626; background: #fef2f2; padding: 2px 4px;');
        console.log('%c   • Check internet connection', 'color: #7f1d1d;');
        console.log('%c   • Verify server is running', 'color: #7f1d1d;');
        console.log('%c   • Check for CORS issues', 'color: #7f1d1d;');
      } else if (error.name === 'AbortError') {
        console.log('%c⏰ TIMEOUT ERROR: Request took too long', 'color: #dc2626; background: #fef2f2; padding: 2px 4px;');
      }
      
      console.log('%c📊 Full Error Object:', 'color: #dc2626;');
      console.error(error);
      
      // Store error log
      this.logs.push({
        id: callId,
        timestamp: new Date(),
        type: 'error',
        url,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        duration
      });
      
    } else if (response) {
      // Success response
      const statusColor = response.ok ? '#059669' : '#dc2626';
      console.log(`%c✅ ${response.status} ${response.statusText} ${timestamp} (${duration}ms)`, `color: ${statusColor}; font-weight: bold;`);
      
      // Log response headers
      console.log('%c📥 Response Headers:', 'color: #7c3aed; font-weight: bold;');
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.table(headers);
      
      // Try to log response body
      try {
        const responseClone = response.clone();
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await responseClone.json();
          console.log('%c📄 Response Data:', 'color: #059669; font-weight: bold;');
          console.log(data);
          
          // Store successful log
          this.logs.push({
            id: callId,
            timestamp: new Date(),
            type: 'success',
            url,
            status: response.status,
            statusText: response.statusText,
            headers,
            data,
            duration
          });
        } else {
          const text = await responseClone.text();
          console.log('%c📄 Response Text:', 'color: #059669; font-weight: bold;');
          console.log(text);
          
          this.logs.push({
            id: callId,
            timestamp: new Date(),
            type: 'success',
            url,
            status: response.status,
            statusText: response.statusText,
            headers,
            data: text,
            duration
          });
        }
      } catch (parseError) {
        console.log('%c⚠️ Could not parse response body:', 'color: #f59e0b;');
        console.error(parseError);
      }
      
      // Check for common issues
      if (!response.ok) {
        if (response.status === 404) {
          console.log('%c🔍 404 NOT FOUND: Endpoint does not exist', 'color: #dc2626; background: #fef2f2; padding: 2px 4px;');
        } else if (response.status === 500) {
          console.log('%c💥 500 SERVER ERROR: Backend issue', 'color: #dc2626; background: #fef2f2; padding: 2px 4px;');
        } else if (response.status === 403) {
          console.log('%c🔐 403 FORBIDDEN: Access denied', 'color: #dc2626; background: #fef2f2; padding: 2px 4px;');
        } else if (response.status === 429) {
          console.log('%c🚦 429 RATE LIMITED: Too many requests', 'color: #f59e0b; background: #fffbeb; padding: 2px 4px;');
        }
      }
    }
    
    console.groupEnd();
  }
  
  // Public methods for debugging
  showLogs() {
    console.log('%c🔍 Network Inspector Logs', 'color: #6b7bff; font-weight: bold; font-size: 16px;');
    console.table(this.logs.map(log => ({
      timestamp: log.timestamp.toISOString().substr(11, 8),
      type: log.type,
      method: log.method || 'GET',
      url: log.url,
      status: log.status || (log.error ? 'ERROR' : 'N/A'),
      duration: log.duration ? `${log.duration}ms` : 'N/A'
    })));
    return this.logs;
  }
  
  clearLogs() {
    this.logs = [];
    console.log('%c🧹 Network logs cleared', 'color: #6b7bff;');
  }
  
  getFailedRequests() {
    return this.logs.filter(log => log.type === 'error' || (log.status && log.status >= 400));
  }
  
  getRequestsToUrl(urlPattern) {
    return this.logs.filter(log => log.url.includes(urlPattern));
  }
}

// Create singleton instance
const networkInspector = new NetworkInspector();

// Make available globally for debugging
window.networkInspector = networkInspector;

// Export for use in modules
export default networkInspector;