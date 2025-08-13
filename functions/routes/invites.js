const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const checkAuth = require('../lib/checkAuth');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const router = express.Router();

const DEFAULT_CREDITS = 10;
const EXPIRY_DAYS = 14;
const BASE_URL = 'https://conference-party-app.web.app'; // decision #8

function genCode(n=10){
  return crypto.randomBytes(16).toString('base64url').replace(/[^a-zA-Z0-9]/g,'').slice(0,n);
}
function expiresAt(days=EXPIRY_DAYS){
  const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString();
}

async function ensureUserDoc(uid, email){
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ email: email||null, invites: { left: DEFAULT_CREDITS }, isAdmin: false, createdAt: admin.firestore.FieldValue.serverTimestamp() }, {merge:true});
    return { left: DEFAULT_CREDITS, isAdmin:false };
  }
  const data = snap.data() || {};
  const left = data.invites?.left ?? DEFAULT_CREDITS;
  const isAdmin = !!data.isAdmin;
  return { left, isAdmin };
}

/**
 * GET /api/invites/my
 * Returns: { left, sent:[...], accepted:[...] }
 */
router.get('/my', checkAuth, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const me = await ensureUserDoc(uid, email);

    const sentQ = await db.collection('invites').where('invitedBy', '==', uid).orderBy('createdAt','desc').limit(100).get();
    const sent = sentQ.docs.map(d => ({ id:d.id, ...d.data() }));

    const accepted = sent.filter(x => x.status === 'accepted').sort((a,b) => (b.acceptedAt?.seconds||0)-(a.acceptedAt?.seconds||0));

    return res.json({ success:true, left: me.isAdmin ? '∞' : me.left, sent, accepted });
  } catch (e) {
    return res.status(500).json({success:false, error:String(e)});
  }
});

/**
 * POST /api/invites/create
 * body: { email? }  (single invite only; no bulk)
 */
router.post('/create', checkAuth, express.json(), async (req, res) => {
  try {
    const { uid, email:senderEmail } = req.user;
    const { left, isAdmin } = await ensureUserDoc(uid, senderEmail);

    if (!isAdmin && left <= 0) return res.status(400).json({success:false, error:'no_invites_left'});

    const email = (req.body?.email || null);
    const code = genCode(10);
    const ref = db.collection('invites').doc(code);
    const doc = {
      code,
      status: 'pending', // pending|revoked|expired|accepted
      invitedBy: uid,
      senderEmail: senderEmail || null,
      email, // optional suggested recipient email
      link: `${BASE_URL}/#/?invite=${code}`,
      expiresAt: expiresAt(EXPIRY_DAYS),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc, { merge:false });

    if (!isAdmin) {
      await db.collection('users').doc(uid).set({ invites: { left: admin.firestore.FieldValue.increment(-1) } }, { merge:true });
    }

    // Stub "email sending"
    console.log('[INVITES] Created', { by: uid, email, code });

    return res.json({ success:true, invite: doc });
  } catch (e) {
    return res.status(500).json({ success:false, error:String(e) });
  }
});

/**
 * POST /api/invites/revoke
 * body: { code }
 * Only pending can be revoked. Returns credit (non-admin).
 */
router.post('/revoke', checkAuth, express.json(), async (req, res) => {
  try {
    const { uid } = req.user;
    const code = String(req.body?.code||'').trim();
    if (!code) return res.status(400).json({success:false, error:'missing_code'});

    const invRef = db.collection('invites').doc(code);
    const snap = await invRef.get();
    if (!snap.exists) return res.status(404).json({success:false, error:'not_found'});
    const inv = snap.data();

    if (inv.invitedBy !== uid) return res.status(403).json({success:false, error:'not_owner'});
    if (inv.status !== 'pending') return res.status(400).json({success:false, error:'not_pending'});

    await invRef.update({ status:'revoked', revokedAt: admin.firestore.FieldValue.serverTimestamp() });

    // return credit if not admin
    const meSnap = await db.collection('users').doc(uid).get();
    const isAdmin = !!meSnap.data()?.isAdmin;
    if (!isAdmin) {
      await db.collection('users').doc(uid).set({ invites: { left: admin.firestore.FieldValue.increment(1) } }, { merge:true });
    }

    return res.json({ success:true });
  } catch (e) {
    return res.status(500).json({ success:false, error:String(e) });
  }
});

/**
 * POST /api/invites/redeem
 * body: { code }
 * Marks accepted; grants DEFAULT_CREDITS to acceptor; single use.
 */
router.post('/redeem', checkAuth, express.json(), async (req, res) => {
  try {
    const { uid, email } = req.user;
    const code = String(req.body?.code||'').trim();
    if (!code) return res.status(400).json({success:false, error:'missing_code'});

    const ref = db.collection('invites').doc(code);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({success:false, error:'not_found'});

    const inv = snap.data();
    if (inv.status !== 'pending') return res.status(400).json({success:false, error:'not_pending'});
    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      await ref.update({ status:'expired', expiredAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.status(400).json({success:false, error:'expired'});
    }

    // Accept
    await ref.update({
      status: 'accepted',
      acceptedBy: uid,
      acceptedEmail: email || null,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Grant credits to the acceptor (viral loop)
    await ensureUserDoc(uid, email);
    await db.collection('users').doc(uid).set({ invites: { left: DEFAULT_CREDITS } }, { merge:true });

    return res.json({ success:true });
  } catch (e) {
    return res.status(500).json({ success:false, error:String(e) });
  }
});

module.exports = router;