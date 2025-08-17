import express from 'express';
import * as admin from 'firebase-admin';

const router = express.Router();

// Get Firestore instance (Firebase Admin is initialized in index.ts)
const getDb = () => admin.firestore();

/**
 * Generate a unique invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/invites/generate - Generate a new invite code
 */
router.post('/generate', async (req, res): Promise<any> => {
  try {
    const { inviterId, inviterName } = req.body;
    
    if (!inviterId || !inviterName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['inviterId', 'inviterName']
      });
    }
    
    const code = generateInviteCode();
    const inviteData = {
      code,
      inviterId,
      inviterName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
      usedAt: null,
      usedBy: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    // Store in Firestore
    await getDb().collection('invites').doc(code).set(inviteData);
    
    console.log(`[invites] Generated invite ${code} for ${inviterName} (${inviterId})`);
    
    res.json({
      success: true,
      code,
      link: `${req.headers.origin || 'https://conference-party-app.web.app'}/#/invite/${code}`,
      expiresAt: inviteData.expiresAt
    });
    
  } catch (error) {
    console.error('[invites] Generate error:', error);
    res.status(500).json({
      error: 'Failed to generate invite',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/invites/status?code=XXX - Check invite validity
 */
router.get('/status', async (req, res) => {
  try {
    const { code } = req.query as { code?: string };
    
    if (!code) {
      return res.status(400).json({
        valid: false,
        error: 'Invite code required',
        reason: 'No code provided'
      });
    }
    
    const inviteDoc = await getDb().collection('invites').doc(code).get();
    
    if (!inviteDoc.exists) {
      console.log(`[invites] Invalid code: ${code}`);
      return res.json({
        valid: false,
        reason: 'Invalid invite code',
        code
      });
    }
    
    const invite = inviteDoc.data();
    const now = new Date();
    
    // Check if expired
    if (invite?.['expiresAt'] && invite['expiresAt'].toDate() < now) {
      console.log(`[invites] Expired code: ${code}`);
      return res.json({
        valid: false,
        reason: 'Invite code has expired',
        code
      });
    }
    
    // Check if already used
    if (invite?.['used']) {
      console.log(`[invites] Already used code: ${code}`);
      return res.json({
        valid: false,
        reason: 'Invite code already used',
        code,
        usedAt: invite['usedAt'],
        usedBy: invite['usedBy']
      });
    }
    
    console.log(`[invites] Valid code: ${code} from ${invite?.['inviterName']}`);
    
    return res.json({
      valid: true,
      code,
      inviterId: invite?.['inviterId'],
      inviterName: invite?.['inviterName'],
      createdAt: invite?.['createdAt'],
      expiresAt: invite?.['expiresAt']
    });
    
  } catch (error) {
    console.error('[invites] Status check error:', error);
    return res.status(500).json({
      valid: false,
      error: 'Failed to check invite',
      reason: 'Server error'
    });
  }
});

/**
 * POST /api/invites/redeem - Redeem an invite code
 */
router.post('/redeem', async (req, res) => {
  try {
    const { code, userId, userName } = req.body;
    
    if (!code || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['code', 'userId']
      });
    }
    
    const inviteDoc = await getDb().collection('invites').doc(code).get();
    
    if (!inviteDoc.exists) {
      return res.status(404).json({
        error: 'Invalid invite code',
        code
      });
    }
    
    const invite = inviteDoc.data();
    const now = new Date();
    
    // Check if expired
    if (invite?.['expiresAt'] && invite['expiresAt'].toDate() < now) {
      return res.status(400).json({
        error: 'Invite code has expired',
        code
      });
    }
    
    // Check if already used
    if (invite?.['used']) {
      return res.status(400).json({
        error: 'Invite code already used',
        code,
        usedAt: invite['usedAt'],
        usedBy: invite['usedBy']
      });
    }
    
    // Mark as used
    await getDb().collection('invites').doc(code).update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      usedBy: userId,
      userName: userName || 'Anonymous'
    });
    
    console.log(`[invites] Redeemed ${code} by ${userName || userId}`);
    
    return res.json({
      success: true,
      code,
      inviterName: invite?.['inviterName'],
      message: 'Invite successfully redeemed'
    });
    
  } catch (error) {
    console.error('[invites] Redeem error:', error);
    return res.status(500).json({
      error: 'Failed to redeem invite',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/invites/stats?userId=XXX - Get invite statistics for a user
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID required'
      });
    }
    
    // Count invites created by this user
    const createdInvites = await getDb().collection('invites')
      .where('inviterId', '==', userId)
      .get();
    
    const usedInvites = await getDb().collection('invites')
      .where('inviterId', '==', userId)
      .where('used', '==', true)
      .get();
    
    const stats = {
      totalGenerated: createdInvites.size,
      totalRedeemed: usedInvites.size,
      redemptionRate: createdInvites.size > 0 ? (usedInvites.size / createdInvites.size * 100).toFixed(1) : '0.0',
      remaining: Math.max(0, 10 - createdInvites.size), // Default 10 invites per user
      invites: createdInvites.docs.map(doc => ({
        code: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate(),
        expiresAt: doc.data()['expiresAt']?.toDate(),
        usedAt: doc.data()['usedAt']?.toDate()
      }))
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
 * GET /api/invites - List all invites (admin endpoint)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query as { limit?: string; offset?: string };
    
    const invitesSnapshot = await getDb().collection('invites')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const invites = invitesSnapshot.docs.map(doc => ({
      code: doc.id,
      ...doc.data(),
      createdAt: doc.data()['createdAt']?.toDate(),
      expiresAt: doc.data()['expiresAt']?.toDate(),
      usedAt: doc.data()['usedAt']?.toDate()
    }));
    
    return res.json({
      invites,
      total: invitesSnapshot.size,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('[invites] List error:', error);
    return res.status(500).json({
      error: 'Failed to list invites',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;