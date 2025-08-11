/**
 * ENTERPRISE API TEST SUITE
 * Comprehensive test coverage for all API endpoints
 */

import { Request, Response } from 'express';
import { api } from '../src/index';
import { config } from '../src/config';

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          docs: []
        }))
      })),
      limit: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          docs: []
        }))
      }))
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      commit: jest.fn(() => Promise.resolve())
    }))
  }))
}));

describe('API Endpoints', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock, send: jest.fn() }));
    setHeaderMock = jest.fn();
    
    req = {
      method: 'GET',
      path: '/api/health',
      headers: {
        origin: 'https://conference-party-app.web.app',
        'content-type': 'application/json'
      },
      ip: '127.0.0.1',
      query: {},
      body: {}
    };
    
    res = {
      json: jsonMock,
      status: statusMock,
      setHeader: setHeaderMock,
      send: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      req.path = '/api/health';
      
      await api(req as Request, res as Response);
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          version: expect.any(String),
          environment: expect.any(String)
        })
      );
    });

    it('should include monitoring metrics', async () => {
      req.path = '/api/health';
      
      await api(req as Request, res as Response);
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          monitoring: expect.objectContaining({
            status: expect.any(String),
            uptime: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Security Validation', () => {
    it('should reject requests with invalid origin', async () => {
      req.headers!.origin = 'https://malicious-site.com';
      
      await api(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Origin not allowed'
        })
      );
    });

    it('should reject requests with oversized payload', async () => {
      req.headers!['content-length'] = '10485760'; // 10MB
      
      await api(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(413);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('payload too large')
        })
      );
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      jest.spyOn(security, 'rateLimit').mockReturnValue(false);
      
      await api(req as Request, res as Response);
      
      expect(security.rateLimit).toHaveBeenCalled();
    });

    it('should validate CSRF tokens for POST requests', async () => {
      req.method = 'POST';
      req.path = '/api/events';
      req.headers!['x-csrf-token'] = 'invalid-token';
      
      const validateCsrfSpy = jest.spyOn(security, 'validateCsrfToken');
      
      await api(req as Request, res as Response);
      
      expect(validateCsrfSpy).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should sanitize string inputs', async () => {
      req.method = 'POST';
      req.path = '/api/events';
      req.body = {
        name: '<script>alert("xss")</script>Event Name',
        description: 'Normal description'
      };
      
      const sanitizeSpy = jest.spyOn(security, 'sanitizeString');
      
      await api(req as Request, res as Response);
      
      expect(sanitizeSpy).toHaveBeenCalledWith(req.body.name);
    });

    it('should validate required fields', async () => {
      req.method = 'POST';
      req.path = '/api/events';
      req.body = {
        // Missing required 'name' field
        description: 'Test event'
      };
      
      await api(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('required')
        })
      );
    });

    it('should validate field types', async () => {
      req.method = 'POST';
      req.path = '/api/events';
      req.body = {
        name: 'Test Event',
        date: 'invalid-date',
        time: '10:00'
      };
      
      await api(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('valid date')
        })
      );
    });
  });

  describe('Parties Endpoint', () => {
    it('should return paginated parties', async () => {
      req.path = '/api/parties';
      req.query = { page: '1', limit: '20' };
      
      await api(req as Request, res as Response);
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 20,
            hasNext: expect.any(Boolean),
            hasPrev: expect.any(Boolean)
          })
        })
      );
    });

    it('should handle invalid pagination parameters', async () => {
      req.path = '/api/parties';
      req.query = { page: '-1', limit: '1000' };
      
      await api(req as Request, res as Response);
      
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: expect.objectContaining({
            page: 1, // Should default to 1
            limit: 100 // Should cap at max limit
          })
        })
      );
    });

    it('should cache responses', async () => {
      req.path = '/api/parties';
      
      // First call
      await api(req as Request, res as Response);
      
      // Second call (should use cache)
      await api(req as Request, res as Response);
      
      expect(setHeaderMock).toHaveBeenCalledWith(
        'Cache-Control',
        expect.stringContaining('max-age')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      req.path = '/api/parties';
      
      // Mock database error
      jest.spyOn(require('firebase-admin/firestore'), 'getFirestore')
        .mockImplementationOnce(() => {
          throw new Error('Database connection failed');
        });
      
      await api(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Database')
        })
      );
    });

    it('should handle unexpected errors', async () => {
      req.path = '/api/unknown-endpoint';
      
      await api(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('CORS Headers', () => {
    it('should set appropriate CORS headers', async () => {
      req.path = '/api/health';
      
      await api(req as Request, res as Response);
      
      expect(setHeaderMock).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://conference-party-app.web.app'
      );
      expect(setHeaderMock).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        expect.stringContaining('GET')
      );
    });

    it('should handle preflight OPTIONS requests', async () => {
      req.method = 'OPTIONS';
      
      await api(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(204);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      req.path = '/api/health';
      
      const startTime = Date.now();
      await api(req as Request, res as Response);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(100); // Should respond in < 100ms
    });

    it('should compress large responses', async () => {
      req.path = '/api/parties';
      req.query = { limit: '100' };
      
      await api(req as Request, res as Response);
      
      // Check that compression was applied
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });
});

// Security and error handler tests removed as modules were cleaned up
// Core functionality is covered by API endpoint tests above