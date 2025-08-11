import { toast } from './ui.js';
import { Events, EVENTS } from './state.js';

// Error types and user-friendly messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Connection failed - check your internet',
  TIMEOUT_ERROR: 'Request timed out - please try again',
  SERVER_ERROR: 'Server error - our team has been notified', 
  AUTH_ERROR: 'Authentication failed - please sign in again',
  VALIDATION_ERROR: 'Invalid data - please check your input',
  RATE_LIMIT: 'Too many requests - please wait a moment',
  MAINTENANCE: 'Service temporarily unavailable',
  UNKNOWN_ERROR: 'Something went wrong - please try again'
};

// Error recovery strategies
const RECOVERY_STRATEGIES = {
  NETWORK_ERROR: 'retry',
  TIMEOUT_ERROR: 'retry',
  SERVER_ERROR: 'fallback',
  AUTH_ERROR: 'reauth',
  VALIDATION_ERROR: 'user-action',
  RATE_LIMIT: 'wait',
  MAINTENANCE: 'offline-mode',
  UNKNOWN_ERROR: 'retry'
};

class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map(); // Track retry counts per operation
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.setupGlobalHandlers();
  }
  
  setupGlobalHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, { context: 'unhandled-promise' });
      event.preventDefault();
    });
    
    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global JavaScript error:', event.error);
      this.handleError(event.error, { context: 'javascript-error' });
    });
    
    // Network status monitoring
    window.addEventListener('online', () => {
      toast('✅ Connection restored');
      Events.emit(EVENTS.NETWORK_RESTORED);
    });
    
    window.addEventListener('offline', () => {
      toast('📱 Offline mode active');
      Events.emit(EVENTS.NETWORK_LOST);
    });
  }
  
  // Main error handling entry point
  async handleError(error, context = {}) {
    const errorType = this.classifyError(error);
    const userMessage = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.UNKNOWN_ERROR;
    const strategy = RECOVERY_STRATEGIES[errorType] || 'retry';
    
    console.error(`[${errorType}]`, error, context);
    
    // Show user-friendly error message
    toast(userMessage);
    
    // Attempt recovery based on strategy
    return this.executeRecoveryStrategy(strategy, error, context);
  }
  
  classifyError(error) {
    if (!error) return 'UNKNOWN_ERROR';
    
    const message = error.message?.toLowerCase() || '';
    
    // Network-related errors
    if (message.includes('fetch') || message.includes('network') || error.name === 'TypeError') {
      return 'NETWORK_ERROR';
    }
    
    // Timeout errors
    if (message.includes('timeout') || error.name === 'AbortError') {
      return 'TIMEOUT_ERROR';
    }
    
    // HTTP status-based classification
    if (error.status) {
      if (error.status >= 500) return 'SERVER_ERROR';
      if (error.status === 401 || error.status === 403) return 'AUTH_ERROR';
      if (error.status === 400) return 'VALIDATION_ERROR';
      if (error.status === 429) return 'RATE_LIMIT';
      if (error.status === 503) return 'MAINTENANCE';
    }
    
    // Authentication-specific errors
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return 'AUTH_ERROR';
    }
    
    // Validation errors
    if (message.includes('valid') || message.includes('required') || message.includes('format')) {
      return 'VALIDATION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  async executeRecoveryStrategy(strategy, error, context) {
    const operationId = context.operation || 'unknown';
    
    switch (strategy) {
      case 'retry':
        return this.attemptRetry(operationId, context.retryFn);
        
      case 'fallback':
        return this.useFallback(context);
        
      case 'reauth':
        return this.triggerReauth();
        
      case 'wait':
        return this.waitAndRetry(operationId, context.retryFn);
        
      case 'offline-mode':
        return this.enableOfflineMode();
        
      case 'user-action':
        return this.requestUserAction(error.message);
        
      default:
        return { success: false, error: error.message };
    }
  }
  
  async attemptRetry(operationId, retryFn) {
    if (!retryFn) return { success: false, error: 'No retry function provided' };
    
    const attempts = this.retryAttempts.get(operationId) || 0;
    
    if (attempts >= this.maxRetries) {
      this.retryAttempts.delete(operationId);
      toast('❌ Max retries exceeded - using offline mode');
      return { success: false, error: 'Max retries exceeded' };
    }
    
    this.retryAttempts.set(operationId, attempts + 1);
    
    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, attempts);
    await this.sleep(delay);
    
    try {
      const result = await retryFn();
      this.retryAttempts.delete(operationId); // Reset on success
      return result;
    } catch (retryError) {
      return this.handleError(retryError, { 
        operation: operationId, 
        retryFn,
        attempt: attempts + 1 
      });
    }
  }
  
  async waitAndRetry(operationId, retryFn, waitTime = 5000) {
    toast('⏱️ Rate limited - waiting before retry...');
    await this.sleep(waitTime);
    return this.attemptRetry(operationId, retryFn);
  }
  
  useFallback(context) {
    if (context.fallbackData) {
      toast('📱 Using cached data');
      return { success: true, data: context.fallbackData, fallback: true };
    }
    
    if (context.fallbackFn) {
      try {
        const result = context.fallbackFn();
        toast('📱 Using fallback method');
        return { success: true, data: result, fallback: true };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
    
    return { success: false, error: 'No fallback available' };
  }
  
  triggerReauth() {
    toast('🔑 Authentication required');
    Events.emit(EVENTS.AUTH_REQUIRED);
    
    // Could trigger a login modal here
    return { success: false, error: 'Authentication required', requiresAuth: true };
  }
  
  enableOfflineMode() {
    toast('📱 Switching to offline mode');
    Events.emit(EVENTS.OFFLINE_MODE_ENABLED);
    return { success: true, offline: true };
  }
  
  requestUserAction(errorMessage) {
    const actionMessage = `Please check: ${errorMessage}`;
    toast(actionMessage);
    return { success: false, error: errorMessage, requiresUserAction: true };
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Public methods for specific error scenarios
  handleApiError(error, context = {}) {
    return this.handleError(error, { 
      ...context, 
      context: 'api-call'
    });
  }
  
  handleNetworkError(error, retryFn) {
    return this.handleError(error, {
      context: 'network',
      retryFn,
      operation: 'network-request'
    });
  }
  
  handleValidationError(error, field) {
    return this.handleError(error, {
      context: 'validation',
      field,
      operation: 'user-input'
    });
  }
  
  // Reset retry counts (call when switching contexts)
  resetRetries(operationId) {
    if (operationId) {
      this.retryAttempts.delete(operationId);
    } else {
      this.retryAttempts.clear();
    }
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Enhanced fetch wrapper with error handling
export async function safeFetch(url, options = {}) {
  const operationId = `fetch-${url}`;
  
  const attemptFetch = async () => {
    try {
      console.log('🔄 [SAFE FETCH DEBUG] Attempting fetch:', {
        url,
        options,
        fullUrl: url.startsWith('http') ? url : window.location.origin + url
      });
      
      const response = await fetch(url, {
        timeout: 10000,
        ...options
      });
      
      console.log('📥 [SAFE FETCH DEBUG] Response received:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        console.error('❌ [SAFE FETCH DEBUG] Response not ok:', response.status, response.statusText);
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      console.log('✅ [SAFE FETCH DEBUG] Fetch successful for:', url);
      return response;
    } catch (fetchError) {
      console.error('❌ [SAFE FETCH DEBUG] Fetch error:', fetchError);
      // Network or parsing error
      throw fetchError;
    }
  };
  
  try {
    return await attemptFetch();
  } catch (error) {
    const recovery = await errorHandler.handleError(error, {
      operation: operationId,
      retryFn: attemptFetch
    });
    
    if (recovery.success) {
      return recovery.data;
    }
    
    throw error;
  }
}

// Export error handler and utilities
export { errorHandler };
export default errorHandler;

// Add new events if they don't exist
if (!EVENTS.NETWORK_RESTORED) EVENTS.NETWORK_RESTORED = 'network:restored';
if (!EVENTS.NETWORK_LOST) EVENTS.NETWORK_LOST = 'network:lost';
if (!EVENTS.AUTH_REQUIRED) EVENTS.AUTH_REQUIRED = 'auth:required';
if (!EVENTS.OFFLINE_MODE_ENABLED) EVENTS.OFFLINE_MODE_ENABLED = 'offline:enabled';