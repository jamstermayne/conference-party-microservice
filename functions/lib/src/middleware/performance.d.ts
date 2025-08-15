import { Request, Response, NextFunction } from 'express';
export declare function performanceMonitor(req: Request, res: Response, next: NextFunction): void;
export declare function cacheMiddleware(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function corsCache(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=performance.d.ts.map