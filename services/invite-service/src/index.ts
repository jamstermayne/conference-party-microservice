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

// Constants
const INVITE_LIMIT = 10; // Each user gets 10 invites
const INVITE_CODE_LENGTH = 8;
const INVITE_EXPIRY_DAYS = 30;

// Interfaces
interface Invite {
  id: string;
  code: string;
  fromUserId: string;
  fromUserName?: string;
  toEmail?: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  metadata?: {
    campaign?: string;
    source?: string;
    medium?: string;
  };
}

interface UserInviteStats {
  userId: string;
  totalInvites: number;
  usedInvites: number;
  remainingInvites: number;
  acceptedInvites: number;
  pendingInvites: number;
  inviteHistory: Invite[];
}

// Health check endpoint (1 function, 1 thing: health monitoring)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "invite-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    features: {
      inviteLimit: INVITE_LIMIT,
      codeLength: INVITE_CODE_LENGTH,
      expiryDays: INVITE_EXPIRY_DAYS
    },
    endpoints: {
      health: "operational",
      create: "operational",
      validate: "operational",
      accept: "operational",
      stats: "operational",
      list: "operational"
    }
  });
});

// Authentication middleware (1 function, 1 thing: auth verification)
async function authenticateUser(req: any, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      // Allow public access for validate and accept endpoints
      if (req.path === '/validate' || req.path.startsWith('/accept')) {
        return next();
      }
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid authentication token" });
  }
}

// Generate unique invite code (1 function, 1 thing: code generation)
function generateInviteCode(): string {
  return crypto.randomBytes(INVITE_CODE_LENGTH / 2)
    .toString('hex')
    .toUpperCase()
    .substring(0, INVITE_CODE_LENGTH);
}

// Create a new invite (1 function, 1 thing: invite creation)
app.post("/create", authenticateUser, async (req: any, res: Response): Promise<any> => {
  try {
    const { uid } = req.user;
    const { toEmail, metadata } = req.body;

    const db = admin.firestore();

    // Check user's invite limit
    const userInvitesSnapshot = await db.collection('invites')
      .where('fromUserId', '==', uid)
      .get();

    if (userInvitesSnapshot.size >= INVITE_LIMIT) {
      return res.status(400).json({
        error: "Invite limit reached",
        limit: INVITE_LIMIT,
        used: userInvitesSnapshot.size
      });
    }

    // Generate unique code
    let code = generateInviteCode();
    let codeExists = true;

    // Ensure code is unique
    while (codeExists) {
      const existingCode = await db.collection('invites')
        .where('code', '==', code)
        .get();

      if (existingCode.empty) {
        codeExists = false;
      } else {
        code = generateInviteCode();
      }
    }

    // Get user details for the invite
    const userDoc = await db.collection('users').doc(uid).get();
    const userName = userDoc.data()?.displayName || 'A friend';

    // Create invite object
    const invite: Invite = {
      id: `inv_${uid}_${Date.now()}`,
      code,
      fromUserId: uid,
      fromUserName: userName,
      toEmail: toEmail || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      metadata: metadata || {}
    };

    // Save to Firestore
    await db.collection('invites').doc(invite.id).set(invite);

    // Generate shareable link
    const inviteLink = `https://conference-party-app.web.app/i/${code}`;

    res.status(201).json({
      success: true,
      invite: {
        code,
        link: inviteLink,
        expiresAt: invite.expiresAt
      },
      remainingInvites: INVITE_LIMIT - userInvitesSnapshot.size - 1
    });

  } catch (error) {
    console.error('[Invite] Create error:', error);
    res.status(500).json({ error: "Failed to create invite" });
  }
});

// Validate invite code (1 function, 1 thing: code validation)
app.get("/validate/:code", async (req: Request, res: Response): Promise<any> => {
  try {
    const { code } = req.params;

    if (!code || code.length !== INVITE_CODE_LENGTH) {
      return res.status(400).json({
        valid: false,
        error: "Invalid invite code format"
      });
    }

    const db = admin.firestore();
    const inviteSnapshot = await db.collection('invites')
      .where('code', '==', code.toUpperCase())
      .where('status', '==', 'pending')
      .get();

    if (inviteSnapshot.empty) {
      return res.status(404).json({
        valid: false,
        error: "Invite code not found or already used"
      });
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const invite = inviteDoc.data() as Invite;

    // Check expiry
    if (new Date(invite.expiresAt) < new Date()) {
      // Update status to expired
      await inviteDoc.ref.update({ status: 'expired' });

      return res.status(410).json({
        valid: false,
        error: "Invite code has expired"
      });
    }

    res.status(200).json({
      valid: true,
      fromUser: invite.fromUserName,
      expiresIn: Math.floor((new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + ' days'
    });

  } catch (error) {
    console.error('[Invite] Validate error:', error);
    res.status(500).json({ error: "Failed to validate invite" });
  }
});

// Accept invite (1 function, 1 thing: invite acceptance)
app.post("/accept/:code", async (req: Request, res: Response): Promise<any> => {
  try {
    const { code } = req.params;
    const { userId, userEmail } = req.body;

    if (!code || !userId) {
      return res.status(400).json({
        error: "Code and userId are required"
      });
    }

    const db = admin.firestore();
    const inviteSnapshot = await db.collection('invites')
      .where('code', '==', code.toUpperCase())
      .where('status', '==', 'pending')
      .get();

    if (inviteSnapshot.empty) {
      return res.status(404).json({
        error: "Invite code not found or already used"
      });
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const invite = inviteDoc.data() as Invite;

    // Check expiry
    if (new Date(invite.expiresAt) < new Date()) {
      await inviteDoc.ref.update({ status: 'expired' });
      return res.status(410).json({
        error: "Invite code has expired"
      });
    }

    // Check if user is trying to use their own invite
    if (invite.fromUserId === userId) {
      return res.status(400).json({
        error: "Cannot use your own invite code"
      });
    }

    // Accept the invite
    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      toEmail: userEmail || invite.toEmail
    });

    // Create connection between users
    const connectionId = `conn_${invite.fromUserId}_${userId}_${Date.now()}`;
    await db.collection('connections').doc(connectionId).set({
      id: connectionId,
      user1: invite.fromUserId,
      user2: userId,
      source: 'invite',
      inviteCode: code,
      createdAt: new Date().toISOString()
    });

    // Award bonus invites (quality control: good invites earn more)
    const bonusInvites = 2; // User who sent invite gets 2 bonus invites
    await db.collection('invite_bonuses').add({
      userId: invite.fromUserId,
      bonusCount: bonusInvites,
      reason: 'invite_accepted',
      awardedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: "Invite accepted successfully",
      connection: {
        withUser: invite.fromUserName,
        established: true
      }
    });

  } catch (error) {
    console.error('[Invite] Accept error:', error);
    res.status(500).json({ error: "Failed to accept invite" });
  }
});

// Get user's invite statistics (1 function, 1 thing: stats retrieval)
app.get("/stats", authenticateUser, async (req: any, res: Response): Promise<any> => {
  try {
    const { uid } = req.user;

    const db = admin.firestore();
    const invitesSnapshot = await db.collection('invites')
      .where('fromUserId', '==', uid)
      .get();

    const invites = invitesSnapshot.docs.map(doc => doc.data() as Invite);

    // Calculate bonus invites
    const bonusSnapshot = await db.collection('invite_bonuses')
      .where('userId', '==', uid)
      .get();

    const totalBonus = bonusSnapshot.docs.reduce((sum, doc) =>
      sum + (doc.data().bonusCount || 0), 0
    );

    const effectiveLimit = INVITE_LIMIT + totalBonus;

    const stats: UserInviteStats = {
      userId: uid,
      totalInvites: effectiveLimit,
      usedInvites: invites.length,
      remainingInvites: Math.max(0, effectiveLimit - invites.length),
      acceptedInvites: invites.filter(i => i.status === 'accepted').length,
      pendingInvites: invites.filter(i => i.status === 'pending').length,
      inviteHistory: invites.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    };

    res.status(200).json({
      success: true,
      stats,
      bonuses: {
        earned: totalBonus,
        reason: "Quality invites earn bonus invites"
      }
    });

  } catch (error) {
    console.error('[Invite] Stats error:', error);
    res.status(500).json({ error: "Failed to fetch invite statistics" });
  }
});

// List user's invites (1 function, 1 thing: invite listing)
app.get("/list", authenticateUser, async (req: any, res: Response): Promise<any> => {
  try {
    const { uid } = req.user;
    const { status, limit = '20', offset = '0' } = req.query;

    const db = admin.firestore();
    let query = db.collection('invites')
      .where('fromUserId', '==', uid)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .get();

    const invites = snapshot.docs.map(doc => {
      const data = doc.data() as Invite;
      return {
        id: data.id,
        code: data.code,
        status: data.status,
        toEmail: data.toEmail,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
        link: `https://conference-party-app.web.app/i/${data.code}`
      };
    });

    res.status(200).json({
      success: true,
      invites,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: snapshot.size === parseInt(limit as string)
      }
    });

  } catch (error) {
    console.error('[Invite] List error:', error);
    res.status(500).json({ error: "Failed to list invites" });
  }
});

// Resolve short code to full token (1 function, 1 thing: code resolution)
app.get("/resolve/:code", async (req: Request, res: Response): Promise<any> => {
  try {
    const { code } = req.params;

    const db = admin.firestore();
    const inviteSnapshot = await db.collection('invites')
      .where('code', '==', code.toUpperCase())
      .get();

    if (inviteSnapshot.empty) {
      return res.status(404).json({
        error: "Invite code not found"
      });
    }

    const invite = inviteSnapshot.docs[0].data() as Invite;

    // Generate a temporary token for the invite page
    const token = crypto.randomBytes(32).toString('hex');

    // Store token temporarily (expires in 1 hour)
    await db.collection('invite_tokens').doc(token).set({
      code: invite.code,
      inviteId: invite.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

    res.status(200).json({
      success: true,
      token
    });

  } catch (error) {
    console.error('[Invite] Resolve error:', error);
    res.status(500).json({ error: "Failed to resolve invite code" });
  }
});

// Export the function
export const inviteService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
}, app);