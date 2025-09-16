/**
 * Authentication Middleware for Matchmaking System
 * Handles admin role verification and access control
 */
import { Request, Response, NextFunction } from 'express';
import { AdminUser, AdminPermission } from './types';
export declare class AuthMiddleware {
    private db;
    constructor();
    /**
     * Require authenticated admin user
     */
    requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require specific permission
     */
    requirePermission: (permission: AdminPermission) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Optional auth - adds user info if authenticated
     */
    optionalAuth: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
    /**
     * Verify Firebase ID token
     */
    private verifyAuth;
    /**
     * Get admin user from database
     */
    private getAdminUser;
    /**
     * Check if admin user has specific permission
     */
    private hasPermission;
    /**
     * Create admin user (system initialization)
     */
    createAdminUser(uid: string, email: string, role?: 'admin' | 'viewer', permissions?: AdminPermission[]): Promise<AdminUser>;
    /**
     * Update admin user permissions
     */
    updateAdminUser(uid: string, updates: Partial<Pick<AdminUser, 'role' | 'permissions'>>): Promise<AdminUser | null>;
    /**
     * List all admin users
     */
    listAdminUsers(): Promise<AdminUser[]>;
    /**
     * Remove admin user
     */
    removeAdminUser(uid: string): Promise<boolean>;
    /**
     * Initialize default admin user (for system setup)
     */
    initializeDefaultAdmin(email: string, uid?: string): Promise<AdminUser>;
    /**
     * Check system initialization status
     */
    isSystemInitialized(): Promise<boolean>;
    /**
     * Generate admin setup token (for initial system setup)
     */
    generateSetupToken(): string;
    /**
     * Verify admin setup token
     */
    verifySetupToken(token: string): boolean;
}
//# sourceMappingURL=auth-middleware.d.ts.map