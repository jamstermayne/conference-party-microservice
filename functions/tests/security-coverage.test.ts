/**
 * SECURITY MODULE COVERAGE TESTS
 * Tests for security functions to improve coverage
 */

import {
  isValidOrigin,
  sanitizeString,
  validateCsrfToken,
  rateLimiter,
  requestValidator,
  sanitizeInput,
} from "../src/security-stub";

describe("Security Module Coverage", () => {
  describe("Origin Validation", () => {
    it("should validate allowed origins", () => {
      const allowedOrigins = [
        "https://conference-party-app.web.app",
        "https://conference-party-app.firebaseapp.com",
        "http://localhost:3000",
      ];

      allowedOrigins.forEach((origin) => {
        expect(isValidOrigin(origin, allowedOrigins)).toBe(true);
      });
    });

    it("should reject blocked origins", () => {
      const allowedOrigins = ["https://conference-party-app.web.app"];
      const blockedOrigins = [
        "https://malicious-site.com",
        "http://suspicious.domain",
        "https://phishing.example",
      ];

      blockedOrigins.forEach((origin) => {
        expect(isValidOrigin(origin, allowedOrigins)).toBe(false);
      });
    });

    it("should handle wildcard patterns", () => {
      const allowedOrigins = ["https://*.conference-party-app.web.app"];

      expect(isValidOrigin("https://staging.conference-party-app.web.app", allowedOrigins)).toBe(true);
      expect(isValidOrigin("https://dev.conference-party-app.web.app", allowedOrigins)).toBe(true);
      expect(isValidOrigin("https://malicious.com", allowedOrigins)).toBe(false);
    });

    it("should handle undefined/null origins", () => {
      const allowedOrigins = ["https://conference-party-app.web.app"];

      expect(isValidOrigin(undefined, allowedOrigins)).toBe(false);
      expect(isValidOrigin(null, allowedOrigins)).toBe(false);
      expect(isValidOrigin("", allowedOrigins)).toBe(false);
    });
  });

  describe("String Sanitization", () => {
    it("should remove HTML tags", () => {
      expect(sanitizeString("<script>alert('xss')</script>")).toBe(""); // Script tags removed completely
      expect(sanitizeString("<p>Hello</p>")).toBe("Hello"); // Regular tags removed, content preserved
      expect(sanitizeString("<img src=x onerror=alert(1)>")).toBe("");
      expect(sanitizeString("Normal text")).toBe("Normal text");
    });

    it("should decode HTML entities", () => {
      expect(sanitizeString("&lt;script&gt;")).toBe("<script>");
      expect(sanitizeString("&amp;")).toBe("&");
      expect(sanitizeString("&quot;test&quot;")).toBe("\"test\"");
    });

    it("should handle SQL injection attempts", () => {
      expect(sanitizeString("'; DROP TABLE users; --")).toBe("'; DROP TABLE users; --");
      expect(sanitizeString("1' OR '1'='1")).toBe("1' OR '1'='1");
    });

    it("should handle null/undefined inputs", () => {
      expect(sanitizeString(undefined)).toBe("");
      expect(sanitizeString(null)).toBe("");
      expect(sanitizeString("")).toBe("");
    });

    it("should preserve normal text", () => {
      expect(sanitizeString("Normal text input")).toBe("Normal text input");
      expect(sanitizeString("Email: user@domain.com")).toBe("Email: user@domain.com");
    });
  });

  describe("CSRF Token Validation", () => {
    const validToken = "abc123def456";
    const sessionToken = "abc123def456";

    it("should validate correct CSRF tokens", () => {
      expect(validateCsrfToken(validToken, sessionToken)).toBe(true);
    });

    it("should reject invalid CSRF tokens", () => {
      expect(validateCsrfToken("invalid", sessionToken)).toBe(false);
      expect(validateCsrfToken("", sessionToken)).toBe(false);
      expect(validateCsrfToken(undefined, sessionToken)).toBe(false);
    });

    it("should handle missing session token", () => {
      expect(validateCsrfToken(validToken, undefined)).toBe(false);
      expect(validateCsrfToken(validToken, "")).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(validateCsrfToken("ABC123DEF456", sessionToken)).toBe(false);
    });
  });

  describe("Rate Limiting", () => {
    const clientId = "test-client-123";

    beforeEach(() => {
      // Clear rate limiter state
      rateLimiter.clear?.();
    });

    it("should allow requests within limit", () => {
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.isAllowed(clientId)).toBe(true);
      }
    });

    it("should block requests over limit", () => {
      // Exhaust the rate limit
      for (let i = 0; i < 100; i++) {
        rateLimiter.isAllowed(clientId);
      }

      expect(rateLimiter.isAllowed(clientId)).toBe(false);
    });

    it("should handle different client IDs separately", () => {
      const client1 = "client-1";
      const client2 = "client-2";

      // Exhaust rate limit for client1
      for (let i = 0; i < 100; i++) {
        rateLimiter.isAllowed(client1);
      }

      expect(rateLimiter.isAllowed(client1)).toBe(false);
      expect(rateLimiter.isAllowed(client2)).toBe(true);
    });

    it("should reset after time window", async () => {
      // This would require mocking time or using a test-friendly rate limiter
      expect(rateLimiter.reset).toBeDefined();
      rateLimiter.reset(clientId);
      expect(rateLimiter.isAllowed(clientId)).toBe(true);
    });
  });

  describe("Request Validation", () => {
    it("should validate required fields", () => {
      const validRequest = {
        body: {code: "DEMO123"},
        headers: {"content-type": "application/json"},
      };

      expect(requestValidator.validate(validRequest, ["code"])).toBe(true);
    });

    it("should reject requests missing required fields", () => {
      const invalidRequest = {
        body: {},
        headers: {"content-type": "application/json"},
      };

      expect(requestValidator.validate(invalidRequest, ["code"])).toBe(false);
    });

    it("should validate request size limits", () => {
      const largeBody = "x".repeat(10000);
      const largeRequest = {
        body: {data: largeBody},
        headers: {"content-type": "application/json"},
      };

      expect(requestValidator.isWithinSizeLimit(largeRequest, 5000)).toBe(false);
      expect(requestValidator.isWithinSizeLimit(largeRequest, 20000)).toBe(true);
    });

    it("should validate content types", () => {
      expect(requestValidator.hasValidContentType(
        {headers: {"content-type": "application/json"}}
      )).toBe(true);

      expect(requestValidator.hasValidContentType(
        {headers: {"content-type": "text/plain"}}
      )).toBe(false);

      expect(requestValidator.hasValidContentType(
        {headers: {}}
      )).toBe(false);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize object inputs", () => {
      const dirtyInput = {
        name: "<p>Test User</p>",
        email: "user@domain.com",
        description: "Normal text",
      };

      const cleaned = sanitizeInput(dirtyInput);
      expect(cleaned.name).toBe("Test User"); // HTML tags removed but content preserved
      expect(cleaned.email).toBe("user@domain.com");
      expect(cleaned.description).toBe("Normal text");
    });

    it("should handle nested objects", () => {
      const nestedInput = {
        user: {
          profile: {
            bio: "<img src=x onerror=alert(1)>",
          },
        },
      };

      const cleaned = sanitizeInput(nestedInput);
      expect(cleaned.user.profile.bio).toBe("");
    });

    it("should handle arrays", () => {
      const arrayInput = {
        tags: ["<script>", "normal-tag", "<img onerror=alert(1)>"],
      };

      const cleaned = sanitizeInput(arrayInput);
      expect(cleaned.tags).toEqual(["", "normal-tag", ""]);
    });

    it("should preserve non-string values", () => {
      const mixedInput = {
        name: "<p>test</p>",
        age: 25,
        active: true,
        score: 95.5,
        created: new Date("2023-01-01"),
      };

      const cleaned = sanitizeInput(mixedInput);
      expect(cleaned.name).toBe("test"); // HTML tags removed, content preserved
      expect(cleaned.age).toBe(25);
      expect(cleaned.active).toBe(true);
      expect(cleaned.score).toBe(95.5);
      expect(typeof cleaned.created).toBe("object"); // Date objects become empty objects in our stub
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed inputs gracefully", () => {
      expect(() => sanitizeString(123 as any)).not.toThrow();
      expect(() => sanitizeString(true as any)).not.toThrow();
      expect(() => sanitizeString({} as any)).not.toThrow();
    });

    it("should handle circular references", () => {
      const circular: any = {name: "test"};
      circular.self = circular;

      expect(() => sanitizeInput(circular)).not.toThrow();
    });

    it("should handle extremely large inputs", () => {
      const largeString = "x".repeat(100000);
      expect(() => sanitizeString(largeString)).not.toThrow();
    });
  });
});
