import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

const COL = 'gcalSessions';

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

export async function saveTokens(sid: string, data: any) {
  await admin.firestore().collection(COL).doc(sid).set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function loadTokens(sid: string) {
  if (!sid) return null;
  const snap = await admin.firestore().collection(COL).doc(sid).get();
  return snap.exists ? snap.data() : null;
}

export async function clearTokens(sid: string) {
  if (!sid) return;
  await admin.firestore().collection(COL).doc(sid).delete();
}