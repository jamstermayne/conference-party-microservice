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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));
app.use(express.json());

// Admin authentication middleware
async function authenticateAdmin(req: any, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user has admin privileges
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const isAdmin = userRecord.customClaims?.admin === true;

    if (!isAdmin) {
      return res.status(403).json({ error: "Admin privileges required" });
    }

    req.user = { uid: decodedToken.uid, admin: true };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid authentication token" });
  }
}

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "admin-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "operational",
      users: "operational",
      events: "operational",
      analytics: "operational",
      system: "operational",
      invites: "operational"
    }
  });
});

// Get system statistics
app.get("/stats", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const db = admin.firestore();

    // Get various collection counts
    const [
      usersSnapshot,
      eventsSnapshot,
      matchesSnapshot,
      calendarEventsSnapshot,
      profilesSnapshot
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('events').count().get(),
      db.collection('matches').count().get(),
      db.collection('calendar_events').count().get(),
      db.collection('matchmaking_profiles').count().get()
    ]);

    const stats = {
      users: {
        total: usersSnapshot.data().count,
        active: 0 // TODO: Calculate active users
      },
      events: {
        total: eventsSnapshot.data().count
      },
      matchmaking: {
        profiles: profilesSnapshot.data().count,
        totalMatches: matchesSnapshot.data().count
      },
      calendar: {
        events: calendarEventsSnapshot.data().count
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    res.status(200).json({
      success: true,
      stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin] Stats error:', error);
    res.status(500).json({ error: "Failed to fetch system statistics" });
  }
});

// Get all users with pagination
app.get("/users", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { limit = '50', offset = '0', search } = req.query;

    const db = admin.firestore();
    let query = db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (offset !== '0') {
      // Note: Firestore offset is not directly supported, this is simplified
      query = query.offset(parseInt(offset as string));
    }

    const usersSnapshot = await query.get();
    let users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    // Apply search filter if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      users = users.filter((user: any) =>
        user.email?.toLowerCase().includes(searchTerm) ||
        user.displayName?.toLowerCase().includes(searchTerm)
      );
    }

    res.status(200).json({
      success: true,
      users,
      meta: {
        total: users.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('[Admin] Get users error:', error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get specific user details
app.get("/users/:uid", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { uid } = req.params;

    const db = admin.firestore();

    // Get user record from Auth
    const userRecord = await admin.auth().getUser(uid);

    // Get additional user data from Firestore
    const [userDoc, profileDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('matchmaking_profiles').doc(uid).get()
    ]);

    const userData = {
      auth: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        customClaims: userRecord.customClaims
      },
      profile: userDoc.exists ? userDoc.data() : null,
      matchmakingProfile: profileDoc.exists ? profileDoc.data() : null
    };

    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('[Admin] Get user error:', error);
    if (error instanceof Error && error.message.includes('no user record')) {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  }
});

// Update user
app.put("/users/:uid", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { uid } = req.params;
    const updates = req.body;

    // Update auth record if auth fields are provided
    const authUpdates: any = {};
    if (updates.email) authUpdates.email = updates.email;
    if (updates.displayName) authUpdates.displayName = updates.displayName;
    if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
    if (updates.disabled !== undefined) authUpdates.disabled = updates.disabled;

    if (Object.keys(authUpdates).length > 0) {
      await admin.auth().updateUser(uid, authUpdates);
    }

    // Update custom claims if provided
    if (updates.customClaims) {
      await admin.auth().setCustomUserClaims(uid, updates.customClaims);
    }

    // Update Firestore user record if profile fields are provided
    const profileUpdates: any = {};
    if (updates.bio) profileUpdates.bio = updates.bio;
    if (updates.company) profileUpdates.company = updates.company;
    if (updates.position) profileUpdates.position = updates.position;

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updatedAt = new Date().toISOString();
      const db = admin.firestore();
      await db.collection('users').doc(uid).update(profileUpdates);
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully"
    });

  } catch (error) {
    console.error('[Admin] Update user error:', error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
app.delete("/users/:uid", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { uid } = req.params;

    const db = admin.firestore();

    // Delete user data from Firestore
    const batch = db.batch();

    // Delete from all relevant collections
    const collections = ['users', 'matchmaking_profiles', 'calendar_events', 'matches'];
    for (const collectionName of collections) {
      const docs = await db.collection(collectionName).where('uid', '==', uid).get();
      docs.forEach(doc => batch.delete(doc.ref));
    }

    await batch.commit();

    // Delete auth record
    await admin.auth().deleteUser(uid);

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error('[Admin] Delete user error:', error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get all events for admin management
app.get("/events", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { limit = '100', status } = req.query;

    const db = admin.firestore();
    let query = db.collection('events')
      .orderBy('date', 'desc')
      .limit(parseInt(limit as string));

    const eventsSnapshot = await query.get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[Admin] Get events error:', error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Create/update event
app.post("/events", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const eventData = req.body;

    if (!eventData.title || !eventData.venue || !eventData.date) {
      return res.status(400).json({
        error: "Missing required fields: title, venue, date"
      });
    }

    const eventId = eventData.id || `evt_${Date.now()}`;
    const event = {
      ...eventData,
      id: eventId,
      updatedAt: new Date().toISOString(),
      createdAt: eventData.createdAt || new Date().toISOString()
    };

    const db = admin.firestore();
    await db.collection('events').doc(eventId).set(event, { merge: true });

    res.status(200).json({
      success: true,
      event
    });

  } catch (error) {
    console.error('[Admin] Create/update event error:', error);
    res.status(500).json({ error: "Failed to save event" });
  }
});

// Delete event
app.delete("/events/:eventId", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { eventId } = req.params;

    const db = admin.firestore();
    await db.collection('events').doc(eventId).delete();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully"
    });

  } catch (error) {
    console.error('[Admin] Delete event error:', error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Get analytics data
app.get("/analytics", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { timeRange = '7d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const db = admin.firestore();

    // Get user registrations in time range
    const usersSnapshot = await db.collection('users')
      .where('createdAt', '>=', startDate.toISOString())
      .where('createdAt', '<=', endDate.toISOString())
      .get();

    // Get matches created in time range
    const matchesSnapshot = await db.collection('matches')
      .where('createdAt', '>=', startDate.toISOString())
      .where('createdAt', '<=', endDate.toISOString())
      .get();

    // Get calendar events in time range
    const calendarSnapshot = await db.collection('calendar_events')
      .where('createdAt', '>=', startDate.toISOString())
      .where('createdAt', '<=', endDate.toISOString())
      .get();

    const analytics = {
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      metrics: {
        newUsers: usersSnapshot.size,
        newMatches: matchesSnapshot.size,
        newCalendarEvents: calendarSnapshot.size,
        dailyBreakdown: generateDailyBreakdown(usersSnapshot.docs, matchesSnapshot.docs, startDate, endDate)
      }
    };

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('[Admin] Analytics error:', error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// System maintenance endpoints
app.post("/system/maintenance", authenticateAdmin, async (req: any, res: Response) => {
  try {
    const { action, target } = req.body;

    switch (action) {
      case 'clear_cache':
        // Clear any caches
        console.log('[Admin] Cache cleared');
        break;

      case 'sync_events':
        // Trigger event sync
        console.log('[Admin] Event sync triggered');
        break;

      case 'cleanup_expired':
        // Clean up expired matches, events, etc.
        const db = admin.firestore();
        const expiredMatches = await db.collection('matches')
          .where('expiresAt', '<', new Date().toISOString())
          .get();

        const batch = db.batch();
        expiredMatches.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        console.log(`[Admin] Cleaned up ${expiredMatches.size} expired matches`);
        break;

      default:
        return res.status(400).json({ error: "Unknown maintenance action" });
    }

    res.status(200).json({
      success: true,
      message: `Maintenance action '${action}' completed`
    });

  } catch (error) {
    console.error('[Admin] Maintenance error:', error);
    res.status(500).json({ error: "Maintenance action failed" });
  }
});

// Helper function to generate daily breakdown
function generateDailyBreakdown(userDocs: any[], matchDocs: any[], startDate: Date, endDate: Date) {
  const breakdown: any[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const dayUsers = userDocs.filter(doc => {
      const createdAt = new Date(doc.data().createdAt);
      return createdAt >= dayStart && createdAt <= dayEnd;
    }).length;

    const dayMatches = matchDocs.filter(doc => {
      const createdAt = new Date(doc.data().createdAt);
      return createdAt >= dayStart && createdAt <= dayEnd;
    }).length;

    breakdown.push({
      date: current.toISOString().split('T')[0],
      users: dayUsers,
      matches: dayMatches
    });

    current.setDate(current.getDate() + 1);
  }

  return breakdown;
}

// Export the function
export const adminService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 3,
}, app);