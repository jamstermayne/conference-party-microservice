"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const params_1 = require("firebase-functions/params");
// Initialize Firebase Admin
try {
    admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT,
    });
}
catch (error) {
    // Already initialized
}
const app = (0, express_1.default)();
// Define secrets
const GOOGLE_CLIENT_ID = (0, params_1.defineSecret)('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = (0, params_1.defineSecret)('GOOGLE_CLIENT_SECRET');
// Middleware
app.use((0, cors_1.default)({
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
app.use((0, compression_1.default)({ threshold: 1024, level: 6 }));
app.use((0, morgan_1.default)('tiny', { skip: (req) => req.path === '/health' }));
app.use(express_1.default.json());
// Health check
app.get("/health", (_req, res) => {
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
app.post("/login", async (req, res) => {
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
    }
    catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(401).json({
            error: "Authentication failed",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post("/logout", async (req, res) => {
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
    }
    catch (error) {
        console.error('[Auth] Logout error:', error);
        // Don't fail logout even if token is invalid
        res.status(200).json({
            success: true,
            message: "Logged out"
        });
    }
});
app.get("/verify", async (req, res) => {
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
    }
    catch (error) {
        console.error('[Auth] Verify error:', error);
        res.status(401).json({
            valid: false,
            error: "Invalid token"
        });
    }
});
app.get("/profile/:uid", async (req, res) => {
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
    }
    catch (error) {
        console.error('[Auth] Profile error:', error);
        res.status(500).json({
            error: "Failed to fetch profile"
        });
    }
});
app.put("/profile/:uid", async (req, res) => {
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
        }, {});
        sanitizedUpdates.updatedAt = new Date().toISOString();
        // Update user profile in Firestore
        const db = admin.firestore();
        await db.collection('users').doc(uid).update(sanitizedUpdates);
        res.status(200).json({
            success: true,
            message: "Profile updated successfully"
        });
    }
    catch (error) {
        console.error('[Auth] Profile update error:', error);
        res.status(500).json({
            error: "Failed to update profile"
        });
    }
});
// OAuth endpoints for Google/LinkedIn integration
app.get("/oauth/google/url", (req, res) => {
    try {
        const { redirectUri } = req.query;
        // Generate OAuth URL for Google
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const scope = 'email profile openid';
        const authUrl = `https://accounts.google.com/oauth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `response_type=code&` +
            `access_type=offline&` +
            `prompt=consent`;
        res.status(200).json({
            authUrl,
            provider: 'google'
        });
    }
    catch (error) {
        console.error('[Auth] OAuth URL error:', error);
        res.status(500).json({
            error: "Failed to generate OAuth URL"
        });
    }
});
// Export the function
exports.authService = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    invoker: "public",
    maxInstances: 5,
    secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET],
}, app);
//# sourceMappingURL=index.js.map