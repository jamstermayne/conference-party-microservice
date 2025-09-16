import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
} catch (error) {
  // Already initialized
}

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://conference-party-app.web.app',
    'https://conference-party-app--preview-*.web.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173'
  ],
  credentials: true,
  maxAge: 86400
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));
app.use(express.json());

// Interfaces (1 function, 1 thing: type definitions)
interface Metric {
  id: string;
  type: 'pageview' | 'event' | 'timing' | 'error' | 'api';
  category: string;
  action?: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface MetricsSummary {
  totalEvents: number;
  uniqueUsers: number;
  activeSessions: number;
  topEvents: Array<{ event: string; count: number }>;
  errorRate: number;
  avgResponseTime: number;
}

// In-memory storage for real-time metrics (1 function, 1 thing: metrics storage)
const metricsBuffer: Metric[] = [];
const BUFFER_SIZE = 1000;
const FLUSH_INTERVAL = 30000; // 30 seconds

// Health check (1 function, 1 thing: health monitoring)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "metrics-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    buffer: {
      current: metricsBuffer.length,
      max: BUFFER_SIZE
    },
    endpoints: {
      health: "operational",
      collect: "operational",
      batch: "operational",
      summary: "operational",
      query: "operational",
      export: "operational"
    }
  });
});

// Collect single metric (1 function, 1 thing: metric collection)
app.post("/collect", async (req: Request, res: Response): Promise<any> => {
  try {
    const { type, category, action, label, value, userId, sessionId, metadata } = req.body;

    if (!type || !category || !sessionId) {
      return res.status(400).json({
        error: "Type, category, and sessionId are required"
      });
    }

    const metric: Metric = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      action,
      label,
      value,
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Add to buffer
    metricsBuffer.push(metric);

    // Flush if buffer is full
    if (metricsBuffer.length >= BUFFER_SIZE) {
      await flushMetrics();
    }

    res.status(204).send(); // No content response for efficiency

  } catch (error) {
    console.error('[Metrics] Collect error:', error);
    res.status(500).json({ error: "Failed to collect metric" });
  }
});

// Collect batch metrics (1 function, 1 thing: batch collection)
app.post("/batch", async (req: Request, res: Response): Promise<any> => {
  try {
    const { metrics } = req.body;

    if (!metrics || !Array.isArray(metrics)) {
      return res.status(400).json({
        error: "Metrics array is required"
      });
    }

    const validMetrics: Metric[] = [];

    for (const m of metrics) {
      if (m.type && m.category && m.sessionId) {
        validMetrics.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: m.type,
          category: m.category,
          action: m.action,
          label: m.label,
          value: m.value,
          userId: m.userId,
          sessionId: m.sessionId,
          timestamp: m.timestamp || new Date().toISOString(),
          metadata: m.metadata
        });
      }
    }

    // Add to buffer
    metricsBuffer.push(...validMetrics);

    // Flush if buffer is full
    if (metricsBuffer.length >= BUFFER_SIZE) {
      await flushMetrics();
    }

    res.status(200).json({
      success: true,
      accepted: validMetrics.length,
      rejected: metrics.length - validMetrics.length
    });

  } catch (error) {
    console.error('[Metrics] Batch error:', error);
    res.status(500).json({ error: "Failed to collect batch metrics" });
  }
});

// Get metrics summary (1 function, 1 thing: summary generation)
app.get("/summary", async (req: Request, res: Response): Promise<any> => {
  try {
    const { period = '1h' } = req.query;

    const db = admin.firestore();
    const now = new Date();
    let startTime = new Date();

    // Calculate start time based on period
    switch (period) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }

    // Query metrics from Firestore
    const snapshot = await db.collection('metrics')
      .where('timestamp', '>=', startTime.toISOString())
      .limit(10000)
      .get();

    const metrics = snapshot.docs.map(doc => doc.data() as Metric);

    // Calculate summary
    const uniqueUsers = new Set(metrics.map(m => m.userId).filter(Boolean));
    const activeSessions = new Set(metrics.map(m => m.sessionId));

    // Count events
    const eventCounts: Record<string, number> = {};
    metrics.forEach(m => {
      const key = `${m.category}:${m.action || 'default'}`;
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    });

    // Top events
    const topEvents = Object.entries(eventCounts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Error rate
    const errors = metrics.filter(m => m.type === 'error').length;
    const errorRate = metrics.length > 0 ? (errors / metrics.length) * 100 : 0;

    // Average response time (for API metrics)
    const apiMetrics = metrics.filter(m => m.type === 'api' && m.value);
    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + (m.value || 0), 0) / apiMetrics.length
      : 0;

    const summary: MetricsSummary = {
      totalEvents: metrics.length,
      uniqueUsers: uniqueUsers.size,
      activeSessions: activeSessions.size,
      topEvents,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime)
    };

    res.status(200).json({
      success: true,
      period,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      summary
    });

  } catch (error) {
    console.error('[Metrics] Summary error:', error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// Query metrics (1 function, 1 thing: metrics querying)
app.get("/query", async (req: Request, res: Response): Promise<any> => {
  try {
    const { type, category, userId, sessionId, start, end, limit = '100' } = req.query;

    const db = admin.firestore();
    let query = db.collection('metrics') as any;

    if (type) query = query.where('type', '==', type);
    if (category) query = query.where('category', '==', category);
    if (userId) query = query.where('userId', '==', userId);
    if (sessionId) query = query.where('sessionId', '==', sessionId);
    if (start) query = query.where('timestamp', '>=', start);
    if (end) query = query.where('timestamp', '<=', end);

    query = query.orderBy('timestamp', 'desc').limit(parseInt(limit as string));

    const snapshot = await query.get();
    const metrics = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      metrics,
      count: metrics.length
    });

  } catch (error) {
    console.error('[Metrics] Query error:', error);
    res.status(500).json({ error: "Failed to query metrics" });
  }
});

// Export metrics (1 function, 1 thing: metrics export)
app.get("/export", async (req: Request, res: Response): Promise<any> => {
  try {
    const { format = 'json', start, end } = req.query;

    const db = admin.firestore();
    let query = db.collection('metrics') as any;

    if (start) query = query.where('timestamp', '>=', start);
    if (end) query = query.where('timestamp', '<=', end);

    const snapshot = await query.limit(10000).get();
    const metrics = snapshot.docs.map((doc: any) => doc.data());

    if (format === 'csv') {
      // Generate CSV
      const headers = ['id', 'type', 'category', 'action', 'label', 'value', 'userId', 'sessionId', 'timestamp'];
      let csv = headers.join(',') + '\n';

      metrics.forEach(m => {
        csv += [
          m.id,
          m.type,
          m.category,
          m.action || '',
          m.label || '',
          m.value || '',
          m.userId || '',
          m.sessionId,
          m.timestamp
        ].join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="metrics.csv"');
      return res.send(csv);

    } else {
      res.status(200).json({
        success: true,
        metrics,
        count: metrics.length,
        exported: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[Metrics] Export error:', error);
    res.status(500).json({ error: "Failed to export metrics" });
  }
});

// Flush metrics to Firestore (1 function, 1 thing: metrics persistence)
async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return;

  try {
    const db = admin.firestore();
    const batch = db.batch();
    const toFlush = metricsBuffer.splice(0, BUFFER_SIZE);

    toFlush.forEach(metric => {
      const docRef = db.collection('metrics').doc(metric.id);
      batch.set(docRef, metric);
    });

    await batch.commit();
    console.log(`[Metrics] Flushed ${toFlush.length} metrics to Firestore`);

  } catch (error) {
    console.error('[Metrics] Flush error:', error);
    // Re-add metrics to buffer if flush failed
    metricsBuffer.unshift(...metricsBuffer);
  }
}

// Periodic flush
setInterval(flushMetrics, FLUSH_INTERVAL);

// Export the function
export const metricsService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
}, app);