/**
 * Icon Delivery Microservice
 * Provides polished, optimized icons for the conference app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { IconService } from './services/icon-service';
import { CacheService } from './services/cache-service';
import { iconRouter } from './routes/icons';
import { healthRouter } from './routes/health';
import { config } from './config';

const app = express();
const port = config.port || 3002;

// Initialize services
const cacheService = new CacheService();
const iconService = new IconService(cacheService);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow icon embedding
}));

// CORS configuration for icon delivery
app.use(cors({
  origin: '*', // Icons should be accessible from any origin
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Cache-Control'],
  exposedHeaders: ['Content-Type', 'Cache-Control', 'ETag']
}));

// Performance middleware
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Static file serving for cached icons
app.use('/static', express.static(path.join(__dirname, '../assets'), {
  maxAge: '30d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// API Routes
app.use('/api/v1/icons', iconRouter(iconService));
app.use('/health', healthRouter);

// Icon categories endpoint
app.get('/api/v1/categories', (_req, res) => {
  res.json({
    categories: [
      'ui',        // UI elements (buttons, arrows, etc.)
      'social',    // Social media icons
      'tech',      // Technology/programming icons
      'business',  // Business/conference icons
      'emoji',     // Emoji-style icons
      'brand'      // Brand logos
    ]
  });
});

// Metadata endpoint
app.get('/api/v1/metadata', (_req, res) => {
  res.json({
    service: 'Icon Delivery Service',
    version: '1.0.0',
    formats: ['svg', 'png', 'webp'],
    sizes: [16, 24, 32, 48, 64, 128, 256, 512],
    optimizations: ['compression', 'lazy-loading', 'caching'],
    totalIcons: iconService.getTotalIcons(),
    cacheStatus: cacheService.getStats()
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested icon or endpoint does not exist'
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.isDevelopment && { stack: err.stack })
  });
});

// Start server
app.listen(port, () => {
  console.log(`🎨 Icon Delivery Service running on port ${port}`);
  console.log(`📦 Serving ${iconService.getTotalIcons()} icons`);
  console.log(`🚀 Environment: ${config.environment}`);
  console.log(`💾 Cache enabled: ${config.cacheEnabled}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET /api/v1/icons - List all icons`);
  console.log(`  GET /api/v1/icons/:name - Get specific icon`);
  console.log(`  GET /api/v1/categories - List categories`);
  console.log(`  GET /api/v1/metadata - Service metadata`);
  console.log(`  GET /health - Health check`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;