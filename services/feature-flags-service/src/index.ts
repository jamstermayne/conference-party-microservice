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
interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage?: number;
  targetGroups?: string[];
  conditions?: FlagCondition[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface FlagCondition {
  type: 'user' | 'group' | 'percentage' | 'date' | 'custom';
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

interface FlagEvaluation {
  flagId: string;
  enabled: boolean;
  reason: string;
  variant?: string;
}

// Default feature flags (1 function, 1 thing: default configuration)
const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'nav-parties',
    name: 'Navigation - Parties',
    description: 'Show parties section in navigation',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'nav-hotspots',
    name: 'Navigation - Hotspots',
    description: 'Show hotspots section in navigation',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'nav-opportunities',
    name: 'Navigation - Opportunities',
    description: 'Show opportunities section in navigation',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'nav-calendar',
    name: 'Navigation - Calendar',
    description: 'Show calendar section in navigation',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'nav-invites',
    name: 'Navigation - Invites',
    description: 'Show invites section in navigation',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'nav-me',
    name: 'Navigation - Profile',
    description: 'Show profile section in navigation',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feature-matchmaking',
    name: 'Matchmaking System',
    description: 'Enable AI-powered matchmaking',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feature-proximity',
    name: 'Proximity Networking',
    description: 'Enable proximity-based networking features',
    enabled: true,
    rolloutPercentage: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Cache for feature flags (1 function, 1 thing: caching)
let flagsCache: Map<string, FeatureFlag> = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// Health check (1 function, 1 thing: health monitoring)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "feature-flags-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    cache: {
      flags: flagsCache.size,
      lastUpdated: new Date(cacheTimestamp).toISOString()
    },
    endpoints: {
      health: "operational",
      flags: "operational",
      evaluate: "operational",
      create: "operational",
      update: "operational",
      delete: "operational"
    }
  });
});

// Get all flags (1 function, 1 thing: flag retrieval)
app.get("/flags", async (req: Request, res: Response): Promise<any> => {
  try {
    const { refresh } = req.query;
    const now = Date.now();

    // Return cached data if fresh
    if (!refresh && flagsCache.size > 0 && (now - cacheTimestamp) < CACHE_TTL) {
      const flags = Array.from(flagsCache.values());
      return res.status(200).json({
        success: true,
        flags,
        cached: true
      });
    }

    // Load from Firestore
    const db = admin.firestore();
    const snapshot = await db.collection('feature_flags').get();

    flagsCache.clear();

    if (snapshot.empty) {
      // Initialize with default flags
      const batch = db.batch();
      DEFAULT_FLAGS.forEach(flag => {
        const docRef = db.collection('feature_flags').doc(flag.id);
        batch.set(docRef, flag);
        flagsCache.set(flag.id, flag);
      });
      await batch.commit();

      cacheTimestamp = now;
      return res.status(200).json({
        success: true,
        flags: DEFAULT_FLAGS,
        initialized: true
      });
    }

    const flags: FeatureFlag[] = [];
    snapshot.forEach(doc => {
      const flag = { id: doc.id, ...doc.data() } as FeatureFlag;
      flags.push(flag);
      flagsCache.set(flag.id, flag);
    });

    cacheTimestamp = now;

    // Transform for legacy API compatibility
    const navFlags: Record<string, boolean> = {};
    flags.forEach(flag => {
      if (flag.id.startsWith('nav-')) {
        const key = flag.id.replace('nav-', '');
        navFlags[key] = flag.enabled;
      }
    });

    res.status(200).json({
      nav: navFlags,
      features: flags.filter(f => f.id.startsWith('feature-')),
      all: flags
    });

  } catch (error) {
    console.error('[Flags] Get flags error:', error);
    res.status(500).json({ error: "Failed to fetch flags" });
  }
});

// Evaluate flags for a user (1 function, 1 thing: flag evaluation)
app.post("/evaluate", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, groups = [], metadata = {} } = req.body;

    const flags = await loadFlags();
    const evaluations: Record<string, FlagEvaluation> = {};

    flags.forEach(flag => {
      const evaluation = evaluateFlag(flag, userId, groups, metadata);
      evaluations[flag.id] = evaluation;
    });

    res.status(200).json({
      success: true,
      userId,
      evaluations
    });

  } catch (error) {
    console.error('[Flags] Evaluate error:', error);
    res.status(500).json({ error: "Failed to evaluate flags" });
  }
});

// Create new flag (1 function, 1 thing: flag creation)
app.post("/create", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, name, description, enabled = false, rolloutPercentage, targetGroups, conditions } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        error: "ID and name are required"
      });
    }

    const flag: FeatureFlag = {
      id,
      name,
      description,
      enabled,
      rolloutPercentage,
      targetGroups,
      conditions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = admin.firestore();
    await db.collection('feature_flags').doc(id).set(flag);

    // Update cache
    flagsCache.set(id, flag);

    res.status(201).json({
      success: true,
      flag
    });

  } catch (error) {
    console.error('[Flags] Create error:', error);
    res.status(500).json({ error: "Failed to create flag" });
  }
});

// Update flag (1 function, 1 thing: flag update)
app.put("/update/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = admin.firestore();
    const docRef = db.collection('feature_flags').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Flag not found"
      });
    }

    const updatedFlag = {
      ...doc.data(),
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    } as FeatureFlag;

    await docRef.update(updatedFlag);

    // Update cache
    flagsCache.set(id, updatedFlag);

    res.status(200).json({
      success: true,
      flag: updatedFlag
    });

  } catch (error) {
    console.error('[Flags] Update error:', error);
    res.status(500).json({ error: "Failed to update flag" });
  }
});

// Delete flag (1 function, 1 thing: flag deletion)
app.delete("/delete/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const db = admin.firestore();
    const docRef = db.collection('feature_flags').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Flag not found"
      });
    }

    await docRef.delete();

    // Update cache
    flagsCache.delete(id);

    res.status(200).json({
      success: true,
      message: "Flag deleted",
      id
    });

  } catch (error) {
    console.error('[Flags] Delete error:', error);
    res.status(500).json({ error: "Failed to delete flag" });
  }
});

// Helper: Load flags (1 function, 1 thing: flag loading)
async function loadFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();

  // Return cached if fresh
  if (flagsCache.size > 0 && (now - cacheTimestamp) < CACHE_TTL) {
    return Array.from(flagsCache.values());
  }

  // Load from Firestore
  const db = admin.firestore();
  const snapshot = await db.collection('feature_flags').get();

  flagsCache.clear();
  const flags: FeatureFlag[] = [];

  snapshot.forEach(doc => {
    const flag = { id: doc.id, ...doc.data() } as FeatureFlag;
    flags.push(flag);
    flagsCache.set(flag.id, flag);
  });

  cacheTimestamp = now;
  return flags;
}

// Helper: Evaluate single flag (1 function, 1 thing: flag logic)
function evaluateFlag(
  flag: FeatureFlag,
  userId?: string,
  groups: string[] = [],
  metadata: Record<string, any> = {}
): FlagEvaluation {
  // Check if flag is globally disabled
  if (!flag.enabled) {
    return {
      flagId: flag.id,
      enabled: false,
      reason: 'Flag is globally disabled'
    };
  }

  // Check target groups
  if (flag.targetGroups && flag.targetGroups.length > 0) {
    const inTargetGroup = flag.targetGroups.some(group => groups.includes(group));
    if (!inTargetGroup) {
      return {
        flagId: flag.id,
        enabled: false,
        reason: 'User not in target group'
      };
    }
  }

  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    const hash = userId ? hashUserId(userId) : Math.random();
    const inRollout = (hash * 100) < flag.rolloutPercentage;
    if (!inRollout) {
      return {
        flagId: flag.id,
        enabled: false,
        reason: 'User not in rollout percentage'
      };
    }
  }

  // Check conditions
  if (flag.conditions && flag.conditions.length > 0) {
    for (const condition of flag.conditions) {
      if (!evaluateCondition(condition, userId, groups, metadata)) {
        return {
          flagId: flag.id,
          enabled: false,
          reason: `Condition failed: ${condition.type}`
        };
      }
    }
  }

  return {
    flagId: flag.id,
    enabled: true,
    reason: 'All conditions met'
  };
}

// Helper: Evaluate condition (1 function, 1 thing: condition evaluation)
function evaluateCondition(
  condition: FlagCondition,
  userId?: string,
  groups: string[] = [],
  metadata: Record<string, any> = {}
): boolean {
  switch (condition.type) {
    case 'user':
      return condition.operator === 'equals' && userId === condition.value;

    case 'group':
      return condition.operator === 'contains' && groups.includes(condition.value);

    case 'percentage':
      const hash = userId ? hashUserId(userId) : Math.random();
      return (hash * 100) < condition.value;

    case 'date':
      const now = new Date();
      const targetDate = new Date(condition.value);
      if (condition.operator === 'greater') return now > targetDate;
      if (condition.operator === 'less') return now < targetDate;
      return false;

    case 'custom':
      const metaValue = metadata[condition.value.key];
      if (condition.operator === 'equals') return metaValue === condition.value.value;
      if (condition.operator === 'contains') return metaValue?.includes(condition.value.value);
      return false;

    default:
      return false;
  }
}

// Helper: Hash user ID for consistent rollout (1 function, 1 thing: hashing)
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

// Export the function
export const featureFlagsService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
}, app);