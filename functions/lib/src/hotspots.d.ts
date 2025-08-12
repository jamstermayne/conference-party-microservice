import type { Request, Response } from 'express';
/**
 * GET /api/hotspots?conference=gamescom2025
 * Optional: &window=today | now | all
 * Returns: { success: true, data: Hotspot[] }
 */
export declare function getHotspots(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=hotspots.d.ts.map