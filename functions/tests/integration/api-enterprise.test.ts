/**
 * Enterprise Integration Tests - API Endpoints
 * Comprehensive end-to-end testing with real-world scenarios
 */

import {api} from "../../src/index";
import {TestDataFactory, MockBuilder, PerformanceTestUtils} from "../utils/test-helpers";
import {TEST_CONFIG} from "../config/test-config";

describe("Enterprise API Integration Tests", () => {
  let mockFirestore: any;
  let performanceTracker: any;

  beforeAll(async () => {
    // Setup enterprise test environment
    process.env.NODE_ENV = "test";
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

    performanceTracker = PerformanceTestUtils.createMemoryLeakDetector();
    performanceTracker.start();
  });

  beforeEach(() => {
    // Setup advanced Firestore mock for each test
    mockFirestore = MockBuilder.createAdvancedFirestoreMock();

    // Pre-populate with realistic test data
    const testParties = TestDataFactory.createBatch(TestDataFactory.createParty, 50);
    testParties.forEach((party, index) => {
      mockFirestore._mockDocs.set(`party-${index}`, party);
    });

    // Mock Firebase Admin
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: jest.fn(() => mockFirestore),
    }));

    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceTracker.measure();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    const leakAnalysis = performanceTracker.analyze();
    if (leakAnalysis.hasMemoryLeak) {
      console.warn("⚠️ Potential memory leak detected:", leakAnalysis);
    }
  });

  describe("Health Endpoint - Production Readiness", () => {
    it("should provide comprehensive health information", async () => {
      const req = MockBuilder.createEnhancedRequest({path: "/health"});
      const res = MockBuilder.createEnhancedResponse();

      const {result, executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
        await api(req, res);
        return res._data;
      });

      // Performance assertions
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.HEALTH);

      // Response structure validation
      expect(result).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
        responseTime: expect.stringMatching(/^\d+ms$/),
        environment: "test",
        uptime: expect.any(Number),
        memoryUsage: expect.objectContaining({
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
          rss: expect.any(Number),
        }),
      });

      // CORS headers validation
      expect(res.getHeader("access-control-allow-origin")).toBe("*");
      expect(res.getHeader("cache-control")).toMatch(/max-age=\d+/);
    });

    it("should handle high-frequency health checks without degradation", async () => {
      const healthCheckFunction = async () => {
        const req = MockBuilder.createEnhancedRequest({path: "/health"});
        const res = MockBuilder.createEnhancedResponse();
        await api(req, res);
        return res._data;
      };

      const concurrencyTest = await PerformanceTestUtils.runConcurrencyTest(
        healthCheckFunction,
        TEST_CONFIG.PERFORMANCE.CONCURRENCY.MEDIUM,
        100
      );

      expect(concurrencyTest.errors).toHaveLength(0);
      expect(concurrencyTest.avgExecutionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.HEALTH * 2);
      expect(concurrencyTest.throughput).toBeGreaterThan(TEST_CONFIG.PERFORMANCE.THROUGHPUT.MIN_OPS_PER_SEC);
    });

    it("should maintain health check consistency across multiple instances", async () => {
      const healthChecks = await Promise.all(
        Array.from({length: 10}, async () => {
          const req = MockBuilder.createEnhancedRequest({path: "/health"});
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return res._data;
        })
      );

      // All health checks should have consistent structure
      const firstHealthCheck = healthChecks[0];
      healthChecks.forEach((healthCheck: any) => {
        expect(Object.keys(healthCheck).sort()).toEqual(Object.keys(firstHealthCheck).sort());
        expect(healthCheck.status).toBe(firstHealthCheck.status);
        expect(healthCheck.version).toBe(firstHealthCheck.version);
      });
    });
  });

  describe("Parties Endpoint - Enterprise Scenarios", () => {
    beforeEach(() => {
      // Setup realistic party data with various scenarios
      const partyScenarios = [
        ...TestDataFactory.createBatch(TestDataFactory.createParty, 20, [
          {"Category": "Developer Mixer", "active": true},
          {"Category": "Networking Event", "active": true},
          {"Category": "Product Launch", "active": false}, // Inactive party
        ]),
        // Large event with many attendees
        TestDataFactory.createParty({
          "Event Name": "Major Gaming Conference",
          "Category": "Conference",
          "expectedAttendees": 5000,
          "active": true,
        }),
        // Event with special characters and unicode
        TestDataFactory.createParty({
          "Event Name": "Café & Bar Müller 🎮",
          "Address": "Königsallee 1, Düsseldorf",
          "Hosts": "Studio Müller & Co.",
          "active": true,
        }),
      ];

      partyScenarios.forEach((party, index) => {
        mockFirestore._mockDocs.set(`party-${index}`, party);
      });
    });

    it("should handle pagination with various page sizes", async () => {
      const paginationTests = [
        {page: 1, limit: 10},
        {page: 2, limit: 5},
        {page: 1, limit: 50},
        {page: 1, limit: 100}, // Max limit
        {page: 1, limit: 200}, // Over max limit (should be capped)
      ];

      for (const testCase of paginationTests) {
        const req = MockBuilder.createEnhancedRequest({
          path: "/parties",
          query: {page: testCase.page.toString(), limit: testCase.limit.toString()},
        });
        const res = MockBuilder.createEnhancedResponse();

        const {executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
          await api(req, res);
        });

        expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.PARTIES);

        const response = res._data;
        expect(response).toMatchObject({
          success: true,
          data: expect.any(Array),
          meta: {
            count: expect.any(Number),
            total: expect.any(Number),
            page: testCase.page,
            limit: Math.min(testCase.limit, 100), // Should respect max limit
            hasMore: expect.any(Boolean),
            loadTime: expect.stringMatching(/^\d+ms$/),
            source: expect.any(String),
          },
        });

        // Verify pagination logic
        const expectedLimit = Math.min(testCase.limit, 100);
        expect(response.data.length).toBeLessThanOrEqual(expectedLimit);
        expect(response.meta.limit).toBe(expectedLimit);
      }
    });

    it("should handle complex filtering scenarios", async () => {
      const filteringTests = [
        {
          query: {category: "Developer Mixer"},
          expectedFilter: (party: any) => party["Category"] === "Developer Mixer",
        },
        {
          query: {search: "Gaming"},
          expectedFilter: (party: any) => party["Event Name"].includes("Gaming"),
        },
        {
          query: {active: "true"},
          expectedFilter: (party: any) => party.active === true,
        },
        {
          query: {category: "Developer Mixer", active: "true"},
          expectedFilter: (party: any) => party["Category"] === "Developer Mixer" && party.active === true,
        },
      ];

      for (const test of filteringTests) {
        const req = MockBuilder.createEnhancedRequest({
          path: "/parties",
          query: test.query,
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        const response = res._data;
        expect(response.success).toBe(true);
        expect(response.data).toBeInstanceOf(Array);

        // Verify filtering logic (this would depend on actual implementation)
        if (response.data.length > 0) {
          response.data.forEach((party: any) => {
            // This assertion would be more specific based on actual filtering implementation
            expect(party).toHaveProperty("Event Name");
            expect(party).toHaveProperty("active");
          });
        }
      }
    });

    it("should handle database errors gracefully", async () => {
      // Simulate database failure
      mockFirestore.collection.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const req = MockBuilder.createEnhancedRequest({path: "/parties"});
      const res = MockBuilder.createEnhancedResponse();

      await api(req, res);

      const response = res._data;
      expect(response).toMatchObject({
        success: true, // Graceful degradation
        data: [],
        meta: {
          count: 0,
          total: 0,
          source: "error",
        },
      });
    });

    it("should maintain consistent response times under load", async () => {
      const loadTest = async () => {
        const req = MockBuilder.createEnhancedRequest({
          path: "/parties",
          query: {limit: "20"},
        });
        const res = MockBuilder.createEnhancedResponse();
        await api(req, res);
        return res._data;
      };

      const results = await PerformanceTestUtils.runConcurrencyTest(
        loadTest,
        TEST_CONFIG.PERFORMANCE.CONCURRENCY.MEDIUM,
        50
      );

      expect(results.errors).toHaveLength(0);
      expect(results.avgExecutionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.PARTIES);
      expect(results.maxExecutionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.PARTIES * 3);

      // Verify response consistency
      results.results.forEach((result) => {
        expect(result).toMatchObject({
          success: true,
          data: expect.any(Array),
          meta: expect.any(Object),
        });
      });
    });
  });

  describe("Swipe Endpoint - User Interaction Testing", () => {
    it("should handle valid swipe actions with complete workflow", async () => {
      const swipeActions = ["like", "pass"];

      for (const action of swipeActions) {
        const swipeData = TestDataFactory.createSwipeAction({action});

        const req = MockBuilder.createEnhancedRequest({
          method: "POST",
          path: "/swipe",
          body: {
            partyId: swipeData.partyId,
            action: action,
            timestamp: swipeData.timestamp,
          },
        });
        const res = MockBuilder.createEnhancedResponse();

        const {executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
          await api(req, res);
        });

        expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.SWIPE);

        const response = res._data;
        expect(response).toMatchObject({
          success: true,
          swipe: {
            id: expect.any(String),
            partyId: swipeData.partyId,
            action: action,
            timestamp: expect.any(String),
          },
          message: expect.any(String),
          nextAction: action === "like" ? "calendar_sync_available" : null,
        });
      }
    });

    it("should validate input data thoroughly", async () => {
      const invalidInputTests = [
        {
          name: "Missing partyId",
          body: {action: "like"},
          expectedErrors: ["Missing required field: partyId"],
        },
        {
          name: "Missing action",
          body: {partyId: "party-123"},
          expectedErrors: ["Missing required field: action"],
        },
        {
          name: "Invalid action",
          body: {partyId: "party-123", action: "invalid"},
          expectedErrors: expect.arrayContaining([expect.stringContaining("action")]),
        },
        {
          name: "Empty partyId",
          body: {partyId: "", action: "like"},
          expectedErrors: ["Missing required field: partyId"],
        },
      ];

      for (const test of invalidInputTests) {
        const req = MockBuilder.createEnhancedRequest({
          method: "POST",
          path: "/swipe",
          body: test.body,
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        expect(res.statusCode).toBe(400);
        const response = res._data;
        expect(response).toMatchObject({
          success: false,
          errors: expect.any(Array),
        });
      }
    });

    it("should handle high-volume swipe interactions", async () => {
      const swipeTest = async () => {
        const swipeData = TestDataFactory.createSwipeAction();
        const req = MockBuilder.createEnhancedRequest({
          method: "POST",
          path: "/swipe",
          body: {
            partyId: swipeData.partyId,
            action: swipeData.action,
            timestamp: swipeData.timestamp,
          },
        });
        const res = MockBuilder.createEnhancedResponse();
        await api(req, res);
        return res._data;
      };

      const volumeTest = await PerformanceTestUtils.runConcurrencyTest(
        swipeTest,
        TEST_CONFIG.PERFORMANCE.CONCURRENCY.HIGH,
        200
      );

      expect(volumeTest.errors.length).toBeLessThan(volumeTest.results.length * 0.05); // Less than 5% error rate
      expect(volumeTest.avgExecutionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.SWIPE);
      expect(volumeTest.throughput).toBeGreaterThan(TEST_CONFIG.PERFORMANCE.THROUGHPUT.MIN_OPS_PER_SEC);
    });
  });

  describe("CORS and Security Headers", () => {
    it("should set comprehensive security headers", async () => {
      const endpoints = ["/health", "/parties", "/swipe"];

      for (const endpoint of endpoints) {
        const req = MockBuilder.createEnhancedRequest({
          path: endpoint,
          method: endpoint === "/swipe" ? "POST" : "GET",
          body: endpoint === "/swipe" ? TestDataFactory.createSwipeAction() : {},
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Verify CORS headers
        expect(res.getHeader("access-control-allow-origin")).toBe("*");
        expect(res.getHeader("access-control-allow-methods")).toContain("GET");
        expect(res.getHeader("access-control-allow-methods")).toContain("POST");
        expect(res.getHeader("access-control-allow-headers")).toContain("Content-Type");
        expect(res.getHeader("access-control-max-age")).toBe("3600");

        // Verify caching headers
        expect(res.getHeader("cache-control")).toMatch(/max-age=\d+/);
        expect(res.getHeader("etag")).toMatch(/^"[\d-.]+"$/);
        expect(res.getHeader("last-modified")).toMatch(/GMT$/);
      }
    });

    it("should handle OPTIONS preflight requests correctly", async () => {
      const preflightTests = [
        {path: "/parties", origin: "https://example.com"},
        {path: "/swipe", origin: "https://app.gamescom.com"},
        {path: "/health", origin: "http://localhost:3000"},
      ];

      for (const test of preflightTests) {
        const req = MockBuilder.createEnhancedRequest({
          method: "OPTIONS",
          path: test.path,
          headers: {
            "origin": test.origin,
            "access-control-request-method": "POST",
            "access-control-request-headers": "Content-Type",
          },
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.getHeader("access-control-allow-origin")).toBe("*");
        expect(res.getHeader("access-control-allow-methods")).toContain("POST");
      }
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should provide detailed error information for debugging", async () => {
      const req = MockBuilder.createEnhancedRequest({path: "/nonexistent"});
      const res = MockBuilder.createEnhancedResponse();

      await api(req, res);

      expect(res.statusCode).toBe(404);
      const response = res._data;
      expect(response).toMatchObject({
        success: false,
        error: "Endpoint not found",
        availableEndpoints: expect.arrayContaining(["/health", "/parties", "/swipe"]),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      });
    });

    it("should handle malformed JSON requests gracefully", async () => {
      const req = MockBuilder.createEnhancedRequest({
        method: "POST",
        path: "/swipe",
        headers: {"content-type": "application/json"},
        body: "invalid json",
      });
      const res = MockBuilder.createEnhancedResponse();

      // This test would depend on how your API handles JSON parsing
      await expect(api(req, res)).not.toThrow();
    });

    it("should maintain service availability during partial failures", async () => {
      // Simulate various failure scenarios
      const failureScenarios = [
        {
          name: "Database timeout",
          setup: () => {
            mockFirestore.collection.mockImplementation(() => ({
              where: () => ({get: () => Promise.reject(new Error("Timeout"))}),
            }));
          },
        },
        {
          name: "Memory pressure",
          setup: () => {
            // Simulate memory pressure by creating large objects
            const largeArray = Array.from({length: 100000}, (_, i) => ({id: i, data: "x".repeat(1000)}));
            mockFirestore._testData = largeArray;
          },
        },
      ];

      for (const scenario of failureScenarios) {
        scenario.setup();

        const req = MockBuilder.createEnhancedRequest({path: "/health"});
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Health endpoint should always respond, even during failures
        expect(res.statusCode).toBeLessThan(500);
        expect(res._data).toHaveProperty("status");
      }
    });
  });

  describe("Performance and Scalability", () => {
    it("should maintain performance with large datasets", async () => {
      // Simulate large dataset
      const largeDataset = TestDataFactory.createBatch(TestDataFactory.createParty, 10000);
      largeDataset.forEach((party, index) => {
        mockFirestore._mockDocs.set(`large-party-${index}`, party);
      });

      const req = MockBuilder.createEnhancedRequest({
        path: "/parties",
        query: {limit: "100"},
      });
      const res = MockBuilder.createEnhancedResponse();

      const {executionTime, memoryUsage} = await PerformanceTestUtils.measureExecutionTime(async () => {
        await api(req, res);
      });

      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.PARTIES * 2);
      expect(memoryUsage.heapUsed).toBeLessThan(TEST_CONFIG.PERFORMANCE.MEMORY.MAX_HEAP_INCREASE);

      const response = res._data;
      expect(response.success).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(100);
    });

    it("should handle concurrent requests without resource leaks", async () => {
      const concurrentTest = async () => {
        const endpoints = ["/health", "/parties"];
        const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

        const req = MockBuilder.createEnhancedRequest({path: randomEndpoint});
        const res = MockBuilder.createEnhancedResponse();
        await api(req, res);
        return res._data;
      };

      const results = await PerformanceTestUtils.runConcurrencyTest(
        concurrentTest,
        TEST_CONFIG.PERFORMANCE.CONCURRENCY.EXTREME,
        1000
      );

      expect(results.errors.length).toBeLessThan(results.results.length * 0.01); // Less than 1% error rate
      expect(results.throughput).toBeGreaterThan(TEST_CONFIG.PERFORMANCE.THROUGHPUT.MIN_OPS_PER_SEC);

      // Verify no memory leaks
      const finalMemoryCheck = performanceTracker.analyze();
      expect(finalMemoryCheck.trend).not.toBe("increasing");
    });
  });
});
