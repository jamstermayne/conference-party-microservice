"use strict";
/**
 * Authentication Middleware
 * Provides JWT validation and user extraction for all microservices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("redis");
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
class AuthMiddleware {
    jwtSecret;
    authServiceUrl;
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8080';
    }
    /**
     * Extract JWT token from request headers
     */
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        // Also check for token in cookies (for web sessions)
        if (req.cookies?.token) {
            return req.cookies.token;
        }
        return null;
    }
    /**
     * Validate JWT token locally (fast path)
     */
    async validateTokenLocal(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            // Basic validation
            if (!decoded.sub || !decoded.email) {
                return null;
            }
            return {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name || '',
                role: decoded.role,
                permissions: decoded.permissions || []
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Validate token with auth service (authoritative)
     */
    async validateTokenRemote(token) {
        try {
            // Check cache first
            const cacheKey = `token:${token.substring(0, 20)}`;
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            // Call auth service
            const response = await fetch(`${this.authServiceUrl}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 5000
            });
            if (response.ok) {
                const user = await response.json();
                // Cache for 5 minutes
                await redis.setex(cacheKey, 300, JSON.stringify(user));
                return user;
            }
            return null;
        }
        catch (error) {
            console.error('Token validation error:', error);
            return null;
        }
    }
    /**
     * Optional authentication - adds user to request if token is valid
     */
    optional() {
        return async (req, res, next) => {
            const token = this.extractToken(req);
            if (token) {
                // Try local validation first (faster)
                let user = await this.validateTokenLocal(token);
                // If local validation fails, try remote validation
                if (!user) {
                    user = await this.validateTokenRemote(token);
                }
                if (user) {
                    req.user = user;
                    req.token = token;
                }
            }
            next();
        };
    }
    /**
     * Required authentication - returns 401 if no valid token
     */
    required(methods) {
        return async (req, res, next) => {
            // Skip auth for certain methods if specified
            if (methods && !methods.includes(req.method)) {
                return next();
            }
            const token = this.extractToken(req);
            if (!token) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_TOKEN_MISSING'
                });
            }
            // Try local validation first
            let user = await this.validateTokenLocal(token);
            // If local validation fails, try remote validation
            if (!user) {
                user = await this.validateTokenRemote(token);
            }
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid or expired token',
                    code: 'AUTH_TOKEN_INVALID'
                });
            }
            req.user = user;
            req.token = token;
            next();
        };
    }
    /**
     * Role-based authorization
     */
    requireRole(roles) {
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_TOKEN_MISSING'
                });
            }
            const userRole = req.user.role;
            if (!userRole || !requiredRoles.includes(userRole)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'AUTH_INSUFFICIENT_ROLE',
                    required: requiredRoles,
                    current: userRole
                });
            }
            next();
        };
    }
    /**
     * Permission-based authorization
     */
    requirePermission(permissions) {
        const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_TOKEN_MISSING'
                });
            }
            const userPermissions = req.user.permissions || [];
            const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));
            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    required: requiredPermissions,
                    current: userPermissions
                });
            }
            next();
        };
    }
    /**
     * Owner-only access (user can only access their own resources)
     */
    requireOwnership(getUserIdFromRequest) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_TOKEN_MISSING'
                });
            }
            const resourceUserId = getUserIdFromRequest(req);
            if (req.user.id !== resourceUserId) {
                return res.status(403).json({
                    error: 'Access denied - resource belongs to another user',
                    code: 'AUTH_OWNERSHIP_REQUIRED'
                });
            }
            next();
        };
    }
    /**
     * API Key authentication for external integrations
     */
    requireApiKey(validKeys) {
        return (req, res, next) => {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) {
                return res.status(401).json({
                    error: 'API key required',
                    code: 'API_KEY_MISSING'
                });
            }
            // If specific keys provided, validate against them
            if (validKeys && !validKeys.includes(apiKey)) {
                return res.status(401).json({
                    error: 'Invalid API key',
                    code: 'API_KEY_INVALID'
                });
            }
            // TODO: Validate API key against database/service
            // For now, accept any key that starts with 'ak_'
            if (!apiKey.startsWith('ak_')) {
                return res.status(401).json({
                    error: 'Invalid API key format',
                    code: 'API_KEY_INVALID_FORMAT'
                });
            }
            next();
        };
    }
}
// Export singleton instance
const authMiddleware = new AuthMiddleware();
exports.default = authMiddleware;
//# sourceMappingURL=auth.js.map