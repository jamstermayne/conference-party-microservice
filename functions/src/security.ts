/**
 * SECURITY MODULE - Enhanced API Protection
 * Implements comprehensive security measures for production resilience
 */

import {Request, Response} from "express";
import * as crypto from "crypto";

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 1000, // Increased from 100
  RATE_LIMIT_MAX_REQUESTS_PER_IP: 200, // Increased from 50

  // Request validation
  MAX_BODY_SIZE: 1024 * 1024, // 1MB
  MAX_URL_LENGTH: 2048,
  MAX_HEADER_SIZE: 8192,

  // Content Security
  ALLOWED_ORIGINS: [
    "https://conference-party-app.web.app",
    "https://conference-party-app.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173",
  ],

  // Input sanitization
  FORBIDDEN_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
  ],

  // CSRF Protection
  CSRF_TOKEN_LENGTH: 32,
  CSRF_TOKEN_EXPIRY: 3600000, // 1 hour
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(req: Request, res: Response): boolean {
  const now = Date.now();
  const clientId = getClientIdentifier(req);

  // Clean expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  const limit = rateLimitStore.get(clientId);

  if (!limit) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (limit.resetTime < now) {
    limit.count = 1;
    limit.resetTime = now + SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS;
    return true;
  }

  if (limit.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS_PER_IP) {
    res.status(429).json({
      success: false,
      error: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((limit.resetTime - now) / 1000),
    });
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: Request): string {
  // Use combination of IP and user agent for better accuracy
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  return crypto.createHash("sha256").update(`${ip}-${userAgent}`).digest("hex");
}

/**
 * Validate and sanitize input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    // Remove dangerous patterns
    let sanitized = input;
    for (const pattern of SECURITY_CONFIG.FORBIDDEN_PATTERNS) {
      sanitized = sanitized.replace(pattern, "");
    }

    // Trim and limit length
    sanitized = sanitized.trim().substring(0, 10000);

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === "object") {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        // Sanitize both key and value
        const sanitizedKey = sanitizeInput(key);
        sanitized[sanitizedKey] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate request headers
 */
export function validateHeaders(req: Request): boolean {
  try {
    // Check for suspiciously large headers
    const headerSize = JSON.stringify(req.headers).length;
    if (headerSize > SECURITY_CONFIG.MAX_HEADER_SIZE) {
      console.warn("Header validation failed: oversized headers", headerSize);
      return false;
    }

    // Check for SQL injection attempts in headers
    const suspiciousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/i,
      /(--|\/\*|\*\/|xp_|sp_|0x)/i,
    ];

    for (const header in req.headers) {
      // Skip HTTP/2 pseudo-headers and common safe headers
      if (header.startsWith(":") ||
          ["user-agent", "accept", "accept-encoding", "accept-language",
            "cache-control", "connection", "host", "referer", "origin",
            "content-type", "content-length", "authorization"].includes(header.toLowerCase())) {
        continue;
      }

      const value = String(req.headers[header]);

      // Skip empty or very short values that are likely safe
      if (!value || value.length < 3) {
        continue;
      }

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          console.warn("Header validation failed: suspicious pattern in header", header, value.substring(0, 100));
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Header validation error:", error);
    // If validation fails due to an error, allow the request (fail open for availability)
    return true;
  }
}

/**
 * CORS validation with origin whitelist
 */
export function validateOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Allow non-browser requests

  // Check against whitelist
  return SECURITY_CONFIG.ALLOWED_ORIGINS.some((allowed) => {
    if (allowed.includes("*")) {
      // Handle wildcard subdomains
      const pattern = allowed.replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return allowed === origin;
  });
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(SECURITY_CONFIG.CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Validate CSRF token
 */
const csrfTokens = new Map<string, number>();

export function validateCSRFToken(token: string): boolean {
  const timestamp = csrfTokens.get(token);
  if (!timestamp) return false;

  const now = Date.now();
  if (now - timestamp > SECURITY_CONFIG.CSRF_TOKEN_EXPIRY) {
    csrfTokens.delete(token);
    return false;
  }

  return true;
}

/**
 * Store CSRF token
 */
export function storeCSRFToken(token: string): void {
  // Clean old tokens
  const now = Date.now();
  for (const [key, timestamp] of csrfTokens.entries()) {
    if (now - timestamp > SECURITY_CONFIG.CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(key);
    }
  }

  csrfTokens.set(token, now);
}

/**
 * Security headers middleware
 */
export function setSecurityHeaders(res: Response): void {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Content Security Policy
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://us-central1-conference-party-app.cloudfunctions.net https://firestore.googleapis.com",
    "frame-ancestors 'none'",
  ].join("; "));
}

/**
 * Validate event data structure
 */
export function validateEventData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  const requiredFields = ["name", "date", "startTime", "venue"];
  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate date format (YYYY-MM-DD)
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push("Invalid date format. Use YYYY-MM-DD");
  }

  // Validate time format (HH:MM)
  if (data.startTime && !/^\d{2}:\d{2}$/.test(data.startTime)) {
    errors.push("Invalid startTime format. Use HH:MM");
  }

  if (data.endTime && !/^\d{2}:\d{2}$/.test(data.endTime)) {
    errors.push("Invalid endTime format. Use HH:MM");
  }

  // Validate field lengths
  const maxLengths: { [key: string]: number } = {
    name: 200,
    description: 2000,
    venue: 300,
    category: 100,
    hosts: 500,
  };

  for (const [field, maxLength] of Object.entries(maxLengths)) {
    if (data[field] && data[field].length > maxLength) {
      errors.push(`${field} exceeds maximum length of ${maxLength} characters`);
    }
  }

  // Validate category
  const validCategories = [
    "Business Networking",
    "Developer Meetup",
    "Publishing Event",
    "Investor Pitch",
    "Industry Party",
    "Game Launch",
    "Press Conference",
    "Community Gathering",
    "Other",
  ];

  if (data.category && !validCategories.includes(data.category)) {
    errors.push(`Invalid category. Must be one of: ${validCategories.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Anonymize sensitive data
 */
export function anonymizeData(data: any): any {
  const sensitiveFields = ["email", "phone", "ip", "userAgent"];
  const anonymized = {...data};

  for (const field of sensitiveFields) {
    if (anonymized[field]) {
      if (field === "email") {
        // Keep domain but hide username
        const parts = anonymized[field].split("@");
        if (parts.length === 2) {
          anonymized[field] = `***@${parts[1]}`;
        }
      } else if (field === "ip") {
        // Keep first two octets
        const parts = anonymized[field].split(".");
        if (parts.length === 4) {
          anonymized[field] = `${parts[0]}.${parts[1]}.***.***`;
        }
      } else {
        anonymized[field] = "***";
      }
    }
  }

  return anonymized;
}
