/**
 * Analytics Microservice
 * Single Purpose: Track and analyze user events
 *
 * Responsibilities:
 * - Track page views
 * - Track user actions
 * - Track conversion events
 * - Generate analytics reports
 * - Real-time analytics streaming
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// In-memory storage for demo (replace with TimescaleDB/ClickHouse in production)
interface Event {
  id: string;
  tenantId: string;
  userId?: string;
  sessionId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  referrer?: string;
}

interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

const events: Event[] = [];
const metrics: Map<string, Metric[]> = new Map();

// Helper: Generate event ID
const generateEventId = () => `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Health check - ONE THING: Report service health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics-service',
    purpose: 'Track and analyze events',
    uptime: process.uptime(),
    eventsTracked: events.length
  });
});

// ONE FUNCTION: Track an event
app.post('/api/v1/track', (req, res) => {
  const {
    tenantId = 'default',
    userId,
    sessionId,
    event,
    properties = {}
  } = req.body;

  if (!event || !sessionId) {
    return res.status(400).json({
      error: 'Missing required fields: event, sessionId'
    });
  }

  const trackedEvent: Event = {
    id: generateEventId(),
    tenantId,
    userId,
    sessionId,
    event,
    properties,
    timestamp: new Date(),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    referrer: req.headers.referer
  };

  events.push(trackedEvent);

  // Update real-time metrics
  updateMetrics(trackedEvent);

  res.json({
    success: true,
    eventId: trackedEvent.id,
    message: 'Event tracked successfully'
  });
});

// ONE FUNCTION: Track multiple events (batch)
app.post('/api/v1/track/batch', (req, res) => {
  const { events: batchEvents = [] } = req.body;

  const trackedEvents = batchEvents.map((evt: any) => {
    const trackedEvent: Event = {
      id: generateEventId(),
      tenantId: evt.tenantId || 'default',
      userId: evt.userId,
      sessionId: evt.sessionId,
      event: evt.event,
      properties: evt.properties || {},
      timestamp: new Date(evt.timestamp || Date.now()),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      referrer: req.headers.referer
    };

    events.push(trackedEvent);
    updateMetrics(trackedEvent);
    return trackedEvent.id;
  });

  res.json({
    success: true,
    eventIds: trackedEvents,
    count: trackedEvents.length
  });
});

// ONE FUNCTION: Get event statistics
app.get('/api/v1/stats/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const { from, to } = req.query;

  let tenantEvents = events.filter(e => e.tenantId === tenantId);

  if (from) {
    const fromDate = new Date(from as string);
    tenantEvents = tenantEvents.filter(e => e.timestamp >= fromDate);
  }

  if (to) {
    const toDate = new Date(to as string);
    tenantEvents = tenantEvents.filter(e => e.timestamp <= toDate);
  }

  // Calculate statistics
  const stats = {
    totalEvents: tenantEvents.length,
    uniqueUsers: new Set(tenantEvents.map(e => e.userId).filter(Boolean)).size,
    uniqueSessions: new Set(tenantEvents.map(e => e.sessionId)).size,
    eventTypes: {} as Record<string, number>,
    topEvents: [] as { event: string; count: number }[],
    timeline: [] as { hour: string; count: number }[]
  };

  // Count event types
  tenantEvents.forEach(e => {
    stats.eventTypes[e.event] = (stats.eventTypes[e.event] || 0) + 1;
  });

  // Get top events
  stats.topEvents = Object.entries(stats.eventTypes)
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Generate hourly timeline
  const hourlyBuckets = new Map<string, number>();
  tenantEvents.forEach(e => {
    const hour = e.timestamp.toISOString().substring(0, 13) + ':00';
    hourlyBuckets.set(hour, (hourlyBuckets.get(hour) || 0) + 1);
  });
  stats.timeline = Array.from(hourlyBuckets.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  res.json(stats);
});

// ONE FUNCTION: Get funnel analytics
app.post('/api/v1/funnel', (req, res) => {
  const { tenantId, steps, from, to } = req.body;

  if (!steps || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'Steps array required' });
  }

  let tenantEvents = events.filter(e => e.tenantId === tenantId);

  if (from) {
    tenantEvents = tenantEvents.filter(e => e.timestamp >= new Date(from));
  }

  if (to) {
    tenantEvents = tenantEvents.filter(e => e.timestamp <= new Date(to));
  }

  // Group events by session
  const sessionEvents = new Map<string, Event[]>();
  tenantEvents.forEach(e => {
    if (!sessionEvents.has(e.sessionId)) {
      sessionEvents.set(e.sessionId, []);
    }
    sessionEvents.get(e.sessionId)!.push(e);
  });

  // Calculate funnel
  const funnel = steps.map((step, index) => {
    let sessionsAtStep = 0;

    sessionEvents.forEach(events => {
      // Check if session completed all previous steps and current step
      const completedPreviousSteps = steps.slice(0, index).every(prevStep =>
        events.some(e => e.event === prevStep)
      );

      if (completedPreviousSteps && events.some(e => e.event === step)) {
        sessionsAtStep++;
      }
    });

    return {
      step,
      sessions: sessionsAtStep,
      percentage: index === 0 ? 100 : 0
    };
  });

  // Calculate percentages
  if (funnel.length > 0) {
    const firstStepSessions = funnel[0].sessions;
    funnel.forEach(step => {
      step.percentage = firstStepSessions > 0
        ? Math.round((step.sessions / firstStepSessions) * 100)
        : 0;
    });
  }

  res.json({
    funnel,
    totalSessions: sessionEvents.size,
    period: { from, to }
  });
});

// ONE FUNCTION: Get user journey
app.get('/api/v1/journey/:userId', (req, res) => {
  const { userId } = req.params;
  const userEvents = events
    .filter(e => e.userId === userId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const journey = {
    userId,
    totalEvents: userEvents.length,
    firstSeen: userEvents[0]?.timestamp,
    lastSeen: userEvents[userEvents.length - 1]?.timestamp,
    sessions: [] as any[]
  };

  // Group by session
  const sessions = new Map<string, Event[]>();
  userEvents.forEach(e => {
    if (!sessions.has(e.sessionId)) {
      sessions.set(e.sessionId, []);
    }
    sessions.get(e.sessionId)!.push(e);
  });

  journey.sessions = Array.from(sessions.entries()).map(([sessionId, events]) => ({
    sessionId,
    startTime: events[0].timestamp,
    endTime: events[events.length - 1].timestamp,
    duration: events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime(),
    eventCount: events.length,
    events: events.map(e => ({
      event: e.event,
      timestamp: e.timestamp,
      properties: e.properties
    }))
  }));

  res.json(journey);
});

// ONE FUNCTION: Get real-time metrics
app.get('/api/v1/metrics/:metric', (req, res) => {
  const { metric } = req.params;
  const { tenantId = 'default' } = req.query;

  const key = `${tenantId}:${metric}`;
  const metricData = metrics.get(key) || [];

  res.json({
    metric,
    tenantId,
    dataPoints: metricData.slice(-100), // Last 100 data points
    current: metricData[metricData.length - 1]?.value || 0
  });
});

// Helper: Update real-time metrics
function updateMetrics(event: Event) {
  // Update events per minute
  const epmKey = `${event.tenantId}:events_per_minute`;
  if (!metrics.has(epmKey)) {
    metrics.set(epmKey, []);
  }

  const now = new Date();
  const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

  const epmMetrics = metrics.get(epmKey)!;
  const lastMetric = epmMetrics[epmMetrics.length - 1];

  if (lastMetric && lastMetric.timestamp.getTime() === currentMinute.getTime()) {
    lastMetric.value++;
  } else {
    epmMetrics.push({
      name: 'events_per_minute',
      value: 1,
      tags: { tenantId: event.tenantId },
      timestamp: currentMinute
    });
  }

  // Keep only last hour of metrics
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  metrics.forEach((metricList, key) => {
    metrics.set(key, metricList.filter(m => m.timestamp > oneHourAgo));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   📊 ANALYTICS MICROSERVICE - RUNNING                    ║
╠══════════════════════════════════════════════════════════╣
║   Purpose: Track and analyze user events                 ║
║   Port: ${PORT}                                          ║
║   Health: http://localhost:${PORT}/health                ║
╠══════════════════════════════════════════════════════════╣
║   Endpoints:                                             ║
║   POST /api/v1/track         - Track single event        ║
║   POST /api/v1/track/batch   - Track multiple events     ║
║   GET  /api/v1/stats/:tenant - Get statistics           ║
║   POST /api/v1/funnel        - Funnel analysis          ║
║   GET  /api/v1/journey/:user - User journey             ║
║   GET  /api/v1/metrics/:name - Real-time metrics        ║
╚══════════════════════════════════════════════════════════╝
  `);
});