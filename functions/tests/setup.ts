/**
 * 🧪 ENTERPRISE TEST SETUP - Comprehensive testing environment
 */

// Mock the problematic routers before they're imported
jest.mock("../routes/invites", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, new-cap
  const router = require("express").Router();
  return {
    __esModule: true,
    default: router
  };
});

jest.mock("../routes/admin", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, new-cap
  const router = require("express").Router();
  return {
    __esModule: true,
    default: router
  };
});

// Load test environment variables
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({path: ".env.test"});

// Ensure test environment is set
process.env["NODE_ENV"] = "test";
process.env["FIREBASE_PROJECT_ID"] = process.env["TEST_PROJECT_ID"] || "conference-party-app-test";
process.env["GCLOUD_PROJECT"] = process.env["TEST_PROJECT_ID"] || "conference-party-app-test";

// Mock browser APIs for Node.js test environment
global.navigator = {
  onLine: true,
  userAgent: "jest-test-environment",
  sendBeacon: jest.fn(() => true),
} as any;
process.env["FIREBASE_CONFIG"] = JSON.stringify({
  projectId: process.env["TEST_PROJECT_ID"] || "conference-party-app-test",
  storageBucket: `${process.env["TEST_PROJECT_ID"] || "conference-party-app-test"}.appspot.com`,
  locationId: "us-central",
});

// Set global test timeout
jest.setTimeout(30000);

// Global test utilities
(global as any).testUtils = {
  // Test data factories
  createMockEvent: () => ({
    id: "test-event-123",
    name: "Test Gaming Party",
    venue: "Test Venue",
    datetime: "2025-08-25T20:00:00.000Z",
    description: "Test description",
    capacity: 100,
    attendees: 25,
    tags: ["gaming", "networking"],
    location: {
      lat: 50.9375,
      lng: 6.9603,
      address: "Cologne, Germany",
    },
    created: Date.now(),
    modified: Date.now(),
  }),

  createMockUser: () => ({
    id: "test-user-456",
    persona: "developer",
    profile: {
      name: "Test Developer",
      company: "Test Gaming Studio",
      role: "Senior Developer",
    },
    networking: {
      opportunities: {enabled: true},
      proximity: {enabled: false},
    },
    conferences: {
      "gamescom2025": {
        attended: true,
        connections: 5,
        events: 3,
      },
    },
  }),

  // Mock response helpers
  createMockApiResponse: (data: any, status = 200) => ({
    status,
    data,
    headers: {"content-type": "application/json"},
    config: {},
    statusText: status === 200 ? "OK" : "Error",
  }),

  // Performance testing helpers
  measurePerformance: async (fn: (...args: any[]) => any, iterations = 1000) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    const end = performance.now();
    return {
      totalTime: end - start,
      averageTime: (end - start) / iterations,
      iterations,
    };
  },

  // Wait helper for async tests
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Mock console methods for cleaner test output
const originalConsole = {...console};
(global as any).console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restore console for debugging when needed
(global as any).restoreConsole = () => {
  (global as any).console = originalConsole;
};

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset console mocks
  ((console as any).log as jest.Mock).mockClear();
  ((console as any).warn as jest.Mock).mockClear();
  ((console as any).error as jest.Mock).mockClear();
});

export {};
