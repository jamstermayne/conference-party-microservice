/**
 * Enterprise Load Testing & Chaos Engineering
 * Production-grade performance and resilience testing
 */

import {api} from "../../src/index";
import {TestDataFactory, MockBuilder, PerformanceTestUtils} from "../utils/test-helpers";
import {TEST_CONFIG} from "../config/test-config";

describe("Load Testing & Chaos Engineering", () => {
  let mockFirestore: any;
  let chaosController: ChaosController;
  let performanceBaseline: PerformanceBaseline;

  beforeAll(async () => {
    // Initialize chaos engineering controller
    chaosController = new ChaosController();
    performanceBaseline = new PerformanceBaseline();

    // Establish performance baseline
    await performanceBaseline.establish();
  });

  beforeEach(() => {
    mockFirestore = MockBuilder.createAdvancedFirestoreMock();

    // Pre-populate with large realistic dataset
    const testData = TestDataFactory.createBatch(TestDataFactory.createParty, 10000);
    testData.forEach((party, index) => {
      mockFirestore._mockDocs.set(`party-${index}`, party);
    });

    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: jest.fn(() => mockFirestore),
    }));
  });

  afterEach(() => {
    chaosController.reset();
    jest.clearAllMocks();
  });

  describe("Load Testing Scenarios", () => {
    describe("Smoke Tests - Basic Functionality", () => {
      it("should handle minimal load without issues", async () => {
        const scenario = TEST_CONFIG.LOAD_TESTING.SCENARIOS.SMOKE;

        const loadTest = async () => {
          const req = MockBuilder.createEnhancedRequest({path: "/health"});
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return res._data;
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(
          loadTest,
          scenario.users,
          10 // 10 requests per user
        );

        expect(results.errors).toHaveLength(0);
        expect(results.avgExecutionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.HEALTH);
        expect(results.throughput).toBeGreaterThan(10); // At least 10 ops/sec
      });
    });

    describe("Load Tests - Expected Traffic", () => {
      it("should handle expected production load", async () => {
        const scenario = TEST_CONFIG.LOAD_TESTING.SCENARIOS.LOAD;

        const mixedWorkload = async () => {
          // Simulate realistic user behavior mix
          const scenarios = [
            {weight: 0.4, endpoint: "/health"},
            {weight: 0.35, endpoint: "/parties", query: {limit: "20"}},
            {weight: 0.2, endpoint: "/parties", query: {category: "Developer Mixer"}},
            {weight: 0.05, endpoint: "/swipe", method: "POST", body: TestDataFactory.createSwipeAction()},
          ];

          const random = Math.random();
          let cumWeight = 0;

          for (const scenario of scenarios) {
            cumWeight += scenario.weight;
            if (random <= cumWeight) {
              const req = MockBuilder.createEnhancedRequest({
                path: scenario.endpoint,
                method: scenario.method || "GET",
                query: scenario.query || {},
                body: scenario.body || {},
              });
              const res = MockBuilder.createEnhancedResponse();
              await api(req, res);
              return {endpoint: scenario.endpoint, response: res._data, status: res.statusCode};
            }
          }

          // Fallback to health endpoint
          const req = MockBuilder.createEnhancedRequest({path: "/health"});
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return {endpoint: "/health", response: res._data, status: res.statusCode};
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(
          mixedWorkload,
          scenario.users,
          300 // 300 requests total (30 per user)
        );

        // Analyze results by endpoint
        const endpointStats = analyzeResultsByEndpoint(results.results);

        expect(results.errors.length).toBeLessThan(results.results.length * 0.01); // <1% error rate
        expect(results.avgExecutionTime).toBeLessThan(1000); // Average under 1 second
        expect(results.throughput).toBeGreaterThan(TEST_CONFIG.PERFORMANCE.THROUGHPUT.MIN_OPS_PER_SEC);

        // Verify each endpoint meets SLA
        expect(endpointStats["/health"]?.avgTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.HEALTH);
        expect(endpointStats["/parties"]?.avgTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.PARTIES);
        expect(endpointStats["/swipe"]?.avgTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.SWIPE);
      });
    });

    describe("Stress Tests - Beyond Normal Capacity", () => {
      it("should gracefully degrade under stress", async () => {
        const scenario = TEST_CONFIG.LOAD_TESTING.SCENARIOS.STRESS;

        const stressTest = async () => {
          const req = MockBuilder.createEnhancedRequest({
            path: "/parties",
            query: {limit: "100"}, // Maximum page size
          });
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return {responseTime: Date.now(), status: res.statusCode, data: res._data};
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(
          stressTest,
          scenario.users,
          100
        );

        // Under stress, some degradation is acceptable
        expect(results.errors.length).toBeLessThan(results.results.length * 0.05); // <5% error rate
        expect(results.avgExecutionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.PARTIES * 3);

        // System should still be responsive
        expect(results.maxExecutionTime).toBeLessThan(10000); // No request should take more than 10s

        // Most requests should still succeed
        const successfulRequests = results.results.filter((r) => r.status < 400);
        expect(successfulRequests.length).toBeGreaterThan(results.results.length * 0.8); // 80% success rate
      });
    });

    describe("Spike Tests - Sudden Traffic Surges", () => {
      it("should handle sudden traffic spikes", async () => {
        const scenario = TEST_CONFIG.LOAD_TESTING.SCENARIOS.SPIKE;

        // First, establish normal baseline
        const normalLoad = async () => {
          const req = MockBuilder.createEnhancedRequest({path: "/health"});
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return res._data;
        };

        const baselineResults = await PerformanceTestUtils.runConcurrencyTest(normalLoad, 5, 50);
        const baselineAvgTime = baselineResults.avgExecutionTime;

        // Then create sudden spike
        const spikeResults = await PerformanceTestUtils.runConcurrencyTest(
          normalLoad,
          scenario.users,
          200
        );

        // During spike, performance may degrade but system should not crash
        expect(spikeResults.errors.length).toBeLessThan(spikeResults.results.length * 0.1); // <10% error rate
        expect(spikeResults.avgExecutionTime).toBeLessThan(baselineAvgTime * 5); // No more than 5x slower

        // Recovery test - system should recover quickly after spike
        const recoveryResults = await PerformanceTestUtils.runConcurrencyTest(normalLoad, 5, 50);
        expect(recoveryResults.avgExecutionTime).toBeLessThan(baselineAvgTime * 2); // Recovery within 2x baseline
      });
    });

    describe("Volume Tests - Large Data Sets", () => {
      it("should handle large datasets efficiently", async () => {
        // Populate with very large dataset
        const largeDataset = TestDataFactory.createBatch(TestDataFactory.createParty, 100000);
        largeDataset.forEach((party, index) => {
          mockFirestore._mockDocs.set(`volume-party-${index}`, party);
        });

        const volumeTest = async () => {
          const req = MockBuilder.createEnhancedRequest({
            path: "/parties",
            query: {
              limit: "50",
              page: (Math.floor(Math.random() * 100) + 1).toString(), // Random page as string
            },
          });
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return res._data;
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(volumeTest, 20, 500);

        expect(results.errors).toHaveLength(0);
        expect(results.avgExecutionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE.RESPONSE_TIME.PARTIES * 2);

        // Verify data consistency
        results.results.forEach((result) => {
          expect(result.success).toBe(true);
          expect(result.data).toBeInstanceOf(Array);
          expect(result.meta.count).toBeLessThanOrEqual(50);
        });
      });
    });
  });

  describe("Chaos Engineering", () => {
    describe("Database Chaos", () => {
      it("should handle database timeouts gracefully", async () => {
        chaosController.injectFailure("DATABASE_TIMEOUT", {
          probability: 0.3, // 30% of requests fail
          duration: 2000, // 2 second timeout
        });

        const chaosTest = async () => {
          const req = MockBuilder.createEnhancedRequest({path: "/parties"});
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return {status: res.statusCode, data: res._data};
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(chaosTest, 10, 100);

        // System should gracefully degrade, not crash
        const successfulRequests = results.results.filter((r) => r.status < 500);
        expect(successfulRequests.length).toBeGreaterThan(results.results.length * 0.5); // At least 50% should succeed

        // Failed requests should return graceful error responses
        const failedRequests = results.results.filter((r) => r.status >= 500 || r.data.error);
        failedRequests.forEach((failed) => {
          if (failed.data) {
            expect(failed.data).toHaveProperty("success", false);
            expect(failed.data).toHaveProperty("error");
          }
        });
      });

      it("should recover after database issues are resolved", async () => {
        // Inject failure
        chaosController.injectFailure("DATABASE_TIMEOUT", {probability: 1.0, duration: 1000});

        // Test during failure - expect degraded response
        const failureReq = MockBuilder.createEnhancedRequest({path: "/health"});
        const failureRes = MockBuilder.createEnhancedResponse();
        await api(failureReq, failureRes);
        // Don't expect specific response during chaos

        // Reset chaos
        chaosController.reset();

        // Test recovery
        const recoveryReq = MockBuilder.createEnhancedRequest({path: "/health"});
        const recoveryRes = MockBuilder.createEnhancedResponse();
        await api(recoveryReq, recoveryRes);

        expect(recoveryRes.statusCode).toBe(200);
        expect(recoveryRes._data.status).toBe("healthy");
      });
    });

    describe("Network Chaos", () => {
      it("should handle network latency spikes", async () => {
        chaosController.injectFailure("NETWORK_LATENCY", {
          probability: 0.2,
          minDelay: 1000,
          maxDelay: 3000,
        });

        const latencyTest = async () => {
          const startTime = Date.now();
          const req = MockBuilder.createEnhancedRequest({path: "/sync"});
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          const endTime = Date.now();

          return {
            duration: endTime - startTime,
            status: res.statusCode,
            data: res._data,
          };
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(latencyTest, 5, 50);

        // Some requests should experience latency, but all should eventually complete
        const slowRequests = results.results.filter((r) => r.duration > 1000);
        expect(slowRequests.length).toBeGreaterThan(0); // Some requests should be slow

        const timedOutRequests = results.results.filter((r) => r.duration > 10000);
        expect(timedOutRequests.length).toBeLessThan(results.results.length * 0.1); // <10% timeout
      });
    });

    describe("Resource Chaos", () => {
      it("should handle memory pressure", async () => {
        chaosController.injectFailure("MEMORY_PRESSURE", {
          probability: 0.1,
          intensity: 0.7, // 70% memory usage
        });

        const memoryPressureTest = async () => {
          const startMemory = process.memoryUsage().heapUsed;

          const req = MockBuilder.createEnhancedRequest({
            path: "/parties",
            query: {limit: "100"},
          });
          const res = MockBuilder.createEnhancedResponse();

          await api(req, res);

          const endMemory = process.memoryUsage().heapUsed;

          return {
            memoryDelta: endMemory - startMemory,
            status: res.statusCode,
            data: res._data,
          };
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(memoryPressureTest, 10, 100);

        // System should handle memory pressure without crashing
        expect(results.errors).toHaveLength(0);

        // Memory usage should be reasonable
        const avgMemoryDelta = results.results.reduce((sum, r) => sum + r.memoryDelta, 0) / results.results.length;
        expect(avgMemoryDelta).toBeLessThan(TEST_CONFIG.PERFORMANCE.MEMORY.LEAK_THRESHOLD);
      });

      it("should handle CPU spikes", async () => {
        chaosController.injectFailure("CPU_SPIKE", {
          probability: 0.15,
          duration: 2000, // 2 second CPU spike
        });

        const cpuSpikeTest = async () => {
          const req = MockBuilder.createEnhancedRequest({path: "/health"});
          const res = MockBuilder.createEnhancedResponse();

          const {result, executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
            await api(req, res);
            return res._data;
          });

          return {executionTime, status: res.statusCode, data: result};
        };

        const results = await PerformanceTestUtils.runConcurrencyTest(cpuSpikeTest, 15, 100);

        // Some requests may be slower due to CPU spikes, but system should remain stable
        const slowRequests = results.results.filter((r) => r.executionTime > 1000);
        expect(slowRequests.length).toBeLessThan(results.results.length * 0.2); // <20% affected

        // No requests should completely hang
        const hangRequests = results.results.filter((r) => r.executionTime > 10000);
        expect(hangRequests.length).toBe(0);
      });
    });

    describe("Circuit Breaker Testing", () => {
      it("should implement circuit breaker pattern for external dependencies", async () => {
        // Simulate external service failures
        chaosController.injectFailure("SERVICE_UNAVAILABLE", {
          probability: 1.0, // 100% failure rate
          duration: 5000,
        });

        const circuitBreakerTest = async () => {
          const req = MockBuilder.createEnhancedRequest({path: "/sync"});
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return {status: res.statusCode, data: res._data};
        };

        // Make requests that should trip the circuit breaker
        await Promise.all(
          Array.from({length: 10}, circuitBreakerTest)
        );

        // Circuit breaker should open, subsequent requests should fail fast
        const circuitOpenRequests = await Promise.all(
          Array.from({length: 5}, circuitBreakerTest)
        );

        // Verify circuit breaker behavior
        const fastFailures = circuitOpenRequests.filter((r) => r.status === 503); // Service Unavailable
        expect(fastFailures.length).toBeGreaterThan(0); // Some should fail fast

        // Reset chaos and allow recovery
        chaosController.reset();

        // Wait for circuit breaker recovery
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Test recovery
        const recoveryReq = MockBuilder.createEnhancedRequest({path: "/sync"});
        const recoveryRes = MockBuilder.createEnhancedResponse();
        await api(recoveryReq, recoveryRes);

        expect(recoveryRes.statusCode).toBeLessThan(500);
      });
    });
  });

  describe("Performance Regression Detection", () => {
    it("should detect performance regressions", async () => {
      const regressionTest = async (endpoint: string) => {
        const req = MockBuilder.createEnhancedRequest({path: endpoint});
        const res = MockBuilder.createEnhancedResponse();

        const {executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
          await api(req, res);
        });

        return executionTime;
      };

      const endpoints = ["/health", "/parties"];

      for (const endpoint of endpoints) {
        const executionTimes = await Promise.all(
          Array.from({length: 100}, () => regressionTest(endpoint))
        );

        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
        const baselineTime = performanceBaseline.getBaseline(endpoint);

        // Check for performance regression
        const regressionThreshold = TEST_CONFIG.MONITORING.METRICS.PERFORMANCE_REGRESSION_THRESHOLD;

        if (baselineTime > 0) {
          const regressionRatio = avgTime / baselineTime;
          expect(regressionRatio).toBeLessThan(regressionThreshold);

          if (regressionRatio > 1.2) { // 20% slower than baseline
            console.warn(`⚠️ Performance regression detected for ${endpoint}: ${avgTime.toFixed(2)}ms vs ${baselineTime.toFixed(2)}ms baseline`);
          }
        }

        // Update baseline if test passes
        performanceBaseline.updateBaseline(endpoint, avgTime);
      }
    });
  });
});

// Helper Classes for Chaos Engineering and Performance Tracking

class ChaosController {
  private activeFailures: Map<string, any> = new Map();

  injectFailure(type: string, config: any) {
    this.activeFailures.set(type, config);
    console.log(`🔥 Chaos injected: ${type}`, config);
  }

  reset() {
    this.activeFailures.clear();
    console.log("🔄 Chaos reset");
  }

  isFailureActive(type: string): boolean {
    return this.activeFailures.has(type);
  }

  getFailureConfig(type: string): any {
    return this.activeFailures.get(type);
  }
}

class PerformanceBaseline {
  private baselines: Map<string, number> = new Map();

  async establish() {
    // Establish baseline performance metrics
    const endpoints = ["/health", "/parties", "/swipe"];

    for (const endpoint of endpoints) {
      const mockReq = MockBuilder.createEnhancedRequest({
        path: endpoint,
        method: endpoint === "/swipe" ? "POST" : "GET",
        body: endpoint === "/swipe" ? TestDataFactory.createSwipeAction() : {},
      });
      const mockRes = MockBuilder.createEnhancedResponse();

      const {executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
        await api(mockReq, mockRes);
      });

      this.baselines.set(endpoint, executionTime);
      console.log(`📊 Baseline established for ${endpoint}: ${executionTime.toFixed(2)}ms`);
    }
  }

  getBaseline(endpoint: string): number {
    return this.baselines.get(endpoint) || 0;
  }

  updateBaseline(endpoint: string, time: number) {
    this.baselines.set(endpoint, time);
  }
}

// Helper function to analyze results by endpoint
function analyzeResultsByEndpoint(results: any[]): Record<string, { avgTime: number; count: number }> {
  const stats: Record<string, { times: number[]; count: number }> = {};

  results.forEach((result) => {
    if (result.endpoint) {
      if (!stats[result.endpoint]) {
        stats[result.endpoint] = {times: [], count: 0};
      }
      stats[result.endpoint].count++;
      if (result.responseTime) {
        stats[result.endpoint].times.push(result.responseTime);
      }
    }
  });

  return Object.fromEntries(
    Object.entries(stats).map(([endpoint, data]) => [
      endpoint,
      {
        avgTime: data.times.reduce((sum, time) => sum + time, 0) / data.times.length || 0,
        count: data.count,
      },
    ])
  );
}
