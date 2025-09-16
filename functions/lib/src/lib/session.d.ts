import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
export declare function ensureSession(req: Request, res: Response): string;
export declare function saveTokens(sid: string, data: any, provider?: string): Promise<void>;
export declare function loadTokens(sid: string, provider?: string): Promise<admin.firestore.DocumentData | null | undefined>;
export declare function clearTokens(sid: string, provider?: string): Promise<void>;
//# sourceMappingURL=session.d.ts.map