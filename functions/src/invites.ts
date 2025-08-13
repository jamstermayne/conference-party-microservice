import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

type Invite = {
  code: string;
  status: 'available'|'redeemed'|'revoked';
  createdAt: number;
  createdByEmail: string;
  createdByUid?: string;
  redeemedAt?: number;
  redeemedByEmail?: string;
  redeemedByUid?: string;
};

type UserDoc = {
  email: string;
  name?: string;
  isAdmin?: boolean;
  invitesRemaining?: number;
  invitedBy?: string; // email of inviter
  createdAt?: number;
  updatedAt?: number;
};

const db = admin.firestore();
const INVITES_PER_USER = 11;

// TEMP: Admins (email)  pull from env or default to Jamy's
const ADMIN_EMAILS = new Set<string>(
  (process.env['ADMIN_EMAILS'] || 'jamynigri@gmail.com,jamy@nigriconsulting.com')
    .split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
);

// Utility
const now = () => Date.now();
const code = () => Math.random().toString(36).substring(2,10).toUpperCase();

async function getOrCreateUser(email: string): Promise<FirebaseFirestore.DocumentReference<UserDoc>> {
  const ref = db.collection('users').doc(email.toLowerCase());
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      email: email.toLowerCase(),
      isAdmin: ADMIN_EMAILS.has(email.toLowerCase()),
      invitesRemaining: ADMIN_EMAILS.has(email.toLowerCase()) ? 9999 : INVITES_PER_USER,
      createdAt: now(), updatedAt: now()
    } as UserDoc, { merge: true });
  }
  return ref as FirebaseFirestore.DocumentReference<UserDoc>;
}

// GET /api/invites/mine?email=me@example.com
export async function getMyInvites(req: Request, res: Response) {
  try {
    const email = String(req.query['email'] || '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'email required' });

    const userRef = await getOrCreateUser(email);
    const user = (await userRef.get()).data() as UserDoc;

    const q = await db.collection('invites').where('createdByEmail','==',email).orderBy('createdAt','desc').limit(100).get();
    const created = q.docs.map(d=>d.data()) as Invite[];

    const r = await db.collection('invites').where('redeemedByEmail','==',email).orderBy('redeemedAt','desc').limit(50).get();
    const redeemedByMe = r.docs.map(d=>d.data()) as Invite[];

    return res.json({
      ok: true,
      user,
      created,
      redeemedByMe,
      stats: {
        invitesRemaining: user.invitesRemaining ?? 0,
        createdCount: created.length,
        redeemedByMe: redeemedByMe.length
      }
    });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}

// POST /api/invites/generate  { email, count }
export async function generateInvites(req: Request, res: Response) {
  try {
    const email = String(req.body?.email || '').toLowerCase();
    let count = Number(req.body?.count || 1);
    if (!email) return res.status(400).json({ error: 'email required' });
    if (!Number.isFinite(count) || count < 1) count = 1;
    if (count > 50) count = 50;

    const userRef = await getOrCreateUser(email);
    const userSnap = await userRef.get();
    const user = userSnap.data() as UserDoc;

    // Allow unlimited for admins, otherwise consume invitesRemaining
    if (!user.isAdmin) {
      const remain = user.invitesRemaining ?? 0;
      if (remain <= 0) return res.status(403).json({ error: 'no invites left' });
      if (count > remain) count = remain;
    }

    const batch = db.batch();
    const created: Invite[] = [];
    for (let i=0;i<count;i++){
      const c = code();
      const ref = db.collection('invites').doc(c);
      const inv: Invite = {
        code: c, status: 'available',
        createdAt: now(),
        createdByEmail: email, createdByUid: userSnap.id
      };
      batch.set(ref, inv, { merge: true });
      created.push(inv);
    }
    if (!user.isAdmin) {
      batch.set(userRef, { invitesRemaining: Math.max(0, (user.invitesRemaining ?? 0) - count), updatedAt: now() }, { merge: true });
    }
    await batch.commit();

    return res.json({ ok:true, created, remaining: user.isAdmin ? '' : Math.max(0, (user.invitesRemaining ?? 0) - count) });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}

// POST /api/invites/redeem  { code, email, invitedByEmail? }
export async function redeemInvite(req: Request, res: Response) {
  try {
    const c = String(req.body?.code || '').toUpperCase();
    const email = String(req.body?.email || '').toLowerCase();
    const invitedByEmail = String(req.body?.invitedByEmail || '').toLowerCase();
    if (!c || !email) return res.status(400).json({ error: 'code and email required' });

    const invRef = db.collection('invites').doc(c);
    const invSnap = await invRef.get();
    if (!invSnap.exists) return res.status(404).json({ error:'invalid code' });

    const inv = invSnap.data() as Invite;
    if (inv.status !== 'available') return res.status(409).json({ error:'already redeemed' });

    // Redeem
    const batch = db.batch();

    batch.set(invRef, {
      status:'redeemed',
      redeemedAt: now(),
      redeemedByEmail: email,
    }, { merge: true });

    // Create recipient user (+11 invites)
    const recRef = await getOrCreateUser(email);
    batch.set(recRef, {
      invitesRemaining: INVITES_PER_USER,
      invitedBy: invitedByEmail || inv.createdByEmail,
      updatedAt: now()
    }, { merge: true });

    await batch.commit();
    return res.json({ ok:true, redeemed: c, recipient: email, invitesGranted: INVITES_PER_USER });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}

// GET /api/me?email=x
export async function getMe(req: Request, res: Response) {
  try {
    const email = String(req.query['email'] || '').toLowerCase();
    if (!email) return res.status(400).json({ error:'email required' });
    const ref = db.collection('users').doc(email);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ email, invitesRemaining: INVITES_PER_USER, isAdmin: ADMIN_EMAILS.has(email), createdAt: now(), updatedAt: now() } as UserDoc, { merge:true });
    }
    const me = (await ref.get()).data() as UserDoc;
    return res.json({ ok:true, me });
  } catch (e:any) {
    return res.status(500).json({ error:e.message });
  }
}