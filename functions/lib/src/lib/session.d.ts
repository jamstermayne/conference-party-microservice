import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
export declare function ensureSession(req: Request, res: Response): string;
export declare function saveTokens(sid: string, data: any): Promise<void>;
export declare function loadTokens(sid: string): Promise<admin.firestore.DocumentData | null | undefined>;
export declare function clearTokens(sid: string): Promise<void>;
//# sourceMappingURL=session.d.ts.map