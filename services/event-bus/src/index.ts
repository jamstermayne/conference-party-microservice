/**
 * Event Bus Microservice
 * Single Purpose: Enable event-driven communication between services
 *
 * ONE THING: Route events between publishers and subscribers
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server and WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Types
interface Subscription {
  id: string;
  pattern: string;
  clientId: string;
  ws?: WebSocket;
  webhook?: string;
}

interface Event {
  id: string;
  type: string;
  source: string;
  data: any;
  timestamp: Date;
  tenantId?: string;
}

// Storage
const subscriptions = new Map<string, Subscription>();
const clients = new Map<string, WebSocket>();
const eventHistory: Event[] = [];

// ONE FUNCTION: Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'event-bus',
    purpose: 'Route events between services',
    connections: clients.size,
    subscriptions: subscriptions.size,
    eventsProcessed: eventHistory.length
  });
});

// ONE FUNCTION: Publish an event
app.post('/api/v1/publish', async (req, res) => {
  const { type, source, data, tenantId } = req.body;

  if (!type || !source) {
    return res.status(400).json({
      error: 'Missing required fields: type, source'
    });
  }

  const event: Event = {
    id: uuidv4(),
    type,
    source,
    data,
    tenantId,
    timestamp: new Date()
  };

  // Store event
  eventHistory.push(event);
  if (eventHistory.length > 10000) {
    eventHistory.shift(); // Keep only last 10k events
  }

  // Route to subscribers
  let delivered = 0;
  subscriptions.forEach(subscription => {
    if (matchesPattern(event.type, subscription.pattern)) {
      if (subscription.ws && subscription.ws.readyState === WebSocket.OPEN) {
        subscription.ws.send(JSON.stringify({
          type: 'event',
          event
        }));
        delivered++;
      } else if (subscription.webhook) {
        // Fire and forget webhook
        fetch(subscription.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        }).catch(() => {}); // Ignore failures
        delivered++;
      }
    }
  });

  res.json({
    success: true,
    eventId: event.id,
    delivered
  });
});

// ONE FUNCTION: Subscribe to events via webhook
app.post('/api/v1/subscribe', (req, res) => {
  const { pattern, webhook } = req.body;

  if (!pattern || !webhook) {
    return res.status(400).json({
      error: 'Missing required fields: pattern, webhook'
    });
  }

  const subscription: Subscription = {
    id: uuidv4(),
    pattern,
    clientId: `webhook_${uuidv4()}`,
    webhook
  };

  subscriptions.set(subscription.id, subscription);

  res.json({
    success: true,
    subscriptionId: subscription.id,
    pattern,
    webhook
  });
});

// ONE FUNCTION: Unsubscribe
app.delete('/api/v1/subscribe/:id', (req, res) => {
  const { id } = req.params;

  if (subscriptions.delete(id)) {
    res.json({ success: true, message: 'Unsubscribed' });
  } else {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

// ONE FUNCTION: Get event history
app.get('/api/v1/events', (req, res) => {
  const { type, source, limit = 100 } = req.query;

  let filtered = eventHistory;

  if (type) {
    filtered = filtered.filter(e => e.type === type);
  }

  if (source) {
    filtered = filtered.filter(e => e.source === source);
  }

  res.json({
    events: filtered.slice(-Number(limit)),
    total: filtered.length
  });
});

// WebSocket handling - real-time subscriptions
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);

  console.log(`Client connected: ${clientId}`);

  ws.send(JSON.stringify({
    type: 'connected',
    clientId
  }));

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());

      if (msg.type === 'subscribe') {
        const subscription: Subscription = {
          id: uuidv4(),
          pattern: msg.pattern,
          clientId,
          ws
        };

        subscriptions.set(subscription.id, subscription);

        ws.send(JSON.stringify({
          type: 'subscribed',
          subscriptionId: subscription.id,
          pattern: msg.pattern
        }));
      }

      if (msg.type === 'unsubscribe') {
        subscriptions.delete(msg.subscriptionId);
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          subscriptionId: msg.subscriptionId
        }));
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    // Remove all subscriptions for this client
    Array.from(subscriptions.entries()).forEach(([id, sub]) => {
      if (sub.clientId === clientId) {
        subscriptions.delete(id);
      }
    });
    console.log(`Client disconnected: ${clientId}`);
  });
});

// Helper: Match event type to subscription pattern
function matchesPattern(eventType: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === eventType) return true;

  // Support wildcards like "user.*" matching "user.created", "user.updated"
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return eventType.startsWith(prefix);
  }

  return false;
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   📡 EVENT BUS MICROSERVICE - RUNNING                    ║
╠══════════════════════════════════════════════════════════╣
║   Purpose: Route events between services                 ║
║   Port: ${PORT}                                          ║
║   WebSocket: ws://localhost:${PORT}                      ║
║   Health: http://localhost:${PORT}/health                ║
╠══════════════════════════════════════════════════════════╣
║   Features:                                              ║
║   • WebSocket real-time subscriptions                    ║
║   • Webhook subscriptions                                ║
║   • Pattern matching (wildcards)                         ║
║   • Event history                                        ║
╚══════════════════════════════════════════════════════════╝
  `);
});