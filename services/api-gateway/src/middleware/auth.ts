/**
 * Authentication Middleware
 * JWT token verification
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

/**
 * Authenticate request
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;

    // Attach user to request
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      tenantId: decoded.tenantId || 'default',
      role: decoded.role || 'user',
    };

    next();
  } catch (error) {
    logger.error('Authentication failed', { error });
    res.status(401).json({ error: 'Invalid token' });
  }
}