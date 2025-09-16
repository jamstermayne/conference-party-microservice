/**
 * Admin Authentication Middleware
 * JWT-based authentication with role-based access control
 */
import { Request, Response, NextFunction } from 'express';
export declare enum UserRole {
    SUPER_ADMIN = "super-admin",
    ADMIN = "admin",
    MANAGER = "manager",
    ANALYST = "analyst",
    DEVELOPER = "developer",
    USER = "user"
}
export declare enum Permission {
    FULL_ACCESS = "full_access",
    MATCHMAKING = "matchmaking",
    COMPANIES = "companies",
    ANALYTICS = "analytics",
    USERS = "users",
    SYSTEM = "system",
    API = "api"
}
interface TokenPayload {
    uid: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
    name?: string;
    company?: string;
}
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
    token?: string;
}
/**
 * Generate JWT token for admin user
 */
export declare function generateAdminToken(userData: {
    uid: string;
    email: string;
    role: UserRole;
    name?: string;
    company?: string;
}): string;
/**
 * Verify JWT token
 */
export declare function verifyToken(token: string): TokenPayload | null;
/**
 * Main authentication middleware
 */
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Middleware to require specific role
 */
export declare function requireRole(requiredRole: UserRole): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to require specific permission
 */
export declare function requirePermission(permission: Permission): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - doesn't fail if no token
 */
export declare function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
/**
 * Login endpoint handler
 */
export declare function adminLogin(req: Request, res: Response): Promise<void>;
/**
 * Token refresh endpoint
 */
export declare function refreshToken(req: AuthenticatedRequest, res: Response): void;
/**
 * Logout endpoint (client-side token removal)
 */
export declare function adminLogout(_req: Request, res: Response): void;
/**
 * Get current user info
 */
export declare function getCurrentUser(req: AuthenticatedRequest, res: Response): void;
export {};
//# sourceMappingURL=admin-auth.d.ts.map