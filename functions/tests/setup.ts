/**
 * Enterprise Test Setup
 * Global configuration, mocks, and utilities for all test suites
 */

import {TestEnvironment} from "./utils/test-helpers";
import "./utils/custom-matchers";

// Set up enterprise test environment
TestEnvironment.setupEnterpriseEnv();

// Configure Jest timeout based on test type
const testFile = expect.getState().testPath || "";
const isLoadTest = testFile.includes("/load/");
const isSecurityTest = testFile.includes("/security/");
const isIntegrationTest = testFile.includes("/integration/");

if (isLoadTest) {
  jest.setTimeout(300000); // 5 minutes for load tests
} else if (isSecurityTest) {
  jest.setTimeout(60000); // 1 minute for security tests
} else if (isIntegrationTest) {
  jest.setTimeout(30000); // 30 seconds for integration tests
} else {
  jest.setTimeout(10000); // 10 seconds for unit tests
}

// Global error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Mock Firebase Admin with advanced capabilities
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  applicationDefault: jest.fn(),
  cert: jest.fn(),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => {
      const mockQuery: any = {
        where: jest.fn(function(this: any, field: string, op: string, value: any) {
          return {
            ...mockQuery,
            _filters: [...(this._filters || []), {field, op, value}],
            get: jest.fn(() => Promise.resolve({
              docs: [
                {
                  id: "test-party-1",
                  data: () => ({
                    "Event Name": "Test Enterprise Party",
                    "Date": "Wed Aug 20",
                    "Start Time": "19:00",
                    "End Time": "23:00",
                    "Address": "Enterprise Test Venue, Cologne",
                    "Hosts": "Enterprise Test Company",
                    "Category": "Developer Mixer",
                    "Price": "Free",
                    "Focus": "Game Developers",
                    "Description": "Enterprise test event for comprehensive testing",
                    "active": true,
                    "source": "enterprise-test",
                    "uploadedAt": new Date().toISOString(),
                    "geocoded": {
                      lat: 50.9375,
                      lng: 6.9603,
                      address: "Enterprise Test Venue",
                      confidence: 1.0,
                    },
                  }),
                  exists: true,
                  createTime: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0},
                  updateTime: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0},
                  readTime: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0},
                },
              ],
              size: 1,
              empty: false,
            })),
          };
        }),
        orderBy: jest.fn(function(this: any, field: string, direction: string = "asc") {
          return {...mockQuery, _orderBy: {field, direction}};
        }),
        limit: jest.fn(function(this: any, count: number) {
          return {...mockQuery, _limit: count};
        }),
        offset: jest.fn(function(this: any, count: number) {
          return {...mockQuery, _offset: count};
        }),
        startAt: jest.fn(function(this: any, ...values: any[]) {
          return {...mockQuery, _startAt: values};
        }),
        endAt: jest.fn(function(this: any, ...values: any[]) {
          return {...mockQuery, _endAt: values};
        }),
        get: jest.fn(() => Promise.resolve({
          docs: [],
          size: 0,
          empty: true,
        })),
      };

      return {
        doc: jest.fn((id?: string) => ({
          id: id || "auto-generated-id",
          set: jest.fn((data: any, options?: any) => Promise.resolve()),
          get: jest.fn(() => Promise.resolve({
            id: id || "auto-generated-id",
            exists: true,
            data: () => ({
              "Event Name": "Test Party",
              "active": true,
              "source": "test",
            }),
            createTime: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0},
            updateTime: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0},
            readTime: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0},
          })),
          update: jest.fn((data: any) => Promise.resolve()),
          delete: jest.fn(() => Promise.resolve()),
          collection: jest.fn(() => mockQuery),
          ref: {
            id: id || "auto-generated-id",
            path: `test-collection/${id || "auto-generated-id"}`,
            parent: {path: "test-collection"},
          },
        })),
        add: jest.fn((data: any) => Promise.resolve({
          id: "auto-generated-id",
          ref: {
            id: "auto-generated-id",
            path: "test-collection/auto-generated-id",
          },
        })),
        where: jest.fn(() => mockQuery),
        orderBy: jest.fn(() => mockQuery),
        limit: jest.fn(() => mockQuery),
        offset: jest.fn(() => mockQuery),
        get: jest.fn(() => Promise.resolve({
          docs: [],
          size: 0,
          empty: true,
        })),
      };
    }),
    batch: jest.fn(() => ({
      set: jest.fn((ref: any, data: any, options?: any) => Promise.resolve()),
      update: jest.fn((ref: any, data: any) => Promise.resolve()),
      delete: jest.fn((ref: any) => Promise.resolve()),
      commit: jest.fn(() => Promise.resolve()),
      _operations: [],
    })),
    runTransaction: jest.fn((updateFunction: Function) => {
      const transaction = {
        get: jest.fn((ref: any) => Promise.resolve({
          id: ref.id,
          exists: true,
          data: () => ({test: "data"}),
        })),
        set: jest.fn((ref: any, data: any) => Promise.resolve()),
        update: jest.fn((ref: any, data: any) => Promise.resolve()),
        delete: jest.fn((ref: any) => Promise.resolve()),
      };
      return updateFunction(transaction);
    }),
    settings: jest.fn(),
    enablePersistence: jest.fn(() => Promise.resolve()),
    terminate: jest.fn(() => Promise.resolve()),
    clearPersistence: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock Google Auth with enterprise features
jest.mock("google-auth-library", () => ({
  GoogleAuth: jest.fn(() => ({
    getClient: jest.fn(() => Promise.resolve({
      request: jest.fn((config: any) => {
        // Simulate different responses based on request
        if (config.url?.includes("spreadsheets")) {
          return Promise.resolve({
            data: {
              values: [
                ["Event Name", "Date", "Start Time", "End Time", "Address", "Hosts", "Category", "Price", "Focus"],
                ["Enterprise Gaming Summit", "Wed Aug 20", "19:00", "23:00", "Cologne Convention Center", "Epic Games", "Developer Mixer", "Free", "Game Developers"],
                ["Indie Developer Meetup", "Thu Aug 21", "18:30", "22:00", "GameHub Cologne", "Indie Collective", "Community", "Free", "Indie Developers"],
                ["VR Showcase", "Fri Aug 22", "20:00", "02:00", "VR Arena Cologne", "Meta", "Product Launch", "€25", "All"],
              ],
            },
            status: 200,
            statusText: "OK",
          });
        }
        return Promise.resolve({data: {}, status: 200});
      }),
      getAccessToken: jest.fn(() => Promise.resolve({
        token: "mock-access-token",
        expires_at: Date.now() + 3600000,
      })),
    })),
    getAccessToken: jest.fn(() => Promise.resolve("mock-access-token")),
    getIdToken: jest.fn(() => Promise.resolve("mock-id-token")),
  })),
}));

// Mock Firebase Functions with enterprise configuration
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: jest.fn((options, handler) => {
    if (typeof options === "function") {
      return options;
    }
    return handler;
  }),
  HttpsError: jest.fn((code: string, message: string) => {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).httpErrorCode = {
      "invalid-argument": 400,
      "failed-precondition": 400,
      "out-of-range": 400,
      "unauthenticated": 401,
      "permission-denied": 403,
      "not-found": 404,
      "already-exists": 409,
      "resource-exhausted": 429,
      "cancelled": 499,
      "data-loss": 500,
      "unknown": 500,
      "internal": 500,
      "not-implemented": 501,
      "unavailable": 503,
      "deadline-exceeded": 504,
    }[code] || 500;
    return error;
  }),
}));

// Mock Firebase Functions Logger
jest.mock("firebase-functions/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
}));

// Enhanced global test data with enterprise scenarios
export const mockParty = {
  "id": "enterprise-party-1",
  "Event Name": "Enterprise Gaming Conference 2025",
  "Date": "Wed Aug 20",
  "Start Time": "19:00",
  "End Time": "23:00",
  "Address": "Cologne Convention Center, Hall 7, Cologne, Germany",
  "Hosts": "Epic Games, Ubisoft, EA Games",
  "Category": "Developer Mixer",
  "Price": "Free with Industry ID",
  "Focus": "Game Developers, Publishers",
  "Description": "Join industry leaders for an evening of networking, insights, and demonstrations of cutting-edge gaming technology.",
  "RSVP Link": "https://enterprise-events.gamescom.com/rsvp/epic-mixer-2025",
  "Requirements": "Industry ID, Business Attire",
  "active": true,
  "source": "gamescom-sheets",
  "uploadedAt": "2025-08-05T21:04:33.731Z",
  "geocoded": {
    lat: 50.9375,
    lng: 6.9603,
    address: "Cologne Convention Center, Hall 7",
    confidence: 0.95,
  },
  "metrics": {
    views: 1250,
    likes: 89,
    shares: 23,
    rsvps: 156,
  },
  "tags": ["networking", "developer", "enterprise", "AAA", "industry"],
  "accessibility": {
    wheelchairAccessible: true,
    signLanguage: false,
    assistiveListening: true,
  },
};

export const mockUGCEvent = {
  id: "ugc-event-1",
  title: "Community Gaming Tournament",
  description: "Local esports tournament open to all skill levels",
  venue: "Gaming Lounge Cologne",
  date: "2025-08-21",
  startTime: "18:00",
  endTime: "22:00",
  category: "Tournament",
  isPublic: true,
  maxAttendees: 64,
  currentAttendees: 23,
  tags: ["esports", "tournament", "community", "competitive"],
  createdBy: "user-123",
  createdAt: "2025-08-05T15:30:00.000Z",
  updatedAt: "2025-08-06T09:15:00.000Z",
  status: "active",
  rules: [
    "Respectful behavior required",
    "No outside food or drinks",
    "Tournament format: Double elimination",
  ],
  prizes: {
    first: "€500 + Trophy",
    second: "€200",
    third: "€100",
  },
};

export const mockParties = [mockParty];

// Enhanced global test utilities (maintaining backward compatibility)
export const createMockRequest = (options: {
  method?: string;
  path?: string;
  body?: any;
  query?: any;
  headers?: any;
  params?: any;
  cookies?: any;
  session?: any;
  user?: any;
  ip?: string;
  userAgent?: string;
} = {}): any => ({
  method: options.method || "GET",
  path: options.path || "/",
  url: options.path || "/",
  originalUrl: options.path || "/",
  body: options.body || {},
  query: options.query || {},
  params: options.params || {},
  headers: {
    "content-type": "application/json",
    "user-agent": options.userAgent || "Enterprise-Test-Suite/1.0.0",
    "accept": "application/json",
    "host": "localhost",
    ...options.headers,
  },
  cookies: options.cookies || {},
  session: options.session || {},
  user: options.user || null,
  ip: options.ip || "127.0.0.1",
  ips: [options.ip || "127.0.0.1"],
  protocol: "https",
  secure: true,
  xhr: false,
  fresh: false,
  stale: true,
  hostname: "localhost",
  baseUrl: "",
  subdomains: [],
  rawBody: Buffer.from(JSON.stringify(options.body || {})),
  get: jest.fn((name: string) => (options.headers || {} as any)[name.toLowerCase()]),
  header: jest.fn((name: string) => (options.headers || {} as any)[name.toLowerCase()]),
  accepts: jest.fn(() => true),
  acceptsCharsets: jest.fn(() => true),
  acceptsEncodings: jest.fn(() => true),
  acceptsLanguages: jest.fn(() => true),
  is: jest.fn(() => true),
  route: {path: options.path || "/"},
});

export const createMockResponse = () => {
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
  res.removeHeader = jest.fn((name: string) => delete res._headers[name.toLowerCase()]);

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

  res.redirect = jest.fn((status: number | string, url?: string) => {
    if (typeof status === "string") {
      url = status;
      status = 302;
    }
    res.statusCode = status as number;
    res.setHeader("location", url || "");
    return res;
  });

  res.cookie = jest.fn((name: string, value: any, options?: any) => {
    return res;
  });

  res.clearCookie = jest.fn((name: string) => {
    return res;
  });

  return res;
};

// Global setup and teardown
beforeAll(async () => {
  // Set up enterprise test environment
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.NODE_ENV = "test";
  process.env.FUNCTIONS_EMULATOR_HOST = "localhost:5001";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

  // Enterprise test configuration
  process.env.LOG_LEVEL = "error";
  process.env.ENABLE_METRICS = "false";
  process.env.ENABLE_TRACING = "false";
  process.env.CACHE_TTL = "1000"; // Short cache for testing
  process.env.MAX_REQUEST_SIZE = "10mb";
  process.env.REQUEST_TIMEOUT = "30000";

  // Health check for test infrastructure
  const healthCheck = await TestEnvironment.healthCheck();
  if (!healthCheck) {
    console.warn("⚠️ Firebase emulators may not be running. Some tests may fail.");
  }
});

afterEach(() => {
  jest.clearAllMocks();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

afterAll(async () => {
  // Cleanup test environment
  TestEnvironment.cleanup();

  // Close any remaining handles
  await new Promise((resolve) => setTimeout(resolve, 100));
});
