import express from 'express';
import * as admin from 'firebase-admin';
import { generateInvitePair, normalizeCode, isExpired } from '../utils/invite-codes';

const router = express.Router();

// Get Firestore instance (Firebase Admin is initialized in index.ts)
const getDb = () => admin.firestore();

/**
 * Invite type definition matching the spec
 */
interface Invite {
  id: string;
  ownerUid: string;
  createdBy?: string; // alias for ownerUid
  toEmail?: string;
  token: string;
  code: string;
  title: string;
  start?: string;
  end?: string;
  location?: string;
  description?: string;
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  createdAt: number;
  updatedAt: number;
  revokedAt?: number;
  expiresAt?: number | string | Date;
  expiresIn?: number;
  redeemedAt?: number | null;
  redeemedBy?: string | null;
  lastSharedAt?: number;
  lastMethod?: 'email' | 'link' | 'code' | 'qr' | 'system';
}

/**
 * POST /api/invites - Create a new invite with token+code pair
 */
router.post('/', async (req, res): Promise<any> => {
  try {
    const { ownerUid, title, toEmail, start, end, location, description } = req.body;
    
    if (!ownerUid || !title) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['ownerUid', 'title']
      });
    }
    
    const { token, code } = generateInvitePair();
    const now = Date.now();
    
    const invite: Omit<Invite, 'id'> = {
      ownerUid,
      toEmail,
      token,
      code,
      title,
      start,
      end,
      location,
      description,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    
    // Store in Firestore
    const docRef = await getDb().collection('invites').add(invite);
    const id = docRef.id;
    
    // Update with ID
    await docRef.update({ id });
    
    const host = req.headers.host || 'conference-party-app.web.app';
    const link = `https://${host}/i/${code}`;
    
    console.log(`[invites] Created invite ${id} with code ${code} for ${ownerUid}`);
    
    return res.json({
      id,
      token,
      code,
      link
    });
    
  } catch (error) {
    console.error('[invites] Create error:', error);
    return res.status(500).json({
      error: 'Failed to create invite',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/invites/:id/share - Get shareable links for an invite (auth required)
 */
router.get('/:id/share', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    
    // Basic auth check (you should verify the token properly)
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const inviteDoc = await getDb().collection('invites').doc(id).get();
    
    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    const invite = inviteDoc.data() as Invite;
    
    // Check if revoked or expired
    const inviteForExpiry = {
      ...invite,
      expiresAt: typeof invite.expiresAt === 'number' 
        ? new Date(invite.expiresAt) 
        : invite.expiresAt || undefined
    };
    if (invite.revokedAt || isExpired(inviteForExpiry as any)) {
      return res.status(410).json({ error: 'Invite expired or revoked' });
    }
    
    const host = req.headers.host || 'conference-party-app.web.app';
    const link = `https://${host}/i/${invite.code}`;
    
    // Update lastSharedAt
    await inviteDoc.ref.update({
      lastSharedAt: Date.now(),
      lastMethod: 'link'
    });
    
    return res.json({
      token: invite.token,
      code: invite.code,
      link
    });
    
  } catch (error) {
    console.error('[invites] Share error:', error);
    return res.status(500).json({
      error: 'Failed to get share info',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/invites/:id/renew - Rotate token+code pair (auth required)
 */
router.post('/:id/renew', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const inviteDoc = await getDb().collection('invites').doc(id).get();
    
    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    const invite = inviteDoc.data() as Invite;
    
    if (invite.revokedAt) {
      return res.status(410).json({ error: 'Cannot renew revoked invite' });
    }
    
    // Generate new pair
    const { token, code } = generateInvitePair();
    
    // Update invite with new pair
    await inviteDoc.ref.update({
      token,
      code,
      updatedAt: Date.now()
    });
    
    const host = req.headers.host || 'conference-party-app.web.app';
    const link = `https://${host}/i/${code}`;
    
    console.log(`[invites] Renewed invite ${id} with new code ${code}`);
    
    return res.json({
      token,
      code,
      link
    });
    
  } catch (error) {
    console.error('[invites] Renew error:', error);
    return res.status(500).json({
      error: 'Failed to renew invite',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/invites/:id/revoke - Revoke an invite (auth required)
 */
router.post('/:id/revoke', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const inviteDoc = await getDb().collection('invites').doc(id).get();
    
    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    // Revoke by setting revokedAt and clearing token/code
    await inviteDoc.ref.update({
      revokedAt: Date.now(),
      token: null,
      code: null,
      updatedAt: Date.now()
    });
    
    console.log(`[invites] Revoked invite ${id}`);
    
    return res.json({
      revoked: true
    });
    
  } catch (error) {
    console.error('[invites] Revoke error:', error);
    return res.status(500).json({
      error: 'Failed to revoke invite',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/invites/public/resolve/:code - Resolve a code to token (public)
 */
router.get('/public/resolve/:code', async (req, res): Promise<any> => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }
    
    // Normalize the code for lookup
    const normalizedCode = normalizeCode(code);
    
    // Find invite by code
    const snapshot = await getDb()
      .collection('invites')
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log(`[invites] Code not found: ${code}`);
      return res.status(404).json({ error: 'Invalid invite code' });
    }
    
    const invite = snapshot.docs[0]!.data() as Invite;
    
    // Check if revoked or expired
    const inviteForExpiry = {
      ...invite,
      expiresAt: typeof invite.expiresAt === 'number' 
        ? new Date(invite.expiresAt) 
        : invite.expiresAt || undefined
    };
    if (invite.revokedAt || isExpired(inviteForExpiry as any)) {
      console.log(`[invites] Code expired/revoked: ${code}`);
      return res.status(410).json({ error: 'Invite expired or revoked' });
    }
    
    return res.json({
      token: invite.token
    });
    
  } catch (error) {
    console.error('[invites] Resolve error:', error);
    return res.status(500).json({
      error: 'Failed to resolve code',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/invites/:id/rsvp - Update RSVP status (public with token)
 */
router.post('/:id/rsvp', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, token } = req.body;
    
    if (!status || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['status', 'token']
      });
    }
    
    if (!['accepted', 'declined', 'maybe'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed: ['accepted', 'declined', 'maybe']
      });
    }
    
    const inviteDoc = await getDb().collection('invites').doc(id).get();
    
    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    const invite = inviteDoc.data() as Invite;
    
    // Verify token
    if (invite.token !== token) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Check if revoked or expired
    const inviteForExpiry = {
      ...invite,
      expiresAt: typeof invite.expiresAt === 'number' 
        ? new Date(invite.expiresAt) 
        : invite.expiresAt || undefined
    };
    if (invite.revokedAt || isExpired(inviteForExpiry as any)) {
      return res.status(410).json({ error: 'Invite expired or revoked' });
    }
    
    // Update status
    await inviteDoc.ref.update({
      status,
      updatedAt: Date.now()
    });
    
    console.log(`[invites] RSVP ${status} for invite ${id}`);
    
    return res.json({
      success: true,
      status
    });
    
  } catch (error) {
    console.error('[invites] RSVP error:', error);
    return res.status(500).json({
      error: 'Failed to update RSVP',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/invites/stats?userId=XXX - Get invite statistics for a user
 */
router.get('/stats', async (req, res): Promise<any> => {
  try {
    const { userId } = req.query as { userId?: string };
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID required'
      });
    }
    
    // Count invites created by this user (check both fields for compatibility)
    const createdInvites = await getDb().collection('invites')
      .where('ownerUid', '==', userId)
      .get();
    
    const usedInvites = createdInvites.docs.filter(doc => {
      const data = doc.data() as Invite;
      return data.redeemedAt !== null;
    });
    
    const stats = {
      totalGenerated: createdInvites.size,
      totalRedeemed: usedInvites.length,
      redemptionRate: createdInvites.size > 0 
        ? (usedInvites.length / createdInvites.size * 100).toFixed(1) 
        : '0.0',
      remaining: Math.max(0, 10 - createdInvites.size), // Default 10 invites per user
      invites: createdInvites.docs.map(doc => {
        const data = doc.data() as Invite;
        return {
          id: doc.id,
          code: data.code,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          redeemedAt: data.redeemedAt,
          redeemedBy: data.redeemedBy,
          status: data.status
        };
      })
    };
    
    return res.json(stats);
  } catch (error) {
    console.error('[invites] Stats error:', error);
    return res.status(500).json({
      error: 'Failed to get stats',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/invites/status - Get invite status for current user
 */
router.get('/status', async (req, res): Promise<any> => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      // Return default status for anonymous users
      return res.json({
        available: 3,
        used: 0,
        redemptionRate: 0,
        canGenerate: true
      });
    }
    
    // Get user's invite stats
    const createdInvites = await getDb().collection('invites')
      .where('ownerUid', '==', userId)
      .get();
    
    const usedCount = createdInvites.docs.filter(doc => {
      const data = doc.data() as Invite;
      return data.redeemedAt !== null;
    }).length;
    
    const maxInvites = 10; // Default limit
    const available = Math.max(0, maxInvites - createdInvites.size);
    
    return res.json({
      available,
      used: usedCount,
      total: createdInvites.size,
      redemptionRate: createdInvites.size > 0 
        ? Math.round(usedCount / createdInvites.size * 100)
        : 0,
      canGenerate: available > 0
    });
    
  } catch (error) {
    console.error('[invites] Status error:', error);
    // Return safe defaults on error
    return res.json({
      available: 3,
      used: 0,
      redemptionRate: 0,
      canGenerate: true
    });
  }
});

export default router;