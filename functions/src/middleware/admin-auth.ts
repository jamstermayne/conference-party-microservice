/**
 * Admin Authentication Middleware
 * JWT-based authentication with role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env['JWT_SECRET'] || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// User roles
export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  DEVELOPER = 'developer',
  USER = 'user'
}

// Permission levels
export enum Permission {
  FULL_ACCESS = 'full_access',
  MATCHMAKING = 'matchmaking',
  COMPANIES = 'companies',
  ANALYTICS = 'analytics',
  USERS = 'users',
  SYSTEM = 'system',
  API = 'api'
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.FULL_ACCESS,
    Permission.MATCHMAKING,
    Permission.COMPANIES,
    Permission.ANALYTICS,
    Permission.USERS,
    Permission.SYSTEM,
    Permission.API
  ],
  [UserRole.ADMIN]: [
    Permission.MATCHMAKING,
    Permission.COMPANIES,
    Permission.ANALYTICS,
    Permission.USERS,
    Permission.API
  ],
  [UserRole.MANAGER]: [
    Permission.MATCHMAKING,
    Permission.COMPANIES,
    Permission.ANALYTICS
  ],
  [UserRole.ANALYST]: [
    Permission.ANALYTICS
  ],
  [UserRole.DEVELOPER]: [
    Permission.API,
    Permission.SYSTEM
  ],
  [UserRole.USER]: []
};

// Token payload interface
interface TokenPayload {
  uid: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  name?: string;
  company?: string;
}

// Extended Request with user data
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  token?: string;
}

/**
 * Generate JWT token for admin user
 */
export function generateAdminToken(userData: {
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
  company?: string;
}): string {
  const permissions = ROLE_PERMISSIONS[userData.role] || [];

  const payload: TokenPayload = {
    uid: userData.uid,
    email: userData.email,
    role: userData.role,
    permissions
  };

  if (userData.name) payload.name = userData.name;
  if (userData.company) payload.company = userData.company;

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'conference-party-admin',
    subject: userData.uid
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'conference-party-admin'
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from request headers
 */
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return undefined;
  }

  // Bearer token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return undefined;
  }

  return parts[1];
}

/**
 * Main authentication middleware
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  // Attach user data to request
  req.user = payload;
  req.token = token;

  next();
}

/**
 * Middleware to require specific role
 */
export function requireRole(requiredRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
      return;
    }

    const userRole = req.user.role;
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 5,
      [UserRole.ADMIN]: 4,
      [UserRole.MANAGER]: 3,
      [UserRole.ANALYST]: 2,
      [UserRole.DEVELOPER]: 2,
      [UserRole.USER]: 1
    };

    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: requiredRole,
        current: userRole
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
      return;
    }

    const hasPermission =
      req.user.permissions.includes(Permission.FULL_ACCESS) ||
      req.user.permissions.includes(permission);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Permission denied',
        code: 'NO_PERMISSION',
        required: permission,
        current: req.user.permissions
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      req.token = token;
    }
  }

  next();
}

/**
 * Login endpoint handler
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password required'
    });
    return;
  }

  try {
    // For development, accept test credentials
    // In production, integrate with Firebase Auth or other provider
    if (email === 'admin@conference-party.com' && password === 'admin123') {
      const token = generateAdminToken({
        uid: 'admin-001',
        email,
        role: UserRole.SUPER_ADMIN,
        name: 'System Administrator',
        company: 'Conference Party'
      });

      res.json({
        success: true,
        token,
        user: {
          uid: 'admin-001',
          email,
          role: UserRole.SUPER_ADMIN,
          name: 'System Administrator',
          permissions: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

/**
 * Token refresh endpoint
 */
export function refreshToken(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'No valid token to refresh'
    });
    return;
  }

  const newToken = generateAdminToken({
    uid: req.user.uid,
    email: req.user.email,
    role: req.user.role,
    ...(req.user.name && { name: req.user.name }),
    ...(req.user.company && { company: req.user.company })
  });

  res.json({
    success: true,
    token: newToken,
    user: req.user
  });
}

/**
 * Logout endpoint (client-side token removal)
 */
export function adminLogout(_req: Request, res: Response): void {
  // In a real implementation, you might want to:
  // - Add token to a blacklist
  // - Clear server-side sessions
  // - Log the logout event

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}

/**
 * Get current user info
 */
export function getCurrentUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
    return;
  }

  res.json({
    success: true,
    user: req.user
  });
}