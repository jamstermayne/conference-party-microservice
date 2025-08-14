import { Request, Response, NextFunction } from "express";

const CANONICAL_HOST = "conference-party-app.web.app";

export function canonicalHost(req: Request, res: Response, next: NextFunction) {
  const host  = (req.get("x-forwarded-host") || req.get("host") || "").toLowerCase();
  const proto = (req.get("x-forwarded-proto") || "https").toLowerCase();
  
  if (host !== CANONICAL_HOST) {
    return res.redirect(301, `${proto}://${CANONICAL_HOST}${req.originalUrl}`);
  }
  
  next();
}