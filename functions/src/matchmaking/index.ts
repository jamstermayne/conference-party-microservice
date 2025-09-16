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

// Simplified router for basic functionality
import { Router } from 'express';
import { MatchEngine } from './match-engine';

const router = Router();
const matchEngine = new MatchEngine();

/**
 * Basic health check endpoint
 */
router.get('/health', async (_req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Basic match finding endpoint
 */
router.post('/matches', async (req, res) => {
  try {
    const matchRequest = req.body;

    if (!matchRequest.companyId) {
      return res.status(400).json({
        success: false,
        error: 'companyId is required',
        timestamp: new Date().toISOString()
      });
    }

    const matchResponse = await matchEngine.findMatches(matchRequest);

    res.json({
      success: true,
      data: matchResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[matchmaking] Error finding matches:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find matches',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;