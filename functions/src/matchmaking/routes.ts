/**
 * Matchmaking API Routes
 * RESTful endpoints for the company-to-company matchmaking system
 */

import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { MatchEngine } from './match-engine';
import { UploadProcessor } from './upload-processor';
import { TaxonomyAnalyzer } from './taxonomy-analyzer';
import { WeightsManager } from './weights-manager';
import { AuthMiddleware } from './auth-middleware';
import {
  MatchRequest,
  MatchResponse,
  UploadRequest,
  UploadResponse,
  TaxonomyRequest,
  TaxonomyResponse,
  APIResponse,
  Company,
  WeightsProfile,
  IngestLog
} from './types';

const router = Router();
const matchEngine = new MatchEngine();
const uploadProcessor = new UploadProcessor();
const taxonomyAnalyzer = new TaxonomyAnalyzer();
const weightsManager = new WeightsManager();
const authMiddleware = new AuthMiddleware();

// Apply auth middleware to admin routes
router.use('/admin/*', authMiddleware.requireAdmin);
router.use('/upload', authMiddleware.requireAdmin);
router.use('/weights', authMiddleware.requireAdmin);

// ============= MATCHING ENDPOINTS =============

/**
 * POST /matchmaking/matches
 * Find matches for companies
 */
router.post('/matches', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const matchRequest: MatchRequest = req.body;

    // Validate request
    if (matchRequest.companyId && typeof matchRequest.companyId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid companyId parameter',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }

    // Execute matching
    const matchResponse: MatchResponse = await matchEngine.findMatches(matchRequest);

    res.json({
      success: true,
      data: matchResponse,
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime
    } as APIResponse<MatchResponse>);

  } catch (error) {
    console.error('[matchmaking] Error finding matches:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find matches',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * GET /matchmaking/matches/:companyId
 * Find matches for a specific company
 */
router.get('/matches/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { weightsProfile, limit, minScore, includeExplanations } = req.query;

    const matchRequest: MatchRequest = {
      companyId,
      weightsProfileId: weightsProfile as string,
      limit: limit ? parseInt(limit as string) : undefined,
      minScore: minScore ? parseFloat(minScore as string) : undefined,
      includeExplanations: includeExplanations === 'true'
    };

    const matchResponse = await matchEngine.findMatches(matchRequest);

    res.json({
      success: true,
      data: matchResponse,
      timestamp: new Date().toISOString()
    } as APIResponse<MatchResponse>);

  } catch (error) {
    console.error('[matchmaking] Error finding company matches:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find company matches',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * POST /matchmaking/matches/batch
 * Find matches for multiple companies
 */
router.post('/matches/batch', async (req: Request, res: Response) => {
  try {
    const { companyIds, weightsProfileId, limit, minScore } = req.body;

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'companyIds array is required',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }

    const results: Record<string, MatchResponse> = {};

    // Process each company
    for (const companyId of companyIds) {
      try {
        const matchRequest: MatchRequest = {
          companyId,
          weightsProfileId,
          limit,
          minScore,
          includeExplanations: false // Disable for batch processing
        };

        results[companyId] = await matchEngine.findMatches(matchRequest);
      } catch (error) {
        console.warn(`Failed to find matches for company ${companyId}:`, error);
        results[companyId] = {
          matches: [],
          totalCount: 0,
          processingTimeMs: 0,
          weightsProfile: {} as WeightsProfile,
          query: { companyId },
          generatedAt: new Date().toISOString()
        };
      }
    }

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    } as APIResponse<Record<string, MatchResponse>>);

  } catch (error) {
    console.error('[matchmaking] Error in batch matching:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process batch matches',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// ============= COMPANY MANAGEMENT ENDPOINTS =============

/**
 * GET /matchmaking/companies
 * List companies with filtering and pagination
 */
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '20',
      type,
      country,
      industry,
      fundingStage,
      size,
      search
    } = req.query;

    const db = admin.firestore();
    let query: FirebaseFirestore.Query = db.collection('companies');

    // Apply filters
    if (type) query = query.where('type', '==', type);
    if (country) query = query.where('country', '==', country);
    if (fundingStage) query = query.where('fundingStage', '==', fundingStage);
    if (size) query = query.where('size', '==', size);
    if (industry) query = query.where('industry', 'array-contains', industry);

    // Simple pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const offset = (pageNum - 1) * pageSizeNum;

    const snapshot = await query.offset(offset).limit(pageSizeNum).get();
    const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Company[];

    // Apply text search if provided (client-side filtering for simplicity)
    let filteredCompanies = companies;
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm) ||
        company.description?.toLowerCase().includes(searchTerm) ||
        company.industry?.some(ind => ind.toLowerCase().includes(searchTerm))
      );
    }

    res.json({
      success: true,
      data: {
        items: filteredCompanies,
        totalCount: filteredCompanies.length,
        page: pageNum,
        pageSize: pageSizeNum,
        hasMore: snapshot.docs.length === pageSizeNum
      },
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('[matchmaking] Error listing companies:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list companies',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * GET /matchmaking/companies/:id
 * Get single company details
 */
router.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();

    const doc = await db.collection('companies').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }

    const company = { id: doc.id, ...doc.data() } as Company;

    res.json({
      success: true,
      data: company,
      timestamp: new Date().toISOString()
    } as APIResponse<Company>);

  } catch (error) {
    console.error('[matchmaking] Error getting company:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get company',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * POST /matchmaking/companies
 * Create new company (admin only)
 */
router.post('/companies', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const companyData: Partial<Company> = req.body;

    // Validate required fields
    if (!companyData.name || !companyData.type || !companyData.country) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, country',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }

    const db = admin.firestore();
    const now = new Date().toISOString();

    const company: Omit<Company, 'id'> = {
      ...companyData,
      createdAt: now,
      updatedAt: now,
      source: 'manual',
      profileCompleteness: uploadProcessor.calculateProfileCompleteness(companyData as Company)
    } as Omit<Company, 'id'>;

    const docRef = await db.collection('companies').add(company);

    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...company },
      timestamp: new Date().toISOString()
    } as APIResponse<Company>);

  } catch (error) {
    console.error('[matchmaking] Error creating company:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create company',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * PUT /matchmaking/companies/:id
 * Update company (admin only)
 */
router.put('/companies/:id', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<Company> = req.body;

    const db = admin.firestore();
    const docRef = db.collection('companies').doc(id);

    // Check if company exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }

    // Update company
    const updatedData = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      profileCompleteness: uploadProcessor.calculateProfileCompleteness({
        ...doc.data(),
        ...updateData
      } as Company)
    };

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const company = { id: updatedDoc.id, ...updatedDoc.data() } as Company;

    res.json({
      success: true,
      data: company,
      timestamp: new Date().toISOString()
    } as APIResponse<Company>);

  } catch (error) {
    console.error('[matchmaking] Error updating company:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update company',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * DELETE /matchmaking/companies/:id
 * Delete company (admin only)
 */
router.delete('/companies/:id', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();

    await db.collection('companies').doc(id).delete();

    res.json({
      success: true,
      message: 'Company deleted successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('[matchmaking] Error deleting company:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete company',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// ============= UPLOAD ENDPOINTS =============

/**
 * POST /matchmaking/upload
 * Upload and process CSV/Excel file (admin only)
 */
router.post('/upload', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const uploadRequest: UploadRequest = req.body;

    if (!uploadRequest.filename || !uploadRequest.data) {
      return res.status(400).json({
        success: false,
        error: 'filename and data are required',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }

    const result: UploadResponse = await uploadProcessor.processUpload(uploadRequest, req.user?.uid);

    const statusCode = result.ingestLog.status === 'failed' ? 400 : 200;

    res.status(statusCode).json({
      success: result.ingestLog.status !== 'failed',
      data: result,
      timestamp: new Date().toISOString()
    } as APIResponse<UploadResponse>);

  } catch (error) {
    console.error('[matchmaking] Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * GET /matchmaking/uploads
 * List upload logs (admin only)
 */
router.get('/uploads', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string)));

    const db = admin.firestore();
    const snapshot = await db.collection('ingestLogs')
      .orderBy('uploadedAt', 'desc')
      .limit(pageSizeNum)
      .get();

    const uploads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IngestLog[];

    res.json({
      success: true,
      data: {
        items: uploads,
        totalCount: uploads.length,
        page: pageNum,
        pageSize: pageSizeNum,
        hasMore: uploads.length === pageSizeNum
      },
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('[matchmaking] Error listing uploads:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list uploads',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// ============= WEIGHTS MANAGEMENT ENDPOINTS =============

/**
 * GET /matchmaking/weights
 * List weights profiles
 */
router.get('/weights', async (req: Request, res: Response) => {
  try {
    const profiles = await weightsManager.listProfiles();

    res.json({
      success: true,
      data: profiles,
      timestamp: new Date().toISOString()
    } as APIResponse<WeightsProfile[]>);

  } catch (error) {
    console.error('[matchmaking] Error listing weights:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list weights profiles',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * POST /matchmaking/weights
 * Create weights profile (admin only)
 */
router.post('/weights', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const profileData: Partial<WeightsProfile> = req.body;
    const profile = await weightsManager.createProfile(profileData, req.user?.uid);

    res.status(201).json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    } as APIResponse<WeightsProfile>);

  } catch (error) {
    console.error('[matchmaking] Error creating weights profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create weights profile',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * PUT /matchmaking/weights/:id
 * Update weights profile (admin only)
 */
router.put('/weights/:id', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<WeightsProfile> = req.body;

    const profile = await weightsManager.updateProfile(id, updateData);

    res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    } as APIResponse<WeightsProfile>);

  } catch (error) {
    console.error('[matchmaking] Error updating weights profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update weights profile',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// ============= TAXONOMY ENDPOINTS =============

/**
 * POST /matchmaking/taxonomy
 * Generate taxonomy visualization
 */
router.post('/taxonomy', async (req: Request, res: Response) => {
  try {
    const taxonomyRequest: TaxonomyRequest = req.body;

    if (!taxonomyRequest.dimension || !taxonomyRequest.visualization) {
      return res.status(400).json({
        success: false,
        error: 'dimension and visualization are required',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }

    const result: TaxonomyResponse = await taxonomyAnalyzer.generateVisualization(taxonomyRequest);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    } as APIResponse<TaxonomyResponse>);

  } catch (error) {
    console.error('[matchmaking] Taxonomy error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate taxonomy',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// ============= SYSTEM ENDPOINTS =============

/**
 * GET /matchmaking/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();

    // Test database connectivity
    const companiesCount = (await db.collection('companies').limit(1).get()).size;
    const weightsCount = (await db.collection('weightsProfiles').limit(1).get()).size;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        collections: {
          companies: companiesCount > 0 ? 'populated' : 'empty',
          weightsProfiles: weightsCount > 0 ? 'populated' : 'empty'
        },
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('[matchmaking] Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'System unhealthy',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

/**
 * POST /matchmaking/admin/clear-caches
 * Clear all system caches (admin only)
 */
router.post('/admin/clear-caches', authMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    matchEngine.clearCaches();

    res.json({
      success: true,
      message: 'Caches cleared successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('[matchmaking] Error clearing caches:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear caches',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

export default router;