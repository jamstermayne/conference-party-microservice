/**
 * Google OAuth Token Management
 * Uses existing Google OAuth client secrets from Secret Manager
 */

import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';

// Use existing Google OAuth secrets
const GOOGLE_CLIENT_ID = defineSecret('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = defineSecret('GOOGLE_CLIENT_SECRET');

/**
 * Get Google access token for a user
 * Reads stored refresh token and exchanges for access token
 */
export async function getGoogleAccessToken(uid: string): Promise<string | null> {
  const db = admin.firestore();
  
  try {
    // Get user's Google OAuth data
    const googleAuthDoc = await db.doc(`users/${uid}/integrations/google`).get();
    const googleAuth = googleAuthDoc.data();
    
    if (!googleAuth?.['refreshToken']) {
      console.log('No Google refresh token found for user');
      return null;
    }
    
    // Check if access token is still valid
    if (googleAuth['accessToken'] && googleAuth['expiresAt']) {
      const expiresAt = googleAuth['expiresAt'].toDate ? googleAuth['expiresAt'].toDate() : new Date(googleAuth['expiresAt']);
      if (expiresAt > new Date()) {
        return googleAuth['accessToken'];
      }
    }
    
    // Exchange refresh token for new access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID.value(),
        client_secret: GOOGLE_CLIENT_SECRET.value(),
        refresh_token: googleAuth['refreshToken'],
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to refresh Google token:', error || 'Unknown error');
      return null;
    }
    
    const tokenData = await response.json();
    
    // Store new access token
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    await db.doc(`users/${uid}/integrations/google`).update({
      accessToken: tokenData.access_token,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Google access token:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Store Google OAuth tokens after initial authorization
 */
export async function storeGoogleTokens(
  uid: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const db = admin.firestore();
  const expiresAt = new Date(Date.now() + (expiresIn * 1000));
  
  await db.doc(`users/${uid}/integrations/google`).set({
    accessToken,
    refreshToken,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}