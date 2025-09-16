/**
 * Simple Matchmaking Router
 * Working implementation with Firestore integration
 */

import { Router, Request, Response } from 'express';
import { matchmakingService } from '../services/matchmaking-service';

const router = Router();

/**
 * GET /api/matchmaking/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'connected',
    message: 'Matchmaking service is operational',
    timestamp: new Date().toISOString(),
    features: [
      'Basic matching algorithm',
      'Company profiles',
      'Match scoring',
      'Real-time updates ready'
    ]
  });
});

/**
 * GET /api/matchmaking/companies
 * Get all companies
 */
router.get('/companies', async (_req: Request, res: Response) => {
  try {
    const companies = await matchmakingService.getAllCompanies();
    res.json({
      success: true,
      data: companies,
      total: companies.length
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch companies'
    });
  }
});

/**
 * POST /api/matchmaking/matches
 * Find matches for a company
 */
router.post('/matches', async (req: Request, res: Response): Promise<Response> => {
  const { companyId, limit = 5 } = req.body;

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'companyId is required'
    });
  }

  try {
    const matches = await matchmakingService.calculateMatches(companyId, limit);

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found or no matches available'
      });
    }

    return res.json({
      success: true,
      companyId,
      matches,
      total: matches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating matches:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate matches'
    });
  }
});

/**
 * GET /api/matchmaking/matches/:companyId
 * Get matches for a specific company
 */
router.get('/matches/:companyId', async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.params;

  try {
    const matches = await matchmakingService.calculateMatches(companyId || '', 10);

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found or no matches available'
      });
    }

    return res.json({
      success: true,
      companyId,
      matches,
      total: matches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch matches'
    });
  }
});

export default router;