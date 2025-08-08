/**
 * Custom Jest Matchers for Enterprise Testing
 * Domain-specific assertions for better test readability
 */

import {customMatchers} from "./test-helpers";

// Register custom matchers with Jest
expect.extend(customMatchers);

// Additional enterprise-specific matchers
expect.extend({
  toMatchAPIContract(received: any, expectedContract: any) {
    const errors: string[] = [];

    // Validate required fields
    if (expectedContract.required) {
      expectedContract.required.forEach((field: string) => {
        if (!(field in received)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }

    // Validate field types
    if (expectedContract.properties) {
      Object.entries(expectedContract.properties).forEach(([field, schema]: [string, any]) => {
        if (field in received) {
          const value = received[field];
          const expectedType = schema.type;

          if (expectedType === "string" && typeof value !== "string") {
            errors.push(`Field '${field}' should be string, got ${typeof value}`);
          } else if (expectedType === "number" && typeof value !== "number") {
            errors.push(`Field '${field}' should be number, got ${typeof value}`);
          } else if (expectedType === "boolean" && typeof value !== "boolean") {
            errors.push(`Field '${field}' should be boolean, got ${typeof value}`);
          } else if (expectedType === "array" && !Array.isArray(value)) {
            errors.push(`Field '${field}' should be array, got ${typeof value}`);
          } else if (expectedType === "object" && (typeof value !== "object" || value === null)) {
            errors.push(`Field '${field}' should be object, got ${typeof value}`);
          }

          // Validate enum values
          if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`Field '${field}' should be one of [${schema.enum.join(", ")}], got '${value}'`);
          }

          // Validate string patterns
          if (schema.pattern && typeof value === "string") {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
              errors.push(`Field '${field}' should match pattern ${schema.pattern}, got '${value}'`);
            }
          }

          // Validate numeric ranges
          if (typeof value === "number") {
            if (schema.minimum !== undefined && value < schema.minimum) {
              errors.push(`Field '${field}' should be >= ${schema.minimum}, got ${value}`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
              errors.push(`Field '${field}' should be <= ${schema.maximum}, got ${value}`);
            }
          }

          // Validate array constraints
          if (Array.isArray(value)) {
            if (schema.minItems !== undefined && value.length < schema.minItems) {
              errors.push(`Field '${field}' should have at least ${schema.minItems} items, got ${value.length}`);
            }
            if (schema.maxItems !== undefined && value.length > schema.maxItems) {
              errors.push(`Field '${field}' should have at most ${schema.maxItems} items, got ${value.length}`);
            }
          }

          // Validate string lengths
          if (typeof value === "string") {
            if (schema.minLength !== undefined && value.length < schema.minLength) {
              errors.push(`Field '${field}' should have at least ${schema.minLength} characters, got ${value.length}`);
            }
            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
              errors.push(`Field '${field}' should have at most ${schema.maxLength} characters, got ${value.length}`);
            }
          }
        }
      });
    }

    const pass = errors.length === 0;

    return {
      message: () => pass ?
        "Expected response not to match API contract" :
        `Expected response to match API contract. Violations:\n${errors.join("\n")}`,
      pass,
    };
  },

  toHaveSecurityHeaders(received: any) {
    const requiredSecurityHeaders = [
      "access-control-allow-origin",
      "content-type",
      "x-content-type-options",
      "x-frame-options",
    ];

    const missingHeaders = requiredSecurityHeaders.filter((header) => {
      const headerValue = received.getHeader ? received.getHeader(header) : received.headers?.[header];
      return !headerValue;
    });

    const pass = missingHeaders.length === 0;

    return {
      message: () => pass ?
        "Expected response not to have all security headers" :
        `Expected response to have security headers. Missing: ${missingHeaders.join(", ")}`,
      pass,
    };
  },

  toBeWithinPerformanceBudget(received: { executionTime: number }, budget: number) {
    const pass = received.executionTime <= budget;

    return {
      message: () => pass ?
        `Expected execution time ${received.executionTime}ms not to be within budget ${budget}ms` :
        `Expected execution time ${received.executionTime}ms to be within budget ${budget}ms`,
      pass,
    };
  },

  toHaveValidPagination(received: any) {
    const errors: string[] = [];

    if (!received.meta) {
      errors.push("Missing pagination meta object");
    } else {
      const requiredFields = ["page", "limit", "total", "count", "hasMore"];
      requiredFields.forEach((field) => {
        if (!(field in received.meta)) {
          errors.push(`Missing pagination field: ${field}`);
        }
      });

      // Validate pagination logic
      if (received.meta.page && received.meta.page < 1) {
        errors.push("Page number should be >= 1");
      }

      if (received.meta.limit && (received.meta.limit < 1 || received.meta.limit > 100)) {
        errors.push("Limit should be between 1 and 100");
      }

      if (received.meta.count && received.meta.total && received.meta.count > received.meta.total) {
        errors.push("Count should not exceed total");
      }

      if (received.data && Array.isArray(received.data)) {
        if (received.data.length !== received.meta.count) {
          errors.push(`Data array length (${received.data.length}) should match count (${received.meta.count})`);
        }
      }

      // Validate hasMore logic
      if (typeof received.meta.hasMore === "boolean" && received.meta.page && received.meta.limit && received.meta.total) {
        const expectedHasMore = (received.meta.page * received.meta.limit) < received.meta.total;
        if (received.meta.hasMore !== expectedHasMore) {
          errors.push(`hasMore should be ${expectedHasMore} based on pagination data`);
        }
      }
    }

    const pass = errors.length === 0;

    return {
      message: () => pass ?
        "Expected response not to have valid pagination" :
        `Expected response to have valid pagination. Issues:\n${errors.join("\n")}`,
      pass,
    };
  },

  toBeValidEventData(received: any) {
    const errors: string[] = [];

    // Required fields for event data
    const requiredFields = ["Event Name", "Date", "Start Time", "Address"];
    requiredFields.forEach((field) => {
      if (!received[field] || received[field].trim() === "") {
        errors.push(`Missing or empty required field: ${field}`);
      }
    });

    // Validate data types and formats
    if (received["Event Name"] && typeof received["Event Name"] !== "string") {
      errors.push("Event Name should be a string");
    }

    if (received["Date"] && typeof received["Date"] !== "string") {
      errors.push("Date should be a string");
    }

    if (received["Start Time"] && typeof received["Start Time"] !== "string") {
      errors.push("Start Time should be a string");
    }

    // Validate time format (basic check for HH:MM format)
    if (received["Start Time"] && !/^\d{1,2}:\d{2}$/.test(received["Start Time"])) {
      errors.push("Start Time should be in HH:MM format");
    }

    // Validate boolean fields
    if (received.active !== undefined && typeof received.active !== "boolean") {
      errors.push("active field should be boolean");
    }

    // Validate source field
    if (received.source && typeof received.source !== "string") {
      errors.push("source field should be string");
    }

    // Validate timestamp format
    if (received.uploadedAt && !isValidISODate(received.uploadedAt)) {
      errors.push("uploadedAt should be valid ISO date string");
    }

    const pass = errors.length === 0;

    return {
      message: () => pass ?
        "Expected data not to be valid event data" :
        `Expected data to be valid event data. Issues:\n${errors.join("\n")}`,
      pass,
    };
  },

  toHaveNoSecurityVulnerabilities(received: any) {
    const vulnerabilities: string[] = [];

    // Check for XSS vulnerabilities
    const xssPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
    ];

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b).*(\bfrom\b|\binto\b|\bwhere\b)/i,
      /('|\")[^'"]*('|").*(\bor\b|\band\b).*('|")[^'"]*('|")/i,
      /;.*(-{2}|\/\*)/,
    ];

    // Check for path traversal
    const pathTraversalPatterns = [
      /\.\.(\/|\\)/,
      /\/(etc\/passwd|windows\/system32)/i,
    ];

    const checkString = (str: string, context: string) => {
      xssPatterns.forEach((pattern) => {
        if (pattern.test(str)) {
          vulnerabilities.push(`Potential XSS in ${context}: ${str.substring(0, 100)}...`);
        }
      });

      sqlPatterns.forEach((pattern) => {
        if (pattern.test(str)) {
          vulnerabilities.push(`Potential SQL injection in ${context}: ${str.substring(0, 100)}...`);
        }
      });

      pathTraversalPatterns.forEach((pattern) => {
        if (pattern.test(str)) {
          vulnerabilities.push(`Potential path traversal in ${context}: ${str.substring(0, 100)}...`);
        }
      });
    };

    const checkObject = (obj: any, path: string = "root") => {
      if (typeof obj === "string") {
        checkString(obj, path);
      } else if (typeof obj === "object" && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          checkObject(value, `${path}.${key}`);
        });
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          checkObject(item, `${path}[${index}]`);
        });
      }
    };

    checkObject(received);

    const pass = vulnerabilities.length === 0;

    return {
      message: () => pass ?
        "Expected data to have security vulnerabilities" :
        `Expected data to have no security vulnerabilities. Found:\n${vulnerabilities.join("\n")}`,
      pass,
    };
  },

  toRespondWithinSLA(received: { executionTime: number; endpoint: string }, slaConfig: Record<string, number>) {
    const endpoint = received.endpoint || "unknown";
    const expectedSLA = slaConfig[endpoint] || slaConfig.default || 1000;
    const pass = received.executionTime <= expectedSLA;

    return {
      message: () => pass ?
        `Expected ${endpoint} (${received.executionTime}ms) not to respond within SLA (${expectedSLA}ms)` :
        `Expected ${endpoint} to respond within SLA. Got ${received.executionTime}ms, expected <= ${expectedSLA}ms`,
      pass,
    };
  },

  toHaveReasonableCacheHeaders(received: any) {
    const errors: string[] = [];

    const cacheControl = received.getHeader ? received.getHeader("cache-control") : received.headers?.["cache-control"];
    const etag = received.getHeader ? received.getHeader("etag") : received.headers?.["etag"];
    const lastModified = received.getHeader ? received.getHeader("last-modified") : received.headers?.["last-modified"];

    if (!cacheControl) {
      errors.push("Missing Cache-Control header");
    } else {
      if (!/max-age=\d+/.test(cacheControl)) {
        errors.push("Cache-Control should include max-age directive");
      }
    }

    if (!etag) {
      errors.push("Missing ETag header");
    } else {
      if (!/^"[^"]+"$/.test(etag)) {
        errors.push("ETag should be properly quoted");
      }
    }

    if (!lastModified) {
      errors.push("Missing Last-Modified header");
    } else {
      const date = new Date(lastModified);
      if (isNaN(date.getTime())) {
        errors.push("Last-Modified should be valid HTTP date");
      }
    }

    const pass = errors.length === 0;

    return {
      message: () => pass ?
        "Expected response not to have reasonable cache headers" :
        `Expected response to have reasonable cache headers. Issues:\n${errors.join("\n")}`,
      pass,
    };
  },
});

// Helper functions
function isValidISODate(dateString: string): boolean {
  if (typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === dateString;
}

// Type declarations for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchAPIContract(expectedContract: any): R;
      toHaveSecurityHeaders(): R;
      toBeWithinPerformanceBudget(budget: number): R;
      toHaveValidPagination(): R;
      toBeValidEventData(): R;
      toHaveNoSecurityVulnerabilities(): R;
      toRespondWithinSLA(slaConfig: Record<string, number>): R;
      toHaveReasonableCacheHeaders(): R;
    }
  }
}
