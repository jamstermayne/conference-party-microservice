/**
 * Structured logging utility for better observability
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  error?: any;
  metadata?: Record<string, any>;
}

class Logger {
  private context: Record<string, any> = {};

  setContext(context: Record<string, any>) {
    this.context = { ...this.context, ...context };
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const logEntry: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...metadata
    };

    // Structure log for Cloud Logging
    const output = JSON.stringify(logEntry);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: any, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, {
      ...metadata,
      error: error?.stack || error?.message || error,
      errorName: error?.name,
      errorCode: error?.code
    });
  }

  // Performance logging
  performance(path: string, method: string, duration: number, statusCode: number) {
    const severity = duration > 2000 ? LogLevel.WARN : LogLevel.INFO;
    this.log(severity, `API Request`, {
      path,
      method,
      duration,
      statusCode,
      slow: duration > 2000
    });
  }

  // Security event logging
  security(event: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, `Security Event: ${event}`, {
      ...metadata,
      securityEvent: true
    });
  }
}

export const logger = new Logger();