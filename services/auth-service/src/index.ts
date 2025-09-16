import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { defineSecret } from 'firebase-functions/params';
import {
  securityMiddleware,
  corsOptions,
  authRateLimiter
} from '../../shared/security-middleware';

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
} catch (error) {
  // Already initialized
}

const app = express();

// Define secrets
const GOOGLE_CLIENT_ID = defineSecret('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = defineSecret('GOOGLE_CLIENT_SECRET');

// Apply security middleware
app.use(securityMiddleware.securityHeaders);
app.use(cors(corsOptions));
app.use(authRateLimiter); // Stricter rate limiting for auth service
app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));
app.use(express.json());
app.use(securityMiddleware.validateInput);
app.use(securityMiddleware.requestLogger);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "auth-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "operational",
      login: "operational",
      logout: "operational",
      verify: "operational",
      profile: "operational"
    }
  });
});

// User authentication endpoints
app.post("/login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { idToken, provider } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "ID token required" });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Create or update user record
    const userRecord = {
      uid,
      email: email || null,
      displayName: name || null,
      photoURL: picture || null,
      provider: provider || 'unknown',
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Store in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(uid).set(userRecord, { merge: true });

    // Generate custom token for session
    const customToken = await admin.auth().createCustomToken(uid);

    res.status(200).json({
      success: true,
      user: {
        uid,
        email,
        displayName: name,
        photoURL: picture,
        provider
      },
      token: customToken
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(401).json({
      error: "Authentication failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post("/logout", async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Update last logout time
      const db = admin.firestore();
      await db.collection('users').doc(decodedToken.uid).update({
        lastLogoutAt: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Don't fail logout even if token is invalid
    res.status(200).json({
      success: true,
      message: "Logged out"
    });
  }
});

app.get("/verify", async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user data from Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    res.status(200).json({
      valid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        ...userData
      }
    });

  } catch (error) {
    console.error('[Auth] Verify error:', error);
    res.status(401).json({
      valid: false,
      error: "Invalid token"
    });
  }
});

app.get("/profile/:uid", async (req: Request, res: Response): Promise<any> => {
  try {
    const { uid } = req.params;

    // Verify request is authenticated and authorized
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Users can only access their own profile (or admin access)
    if (decodedToken.uid !== uid && !decodedToken.admin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get user profile from Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    res.status(200).json({
      success: true,
      profile: userData
    });

  } catch (error) {
    console.error('[Auth] Profile error:', error);
    res.status(500).json({
      error: "Failed to fetch profile"
    });
  }
});

app.put("/profile/:uid", async (req: Request, res: Response): Promise<any> => {
  try {
    const { uid } = req.params;
    const updates = req.body;

    // Verify request is authenticated and authorized
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Users can only update their own profile
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Sanitize updates (only allow certain fields)
    const allowedFields = ['displayName', 'photoURL', 'bio', 'company', 'position', 'preferences'];
    const sanitizedUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    sanitizedUpdates.updatedAt = new Date().toISOString();

    // Update user profile in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(uid).update(sanitizedUpdates);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });

  } catch (error) {
    console.error('[Auth] Profile update error:', error);
    res.status(500).json({
      error: "Failed to update profile"
    });
  }
});

// OAuth endpoints for Google/LinkedIn integration
app.get("/oauth/google/url", (req: Request, res: Response): any => {
  try {
    const { redirectUri } = req.query;

    // Generate OAuth URL for Google
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const scope = 'email profile openid';
    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri as string)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    res.status(200).json({
      authUrl,
      provider: 'google'
    });

  } catch (error) {
    console.error('[Auth] OAuth URL error:', error);
    res.status(500).json({
      error: "Failed to generate OAuth URL"
    });
  }
});

// Export the function
export const authService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
  secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET],
}, app);