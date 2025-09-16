/**
 * API Gateway Configuration
 * Single source of truth for gateway settings
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_GATEWAY_PORT || '3000', 10),

  // Service Discovery
  services: {
    matchmaking: {
      url: process.env.MATCHMAKING_SERVICE_URL || 'http://localhost:3001',
      prefix: '/api/matchmaking',
      timeout: 5000,
      retries: 3,
    },
    icons: {
      url: process.env.ICONS_SERVICE_URL || 'http://localhost:3002',
      prefix: '/api/icons',
      timeout: 3000,
      retries: 2,
    },
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
      prefix: '/api/auth',
      timeout: 5000,
      retries: 2,
    },
    analytics: {
      url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
      prefix: '/api/analytics',
      timeout: 3000,
      retries: 2,
    },
    notifications: {
      url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005',
      prefix: '/api/notifications',
      timeout: 5000,
      retries: 3,
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // Request limits
  requestLimit: '10mb',

  // Cache
  cache: {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: 300, // 5 minutes default
    },
    memory: {
      max: 100, // max items
      ttl: 60, // 1 minute
    },
  },

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    requestTimeout: 5000, // 5 seconds
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret',
    publicPaths: ['/health', '/api/auth/login', '/api/auth/register'],
  },
};