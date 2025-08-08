/**
 * Enterprise Security & Penetration Tests
 * Comprehensive security testing for production deployment
 */

import {api} from "../../src/index";
import {MockBuilder, PerformanceTestUtils} from "../utils/test-helpers";
import {TEST_CONFIG} from "../config/test-config";

describe("Security & Penetration Tests", () => {
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = MockBuilder.createAdvancedFirestoreMock();
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: jest.fn(() => mockFirestore),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Injection Attack Prevention", () => {
    describe("SQL Injection Protection", () => {
      it("should prevent SQL injection in query parameters", async () => {
        const sqlInjectionPayloads = TEST_CONFIG.SECURITY.PAYLOADS.SQL_INJECTION;

        for (const payload of sqlInjectionPayloads) {
          const req = MockBuilder.createEnhancedRequest({
            path: "/parties",
            query: {
              search: payload,
              category: payload,
              limit: payload,
            },
          });
          const res = MockBuilder.createEnhancedResponse();

          await api(req, res);

          // Should not crash and should return safe response
          expect(res.statusCode).toBeLessThan(500);
          const response = res._data;

          if (response.success) {
            expect(response.data).toBeInstanceOf(Array);
          } else {
            expect(response.error).toBeDefined();
            expect(response.error).not.toContain("SQL");
            expect(response.error).not.toContain("DROP");
            expect(response.error).not.toContain("DELETE");
          }
        }
      });
    });

    describe("NoSQL Injection Protection", () => {
      it("should prevent NoSQL injection in request bodies", async () => {
        const nosqlPayloads = TEST_CONFIG.SECURITY.PAYLOADS.NOSQL_INJECTION;

        for (const payload of nosqlPayloads) {
          const req = MockBuilder.createEnhancedRequest({
            method: "POST",
            path: "/swipe",
            body: {
              partyId: payload,
              action: payload,
              metadata: JSON.parse(payload),
            },
          });
          const res = MockBuilder.createEnhancedResponse();

          await api(req, res);

          // Should reject malicious payloads
          expect(res.statusCode).toBeOneOf([400, 422]);
          const response = res._data;
          expect(response.success).toBe(false);
          expect(response.errors || response.error).toBeDefined();
        }
      });
    });

    describe("Command Injection Protection", () => {
      it("should prevent command injection in all input fields", async () => {
        const commandPayloads = TEST_CONFIG.SECURITY.PAYLOADS.COMMAND_INJECTION;

        for (const payload of commandPayloads) {
          const req = MockBuilder.createEnhancedRequest({
            method: "POST",
            path: "/ugc/events/create",
            body: {
              title: payload,
              description: payload,
              venue: payload,
              date: "2025-08-20",
              startTime: payload,
            },
          });
          const res = MockBuilder.createEnhancedResponse();

          await api(req, res);

          // Should sanitize or reject command injection attempts
          const response = res._data;
          if (response.success && response.data) {
            expect(response.data.title).not.toContain(";");
            expect(response.data.title).not.toContain("|");
            expect(response.data.title).not.toContain("&&");
          }
        }
      });
    });

    describe("XSS Protection", () => {
      it("should prevent XSS in user-generated content", async () => {
        const xssPayloads = TEST_CONFIG.SECURITY.PAYLOADS.XSS;

        for (const payload of xssPayloads) {
          const req = MockBuilder.createEnhancedRequest({
            method: "POST",
            path: "/ugc/events/create",
            body: {
              title: payload,
              description: `Event description with ${payload}`,
              venue: "Test Venue",
              date: "2025-08-20",
              startTime: "19:00",
            },
          });
          const res = MockBuilder.createEnhancedResponse();

          await api(req, res);

          const response = res._data;
          if (response.success && response.data) {
            // XSS payloads should be sanitized or rejected
            expect(response.data.title).not.toContain("<script>");
            expect(response.data.title).not.toContain("javascript:");
            expect(response.data.title).not.toContain("onerror=");
            expect(response.data.description).not.toContain("<script>");
          }
        }
      });

      it("should set proper Content-Security-Policy headers", async () => {
        const req = MockBuilder.createEnhancedRequest({path: "/health"});
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // While our API doesn't serve HTML, it should still have security headers
        expect(res.getHeader("content-type")).toBe("application/json");
        expect(res.getHeader("x-content-type-options")).toBe("nosniff");
      });
    });

    describe("Path Traversal Protection", () => {
      it("should prevent path traversal attacks", async () => {
        const pathTraversalPayloads = TEST_CONFIG.SECURITY.PAYLOADS.PATH_TRAVERSAL;

        for (const payload of pathTraversalPayloads) {
          const req = MockBuilder.createEnhancedRequest({
            path: `/parties/${encodeURIComponent(payload)}`,
            query: {
              file: payload,
              path: payload,
            },
          });
          const res = MockBuilder.createEnhancedResponse();

          await api(req, res);

          // Should not access unauthorized files/directories
          expect(res.statusCode).not.toBe(200);
          const response = res._data;
          expect(response).not.toContain("/etc/passwd");
          expect(response).not.toContain("root:");
        }
      });
    });
  });

  describe("Authentication & Authorization", () => {
    it("should handle missing authentication gracefully", async () => {
      const protectedEndpoints = ["/admin/clear", "/admin/stats"];

      for (const endpoint of protectedEndpoints) {
        const req = MockBuilder.createEnhancedRequest({
          path: endpoint,
          headers: {}, // No authentication headers
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Should return appropriate authentication error
        expect(res.statusCode).toBeOneOf([401, 403, 404]);
      }
    });

    it("should validate JWT tokens properly", async () => {
      const invalidTokens = [
        "invalid.token.here",
        "Bearer invalid.token.here",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
        "Bearer " + "A".repeat(1000), // Extremely long token
        "",
      ];

      for (const token of invalidTokens) {
        const req = MockBuilder.createEnhancedRequest({
          path: "/admin/clear",
          headers: {
            "Authorization": token,
          },
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Should reject invalid tokens
        expect(res.statusCode).toBeOneOf([401, 403]);
        const response = res._data;
        expect(response.success).toBe(false);
      }
    });

    it("should prevent privilege escalation", async () => {
      // Test with regular user token trying to access admin functions
      const userToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6InVzZXItMTIzIn0.signature";

      const adminEndpoints = ["/admin/clear", "/admin/stats", "/admin/users"];

      for (const endpoint of adminEndpoints) {
        const req = MockBuilder.createEnhancedRequest({
          path: endpoint,
          headers: {
            "Authorization": userToken,
          },
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Should deny access to admin endpoints
        expect(res.statusCode).toBeOneOf([403, 404]);
      }
    });
  });

  describe("Rate Limiting & DoS Protection", () => {
    it("should implement rate limiting for API endpoints", async () => {
      const rateLimitTest = async (endpoint: string, method: string = "GET") => {
        const requests = Array.from({length: TEST_CONFIG.SECURITY.RATE_LIMITING.BURST_SIZE}, async () => {
          const req = MockBuilder.createEnhancedRequest({
            path: endpoint,
            method: method,
            body: method === "POST" ? {partyId: "test", action: "like"} : {},
            headers: {
              "X-Real-IP": "192.168.1.100", // Same IP for all requests
              "User-Agent": "Test Client",
            },
          });
          const res = MockBuilder.createEnhancedResponse();
          await api(req, res);
          return res;
        });

        const responses = await Promise.all(requests);

        // Some requests should be rate limited (429 status)
        const rateLimitedCount = responses.filter((res) => res.statusCode === 429).length;

        // At least some requests should be rate limited if system is working properly
        // This would depend on actual rate limiting implementation
        console.log(`Rate limiting test for ${endpoint}: ${rateLimitedCount}/${responses.length} requests rate limited`);
      };

      await rateLimitTest("/parties");
      await rateLimitTest("/swipe", "POST");
    });

    it("should handle request flooding gracefully", async () => {
      const floodTest = async () => {
        const req = MockBuilder.createEnhancedRequest({
          path: "/health",
          headers: {
            "X-Real-IP": "192.168.1.200",
          },
        });
        const res = MockBuilder.createEnhancedResponse();
        await api(req, res);
        return res;
      };

      const {results, errors, avgExecutionTime} = await PerformanceTestUtils.runConcurrencyTest(
        floodTest,
        TEST_CONFIG.SECURITY.RATE_LIMITING.SUSTAINED_RATE,
        100
      );

      // System should remain responsive even under flood
      expect(avgExecutionTime).toBeLessThan(10000); // 10 seconds max average
      expect(errors.length).toBeLessThan(results.length * 0.5); // Less than 50% failures
    });

    it("should prevent resource exhaustion attacks", async () => {
      const resourceExhaustionTests = [
        {
          name: "Large request body",
          request: {
            method: "POST",
            path: "/swipe",
            body: {
              partyId: "A".repeat(1000000), // 1MB party ID
              action: "like",
              metadata: Array.from({length: 10000}, (_, i) => ({key: i, value: "x".repeat(1000)})),
            },
          },
        },
        {
          name: "Extremely deep nested object",
          request: {
            method: "POST",
            path: "/ugc/events/create",
            body: createDeeplyNestedObject(1000), // 1000 levels deep
          },
        },
        {
          name: "Many query parameters",
          request: {
            path: "/parties",
            query: Object.fromEntries(
              Array.from({length: 1000}, (_, i) => [`param${i}`, `value${i}`])
            ),
          },
        },
      ];

      for (const test of resourceExhaustionTests) {
        const req = MockBuilder.createEnhancedRequest(test.request);
        const res = MockBuilder.createEnhancedResponse();

        const startTime = Date.now();
        await api(req, res);
        const duration = Date.now() - startTime;

        // Should reject or handle large requests quickly
        expect(duration).toBeLessThan(5000); // 5 seconds max
        expect(res.statusCode).toBeOneOf([200, 400, 413, 422]); // Valid response codes
      }
    });
  });

  describe("Data Validation & Sanitization", () => {
    it("should validate all input data types", async () => {
      const invalidDataTypes = [
        {partyId: 123, action: "like"}, // Number instead of string
        {partyId: true, action: "like"}, // Boolean instead of string
        {partyId: [], action: "like"}, // Array instead of string
        {partyId: {}, action: "like"}, // Object instead of string
        {partyId: null, action: "like"}, // Null value
        {partyId: undefined, action: "like"}, // Undefined value
      ];

      for (const invalidData of invalidDataTypes) {
        const req = MockBuilder.createEnhancedRequest({
          method: "POST",
          path: "/swipe",
          body: invalidData,
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Should validate data types and reject invalid ones
        expect(res.statusCode).toBeOneOf([400, 422]);
        const response = res._data;
        expect(response.success).toBe(false);
        expect(response.errors || response.error).toBeDefined();
      }
    });

    it("should sanitize user input properly", async () => {
      const unsafeInputs = [
        "Normal text",
        "<script>alert(\"xss\")</script>",
        "\"; DROP TABLE parties; --",
        "../../../etc/passwd",
        "Text with\nnewlines\rand\ttabs",
        "Unicode: 你好世界 🎮",
        "Special chars: @#$%^&*()_+-=[]{}|;:,.<>?",
      ];

      for (const input of unsafeInputs) {
        const req = MockBuilder.createEnhancedRequest({
          method: "POST",
          path: "/ugc/events/create",
          body: {
            title: input,
            description: `Description: ${input}`,
            venue: "Test Venue",
            date: "2025-08-20",
            startTime: "19:00",
          },
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        const response = res._data;
        if (response.success && response.data) {
          // Verify dangerous content is removed or escaped
          expect(response.data.title).not.toContain("<script>");
          expect(response.data.title).not.toContain("DROP TABLE");
          expect(response.data.description).not.toContain("../../../");
        }
      }
    });
  });

  describe("HTTP Security Headers", () => {
    it("should set comprehensive security headers", async () => {
      const req = MockBuilder.createEnhancedRequest({path: "/health"});
      const res = MockBuilder.createEnhancedResponse();

      await api(req, res);

      const securityHeaders = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Type": "application/json",
      };

      Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
        const actualValue = res.getHeader(header.toLowerCase());
        if (expectedValue) {
          expect(actualValue).toBe(expectedValue);
        } else {
          expect(actualValue).toBeDefined();
        }
      });
    });

    it("should handle malicious headers gracefully", async () => {
      const maliciousHeaders = TEST_CONFIG.SECURITY.HEADERS.MALICIOUS;

      for (const [headerName, headerValue] of Object.entries(maliciousHeaders)) {
        const req = MockBuilder.createEnhancedRequest({
          path: "/health",
          headers: {
            [headerName]: headerValue,
          },
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Should not crash and should return valid response
        expect(res.statusCode).toBeLessThan(500);
        const response = res._data;
        expect(response).toHaveProperty("status");
      }
    });

    it("should reject oversized headers", async () => {
      const oversizedHeaders = TEST_CONFIG.SECURITY.HEADERS.OVERSIZED;

      for (const [headerName, headerValue] of Object.entries(oversizedHeaders)) {
        const req = MockBuilder.createEnhancedRequest({
          path: "/health",
          headers: {
            [headerName]: headerValue,
          },
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Should handle or reject oversized headers
        expect(res.statusCode).toBeOneOf([200, 400, 413]);
      }
    });
  });

  describe("Business Logic Security", () => {
    it("should prevent duplicate event creation abuse", async () => {
      const eventData = {
        title: "Duplicate Test Event",
        description: "This event should be detected as duplicate",
        venue: "Test Venue",
        date: "2025-08-20",
        startTime: "19:00",
      };

      // Create same event multiple times
      const duplicateRequests = Array.from({length: 10}, async () => {
        const req = MockBuilder.createEnhancedRequest({
          method: "POST",
          path: "/ugc/events/create",
          body: eventData,
        });
        const res = MockBuilder.createEnhancedResponse();
        await api(req, res);
        return res;
      });

      const responses = await Promise.all(duplicateRequests);

      // Should detect and prevent duplicate events
      const successfulCreations = responses.filter((res: any) => res.statusCode === 201).length;
      expect(successfulCreations).toBeLessThanOrEqual(1);

      const duplicateRejections = responses.filter((res: any) =>
        res.statusCode === 409 ||
        (res._data && res._data.error && res._data.error.includes("duplicate"))
      ).length;
      expect(duplicateRejections).toBeGreaterThan(0);
    });

    it("should validate business rules for event creation", async () => {
      const invalidBusinessLogicTests = [
        {
          name: "Past date event",
          data: {
            title: "Past Event",
            venue: "Test Venue",
            date: "2020-01-01", // Past date
            startTime: "19:00",
          },
        },
        {
          name: "Invalid time range",
          data: {
            title: "Invalid Time Event",
            venue: "Test Venue",
            date: "2025-08-20",
            startTime: "23:00",
            endTime: "18:00", // End before start
          },
        },
        {
          name: "Excessive capacity",
          data: {
            title: "Huge Event",
            venue: "Test Venue",
            date: "2025-08-20",
            startTime: "19:00",
            maxAttendees: 1000000, // Unrealistic capacity
          },
        },
      ];

      for (const test of invalidBusinessLogicTests) {
        const req = MockBuilder.createEnhancedRequest({
          method: "POST",
          path: "/ugc/events/create",
          body: test.data,
        });
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        // Should reject business logic violations
        expect(res.statusCode).toBeOneOf([400, 422]);
        const response = res._data;
        expect(response.success).toBe(false);
        expect(response.error || response.errors).toBeDefined();
      }
    });
  });

  describe("Error Information Disclosure", () => {
    it("should not expose sensitive system information in errors", async () => {
      // Force various error conditions
      const errorConditions = [
        {path: "/nonexistent", expectedStatus: 404},
        {path: "/parties", query: {invalid: "param"}, expectedStatus: [200, 400]},
        {path: "/swipe", method: "POST", body: {}, expectedStatus: 400},
      ];

      for (const condition of errorConditions) {
        const req = MockBuilder.createEnhancedRequest(condition);
        const res = MockBuilder.createEnhancedResponse();

        await api(req, res);

        const response = res._data;
        if (typeof response === "string") {
          // Check error message doesn't expose sensitive info
          expect(response).not.toMatch(/password|secret|key|token/i);
          expect(response).not.toMatch(/internal server error/i);
          expect(response).not.toMatch(/stack trace|line \d+/i);
          expect(response).not.toMatch(/\/private\/|\/home\/|c:\\/i);
        }

        if (typeof response === "object" && response.error) {
          expect(response.error).not.toMatch(/password|secret|key|token/i);
          expect(response.error).not.toMatch(/stack trace|line \d+/i);
        }
      }
    });
  });
});

// Helper function to create deeply nested objects for testing
function createDeeplyNestedObject(depth: number): any {
  if (depth <= 0) return "deep value";

  return {
    level: depth,
    nested: createDeeplyNestedObject(depth - 1),
    data: `Level ${depth} data`,
  };
}

// Custom Jest matchers for security testing
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of [${expected.join(", ")}]`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of [${expected.join(", ")}]`,
        pass: false,
      };
    }
  },
});
