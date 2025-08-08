/**
 * Enterprise Unit Tests - Utility Functions
 * Comprehensive testing for all utility functions with edge cases
 */

const {TestDataFactory, PerformanceTestUtils} = require("../utils/test-helpers");

// Mock the modules before importing the functions to test
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  applicationDefault: jest.fn(),
  cert: jest.fn(),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
}));

jest.mock("google-auth-library", () => ({
  GoogleAuth: jest.fn(),
}));

describe("Enterprise Unit Tests - Utility Functions", () => {
  describe("Performance Testing Utilities", () => {
    it("should measure execution time accurately", async () => {
      const testFunction = async () => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      };

      const {result, executionTime} = await PerformanceTestUtils.measureExecutionTime(testFunction);

      expect(executionTime).toBeGreaterThan(90); // Allow some variance
      expect(executionTime).toBeLessThan(150);
      expect(result).toBeUndefined(); // Promise resolves with undefined
    });

    it("should handle execution time measurement for functions with return values", async () => {
      const testValue = {test: "data", timestamp: Date.now()};
      const testFunction = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return testValue;
      };

      const {result, executionTime} = await PerformanceTestUtils.measureExecutionTime(testFunction);

      expect(executionTime).toBeGreaterThan(40);
      expect(executionTime).toBeLessThan(100);
      expect(result).toEqual(testValue);
    });

    it("should run concurrency tests with proper error handling", async () => {
      let callCount = 0;
      const testFunction = async () => {
        callCount++;
        if (callCount > 5) {
          throw new Error("Simulated failure");
        }
        return {success: true, callNumber: callCount};
      };

      const results = await PerformanceTestUtils.runConcurrencyTest(
        testFunction,
        10, // 10 concurrent requests
        20 // 20 total requests
      );

      expect(results.results.length + results.errors.length).toBe(20);
      expect(results.errors.length).toBeGreaterThan(0); // Some should fail
      expect(results.results.length).toBeGreaterThan(0); // Some should succeed
      expect(results.avgExecutionTime).toBeGreaterThan(0);
      expect(results.minExecutionTime).toBeGreaterThanOrEqual(0);
      expect(results.maxExecutionTime).toBeGreaterThanOrEqual(results.minExecutionTime);
      expect(typeof results.throughput).toBe("number");
    });

    it("should calculate throughput correctly", async () => {
      const fastFunction = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "success";
      };

      const results = await PerformanceTestUtils.runConcurrencyTest(
        fastFunction,
        5, // 5 concurrent
        25 // 25 total requests
      );

      expect(results.throughput).toBeGreaterThan(0);
      expect(results.errors).toHaveLength(0);
      expect(results.results).toHaveLength(25);
    });
  });

  describe("Test Data Factory", () => {
    it("should create party data with default values", () => {
      const party = TestDataFactory.createParty();

      expect(party).toHaveProperty("id");
      expect(party).toHaveProperty("Event Name");
      expect(party).toHaveProperty("Date");
      expect(party).toHaveProperty("Start Time");
      expect(party).toHaveProperty("Address");
      expect(party).toHaveProperty("active", true);
      expect(party).toHaveProperty("source");
      expect(party).toHaveProperty("uploadedAt");
      expect(party).toHaveProperty("geocoded");

      expect(party.geocoded).toHaveProperty("lat");
      expect(party.geocoded).toHaveProperty("lng");
      expect(party.geocoded).toHaveProperty("confidence");
    });

    it("should create party data with custom overrides", () => {
      const customData = {
        "Event Name": "Custom Test Party",
        "Category": "Custom Category",
        "active": false,
        "customField": "custom value",
      };

      const party = TestDataFactory.createParty(customData);

      expect(party["Event Name"]).toBe("Custom Test Party");
      expect(party["Category"]).toBe("Custom Category");
      expect(party.active).toBe(false);
      expect(party.customField).toBe("custom value");

      // Should still have default values for non-overridden fields
      expect(party).toHaveProperty("Date");
      expect(party).toHaveProperty("Address");
    });

    it("should create UGC events with proper structure", () => {
      const ugcEvent = TestDataFactory.createUGCEvent();

      expect(ugcEvent).toHaveProperty("id");
      expect(ugcEvent).toHaveProperty("title");
      expect(ugcEvent).toHaveProperty("description");
      expect(ugcEvent).toHaveProperty("venue");
      expect(ugcEvent).toHaveProperty("date");
      expect(ugcEvent).toHaveProperty("startTime");
      expect(ugcEvent).toHaveProperty("endTime");
      expect(ugcEvent).toHaveProperty("category");
      expect(ugcEvent).toHaveProperty("isPublic");
      expect(ugcEvent).toHaveProperty("maxAttendees");
      expect(ugcEvent).toHaveProperty("currentAttendees");
      expect(ugcEvent).toHaveProperty("tags");
      expect(ugcEvent.tags).toBeInstanceOf(Array);
    });

    it("should create swipe actions with proper structure", () => {
      const swipeAction = TestDataFactory.createSwipeAction();

      expect(swipeAction).toHaveProperty("partyId");
      expect(swipeAction).toHaveProperty("action");
      expect(["like", "pass"]).toContain(swipeAction.action);
      expect(swipeAction).toHaveProperty("timestamp");
      expect(swipeAction).toHaveProperty("metadata");
    });

    it("should create batches of test data", () => {
      const batchSize = 10;
      const parties = TestDataFactory.createBatch(TestDataFactory.createParty, batchSize);

      expect(parties).toHaveLength(batchSize);
      expect(parties).toBeInstanceOf(Array);

      parties.forEach((party) => {
        expect(party).toHaveProperty("Event Name");
        expect(party).toHaveProperty("id");
        expect(party.active).toBe(true);
      });

      // Each party should have a unique ID
      const ids = parties.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(batchSize);
    });

    it("should create large batches efficiently", async () => {
      const largeBatchSize = 1000;

      const {result: largeBatch, executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
        return TestDataFactory.createBatch(TestDataFactory.createParty, largeBatchSize);
      });

      expect(largeBatch).toHaveLength(largeBatchSize);
      expect(executionTime).toBeLessThan(1000); // Should create 1000 items in under 1 second

      // Verify data quality in large batch
      const sampleParty = largeBatch[Math.floor(Math.random() * largeBatchSize)];
      expect(sampleParty).toHaveProperty("Event Name");
      expect(sampleParty).toHaveProperty("geocoded");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty or null inputs gracefully", () => {
      const emptyParty = TestDataFactory.createParty({});
      expect(emptyParty).toHaveProperty("Event Name");

      const nullOverrideParty = TestDataFactory.createParty({"Event Name": null});
      expect(nullOverrideParty["Event Name"]).toBeNull();
    });

    it("should handle performance measurement of synchronous functions", async () => {
      const syncFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const {result, executionTime} = await PerformanceTestUtils.measureExecutionTime(syncFunction);

      expect(result).toBe(499500); // Sum of 0 to 999
      expect(executionTime).toBeGreaterThanOrEqual(0);
      expect(executionTime).toBeLessThan(100); // Should be very fast
    });

    it("should handle performance measurement of functions that throw errors", async () => {
      const errorFunction = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error("Test error");
      };

      await expect(PerformanceTestUtils.measureExecutionTime(errorFunction))
        .rejects.toThrow("Test error");
    });

    it("should handle zero batch size gracefully", () => {
      const emptyBatch = TestDataFactory.createBatch(TestDataFactory.createParty, 0);
      expect(emptyBatch).toHaveLength(0);
      expect(emptyBatch).toBeInstanceOf(Array);
    });
  });

  describe("Data Validation and Quality", () => {
    it("should generate valid timestamps", () => {
      const party = TestDataFactory.createParty();
      const timestamp = new Date(party.uploadedAt);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000); // Generated within last second
    });

    it("should generate realistic geocoding data", () => {
      const party = TestDataFactory.createParty();

      expect(party.geocoded.lat).toBeGreaterThan(-90);
      expect(party.geocoded.lat).toBeLessThan(90);
      expect(party.geocoded.lng).toBeGreaterThan(-180);
      expect(party.geocoded.lng).toBeLessThan(180);
      expect(party.geocoded.confidence).toBeGreaterThan(0);
      expect(party.geocoded.confidence).toBeLessThanOrEqual(1);
    });

    it("should generate unique IDs across multiple calls", () => {
      const ids = new Set();
      const numParties = 100;

      for (let i = 0; i < numParties; i++) {
        const party = TestDataFactory.createParty();
        expect(ids.has(party.id)).toBe(false);
        ids.add(party.id);
      }

      expect(ids.size).toBe(numParties);
    });

    it("should maintain data consistency in concurrent creation", async () => {
      const concurrentCreation = async () => {
        return TestDataFactory.createParty();
      };

      const results = await PerformanceTestUtils.runConcurrencyTest(
        concurrentCreation,
        10, // 10 concurrent
        50 // 50 total
      );

      expect(results.errors).toHaveLength(0);
      expect(results.results).toHaveLength(50);

      // Verify all results are valid parties
      results.results.forEach((party) => {
        expect(party).toHaveProperty("Event Name");
        expect(party).toHaveProperty("id");
        expect(typeof party.id).toBe("string");
      });

      // Verify ID uniqueness
      const ids = results.results.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(50);
    });
  });

  describe("Performance Benchmarks", () => {
    it("should meet performance benchmarks for batch creation", async () => {
      const benchmarkSize = 10000;
      const maxAllowedTime = 2000; // 2 seconds

      const {result: batch, executionTime} = await PerformanceTestUtils.measureExecutionTime(async () => {
        return TestDataFactory.createBatch(TestDataFactory.createParty, benchmarkSize);
      });

      expect(executionTime).toBeLessThan(maxAllowedTime);
      expect(batch).toHaveLength(benchmarkSize);

      // Calculate items per second
      const itemsPerSecond = benchmarkSize / (executionTime / 1000);
      expect(itemsPerSecond).toBeGreaterThan(1000); // At least 1000 items per second
    });

    it("should handle memory efficiently with large datasets", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const largeDataset = TestDataFactory.createBatch(TestDataFactory.createParty, 50000);

      const afterCreationMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = afterCreationMemory - initialMemory;

      expect(largeDataset).toHaveLength(50000);

      // Memory increase should be reasonable (less than 100MB for 50k items)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);

      // Clear the large dataset
      largeDataset.length = 0;
    });
  });
});
