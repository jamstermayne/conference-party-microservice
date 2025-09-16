/**
 * Authentication Middleware for Matchmaking System
 * Handles admin role verification and access control
 */

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AdminUser, AdminPermission } from './types';

export class AuthMiddleware {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Require authenticated admin user
   */
  requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.verifyAuth(req);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const adminUser = await this.getAdminUser(user.uid);

      if (!adminUser || adminUser.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Add user info to request
      (req as any).user = { uid: user.uid, admin: adminUser };

      next();
    } catch (error) {
      console.error('[auth] Admin verification failed:', error);
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Require specific permission
   */
  requirePermission = (permission: AdminPermission) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = await this.verifyAuth(req);

        if (!user) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            timestamp: new Date().toISOString()
          });
          return;
        }

        const adminUser = await this.getAdminUser(user.uid);

        if (!adminUser) {
          res.status(403).json({
            success: false,
            error: 'Admin access required',
            timestamp: new Date().toISOString()
          });
          return;
        }

        if (!this.hasPermission(adminUser, permission)) {
          res.status(403).json({
            success: false,
            error: `Permission required: ${permission}`,
            timestamp: new Date().toISOString()
          });
          return;
        }

        (req as any).user = { uid: user.uid, admin: adminUser };

        next();
      } catch (error) {
        console.error('[auth] Permission verification failed:', error);
        res.status(401).json({
          success: false,
          error: 'Authentication failed',
          timestamp: new Date().toISOString()
        });
      }
    };
  };

  /**
   * Optional auth - adds user info if authenticated
   */
  optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.verifyAuth(req);

      if (user) {
        const adminUser = await this.getAdminUser(user.uid);
        (req as any).user = { uid: user.uid, admin: adminUser };
      }

      next();
    } catch (error) {
      // Continue without auth for optional routes
      next();
    }
  };

  /**
   * Verify Firebase ID token
   */
  private async verifyAuth(req: Request): Promise<admin.auth.DecodedIdToken | null> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.warn('[auth] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Get admin user from database
   */
  private async getAdminUser(uid: string): Promise<AdminUser | null> {
    try {
      const doc = await this.db.collection('adminUsers').doc(uid).get();

      if (!doc.exists) {
        return null;
      }

      const userData = doc.data() as AdminUser;

      // Update last login timestamp
      await doc.ref.update({
        lastLoginAt: new Date().toISOString()
      });

      return userData;
    } catch (error) {
      console.error('[auth] Failed to get admin user:', error);
      return null;
    }
  }

  /**
   * Check if admin user has specific permission
   */
  private hasPermission(adminUser: AdminUser, permission: AdminPermission): boolean {
    // System admins have all permissions
    if (adminUser.permissions.includes('system_admin')) {
      return true;
    }

    return adminUser.permissions.includes(permission);
  }

  /**
   * Create admin user (system initialization)
   */
  async createAdminUser(
    uid: string,
    email: string,
    role: 'admin' | 'viewer' = 'admin',
    permissions: AdminPermission[] = ['upload_companies', 'edit_weights', 'view_matches', 'export_data']
  ): Promise<AdminUser> {
    const adminUser: AdminUser = {
      uid,
      email,
      role,
      permissions,
      createdAt: new Date().toISOString()
    };

    await this.db.collection('adminUsers').doc(uid).set(adminUser);

    return adminUser;
  }

  /**
   * Update admin user permissions
   */
  async updateAdminUser(
    uid: string,
    updates: Partial<Pick<AdminUser, 'role' | 'permissions'>>
  ): Promise<AdminUser | null> {
    try {
      const docRef = this.db.collection('adminUsers').doc(uid);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      await docRef.update(updates);

      const updatedDoc = await docRef.get();
      return updatedDoc.data() as AdminUser;
    } catch (error) {
      console.error('[auth] Failed to update admin user:', error);
      return null;
    }
  }

  /**
   * List all admin users
   */
  async listAdminUsers(): Promise<AdminUser[]> {
    try {
      const snapshot = await this.db.collection('adminUsers').get();

      return snapshot.docs.map(doc => doc.data() as AdminUser);
    } catch (error) {
      console.error('[auth] Failed to list admin users:', error);
      return [];
    }
  }

  /**
   * Remove admin user
   */
  async removeAdminUser(uid: string): Promise<boolean> {
    try {
      await this.db.collection('adminUsers').doc(uid).delete();
      return true;
    } catch (error) {
      console.error('[auth] Failed to remove admin user:', error);
      return false;
    }
  }

  /**
   * Initialize default admin user (for system setup)
   */
  async initializeDefaultAdmin(email: string, uid?: string): Promise<AdminUser> {
    // If no UID provided, create Firebase user
    let adminUid = uid;

    if (!adminUid) {
      try {
        const userRecord = await admin.auth().createUser({
          email,
          emailVerified: true,
          disabled: false
        });
        adminUid = userRecord.uid;
      } catch (error) {
        // User might already exist
        try {
          const userRecord = await admin.auth().getUserByEmail(email);
          adminUid = userRecord.uid;
        } catch (getUserError) {
          throw new Error(`Failed to create or find admin user: ${getUserError}`);
        }
      }
    }

    // Create admin user with full permissions
    const adminUser = await this.createAdminUser(
      adminUid,
      email,
      'admin',
      ['system_admin', 'upload_companies', 'edit_weights', 'view_matches', 'export_data', 'manage_users']
    );

    console.log(`[auth] Created default admin user: ${email} (${adminUid})`);

    return adminUser;
  }

  /**
   * Check system initialization status
   */
  async isSystemInitialized(): Promise<boolean> {
    try {
      const snapshot = await this.db.collection('adminUsers')
        .where('permissions', 'array-contains', 'system_admin')
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('[auth] Failed to check system initialization:', error);
      return false;
    }
  }

  /**
   * Generate admin setup token (for initial system setup)
   */
  generateSetupToken(): string {
    const payload = {
      type: 'admin_setup',
      timestamp: Date.now(),
      random: Math.random().toString(36).substr(2, 9)
    };

    // In production, use proper JWT signing
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Verify admin setup token
   */
  verifySetupToken(token: string): boolean {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());

      // Check if token is recent (1 hour expiry)
      const now = Date.now();
      const tokenAge = now - payload.timestamp;
      const oneHour = 60 * 60 * 1000;

      return payload.type === 'admin_setup' && tokenAge < oneHour;
    } catch (error) {
      return false;
    }
  }
}