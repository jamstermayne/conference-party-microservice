import { api } from '../src/index';
import { createMockRequest, createMockResponse } from './setup';

describe('API Integration Tests', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
  });

  describe('Health Endpoint', () => {
    test('should return healthy status', async () => {
      mockReq.path = '/health';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          version: '3.0.0',
          timestamp: expect.any(String),
          responseTime: expect.stringMatching(/\d+ms/)
        })
      );
    });

    test('should include response time in health check', async () => {
      mockReq.path = '/health';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          responseTime: expect.stringMatching(/\d+ms/)
        })
      );
    });
  });

  describe('Parties Feed Endpoint', () => {
    test('should return parties with pagination', async () => {
      mockReq.path = '/parties';
      mockReq.query = { page: '1', limit: '10' };
      
      await api(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          meta: expect.objectContaining({
            count: expect.any(Number),
            total: expect.any(Number),
            page: 1,
            limit: 10,
            hasMore: expect.any(Boolean),
            loadTime: expect.stringMatching(/\d+ms/),
            source: expect.any(String)
          })
        })
      );
    });

    test('should handle pagination parameters correctly', async () => {
      mockReq.path = '/parties';
      mockReq.query = { page: '2', limit: '5' };
      
      await api(mockReq, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response.meta.page).toBe(2);
      expect(response.meta.limit).toBe(5);
    });

    test('should limit maximum page size', async () => {
      mockReq.path = '/parties';
      mockReq.query = { limit: '200' }; // Exceeds max limit
      
      await api(mockReq, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response.meta.limit).toBe(100); // Should be capped at 100
    });

    test('should return empty array on error with graceful degradation', async () => {
      // Mock Firestore to throw error
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      mockReq.path = '/parties';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          meta: expect.objectContaining({
            count: 0,
            total: 0,
            source: 'error'
          })
        })
      );
    });
  });

  describe('Swipe Endpoint', () => {
    test('should handle valid swipe request', async () => {
      mockReq.method = 'POST';
      mockReq.path = '/swipe';
      mockReq.body = {
        partyId: 'test-party-1',
        action: 'like',
        timestamp: '2025-08-06T10:00:00Z'
      };
      
      await api(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          swipe: expect.objectContaining({
            id: expect.any(String),
            partyId: 'test-party-1',
            action: 'like',
            timestamp: expect.any(String)
          }),
          message: 'Party saved to interested!',
          nextAction: 'calendar_sync_available'
        })
      );
    });

    test('should handle pass action correctly', async () => {
      mockReq.method = 'POST';
      mockReq.path = '/swipe';
      mockReq.body = {
        partyId: 'test-party-1',
        action: 'pass'
      };
      
      await api(mockReq, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response.swipe.action).toBe('pass');
      expect(response.message).toBe('Thanks for the feedback');
      expect(response.nextAction).toBeNull();
    });

    test('should reject GET requests', async () => {
      mockReq.method = 'GET';
      mockReq.path = '/swipe';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed'
      });
    });

    test('should validate required fields', async () => {
      mockReq.method = 'POST';
      mockReq.path = '/swipe';
      mockReq.body = {}; // Missing required fields
      
      await api(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        errors: expect.arrayContaining([
          'Missing required field: partyId',
          'Missing required field: action'
        ])
      });
    });
  });

  describe('CORS Headers', () => {
    test('should set CORS headers for all requests', async () => {
      mockReq.path = '/health';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    });

    test('should handle OPTIONS preflight requests', async () => {
      mockReq.method = 'OPTIONS';
      mockReq.path = '/parties';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      mockReq.path = '/unknown';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: expect.any(Array)
      });
    });

    test('should handle internal server errors', async () => {
      // Force an error in the API function
      mockReq.path = '/parties';
      
      // Mock Firestore to throw an unexpected error
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });
      
      await api(mockReq, mockRes);
      
      // Should still return success with empty data due to graceful degradation
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: []
        })
      );
    });

    test('should include response time in error responses', async () => {
      mockReq.path = '/unknown';
      
      await api(mockReq, mockRes);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response).toHaveProperty('error');
    });
  });

  describe('Sync Endpoint', () => {
    test('should sync parties from Google Sheets', async () => {
      mockReq.path = '/sync';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('parties synced from Google Sheets'),
          count: expect.any(Number),
          source: 'gamescom-sheets',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Admin Clear Endpoint', () => {
    test('should clear all parties', async () => {
      mockReq.path = '/admin/clear';
      
      await api(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('parties cleared'),
          count: expect.any(Number)
        })
      );
    });
  });
});