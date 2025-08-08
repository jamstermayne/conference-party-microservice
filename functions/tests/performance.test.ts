import { api } from '../src/index';
import { createMockRequest, createMockResponse } from './setup';

describe('Performance Tests', () => {
  const PERFORMANCE_THRESHOLDS = {
    health: 50, // ms
    parties: 200, // ms
    swipe: 100, // ms
    sync: 5000 // ms
  };

  const measureExecutionTime = async (fn: Function): Promise<number> => {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  };

  describe('Response Time Benchmarks', () => {
    test('health endpoint should respond within threshold', async () => {
      const mockReq = createMockRequest({ path: '/health' });
      const mockRes = createMockResponse();

      const executionTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      console.log(`Health endpoint: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.health);
    });

    test('parties endpoint should respond within threshold', async () => {
      const mockReq = createMockRequest({ 
        path: '/parties',
        query: { limit: '10' }
      });
      const mockRes = createMockResponse();

      const executionTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      console.log(`Parties endpoint: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.parties);
    });

    test('swipe endpoint should respond within threshold', async () => {
      const mockReq = createMockRequest({ 
        method: 'POST',
        path: '/swipe',
        body: { partyId: 'test-1', action: 'like' }
      });
      const mockRes = createMockResponse();

      const executionTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      console.log(`Swipe endpoint: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.swipe);
    });

    test('sync endpoint should respond within threshold', async () => {
      const mockReq = createMockRequest({ path: '/sync' });
      const mockRes = createMockResponse();

      const executionTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      console.log(`Sync endpoint: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.sync);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 100 requests to simulate load
      const requests = Array.from({ length: 100 }, () => {
        return async () => {
          const mockReq = createMockRequest({ path: '/health' });
          const mockRes = createMockResponse();
          await api(mockReq, mockRes);
        };
      });

      await Promise.all(requests.map(req => req()));
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      console.log(`Memory increase after 100 requests: ${memoryIncreaseMB.toFixed(2)}MB`);
      
      // Memory increase should be less than 50MB for 100 requests
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Concurrent Request Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        return async () => {
          const mockReq = createMockRequest({ 
            path: '/parties',
            query: { page: String(i + 1), limit: '5' }
          });
          const mockRes = createMockResponse();
          return measureExecutionTime(async () => {
            await api(mockReq, mockRes);
          });
        };
      });

      const results = await Promise.all(requests.map(req => req()));
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      const maxTime = Math.max(...results);

      console.log(`Concurrent requests - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

      // Average time should be reasonable for concurrent requests
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.parties);
      expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.parties * 2);
    });
  });

  describe('Large Dataset Performance', () => {
    test('should handle large party datasets efficiently', async () => {
      // Mock large dataset
      const { getFirestore } = require('firebase-admin/firestore');
      const mockLargeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `party-${i}`,
        data: () => ({
          'Event Name': `Party ${i}`,
          'Date': 'Wed Aug 20',
          'Start Time': '19:00',
          'Address': 'Test Location',
          active: true,
          source: 'test'
        })
      }));

      getFirestore.mockReturnValue({
        collection: jest.fn(() => ({
          where: jest.fn(() => ({
            get: jest.fn(() => ({
              docs: mockLargeDataset
            }))
          }))
        }))
      });

      const mockReq = createMockRequest({ 
        path: '/parties',
        query: { limit: '100' }
      });
      const mockRes = createMockResponse();

      const executionTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      console.log(`Large dataset (1000 parties) processing: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(500); // Should handle 1000 parties in under 500ms
    });
  });

  describe('Cache Performance', () => {
    test('should benefit from caching on repeated requests', async () => {
      const mockReq = createMockRequest({ path: '/sync' });
      
      // First request (cache miss)
      const mockRes1 = createMockResponse();
      const firstRequestTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes1);
      });

      // Second request (should benefit from cache)
      const mockRes2 = createMockResponse();
      const secondRequestTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes2);
      });

      console.log(`First request: ${firstRequestTime.toFixed(2)}ms, Second request: ${secondRequestTime.toFixed(2)}ms`);
      
      // Second request should be faster due to caching
      // Note: In actual implementation, this would be more pronounced
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime);
    });
  });

  describe('Error Path Performance', () => {
    test('should handle errors efficiently without performance degradation', async () => {
      const mockReq = createMockRequest({ path: '/unknown' });
      const mockRes = createMockResponse();

      const executionTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      console.log(`Error path (404): ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(50); // Error responses should be very fast
    });

    test('should handle validation errors quickly', async () => {
      const mockReq = createMockRequest({ 
        method: 'POST',
        path: '/swipe',
        body: {} // Invalid body
      });
      const mockRes = createMockResponse();

      const executionTime = await measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      console.log(`Validation error: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(25); // Validation should be very fast
    });
  });
});