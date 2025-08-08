/**
 * Enterprise Test Utilities
 * Comprehensive test helpers for production-grade testing
 */

import {Request, Response} from "express";
import {DocumentReference, DocumentSnapshot} from "firebase-admin/firestore";

// Test Data Factories
export class TestDataFactory {
  static createParty(overrides: Partial<any> = {}): any {
    return {
      "id": `party-${Date.now()}-${Math.random()}`,
      "Event Name": "Test Gaming Conference",
      "Date": "Wed Aug 20",
      "Start Time": "19:00",
      "End Time": "23:00",
      "Address": "Cologne Convention Center, Germany",
      "Hosts": "Epic Games",
      "Category": "Developer Mixer",
      "Price": "Free",
      "Focus": "Game Developers",
      "Description": "Join us for an evening of networking and gaming insights.",
      "RSVP Link": "https://example.com/rsvp",
      "Requirements": "Industry ID required",
      "active": true,
      "source": "gamescom-sheets",
      "uploadedAt": new Date().toISOString(),
      "geocoded": {
        lat: 50.9375,
        lng: 6.9603,
        address: "Cologne Convention Center",
        confidence: 0.9,
      },
      ...overrides,
    };
  }

  static createUGCEvent(overrides: Partial<any> = {}): any {
    return {
      id: `ugc-${Date.now()}-${Math.random()}`,
      title: "Community Gaming Meetup",
      description: "Local gaming community gathering",
      venue: "Gaming Lounge Cologne",
      date: "2025-08-21",
      startTime: "18:00",
      endTime: "22:00",
      category: "Community",
      isPublic: true,
      maxAttendees: 50,
      currentAttendees: 0,
      tags: ["gaming", "networking", "community"],
      createdBy: "test-user-123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      ...overrides,
    };
  }

  static createSwipeAction(overrides: Partial<any> = {}): any {
    return {
      id: `swipe-${Date.now()}-${Math.random()}`,
      partyId: "party-123",
      action: "like",
      timestamp: new Date().toISOString(),
      userId: "anonymous",
      sessionId: `session-${Date.now()}`,
      metadata: {
        userAgent: "test-agent",
        platform: "web",
        source: "swipe-ui",
      },
      ...overrides,
    };
  }

  static createUser(overrides: Partial<any> = {}): any {
    return {
      id: `user-${Date.now()}-${Math.random()}`,
      email: "test@example.com",
      displayName: "Test User",
      role: "user",
      preferences: {
        categories: ["Developer Mixer", "Networking"],
        notifications: true,
        location: "Cologne, Germany",
      },
      stats: {
        eventsAttended: 0,
        eventsLiked: 0,
        eventsCreated: 0,
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      ...overrides,
    };
  }

  static createBatch(factory: Function, count: number, overrides: any[] = []): any[] {
    return Array.from({length: count}, (_, index) =>
      factory(overrides[index] || {id: `batch-item-${index}`})
    );
  }
}

// Mock Builders with Advanced Features
export class MockBuilder {
  static createAdvancedFirestoreMock(): any {
    const mockDocs = new Map<string, any>();
    const mockCollections = new Map<string, any>();

    const createMockDoc = (id: string, data: any = {}): DocumentSnapshot => ({
      id,
      exists: Object.keys(data).length > 0,
      data: () => data,
      get: (field: string) => data[field],
      ref: {id, path: `test-collection/${id}`} as DocumentReference,
      createTime: {seconds: Date.now() / 1000, nanoseconds: 0} as any,
      updateTime: {seconds: Date.now() / 1000, nanoseconds: 0} as any,
      readTime: {seconds: Date.now() / 1000, nanoseconds: 0} as any,
    } as DocumentSnapshot);

    const mockQuery: any = {
      where: jest.fn(function(this: any, field: string, op: string, value: any) {
        // Filter documents based on query
        const filteredDocs = Array.from(mockDocs.entries())
          .filter(([id, docData]) => {
            switch (op) {
            case "==": return docData[field] === value;
            case "!=": return docData[field] !== value;
            case ">": return docData[field] > value;
            case ">=": return docData[field] >= value;
            case "<": return docData[field] < value;
            case "<=": return docData[field] <= value;
            case "in": return Array.isArray(value) && value.includes(docData[field]);
            case "array-contains": return Array.isArray(docData[field]) && docData[field].includes(value);
            default: return true;
            }
          })
          .map(([id, docData]) => createMockDoc(id, docData));

        return {
          ...mockQuery,
          _filteredDocs: filteredDocs,
          get: jest.fn(() => Promise.resolve({docs: filteredDocs})),
        };
      }),
      orderBy: jest.fn(function(this: any, field: string, direction: string = "asc") {
        const docs = this._filteredDocs || Array.from(mockDocs.entries()).map(([id, data]) => createMockDoc(id, data));
        const sortedDocs = docs.sort((a: any, b: any) => {
          const aVal = a.data()[field];
          const bVal = b.data()[field];
          if (direction === "desc") return bVal > aVal ? 1 : -1;
          return aVal > bVal ? 1 : -1;
        });
        return {...mockQuery, _filteredDocs: sortedDocs, get: jest.fn(() => Promise.resolve({docs: sortedDocs}))};
      }),
      limit: jest.fn(function(this: any, count: number) {
        const docs = this._filteredDocs || Array.from(mockDocs.entries()).map(([id, data]) => createMockDoc(id, data));
        const limitedDocs = docs.slice(0, count);
        return {...mockQuery, _filteredDocs: limitedDocs, get: jest.fn(() => Promise.resolve({docs: limitedDocs}))};
      }),
      offset: jest.fn(function(this: any, count: number) {
        const docs = this._filteredDocs || Array.from(mockDocs.entries()).map(([id, data]) => createMockDoc(id, data));
        const offsetDocs = docs.slice(count);
        return {...mockQuery, _filteredDocs: offsetDocs, get: jest.fn(() => Promise.resolve({docs: offsetDocs}))};
      }),
      get: jest.fn(() => {
        const allDocs = Array.from(mockDocs.entries()).map(([id, data]) => createMockDoc(id, data));
        return Promise.resolve({docs: allDocs});
      }),
    };

    const mockCollection = {
      doc: jest.fn((id?: string) => {
        const docId = id || `auto-${Date.now()}-${Math.random()}`;
        return {
          id: docId,
          set: jest.fn((data: any) => {
            mockDocs.set(docId, data);
            return Promise.resolve();
          }),
          get: jest.fn(() => {
            const data = mockDocs.get(docId) || {};
            return Promise.resolve(createMockDoc(docId, data));
          }),
          update: jest.fn((data: any) => {
            const existing = mockDocs.get(docId) || {};
            mockDocs.set(docId, {...existing, ...data});
            return Promise.resolve();
          }),
          delete: jest.fn(() => {
            mockDocs.delete(docId);
            return Promise.resolve();
          }),
          ref: {id: docId, path: `test-collection/${docId}`},
        };
      }),
      add: jest.fn((data: any) => {
        const docId = `auto-${Date.now()}-${Math.random()}`;
        mockDocs.set(docId, data);
        return Promise.resolve({id: docId});
      }),
      where: jest.fn(() => mockQuery),
      orderBy: jest.fn(() => mockQuery),
      limit: jest.fn(() => mockQuery),
      offset: jest.fn(() => mockQuery),
      get: jest.fn(() => {
        const allDocs = Array.from(mockDocs.entries()).map(([id, data]) => createMockDoc(id, data));
        return Promise.resolve({docs: allDocs});
      }),
    };

    const mockBatch: any = {
      set: jest.fn((ref: any, data: any) => {
        mockDocs.set(ref.id, data);
        return mockBatch;
      }),
      update: jest.fn((ref: any, data: any) => {
        const existing = mockDocs.get(ref.id) || {};
        mockDocs.set(ref.id, {...existing, ...data});
        return mockBatch;
      }),
      delete: jest.fn((ref: any) => {
        mockDocs.delete(ref.id);
        return mockBatch;
      }),
      commit: jest.fn(() => Promise.resolve()),
    };

    return {
      collection: jest.fn((name: string) => {
        mockCollections.set(name, mockCollection);
        return mockCollection;
      }),
      batch: jest.fn(() => mockBatch),
      runTransaction: jest.fn((callback: Function) => callback({
        get: jest.fn((ref: any) => Promise.resolve(createMockDoc(ref.id, mockDocs.get(ref.id) || {}))),
        set: jest.fn((ref: any, data: any) => mockDocs.set(ref.id, data)),
        update: jest.fn((ref: any, data: any) => {
          const existing = mockDocs.get(ref.id) || {};
          mockDocs.set(ref.id, {...existing, ...data});
        }),
        delete: jest.fn((ref: any) => mockDocs.delete(ref.id)),
      })),
      // Expose internals for testing
      _mockDocs: mockDocs,
      _mockCollections: mockCollections,
    };
  }

  static createEnhancedRequest(options: Partial<Request> & {
    method?: string;
    path?: string;
    body?: any;
    query?: any;
    headers?: any;
    params?: any;
    cookies?: any;
    session?: any;
    user?: any;
  } = {}): any {
    const baseReq = {
      method: options.method || "GET",
      path: options.path || "/",
      url: options.path || "/",
      body: options.body || {},
      query: options.query || {},
      headers: options.headers || {
        "content-type": "application/json",
        "user-agent": "test-suite/1.0.0",
        "accept": "application/json",
        ...options.headers,
      },
      params: options.params || {},
      cookies: options.cookies || {},
      session: options.session || {},
      user: options.user || null,
      rawBody: Buffer.from(JSON.stringify(options.body || {})),
      get: jest.fn((name: string) => (options.headers || {} as any)[name.toLowerCase()]),
      header: jest.fn((name: string) => (options.headers || {} as any)[name.toLowerCase()]),
      accepts: jest.fn(() => true),
      acceptsCharsets: jest.fn(() => true),
      acceptsEncodings: jest.fn(() => true),
      acceptsLanguages: jest.fn(() => true),
      is: jest.fn(() => true),
      ip: "127.0.0.1",
      ips: ["127.0.0.1"],
      protocol: "https",
      secure: true,
      xhr: false,
      fresh: false,
      stale: true,
      hostname: "localhost",
      originalUrl: options.path || "/",
      baseUrl: "",
      subdomains: [],
      route: {path: options.path || "/"},
    } as any;

    return {...baseReq, ...options} as any;
  }

  static createEnhancedResponse(): any {
    const res: any = {
      statusCode: 200,
      headersSent: false,
      locals: {},
      _headers: {} as any,
      _data: null as any,
    };

    res.status = jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    });

    res.setHeader = jest.fn((name: string, value: string) => {
      res._headers[name.toLowerCase()] = value;
      return res;
    });

    res.getHeader = jest.fn((name: string) => res._headers[name.toLowerCase()]);

    res.json = jest.fn((data: any) => {
      res._data = data;
      res.setHeader("content-type", "application/json");
      return res;
    });

    res.send = jest.fn((data: any) => {
      res._data = data;
      return res;
    });

    res.end = jest.fn((data?: any) => {
      if (data) res._data = data;
      res.headersSent = true;
      return res;
    });

    res.redirect = jest.fn((url: string) => {
      res.statusCode = 302;
      res.setHeader("location", url);
      return res;
    });

    res.cookie = jest.fn((name: string, value: any, options?: any) => {
      return res;
    });

    res.clearCookie = jest.fn((name: string) => {
      return res;
    });

    return res as Response;
  }
}

// Performance Testing Utilities
export class PerformanceTestUtils {
  static async measureExecutionTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; executionTime: number; memoryUsage: NodeJS.MemoryUsage }> {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    const result = await fn();

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    const memoryUsage = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
      arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
    };

    return {result, executionTime, memoryUsage};
  }

  static async runConcurrencyTest<T>(
    fn: () => Promise<T>,
    concurrency: number,
    iterations: number = 100
  ): Promise<{
    results: T[];
    avgExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    throughput: number;
    errors: Error[];
  }> {
    const results: T[] = [];
    const executionTimes: number[] = [];
    const errors: Error[] = [];

    const batches = Math.ceil(iterations / concurrency);

    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = Array.from({length: Math.min(concurrency, iterations - batch * concurrency)}, async () => {
        try {
          const {result, executionTime} = await this.measureExecutionTime(fn);
          results.push(result);
          executionTimes.push(executionTime);
        } catch (error) {
          errors.push(error as Error);
        }
      });

      await Promise.all(batchPromises);
    }

    const avgExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
    const throughput = (results.length / totalTime) * 1000; // Operations per second

    return {
      results,
      avgExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      throughput,
      errors,
    };
  }

  static createMemoryLeakDetector() {
    let initialHeapUsed: number;
    let measurements: number[] = [];

    return {
      start() {
        if (global.gc) global.gc();
        initialHeapUsed = process.memoryUsage().heapUsed;
        measurements = [];
      },

      measure() {
        if (global.gc) global.gc();
        const currentHeapUsed = process.memoryUsage().heapUsed;
        measurements.push(currentHeapUsed - initialHeapUsed);
      },

      analyze(): {
        hasMemoryLeak: boolean;
        maxIncrease: number;
        averageIncrease: number;
        trend: "increasing" | "stable" | "decreasing";
        measurements: number[];
        } {
        if (measurements.length < 3) {
          throw new Error("Need at least 3 measurements for leak detection");
        }

        const maxIncrease = Math.max(...measurements);
        const averageIncrease = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;

        // Calculate trend
        const halfPoint = Math.floor(measurements.length / 2);
        const firstHalf = measurements.slice(0, halfPoint);
        const secondHalf = measurements.slice(halfPoint);
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        let trend: "increasing" | "stable" | "decreasing";
        const trendDiff = secondAvg - firstAvg;
        if (Math.abs(trendDiff) < 1024 * 1024) { // Less than 1MB change
          trend = "stable";
        } else if (trendDiff > 0) {
          trend = "increasing";
        } else {
          trend = "decreasing";
        }

        // Memory leak detection thresholds
        const hasMemoryLeak = maxIncrease > 50 * 1024 * 1024 || (trend === "increasing" && averageIncrease > 10 * 1024 * 1024);

        return {
          hasMemoryLeak,
          maxIncrease,
          averageIncrease,
          trend,
          measurements,
        };
      },
    };
  }
}

// Test Environment Setup
export class TestEnvironment {
  static setupEnterpriseEnv() {
    process.env.NODE_ENV = "test";
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
    process.env.FUNCTIONS_EMULATOR_HOST = "localhost:5001";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
    process.env.PUBSUB_EMULATOR_HOST = "localhost:8085";
    process.env.STORAGE_EMULATOR_HOST = "localhost:9199";

    // Test-specific configurations
    process.env.TEST_TIMEOUT = "30000";
    process.env.LOG_LEVEL = "error"; // Suppress logs during testing
    process.env.ENABLE_TEST_COVERAGE = "true";
    process.env.TEST_PARALLELISM = "true";
  }

  static cleanup() {
    // Clean up any test artifacts
    if (global.gc) global.gc();
  }

  static async healthCheck(): Promise<boolean> {
    try {
      // Verify Firebase emulators are running
      const response = await fetch("http://localhost:8080");
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Custom Jest Matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidParty(): R;
      toBeValidAPIResponse(): R;
      toHaveExecutionTimeBelow(threshold: number): R;
      toHaveMemoryUsageBelow(threshold: number): R;
    }
  }
}

export const customMatchers = {
  toBeValidParty(received: any) {
    const requiredFields = ["Event Name", "Date", "Start Time", "Address"];
    const missingFields = requiredFields.filter((field) => !received[field]);

    const pass = missingFields.length === 0 &&
                 typeof received.active === "boolean" &&
                 received.source &&
                 received.uploadedAt;

    return {
      message: () => pass ?
        `Expected ${JSON.stringify(received)} not to be a valid party` :
        `Expected ${JSON.stringify(received)} to be a valid party. Missing fields: ${missingFields.join(", ")}`,
      pass,
    };
  },

  toBeValidAPIResponse(received: any) {
    const hasStatus = typeof received.success === "boolean";
    const hasTimestamp = received.timestamp && !isNaN(Date.parse(received.timestamp));
    const hasProperError = !received.success ? !!received.error : true;

    const pass = hasStatus && hasTimestamp && hasProperError;

    return {
      message: () => pass ?
        `Expected ${JSON.stringify(received)} not to be a valid API response` :
        `Expected ${JSON.stringify(received)} to be a valid API response`,
      pass,
    };
  },

  toHaveExecutionTimeBelow(received: { executionTime: number }, threshold: number) {
    const pass = received.executionTime < threshold;

    return {
      message: () => pass ?
        `Expected execution time ${received.executionTime}ms not to be below ${threshold}ms` :
        `Expected execution time ${received.executionTime}ms to be below ${threshold}ms`,
      pass,
    };
  },

  toHaveMemoryUsageBelow(received: { memoryUsage: NodeJS.MemoryUsage }, threshold: number) {
    const heapUsed = received.memoryUsage.heapUsed;
    const pass = heapUsed < threshold;

    return {
      message: () => pass ?
        `Expected memory usage ${heapUsed} bytes not to be below ${threshold} bytes` :
        `Expected memory usage ${heapUsed} bytes to be below ${threshold} bytes`,
      pass,
    };
  },
};
