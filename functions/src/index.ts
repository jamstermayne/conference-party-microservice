import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {Request, Response} from "express";
import { config, validateConfig } from "./simple-config";

console.log('🚀 Starting Firebase Functions initialization...');

initializeApp();
console.log('✅ Firebase Admin initialized');

// Validate configuration on startup (non-blocking)
try {
  validateConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.warn('⚠️ Configuration validation failed:', error instanceof Error ? error.message : String(error));
  // Don't exit - allow function to start with warnings
}

console.log('🔧 Function setup complete, ready to handle requests');

function setCorsHeaders(res: Response, req?: Request): void {
  const origin = req?.headers.origin as string;
  
  // Check if origin is allowed (including wildcard pattern matching)
  let allowOrigin: string = config.cors.allowedOrigins[0] || 'https://conference-party-app.web.app'; // Default to first allowed origin
  
  if (origin) {
    // Check for exact match first
    if (config.cors.allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else {
      // Check for wildcard pattern matches
      const wildcardMatch = config.cors.allowedOrigins.find(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          // Convert wildcard pattern to regex
          const pattern = allowedOrigin
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        return false;
      });
      
      if (wildcardMatch) {
        allowOrigin = origin;
      }
    }
  }
  
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Environment, X-Client-Version, X-Development-Mode, X-Codespace-Origin, X-Gitpod-Origin");
  res.setHeader("Access-Control-Allow-Credentials", String(config.cors.credentials));
  res.setHeader("Access-Control-Max-Age", String(config.cors.maxAge));
  res.setHeader("Content-Type", "application/json");
}

/**
 * Handle invite validation endpoint
 */
async function handleInviteValidation(req: Request, res: Response): Promise<void> {
  setCorsHeaders(res, req);
  
  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  
  if (req.method !== "GET") {
    res.status(405).json({
      success: false,
      error: "Method not allowed. Use GET."
    });
    return;
  }
  
  const inviteCode = req.query['code'] as string;
  
  if (!inviteCode || typeof inviteCode !== 'string') {
    res.status(400).json({
      success: false,
      valid: false,
      error: "Invite code is required"
    });
    return;
  }
  
  // Basic validation - ensure code format is correct
  const cleanCode = inviteCode.trim().toUpperCase();
  const codePattern = /^[A-Z0-9]{6,8}$/;
  
  if (!codePattern.test(cleanCode)) {
    res.status(400).json({
      success: false,
      valid: false,
      error: "Invalid invite code format",
      reason: "invalid_format"
    });
    return;
  }
  
  try {
    // For now, simulate invite validation
    // In a real implementation, this would check against a database
    const isValidCode = await validateInviteCode(cleanCode);
    
    if (isValidCode.valid) {
      res.status(200).json({
        success: true,
        valid: true,
        inviterId: isValidCode.inviterId,
        inviterName: isValidCode.inviterName,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        valid: false,
        error: "Invite code not found or expired",
        reason: isValidCode.reason
      });
    }
    
  } catch (error) {
    console.error("Invite validation error:", error);
    res.status(500).json({
      success: false,
      valid: false,
      error: "Internal server error during validation"
    });
  }
}

/**
 * Validate invite code against data store
 * This is a placeholder implementation - replace with actual database logic
 */
async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  inviterId?: string;
  inviterName?: string;
  reason?: string;
}> {
  // Demo implementation - replace with real database lookup
  const validDemoCodes = {
    'DEMO123': { inviterId: 'demo-user-1', inviterName: 'Alex Chen' },
    'TEST456': { inviterId: 'demo-user-2', inviterName: 'Sarah Johnson' },
    'GAMESCOM': { inviterId: 'demo-user-3', inviterName: 'Velocity Team' },
  };
  
  const codeData = validDemoCodes[code as keyof typeof validDemoCodes];
  
  if (codeData) {
    return {
      valid: true,
      inviterId: codeData.inviterId,
      inviterName: codeData.inviterName
    };
  }
  
  return {
    valid: false,
    reason: 'not_found'
  };
}

// Simple health check
export const api = onRequest({
  invoker: "public", 
  cors: false,
  maxInstances: 20,
  timeoutSeconds: 60,
  memory: "256MiB" as const,
  minInstances: 0,
}, async (req: Request, res: Response) => {
  // Set CORS headers immediately
  setCorsHeaders(res, req);
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  const startTime = Date.now();
  
  try {
    const path = req.path.replace("/api", "");
    console.log(`API Request: ${req.method} ${path}`);

    switch (path) {
      case "/health":
        const response = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "3.1.0",
          environment: process.env['NODE_ENV'] || "production",
          responseTime: `${Date.now() - startTime}ms`,
          cors: {
            origin: req.headers.origin,
            allowed: config.cors.allowedOrigins
          }
        };
        
        res.json(response);
        break;

      case "/invite/validate":
        await handleInviteValidation(req, res);
        break;
        
      default:
        setCorsHeaders(res);
        res.status(404).json({
          success: false,
          error: "Endpoint not found",
          availableEndpoints: ["/health", "/invite/validate"],
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("API Error:", error);
    setCorsHeaders(res);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      responseTime: `${Date.now() - startTime}ms`,
    });
  }
});