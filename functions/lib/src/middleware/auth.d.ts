import { Request, Response, NextFunction } from 'express';
/**
 * Authentication middleware that verifies Firebase ID tokens
 * and sets req.user with the decoded token
 */
export declare function authenticateUser(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map