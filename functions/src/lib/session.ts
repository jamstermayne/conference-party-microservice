import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

const COL = 'gcalSessions';
const COL_LINKEDIN = 'linkedinSessions';

export function ensureSession(req: Request, res: Response): string {
  let sid = (req as any).cookies?.['sid'] as string | undefined;
  if (!sid) {
    sid = crypto.randomBytes(16).toString('hex');
    res.cookie('sid', sid, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });
  }
  return sid;
}

export async function saveTokens(sid: string, data: any, provider: string = 'google') {
  const collection = provider === 'linkedin' ? COL_LINKEDIN : COL;
  await admin.firestore().collection(collection).doc(sid).set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function loadTokens(sid: string, provider: string = 'google') {
  if (!sid) return null;
  const collection = provider === 'linkedin' ? COL_LINKEDIN : COL;
  const snap = await admin.firestore().collection(collection).doc(sid).get();
  return snap.exists ? snap.data() : null;
}

export async function clearTokens(sid: string, provider: string = 'google') {
  if (!sid) return;
  const collection = provider === 'linkedin' ? COL_LINKEDIN : COL;
  await admin.firestore().collection(collection).doc(sid).delete();
}