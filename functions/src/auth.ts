import * as admin from "firebase-admin";
import * as express from "express";
import {ENV} from "./env";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = ENV.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function getUserFromAuth(req: express.Request): Promise<{uid: string; email: string | null} | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split('Bearer ')[1];
  if (!token) return null;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}