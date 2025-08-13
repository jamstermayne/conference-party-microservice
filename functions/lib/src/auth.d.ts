import * as express from "express";
export declare function isAdminEmail(email: string | null | undefined): boolean;
export declare function getUserFromAuth(req: express.Request): Promise<{
    uid: string;
    email: string | null;
} | null>;
//# sourceMappingURL=auth.d.ts.map