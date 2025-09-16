import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { securityMiddleware } from '../../shared/security-middleware';
import { UserSchema, MatchSchema, validateSchema } from '../../shared/schemas';

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

// Apply security middleware
app.use(securityMiddleware.validateInput);
app.use(securityMiddleware.sanitizeXSS);

// Interfaces
interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  company?: string;
  position?: string;
  industry?: string;
  interests?: string[];
  skills?: string[];
  lookingFor?: string[];
  photoURL?: string;
  bio?: string;
  linkedinUrl?: string;
  location?: {
    lat: number;
    lng: number;
    venue?: string;
  };
  preferences?: {
    maxDistance?: number;
    industries?: string[];
    roles?: string[];
    meetingTypes?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Match {
  id: string;
  user1: string;
  user2: string;
  score: number;
  reasons: string[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  commonInterests?: string[];
  commonSkills?: string[];
  mutualConnections?: number;
}

interface MatchRequest {
  id: string;
  fromUser: string;
  toUser: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "matchmaking-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "operational",
      profile: "operational",
      matches: "operational",
      requests: "operational",
      swipe: "operational",
      nearby: "operational"
    }
  });
});

// Authentication middleware
async function authenticateUser(req: any, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid authentication token" });
  }
}

// Create or update user profile
app.post("/profile", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const profileData = req.body;

    // Validate required fields
    if (!profileData.displayName) {
      return res.status(400).json({ error: "Display name is required" });
    }

    const profile: UserProfile = {
      uid,
      displayName: profileData.displayName,
      email: profileData.email,
      company: profileData.company,
      position: profileData.position,
      industry: profileData.industry,
      interests: profileData.interests || [],
      skills: profileData.skills || [],
      lookingFor: profileData.lookingFor || [],
      photoURL: profileData.photoURL,
      bio: profileData.bio,
      linkedinUrl: profileData.linkedinUrl,
      location: profileData.location,
      preferences: profileData.preferences || {},
      createdAt: profileData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = admin.firestore();
    await db.collection('matchmaking_profiles').doc(uid).set(profile, { merge: true });

    res.status(200).json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('[Matchmaking] Profile error:', error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// Get user profile
app.get("/profile/:uid?", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid: targetUid } = req.params;
    const { uid: currentUid } = req.user;

    // If no UID specified, return current user's profile
    const profileUid = targetUid || currentUid;

    const db = admin.firestore();
    const profileDoc = await db.collection('matchmaking_profiles').doc(profileUid).get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = profileDoc.data() as UserProfile;

    // If viewing someone else's profile, don't return sensitive data
    if (profileUid !== currentUid) {
      delete profile.email;
      delete profile.preferences;
    }

    res.status(200).json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('[Matchmaking] Get profile error:', error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Generate matches for user
app.post("/matches/generate", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { limit = 10, radius = 5000 } = req.body;

    const db = admin.firestore();

    // Get current user's profile
    const userProfileDoc = await db.collection('matchmaking_profiles').doc(uid).get();
    if (!userProfileDoc.exists) {
      return res.status(400).json({ error: "User profile not found" });
    }

    const userProfile = userProfileDoc.data() as UserProfile;

    // Get potential matches (exclude current user and already matched users)
    const potentialMatches = await db.collection('matchmaking_profiles')
      .where(admin.firestore.FieldPath.documentId(), '!=', uid)
      .limit(50)
      .get();

    const matches: Match[] = [];

    for (const matchDoc of potentialMatches.docs) {
      const matchProfile = matchDoc.data() as UserProfile;

      // Calculate match score
      const score = calculateMatchScore(userProfile, matchProfile);

      if (score > 0.3) { // Only include matches with score > 30%
        const match: Match = {
          id: `${uid}_${matchProfile.uid}_${Date.now()}`,
          user1: uid,
          user2: matchProfile.uid,
          score,
          reasons: generateMatchReasons(userProfile, matchProfile),
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          commonInterests: findCommonItems(userProfile.interests, matchProfile.interests),
          commonSkills: findCommonItems(userProfile.skills, matchProfile.skills)
        };

        matches.push(match);
      }
    }

    // Sort by score and limit results
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Save matches to database
    const batch = db.batch();
    topMatches.forEach(match => {
      const matchRef = db.collection('matches').doc(match.id);
      batch.set(matchRef, match);
    });
    await batch.commit();

    res.status(200).json({
      success: true,
      matches: topMatches,
      count: topMatches.length
    });

  } catch (error) {
    console.error('[Matchmaking] Generate matches error:', error);
    res.status(500).json({ error: "Failed to generate matches" });
  }
});

// Get user's matches
app.get("/matches", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { status, limit = 20 } = req.query;

    const db = admin.firestore();
    let query = db.collection('matches')
      .where('user1', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (status) {
      query = query.where('status', '==', status);
    }

    const matchesSnapshot = await query.get();
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get profile data for matched users
    const enrichedMatches = await Promise.all(
      matches.map(async (match: any) => {
        const matchedUserDoc = await db.collection('matchmaking_profiles').doc(match.user2).get();
        const matchedUserProfile = matchedUserDoc.data();

        return {
          ...match,
          matchedUser: {
            uid: match.user2,
            displayName: matchedUserProfile?.displayName,
            photoURL: matchedUserProfile?.photoURL,
            company: matchedUserProfile?.company,
            position: matchedUserProfile?.position,
            bio: matchedUserProfile?.bio
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      matches: enrichedMatches
    });

  } catch (error) {
    console.error('[Matchmaking] Get matches error:', error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// Swipe on a match (like/pass)
app.post("/swipe", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { matchId, action } = req.body; // action: 'like' | 'pass'

    if (!['like', 'pass'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'like' or 'pass'" });
    }

    const db = admin.firestore();
    const matchRef = db.collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) {
      return res.status(404).json({ error: "Match not found" });
    }

    const match = matchDoc.data() as Match;

    // Verify user is part of this match
    if (match.user1 !== uid && match.user2 !== uid) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (action === 'like') {
      // Check if it's a mutual like
      const otherUserId = match.user1 === uid ? match.user2 : match.user1;
      const reverseMatchQuery = await db.collection('matches')
        .where('user1', '==', otherUserId)
        .where('user2', '==', uid)
        .where('status', '==', 'accepted')
        .get();

      if (!reverseMatchQuery.empty) {
        // It's a mutual match!
        await matchRef.update({
          status: 'accepted',
          respondedAt: new Date().toISOString()
        });

        // Create a connection request
        const connectionId = `${uid}_${otherUserId}_${Date.now()}`;
        await db.collection('match_requests').doc(connectionId).set({
          id: connectionId,
          fromUser: uid,
          toUser: otherUserId,
          status: 'accepted',
          createdAt: new Date().toISOString(),
          respondedAt: new Date().toISOString()
        });

        res.status(200).json({
          success: true,
          action: 'like',
          mutual: true,
          message: "It's a match!"
        });
      } else {
        await matchRef.update({
          status: 'accepted',
          respondedAt: new Date().toISOString()
        });

        res.status(200).json({
          success: true,
          action: 'like',
          mutual: false
        });
      }
    } else {
      await matchRef.update({
        status: 'declined',
        respondedAt: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        action: 'pass'
      });
    }

  } catch (error) {
    console.error('[Matchmaking] Swipe error:', error);
    res.status(500).json({ error: "Failed to process swipe" });
  }
});

// Get nearby users
app.get("/nearby", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { radius = 1000, limit = 20 } = req.query;

    const db = admin.firestore();

    // Get current user's location
    const userProfileDoc = await db.collection('matchmaking_profiles').doc(uid).get();
    if (!userProfileDoc.exists) {
      return res.status(400).json({ error: "User profile not found" });
    }

    const userProfile = userProfileDoc.data() as UserProfile;
    if (!userProfile.location) {
      return res.status(400).json({ error: "User location not set" });
    }

    // Get all profiles with locations
    const nearbySnapshot = await db.collection('matchmaking_profiles')
      .where('location', '!=', null)
      .limit(100)
      .get();

    const nearbyUsers = nearbySnapshot.docs
      .filter(doc => doc.id !== uid)
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter((profile: any) => {
        if (!profile.location) return false;
        const distance = calculateDistance(
          userProfile.location!.lat,
          userProfile.location!.lng,
          profile.location.lat,
          profile.location.lng
        );
        return distance <= parseInt(radius as string);
      })
      .slice(0, parseInt(limit as string));

    res.status(200).json({
      success: true,
      users: nearbyUsers,
      userLocation: userProfile.location
    });

  } catch (error) {
    console.error('[Matchmaking] Nearby error:', error);
    res.status(500).json({ error: "Failed to fetch nearby users" });
  }
});

// Helper functions
function calculateMatchScore(user1: UserProfile, user2: UserProfile): number {
  let score = 0;

  // Industry compatibility
  if (user1.industry === user2.industry) score += 0.2;

  // Common interests
  const commonInterests = findCommonItems(user1.interests, user2.interests);
  score += Math.min(commonInterests.length * 0.1, 0.3);

  // Common skills
  const commonSkills = findCommonItems(user1.skills, user2.skills);
  score += Math.min(commonSkills.length * 0.05, 0.2);

  // Looking for alignment
  const lookingForMatch = user1.lookingFor?.some(item =>
    user2.skills?.includes(item) || user2.interests?.includes(item)
  ) || false;
  if (lookingForMatch) score += 0.2;

  // Random factor for variety
  score += Math.random() * 0.1;

  return Math.min(score, 1);
}

function generateMatchReasons(user1: UserProfile, user2: UserProfile): string[] {
  const reasons: string[] = [];

  if (user1.industry === user2.industry) {
    reasons.push(`Both work in ${user1.industry}`);
  }

  const commonInterests = findCommonItems(user1.interests, user2.interests);
  if (commonInterests.length > 0) {
    reasons.push(`Shared interests: ${commonInterests.slice(0, 2).join(', ')}`);
  }

  const commonSkills = findCommonItems(user1.skills, user2.skills);
  if (commonSkills.length > 0) {
    reasons.push(`Similar skills: ${commonSkills.slice(0, 2).join(', ')}`);
  }

  if (reasons.length === 0) {
    reasons.push('Potential networking opportunity');
  }

  return reasons;
}

function findCommonItems(arr1: string[] = [], arr2: string[] = []): string[] {
  return arr1.filter(item => arr2.includes(item));
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
}

// Export the function
export const matchmakingService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
}, app);