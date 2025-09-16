/**
 * Matchmaking System Entry Point
 * Simplified exports for integration
 */
export * from './types';
export { MatchEngine } from './match-engine';
export { SignalEngine } from './signal-engine';
export { UploadProcessor } from './upload-processor';
export { WeightsManager } from './weights-manager';
export { TaxonomyAnalyzer } from './taxonomy-analyzer';
export { AuthMiddleware } from './auth-middleware';
export { setupMatchmakingSystem } from './setup';
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=index.d.ts.map