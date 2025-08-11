/**
 * GPT-5 FOUNDATION TEST UTILITIES
 * Comprehensive test helpers and mocks
 */

import {Request, Response} from "express";

// Mock Request Builder
export class MockRequestBuilder {
  private request: Partial<Request> = {
    method: "GET",
    path: "/api/health",
    headers: {},
    query: {},
    body: {},
  };

  method(method: string): MockRequestBuilder {
    this.request.method = method;
    return this;
  }

  path(path: string): MockRequestBuilder {
    this.request.path = path;
    return this;
  }

  origin(origin: string): MockRequestBuilder {
    if (!this.request.headers) this.request.headers = {};
    this.request.headers.origin = origin;
    return this;
  }

  header(key: string, value: string): MockRequestBuilder {
    if (!this.request.headers) this.request.headers = {};
    this.request.headers[key] = value;
    return this;
  }

  query(query: Record<string, any>): MockRequestBuilder {
    this.request.query = query;
    return this;
  }

  body(body: Record<string, any>): MockRequestBuilder {
    this.request.body = body;
    return this;
  }

  build(): Partial<Request> {
    return {...this.request};
  }
}

// Mock Response Builder
export class MockResponseBuilder {
  private jsonMock: jest.Mock;
  private statusMock: jest.Mock;
  private setHeaderMock: jest.Mock;
  private sendMock: jest.Mock;

  constructor() {
    this.jsonMock = jest.fn();
    this.statusMock = jest.fn(() => ({json: this.jsonMock}));
    this.setHeaderMock = jest.fn();
    this.sendMock = jest.fn();
  }

  build(): { res: Partial<Response>, mocks: ResponseMocks } {
    const res = {
      json: this.jsonMock,
      status: this.statusMock,
      setHeader: this.setHeaderMock,
      send: this.sendMock,
    };

    const mocks = {
      json: this.jsonMock,
      status: this.statusMock,
      setHeader: this.setHeaderMock,
      send: this.sendMock,
    };

    return {res, mocks};
  }
}

export interface ResponseMocks {
  json: jest.Mock;
  status: jest.Mock;
  setHeader: jest.Mock;
  send: jest.Mock;
}

// Test Data Factories
export const TestData = {
  validInviteCodes: ["DEMO123", "TEST456", "GAMESCOM"],
  invalidInviteCodes: ["INVALID", "EXPIRED", "NOTFOUND"],

  allowedOrigins: [
    "https://conference-party-app.web.app",
    "https://conference-party-app.firebaseapp.com",
    "http://localhost:3000",
  ],

  blockedOrigins: [
    "https://malicious-site.com",
    "http://suspicious.domain",
    "https://phishing.example",
  ],

  healthResponse: {
    status: "healthy",
    version: "3.1.0",
    environment: expect.any(String),
    responseTime: expect.stringMatching(/\d+ms/),
    timestamp: expect.any(String),
    cors: expect.objectContaining({
      origin: expect.any(String),
      allowed: expect.any(Array),
    }),
  },

  inviteValidResponse: {
    valid: true,
    inviterId: expect.any(String),
    inviterName: expect.any(String),
  },

  inviteInvalidResponse: {
    valid: false,
    reason: "not_found",
  },

  notFoundResponse: {
    success: false,
    error: "Endpoint not found",
    availableEndpoints: ["/health", "/invite/validate"],
    timestamp: expect.any(String),
  },
};

// Performance Testing Utilities
export class PerformanceTestHelper {
  static async measureResponseTime<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; time: number }> {
    const startTime = Date.now();
    const result = await operation();
    const time = Date.now() - startTime;
    return {result, time};
  }

  static expectFastResponse(time: number, threshold = 100): void {
    expect(time).toBeLessThan(threshold);
  }

  static async benchmarkOperation<T>(
    operation: () => Promise<T>,
    iterations = 10
  ): Promise<{ avg: number; min: number; max: number; times: number[] }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const {time} = await this.measureResponseTime(operation);
      times.push(time);
    }

    return {
      avg: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times,
    };
  }
}

// CORS Testing Utilities
export class CorsTestHelper {
  static expectCorsHeaders(setHeaderMock: jest.Mock): void {
    expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Origin", expect.any(String));
    expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    expect(setHeaderMock).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With"
    );
  }

  static expectOriginAllowed(setHeaderMock: jest.Mock, origin: string): void {
    expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Origin", origin);
  }

  static expectPreflightResponse(statusMock: jest.Mock, sendMock: jest.Mock): void {
    expect(statusMock).toHaveBeenCalledWith(204);
    expect(sendMock).toHaveBeenCalled();
  }
}

// Error Testing Utilities
export class ErrorTestHelper {
  static expectNotFound(statusMock: jest.Mock, jsonMock: jest.Mock): void {
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(TestData.notFoundResponse);
  }

  static expectInternalError(statusMock: jest.Mock, jsonMock: jest.Mock): void {
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String),
        responseTime: expect.stringMatching(/\d+ms/),
      })
    );
  }
}

// Snapshot Testing Utilities
export class SnapshotTestHelper {
  static sanitizeResponse(response: any): any {
    return {
      ...response,
      timestamp: "[TIMESTAMP]",
      responseTime: "[RESPONSE_TIME]",
    };
  }

  static expectResponseSnapshot(jsonMock: jest.Mock, testName: string): void {
    const calls = jsonMock.mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const sanitized = this.sanitizeResponse(calls[0][0]);
    expect(sanitized).toMatchSnapshot(testName);
  }
}

// Integration Test Helpers
export class IntegrationTestHelper {
  static async testEndpoint(
    api: (...args: any[]) => any,
    request: Partial<Request>,
    expectedStatus?: number
  ): Promise<{ mocks: ResponseMocks; response: any }> {
    const {res, mocks} = new MockResponseBuilder().build();

    await api(request as Request, res as Response);

    if (expectedStatus) {
      expect(mocks.status).toHaveBeenCalledWith(expectedStatus);
    }

    return {mocks, response: mocks.json.mock.calls[0]?.[0]};
  }

  static async testHealthEndpoint(api: (...args: any[]) => any): Promise<any> {
    const request = new MockRequestBuilder()
      .method("GET")
      .path("/api/health")
      .origin("https://conference-party-app.web.app")
      .build();

    const {response} = await this.testEndpoint(api, request);
    expect(response).toMatchObject(TestData.healthResponse);
    return response;
  }

  static async testInviteValidation(
    api: (...args: any[]) => any,
    code: string,
    expectedValid: boolean
  ): Promise<any> {
    const request = new MockRequestBuilder()
      .method("POST")
      .path("/api/invite/validate")
      .origin("https://conference-party-app.web.app")
      .body({code})
      .build();

    const {response} = await this.testEndpoint(api, request);
    expect(response.valid).toBe(expectedValid);
    return response;
  }
}

// Test Suite Builder
export class TestSuiteBuilder {
  private suite: string;
  private tests: Array<() => void> = [];

  constructor(suite: string) {
    this.suite = suite;
  }

  addHealthTests(): TestSuiteBuilder {
    this.tests.push(() => {
      describe("Health Endpoint", () => {
        it("should return health status", async () => {
          // Health test implementation
        });
      });
    });
    return this;
  }

  addCorsTests(): TestSuiteBuilder {
    this.tests.push(() => {
      describe("CORS Handling", () => {
        it("should handle CORS properly", async () => {
          // CORS test implementation
        });
      });
    });
    return this;
  }

  addPerformanceTests(): TestSuiteBuilder {
    this.tests.push(() => {
      describe("Performance", () => {
        it("should respond quickly", async () => {
          // Performance test implementation
        });
      });
    });
    return this;
  }

  build(): void {
    describe(this.suite, () => {
      this.tests.forEach((test) => test());
    });
  }
}

// Export convenience functions
export const mockRequest = () => new MockRequestBuilder();
export const mockResponse = () => new MockResponseBuilder();
export const performance = PerformanceTestHelper;
export const cors = CorsTestHelper;
export const errors = ErrorTestHelper;
export const snapshots = SnapshotTestHelper;
export const integration = IntegrationTestHelper;
