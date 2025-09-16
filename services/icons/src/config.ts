/**
 * Icon Service Configuration
 */

export const config = {
  port: process.env.PORT || 3002,
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',

  // Cache configuration
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTTL: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour default
  cacheMaxSize: parseInt(process.env.CACHE_MAX_SIZE || '100'), // Max 100 items

  // Icon processing
  defaultFormat: 'svg',
  defaultSize: 64,
  maxSize: 1024,
  minSize: 16,
  quality: {
    png: 90,
    webp: 85,
    jpeg: 85
  },

  // Performance
  compressionLevel: 6,
  maxConcurrentProcessing: 5,

  // Security
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
  }
};