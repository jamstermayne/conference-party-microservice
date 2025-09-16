/**
 * Authentication Middleware
 * Provides JWT validation and user extraction for all microservices
 */
import { Request, Response, NextFunction } from 'express';
interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    permissions?: string[];
}
interface AuthenticatedRequest extends Request {
    user?: User;
    token?: string;
}
declare class AuthMiddleware {
    private jwtSecret;
    private authServiceUrl;
    constructor();
    /**
     * Extract JWT token from request headers
     */
    private extractToken;
    /**
     * Validate JWT token locally (fast path)
     */
    private validateTokenLocal;
    /**
     * Validate token with auth service (authoritative)
     */
    private validateTokenRemote;
    /**
     * Optional authentication - adds user to request if token is valid
     */
    optional(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Required authentication - returns 401 if no valid token
     */
    required(methods?: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Role-based authorization
     */
    requireRole(roles: string | string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    /**
     * Permission-based authorization
     */
    requirePermission(permissions: string | string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    /**
     * Owner-only access (user can only access their own resources)
     */
    requireOwnership(getUserIdFromRequest: (req: AuthenticatedRequest) => string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    /**
     * API Key authentication for external integrations
     */
    requireApiKey(validKeys?: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
}
declare const authMiddleware: AuthMiddleware;
export default authMiddleware;
export { AuthenticatedRequest, User };
