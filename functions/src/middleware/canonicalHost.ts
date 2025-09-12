import { Request, Response, NextFunction } from "express";

const CANONICAL_HOST = "conference-party-app.web.app";

export function canonicalHost(req: Request, res: Response, next: NextFunction) {
  // Skip canonical host check in test environment
  if (process.env["NODE_ENV"] === "test") {
    return next();
  }
  
  // Skip canonical host check for API requests (allow direct function calls)
  if (req.originalUrl?.startsWith("/api")) {
    return next();
  }
  
  const host  = (req.get("x-forwarded-host") || req.get("host") || "").toLowerCase();
  const proto = (req.get("x-forwarded-proto") || "https").toLowerCase();
  
  // Only redirect non-API requests to canonical host
  if (host !== CANONICAL_HOST) {
    return res.redirect(301, `${proto}://${CANONICAL_HOST}${req.originalUrl}`);
  }
  
  next();
}