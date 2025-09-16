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
interface UserProfile {
  id: string;
  email: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  interests: string[];
  goals: string[];
  skills: string[];
  linkedIn?: string;
  twitter?: string;
  avatar?: string;
  preferences: {
    visibility: 'public' | 'connections' | 'private';
    notifications: boolean;
    matchingEnabled: boolean;
    dataSharing: boolean;
  };
  stats: {
    connectionsCount: number;
    eventsAttended: number;
    matchScore: number;
    lastActive?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Health check (1 function, 1 thing: health monitoring)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "user-profile-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "operational",
      profile: "operational",
      preferences: "operational",
      connections: "operational",
      search: "operational",
      stats: "operational"
    }
  });
});

// Get user profile (1 function, 1 thing: profile retrieval)
app.get("/profile/:userId", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    const db = admin.firestore();
    const profileDoc = await db.collection('user_profiles').doc(userId).get();

    if (!profileDoc.exists) {
      return res.status(404).json({
        error: "Profile not found"
      });
    }

    const profile = profileDoc.data() as UserProfile;

    // Check visibility settings
    const requesterId = (req as any).user?.uid;
    if (profile.preferences.visibility === 'private' && requesterId !== userId) {
      return res.status(403).json({
        error: "Profile is private"
      });
    }

    if (profile.preferences.visibility === 'connections' && requesterId !== userId) {
      // Check if requester is a connection
      const isConnection = await checkConnection(userId, requesterId);
      if (!isConnection) {
        return res.status(403).json({
          error: "Profile is visible to connections only"
        });
      }
    }

    res.status(200).json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('[Profile] Get profile error:', error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Create or update profile (1 function, 1 thing: profile management)
app.put("/profile/:userId", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).user?.uid;

    // Only allow users to update their own profile
    if (requesterId !== userId) {
      return res.status(403).json({
        error: "Unauthorized to update this profile"
      });
    }

    const updates = req.body;
    const db = admin.firestore();
    const profileRef = db.collection('user_profiles').doc(userId);

    const profileDoc = await profileRef.get();

    if (profileDoc.exists) {
      // Update existing profile
      const updatedProfile = {
        ...profileDoc.data(),
        ...updates,
        id: userId,
        updatedAt: new Date().toISOString()
      };

      await profileRef.update(updatedProfile);

      res.status(200).json({
        success: true,
        profile: updatedProfile
      });
    } else {
      // Create new profile
      const newProfile: UserProfile = {
        id: userId,
        email: updates.email || '',
        name: updates.name || '',
        title: updates.title,
        company: updates.company,
        bio: updates.bio,
        interests: updates.interests || [],
        goals: updates.goals || [],
        skills: updates.skills || [],
        linkedIn: updates.linkedIn,
        twitter: updates.twitter,
        avatar: updates.avatar,
        preferences: updates.preferences || {
          visibility: 'public',
          notifications: true,
          matchingEnabled: true,
          dataSharing: false
        },
        stats: {
          connectionsCount: 0,
          eventsAttended: 0,
          matchScore: 0,
          lastActive: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await profileRef.set(newProfile);

      res.status(201).json({
        success: true,
        profile: newProfile
      });
    }

  } catch (error) {
    console.error('[Profile] Update profile error:', error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update preferences (1 function, 1 thing: preference management)
app.post("/preferences/:userId", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).user?.uid;

    if (requesterId !== userId) {
      return res.status(403).json({
        error: "Unauthorized to update preferences"
      });
    }

    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        error: "Preferences object is required"
      });
    }

    const db = admin.firestore();
    await db.collection('user_profiles').doc(userId).update({
      preferences,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('[Profile] Update preferences error:', error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Get user connections (1 function, 1 thing: connection retrieval)
app.get("/connections/:userId", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const db = admin.firestore();

    // Get connections from both directions
    const [sentConnections, receivedConnections] = await Promise.all([
      db.collection('connections')
        .where('fromUserId', '==', userId)
        .where('status', '==', 'accepted')
        .get(),
      db.collection('connections')
        .where('toUserId', '==', userId)
        .where('status', '==', 'accepted')
        .get()
    ]);

    const connectionUserIds = new Set<string>();

    sentConnections.forEach(doc => {
      const data = doc.data();
      connectionUserIds.add(data.toUserId);
    });

    receivedConnections.forEach(doc => {
      const data = doc.data();
      connectionUserIds.add(data.fromUserId);
    });

    // Get profile data for connections
    const connectionIds = Array.from(connectionUserIds);
    const paginatedIds = connectionIds.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    const profiles = await Promise.all(
      paginatedIds.map(async (id) => {
        const profileDoc = await db.collection('user_profiles').doc(id).get();
        return profileDoc.exists ? profileDoc.data() : null;
      })
    );

    const validProfiles = profiles.filter(p => p !== null);

    res.status(200).json({
      success: true,
      connections: validProfiles,
      meta: {
        total: connectionIds.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < connectionIds.length
      }
    });

  } catch (error) {
    console.error('[Profile] Get connections error:', error);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

// Search profiles (1 function, 1 thing: profile search)
app.get("/search", async (req: Request, res: Response): Promise<any> => {
  try {
    const { q, interests, skills, company, limit = '20' } = req.query;

    if (!q && !interests && !skills && !company) {
      return res.status(400).json({
        error: "At least one search parameter is required"
      });
    }

    const db = admin.firestore();
    let query = db.collection('user_profiles')
      .where('preferences.visibility', 'in', ['public', 'connections'])
      .limit(parseInt(limit as string));

    // Note: Firestore has limitations on complex queries
    // For production, consider using Algolia or Elasticsearch

    if (company) {
      query = query.where('company', '==', company);
    }

    const snapshot = await query.get();
    const profiles: UserProfile[] = [];

    snapshot.forEach(doc => {
      const profile = doc.data() as UserProfile;
      let match = false;

      // Text search in name and bio
      if (q) {
        const searchTerm = (q as string).toLowerCase();
        if (
          profile.name?.toLowerCase().includes(searchTerm) ||
          profile.bio?.toLowerCase().includes(searchTerm) ||
          profile.title?.toLowerCase().includes(searchTerm)
        ) {
          match = true;
        }
      }

      // Interest matching
      if (interests && !match) {
        const searchInterests = (interests as string).split(',').map(i => i.trim().toLowerCase());
        const profileInterests = profile.interests.map(i => i.toLowerCase());
        match = searchInterests.some(i => profileInterests.includes(i));
      }

      // Skill matching
      if (skills && !match) {
        const searchSkills = (skills as string).split(',').map(s => s.trim().toLowerCase());
        const profileSkills = profile.skills.map(s => s.toLowerCase());
        match = searchSkills.some(s => profileSkills.includes(s));
      }

      if (match || (!q && !interests && !skills)) {
        profiles.push(profile);
      }
    });

    res.status(200).json({
      success: true,
      profiles,
      count: profiles.length
    });

  } catch (error) {
    console.error('[Profile] Search error:', error);
    res.status(500).json({ error: "Failed to search profiles" });
  }
});

// Update user stats (1 function, 1 thing: stats management)
app.post("/stats/:userId", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { action, value } = req.body;

    if (!action) {
      return res.status(400).json({
        error: "Action is required"
      });
    }

    const db = admin.firestore();
    const profileRef = db.collection('user_profiles').doc(userId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return res.status(404).json({
        error: "Profile not found"
      });
    }

    const profile = profileDoc.data() as UserProfile;
    const updates: any = {
      'stats.lastActive': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    switch (action) {
      case 'incrementConnections':
        updates['stats.connectionsCount'] = (profile.stats.connectionsCount || 0) + 1;
        break;
      case 'decrementConnections':
        updates['stats.connectionsCount'] = Math.max(0, (profile.stats.connectionsCount || 0) - 1);
        break;
      case 'incrementEvents':
        updates['stats.eventsAttended'] = (profile.stats.eventsAttended || 0) + 1;
        break;
      case 'updateMatchScore':
        updates['stats.matchScore'] = value || 0;
        break;
      default:
        return res.status(400).json({
          error: "Invalid action"
        });
    }

    await profileRef.update(updates);

    res.status(200).json({
      success: true,
      stats: {
        ...profile.stats,
        ...updates
      }
    });

  } catch (error) {
    console.error('[Profile] Update stats error:', error);
    res.status(500).json({ error: "Failed to update stats" });
  }
});

// Helper function: Check if two users are connected (1 function, 1 thing: connection check)
async function checkConnection(userId1: string, userId2: string): Promise<boolean> {
  const db = admin.firestore();

  const [sent, received] = await Promise.all([
    db.collection('connections')
      .where('fromUserId', '==', userId1)
      .where('toUserId', '==', userId2)
      .where('status', '==', 'accepted')
      .get(),
    db.collection('connections')
      .where('fromUserId', '==', userId2)
      .where('toUserId', '==', userId1)
      .where('status', '==', 'accepted')
      .get()
  ]);

  return !sent.empty || !received.empty;
}

// Export the function
export const userProfileService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 10,
}, app);