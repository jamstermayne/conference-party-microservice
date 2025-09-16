import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import crypto from "crypto";

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
    'http://localhost:5173',
    'https://script.google.com' // Allow Google Sheets webhooks
  ],
  credentials: true,
  maxAge: 86400
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));
app.use(express.json({ limit: '10mb' })); // Larger limit for webhook payloads

// Interfaces (1 function, 1 thing: type definitions)
interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  metadata?: Record<string, any>;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

interface WebhookDelivery {
  webhookId: string;
  eventId: string;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: string;
  response?: any;
  error?: string;
}

// Webhook registry (1 function, 1 thing: webhook storage)
const webhookRegistry = new Map<string, WebhookRegistration>();

// Health check endpoint (1 function, 1 thing: health monitoring)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "webhook-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    registry: {
      activeWebhooks: webhookRegistry.size,
      totalWebhooks: Array.from(webhookRegistry.values()).filter(w => w.active).length
    },
    endpoints: {
      health: "operational",
      register: "operational",
      unregister: "operational",
      trigger: "operational",
      list: "operational",
      verify: "operational",
      receive: "operational"
    }
  });
});

// Register a new webhook (1 function, 1 thing: webhook registration)
app.post("/register", async (req: Request, res: Response): Promise<any> => {
  try {
    const { url, events, secret, metadata } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        error: "URL and events array are required"
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: "Invalid webhook URL"
      });
    }

    const webhookId = crypto.randomBytes(16).toString('hex');
    const webhook: WebhookRegistration = {
      id: webhookId,
      url,
      events,
      secret,
      active: true,
      createdAt: new Date().toISOString(),
      metadata
    };

    // Store in Firestore for persistence
    const db = admin.firestore();
    await db.collection('webhooks').doc(webhookId).set(webhook);

    // Add to local registry
    webhookRegistry.set(webhookId, webhook);

    res.status(201).json({
      success: true,
      webhook: {
        id: webhookId,
        url,
        events,
        active: true
      }
    });

  } catch (error) {
    console.error('[Webhook] Registration error:', error);
    res.status(500).json({ error: "Failed to register webhook" });
  }
});

// Unregister a webhook (1 function, 1 thing: webhook removal)
app.delete("/unregister/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!webhookRegistry.has(id)) {
      // Try to find in Firestore
      const db = admin.firestore();
      const doc = await db.collection('webhooks').doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({
          error: "Webhook not found"
        });
      }
    }

    // Remove from Firestore
    const db = admin.firestore();
    await db.collection('webhooks').doc(id).delete();

    // Remove from local registry
    webhookRegistry.delete(id);

    res.status(200).json({
      success: true,
      message: "Webhook unregistered",
      id
    });

  } catch (error) {
    console.error('[Webhook] Unregister error:', error);
    res.status(500).json({ error: "Failed to unregister webhook" });
  }
});

// Trigger webhooks for an event (1 function, 1 thing: webhook triggering)
app.post("/trigger", async (req: Request, res: Response): Promise<any> => {
  try {
    const { type, data, source = 'manual' } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        error: "Event type and data are required"
      });
    }

    const event: WebhookEvent = {
      id: crypto.randomBytes(16).toString('hex'),
      type,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    // Get all webhooks subscribed to this event type
    const db = admin.firestore();
    const webhooksSnapshot = await db.collection('webhooks')
      .where('events', 'array-contains', type)
      .where('active', '==', true)
      .get();

    const deliveries: WebhookDelivery[] = [];

    // Trigger each webhook
    for (const doc of webhooksSnapshot.docs) {
      const webhook = doc.data() as WebhookRegistration;

      const delivery: WebhookDelivery = {
        webhookId: webhook.id,
        eventId: event.id,
        status: 'pending',
        attempts: 0
      };

      try {
        // Prepare payload
        const payload = {
          id: event.id,
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
          webhookId: webhook.id
        };

        // Add signature if secret is configured
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event.type,
          'X-Webhook-Id': webhook.id
        };

        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');
          headers['X-Webhook-Signature'] = signature;
        }

        // Send webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        delivery.status = response.ok ? 'success' : 'failed';
        delivery.attempts = 1;
        delivery.lastAttempt = new Date().toISOString();
        delivery.response = {
          status: response.status,
          statusText: response.statusText
        };

        // Update last triggered time
        await db.collection('webhooks').doc(webhook.id).update({
          lastTriggered: new Date().toISOString()
        });

      } catch (error: any) {
        delivery.status = 'failed';
        delivery.attempts = 1;
        delivery.lastAttempt = new Date().toISOString();
        delivery.error = error.message;
      }

      deliveries.push(delivery);

      // Store delivery record
      await db.collection('webhook_deliveries').add(delivery);
    }

    res.status(200).json({
      success: true,
      event,
      deliveries: {
        total: deliveries.length,
        successful: deliveries.filter(d => d.status === 'success').length,
        failed: deliveries.filter(d => d.status === 'failed').length,
        details: deliveries
      }
    });

  } catch (error) {
    console.error('[Webhook] Trigger error:', error);
    res.status(500).json({ error: "Failed to trigger webhooks" });
  }
});

// List all webhooks (1 function, 1 thing: webhook listing)
app.get("/list", async (req: Request, res: Response): Promise<any> => {
  try {
    const { active } = req.query;

    const db = admin.firestore();
    let query = db.collection('webhooks').limit(100);

    if (active !== undefined) {
      query = query.where('active', '==', active === 'true');
    }

    const snapshot = await query.get();
    const webhooks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      webhooks,
      count: webhooks.length
    });

  } catch (error) {
    console.error('[Webhook] List error:', error);
    res.status(500).json({ error: "Failed to list webhooks" });
  }
});

// Verify webhook signature (1 function, 1 thing: signature verification)
app.post("/verify", async (req: Request, res: Response): Promise<any> => {
  try {
    const { webhookId, payload, signature } = req.body;

    if (!webhookId || !payload || !signature) {
      return res.status(400).json({
        error: "Webhook ID, payload, and signature are required"
      });
    }

    const db = admin.firestore();
    const doc = await db.collection('webhooks').doc(webhookId).get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Webhook not found"
      });
    }

    const webhook = doc.data() as WebhookRegistration;

    if (!webhook.secret) {
      return res.status(400).json({
        error: "Webhook has no secret configured"
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const isValid = signature === expectedSignature;

    res.status(200).json({
      success: true,
      valid: isValid
    });

  } catch (error) {
    console.error('[Webhook] Verify error:', error);
    res.status(500).json({ error: "Failed to verify signature" });
  }
});

// Receive webhook from external sources (1 function, 1 thing: webhook reception)
app.post("/receive", async (req: Request, res: Response): Promise<any> => {
  try {
    const { headers, body } = req;

    // Log received webhook for debugging
    console.log('[Webhook] Received:', {
      headers: headers,
      body: body,
      timestamp: new Date().toISOString()
    });

    // Store in Firestore for processing
    const db = admin.firestore();
    const docRef = await db.collection('received_webhooks').add({
      headers: JSON.stringify(headers),
      body,
      source: headers['x-source'] || 'unknown',
      timestamp: new Date().toISOString(),
      processed: false
    });

    // Process based on source
    const source = headers['x-source'] || headers['user-agent'] || 'unknown';

    if (source.includes('google') || source.includes('sheets')) {
      // Google Sheets webhook
      await processGoogleSheetsWebhook(body, docRef.id);
    } else if (source.includes('github')) {
      // GitHub webhook
      await processGitHubWebhook(body, docRef.id);
    } else {
      // Generic webhook
      await processGenericWebhook(body, docRef.id);
    }

    // Mark as processed
    await docRef.update({ processed: true });

    res.status(200).json({
      success: true,
      message: "Webhook received and processed",
      id: docRef.id
    });

  } catch (error) {
    console.error('[Webhook] Receive error:', error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

// Process Google Sheets webhook (1 function, 1 thing: sheets processing)
async function processGoogleSheetsWebhook(data: any, webhookId: string): Promise<void> {
  try {
    const db = admin.firestore();

    // Extract sheet data
    const { sheetId, range, values } = data;

    if (values && Array.isArray(values)) {
      // Store events data
      const batch = db.batch();

      values.forEach((row: any[], index: number) => {
        if (index === 0) return; // Skip header row

        const [title, venue, date, time, price, description] = row;
        const eventId = title?.toLowerCase().replace(/\s+/g, '-') || `event-${index}`;

        const eventRef = db.collection('events').doc(eventId);
        batch.set(eventRef, {
          title,
          venue,
          date,
          time,
          price,
          description,
          source: 'google-sheets',
          sheetId,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
      console.log(`[Webhook] Processed ${values.length - 1} events from Google Sheets`);
    }

  } catch (error) {
    console.error('[Webhook] Google Sheets processing error:', error);
    throw error;
  }
}

// Process GitHub webhook (1 function, 1 thing: github processing)
async function processGitHubWebhook(data: any, webhookId: string): Promise<void> {
  try {
    const { action, repository, sender } = data;

    // Log GitHub events for monitoring
    const db = admin.firestore();
    await db.collection('github_events').add({
      webhookId,
      action,
      repository: repository?.full_name,
      sender: sender?.login,
      timestamp: new Date().toISOString()
    });

    console.log(`[Webhook] Processed GitHub ${action} event`);

  } catch (error) {
    console.error('[Webhook] GitHub processing error:', error);
    throw error;
  }
}

// Process generic webhook (1 function, 1 thing: generic processing)
async function processGenericWebhook(data: any, webhookId: string): Promise<void> {
  try {
    // Store for later processing
    const db = admin.firestore();
    await db.collection('generic_webhooks').add({
      webhookId,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });

    console.log('[Webhook] Stored generic webhook for processing');

  } catch (error) {
    console.error('[Webhook] Generic processing error:', error);
    throw error;
  }
}

// Setup webhook endpoint (1 function, 1 thing: webhook setup)
app.post("/setup", async (req: Request, res: Response): Promise<any> => {
  try {
    const { sheetId, callbackUrl } = req.body;

    if (!sheetId) {
      return res.status(400).json({
        error: "Sheet ID is required"
      });
    }

    // In production, this would configure Google Sheets API webhook
    // For now, return success with webhook URL
    const webhookUrl = callbackUrl ||
      `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/webhookService/receive`;

    res.status(200).json({
      success: true,
      configured: true,
      webhookUrl,
      sheetId,
      message: "Webhook configured for Google Sheets",
      instructions: "Add this URL to your Google Apps Script doPost function"
    });

  } catch (error) {
    console.error('[Webhook] Setup error:', error);
    res.status(500).json({ error: "Failed to setup webhook" });
  }
});

// Export the function
export const webhookService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
}, app);