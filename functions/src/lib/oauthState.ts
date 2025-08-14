import * as admin from "firebase-admin";

const COL = "oauthState";
const TTL_MINUTES = 15;

/**
 * Create a new OAuth state token and store it in Firestore
 * The state itself is used as the document ID for easy lookup
 */
export async function createState(metadata?: { ip?: string; userAgent?: string }): Promise<string> {
  const crypto = await import("crypto");
  const state = crypto.randomBytes(16).toString("hex");
  const ref = admin.firestore().collection(COL).doc(state);
  
  await ref.set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + TTL_MINUTES * 60 * 1000)),
    used: false,
    // Optional telemetry
    ...(metadata && { metadata })
  });
  
  return state;
}

/**
 * Consume an OAuth state token (one-time use)
 * Uses a transaction to ensure atomic read-and-update
 */
export async function consumeState(state: string): Promise<boolean> {
  if (!state) return false;
  
  const ref = admin.firestore().collection(COL).doc(state);
  
  return await admin.firestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    
    // State doesn't exist
    if (!snap.exists) return false;
    
    const data = snap.data() as any;
    
    // Already used
    if (data.used) return false;
    
    // Check expiration
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      // Expired - optionally delete it
      tx.delete(ref);
      return false;
    }
    
    // Mark as used
    tx.update(ref, { 
      used: true, 
      usedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    return true;
  });
}

/**
 * Clean up expired and used states (optional - can be scheduled)
 * This can be called periodically or via a scheduled Cloud Function
 */
export async function cleanupExpiredStates(): Promise<number> {
  const now = admin.firestore.Timestamp.now();
  const cutoffTime = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - TTL_MINUTES * 60 * 1000)
  );
  
  // Query for expired or old used states
  const batch = admin.firestore().batch();
  let count = 0;
  
  // Delete expired states
  const expiredQuery = admin.firestore()
    .collection(COL)
    .where('expiresAt', '<', now)
    .limit(500);
    
  const expiredSnap = await expiredQuery.get();
  expiredSnap.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  // Delete old used states
  const usedQuery = admin.firestore()
    .collection(COL)
    .where('used', '==', true)
    .where('usedAt', '<', cutoffTime)
    .limit(500);
    
  const usedSnap = await usedQuery.get();
  usedSnap.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
  }
  
  return count;
}