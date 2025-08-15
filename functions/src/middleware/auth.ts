import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

/**
 * Authentication middleware that verifies Firebase ID tokens
 * and sets req.user with the decoded token
 */
export async function authenticateUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth - routes can check for user
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return next();
    }
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      (req as any).user = decodedToken;
    } catch (error) {
      // Invalid token, continue without auth
      console.warn('Invalid auth token:', error);
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
}