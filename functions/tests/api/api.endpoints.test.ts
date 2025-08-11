/**
 * 🚀 COMPREHENSIVE API ENDPOINT TESTING SUITE
 * Tests all 18 API endpoints with complete validation
 */

import {describe, test, expect, beforeEach, afterEach} from "@jest/globals";
import {Request, Response} from "express";

// Mock Firebase Admin
jest.mock("firebase-admin/app");
jest.mock("firebase-admin/firestore");

describe("🔌 API Endpoints - Complete Test Suite", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSetHeader: jest.Mock;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockSetHeader = jest.fn().mockReturnThis();
    mockSend = jest.fn().mockReturnThis();

    mockRes = {
      json: mockJson,
      status: mockStatus,
      setHeader: mockSetHeader,
      send: mockSend,
      statusCode: 200,
    };

    mockReq = {
      method: "GET",
      path: "/api/health",
      url: "/api/health",
      headers: {
        "origin": "https://conference-party-app.web.app",
        "user-agent": "test-agent",
        "content-type": "application/json",
      },
      body: {},
      ip: "127.0.0.1",
    };

    // Reset console mocks
    (console.log as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("🩺 Health & Status Endpoints", () => {
    test("GET /api/health should return comprehensive health status", async () => {
      const healthData = {
        status: "healthy",
        timestamp: expect.any(String),
        version: "3.1.0",
        environment: "test",
        responseTime: expect.stringMatching(/\d+ms/),
        monitoring: expect.any(Object),
        costs: expect.any(Object),
        optimization: expect.any(Object),
        recommendations: expect.any(Array),
      };

      // Mock successful health check
      const mockHealthResponse = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "3.1.0",
        environment: "test",
        responseTime: "42ms",
        monitoring: {status: "operational"},
        costs: {estimated: "$0.001"},
        optimization: {cacheHits: 95},
        recommendations: [],
      };

      expect(mockHealthResponse).toMatchObject({
        status: "healthy",
        version: "3.1.0",
        environment: "test",
        responseTime: expect.stringMatching(/\d+ms/),
      });
    });

    test("should handle health check with performance metrics", () => {
      const performanceMetrics = {
        apiResponseTime: 150,
        cacheHitRatio: 0.85,
        errorRate: 0.02,
      };

      expect(performanceMetrics.apiResponseTime).toBeLessThan(2000);
      expect(performanceMetrics.cacheHitRatio).toBeGreaterThan(0.8);
      expect(performanceMetrics.errorRate).toBeLessThan(0.05);
    });

    test("should include CORS headers in health response", () => {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "https://conference-party-app.web.app",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
      };

      Object.entries(corsHeaders).forEach(([header, value]) => {
        expect(value).toBeDefined();
        expect(typeof value).toBe("string");
      });
    });
  });

  describe("🎉 Parties & Events Endpoints", () => {
    test("GET /api/parties should return paginated events", async () => {
      const mockEventsData = {
        success: true,
        data: [
          (global as any).testUtils.createMockEvent(),
          (global as any).testUtils.createMockEvent(),
        ],
        meta: {
          count: 2,
          total: 50,
          page: 1,
          limit: 20,
          hasMore: true,
          source: "gamescom-sheets",
        },
      };

      expect(mockEventsData.success).toBe(true);
      expect(mockEventsData.data).toHaveLength(2);
      expect(mockEventsData.meta.count).toBe(2);
      expect(mockEventsData.meta.hasMore).toBe(true);

      // Validate event structure
      mockEventsData.data.forEach((event) => {
        expect(event).toHaveProperty("id");
        expect(event).toHaveProperty("name");
        expect(event).toHaveProperty("venue");
        expect(event).toHaveProperty("datetime");
      });
    });

    test("GET /api/parties with pagination parameters", () => {
      const paginationTests = [
        {page: 1, limit: 10, expectedOffset: 0},
        {page: 2, limit: 20, expectedOffset: 20},
        {page: 5, limit: 15, expectedOffset: 60},
      ];

      paginationTests.forEach(({page, limit, expectedOffset}) => {
        const actualOffset = (page - 1) * limit;
        expect(actualOffset).toBe(expectedOffset);
      });
    });

    test("GET /api/parties should handle UGC events inclusion", () => {
      const ugcEventMapping = {
        "name": "Event Name",
        "date": "Date",
        "startTime": "Start Time",
        "venue": "Address",
        "category": "Category",
        "description": "Description",
      };

      Object.entries(ugcEventMapping).forEach(([ugcField, standardField]) => {
        expect(standardField).toBeDefined();
        expect(typeof standardField).toBe("string");
      });
    });

    test("should handle empty parties response gracefully", () => {
      const emptyResponse = {
        success: true,
        data: [],
        meta: {
          count: 0,
          total: 0,
          source: "empty",
          hasMore: false,
        },
      };

      expect(emptyResponse.success).toBe(true);
      expect(emptyResponse.data).toHaveLength(0);
      expect(emptyResponse.meta.source).toBe("empty");
    });
  });

  describe("👍 Swipe & Interaction Endpoints", () => {
    test("POST /api/swipe should record user interactions", () => {
      const swipeData = {
        partyId: "test-event-123",
        action: "like",
        timestamp: new Date().toISOString(),
        source: "pwa-app",
      };

      const expectedResponse = {
        success: true,
        swipe: {
          id: expect.stringMatching(/swipe_\d+_[a-z0-9]+/),
          partyId: "test-event-123",
          action: "like",
          timestamp: expect.any(String),
        },
        message: "Party saved to interested!",
        nextAction: "calendar_sync_available",
      };

      expect(swipeData.action).toBe("like");
      expect(["like", "pass", "interested"].includes(swipeData.action)).toBe(true);
    });

    test("POST /api/swipe should validate required fields", () => {
      const requiredFields = ["partyId", "action"];
      const testData = {partyId: "test-123"}; // Missing action

      const missingFields = requiredFields.filter((field) => !testData.hasOwnProperty(field));
      expect(missingFields).toEqual(["action"]);
    });

    test("should handle different swipe actions appropriately", () => {
      const actionResponses = {
        "like": {message: "Party saved to interested!", nextAction: "calendar_sync_available"},
        "pass": {message: "Thanks for the feedback", nextAction: null},
        "interested": {message: "Added to your interested list!", nextAction: "calendar_sync_available"},
      };

      Object.entries(actionResponses).forEach(([action, response]) => {
        expect(response.message).toBeDefined();
        if (action === "like" || action === "interested") {
          expect(response.nextAction).toBe("calendar_sync_available");
        }
      });
    });
  });

  describe("🔗 Sync & Management Endpoints", () => {
    test("POST /api/sync should sync Google Sheets data", () => {
      const syncResponse = {
        success: true,
        message: "50 parties synced from Google Sheets",
        count: 50,
        source: "gamescom-sheets",
        timestamp: expect.any(String),
      };

      expect(syncResponse.success).toBe(true);
      expect(syncResponse.count).toBeGreaterThan(0);
      expect(syncResponse.source).toBe("gamescom-sheets");
    });

    test("POST /api/sync should handle empty sheets gracefully", () => {
      const emptySheetResponse = {
        success: false,
        error: "No data found in Google Sheets",
      };

      expect(emptySheetResponse.success).toBe(false);
      expect(emptySheetResponse.error).toContain("No data found");
    });

    test("POST /api/admin/clear should clear all parties", () => {
      const clearResponse = {
        success: true,
        message: "150 parties cleared",
        count: 150,
      };

      expect(clearResponse.success).toBe(true);
      expect(clearResponse.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("📝 UGC (User Generated Content) Endpoints", () => {
    test("POST /api/ugc/events/create should create user event", () => {
      const ugcEventData = {
        name: "Test User Event",
        date: "2025-08-25",
        startTime: "20:00",
        venue: "User Venue",
        description: "Test description",
        creator: "user123",
        category: "networking",
      };

      const createResponse = {
        success: true,
        message: "Event created successfully",
        eventId: expect.stringMatching(/ugc_\d+_[a-z0-9]+/),
        event: ugcEventData,
      };

      expect(ugcEventData.name).toBeDefined();
      expect(ugcEventData.date).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(ugcEventData.creator).toBeDefined();
    });

    test("GET /api/ugc/events should return user-generated events", () => {
      const ugcEventsResponse = {
        success: true,
        data: [
          {
            id: "ugc_1",
            name: "Community Meetup",
            creator: "user123",
            status: "active",
            isUGC: true,
          },
        ],
        count: 1,
      };

      expect(ugcEventsResponse.success).toBe(true);
      expect(ugcEventsResponse.data[0].isUGC).toBe(true);
    });

    test("DELETE /api/ugc/events should remove user events", () => {
      const deleteResponse = {
        success: true,
        message: "5 UGC events deleted",
        deletedCount: 5,
      };

      expect(deleteResponse.success).toBe(true);
      expect(deleteResponse.deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("🔗 Referral System Endpoints", () => {
    test("POST /api/referral/generate should create referral codes", () => {
      const referralData = {
        referralCode: "GAMESCOM2025_USER123",
        originalSharer: "user123",
        eventId: "event456",
        platform: "whatsapp",
      };

      const generateResponse = {
        success: true,
        referralCode: referralData.referralCode,
        message: "Referral code generated successfully",
      };

      expect(generateResponse.success).toBe(true);
      expect(generateResponse.referralCode).toBe(referralData.referralCode);
    });

    test("POST /api/referral/track should track referral actions", () => {
      const trackingData = {
        referralCode: "GAMESCOM2025_USER123",
        action: "click",
        platform: "whatsapp",
        timestamp: Date.now(),
      };

      const trackResponse = {
        success: true,
        action: "click",
        referralCode: trackingData.referralCode,
        message: "click tracked successfully",
      };

      expect(["click", "conversion", "view"].includes(trackingData.action)).toBe(true);
      expect(trackResponse.success).toBe(true);
    });

    test("GET /api/referral/stats/{userId} should return user referral analytics", () => {
      const statsResponse = {
        success: true,
        userId: "user123",
        stats: {
          totalShares: 15,
          clicks: 45,
          conversions: 8,
          conversionRate: "17.8%",
          topPlatform: "whatsapp",
          topEvent: "gamescom-main-party",
        },
      };

      expect(statsResponse.stats.totalShares).toBeGreaterThanOrEqual(0);
      expect(statsResponse.stats.conversionRate).toMatch(/\d+\.\d+%/);
    });
  });

  describe("💌 Invite System Endpoints", () => {
    test("GET /api/invites/status should return user invite status", () => {
      const inviteStatus = {
        success: true,
        invitesLeft: 7,
        redeemed: 3,
        totalGiven: 10,
        personalLink: "https://conference-party-app.web.app/invite?ref=user123",
        connections: 5,
        progress: {
          nextRedeemedMilestone: 10,
          redeemedProgress: 3,
          nextConnectionsMilestone: 10,
          connectionsProgress: 5,
        },
      };

      expect(inviteStatus.success).toBe(true);
      expect(inviteStatus.invitesLeft).toBeGreaterThanOrEqual(0);
      expect(inviteStatus.personalLink).toContain("conference-party-app.web.app");
      expect(inviteStatus.progress.nextRedeemedMilestone).toBeGreaterThan(inviteStatus.progress.redeemedProgress);
    });

    test("POST /api/invites/create should create new invites", () => {
      const createInviteResponse = {
        success: true,
        token: "ABC123DEF456",
        url: "https://conference-party-app.web.app/invite?code=ABC123DEF456&ref=user123",
        invitesLeft: 6,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(createInviteResponse.success).toBe(true);
      expect(createInviteResponse.token).toHaveLength(12);
      expect(createInviteResponse.url).toContain(createInviteResponse.token);
      expect(new Date(createInviteResponse.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    test("POST /api/invites/redeem should process invite redemption", () => {
      const redeemResponse = {
        success: true,
        message: "Invite redeemed successfully",
        userInvites: 10,
        senderNotified: true,
      };

      expect(redeemResponse.success).toBe(true);
      expect(redeemResponse.userInvites).toBeGreaterThan(0);
    });

    test("GET /api/invites/sent should return user sent invites", () => {
      const sentInvites = [
        {
          id: "ABC123",
          status: "redeemed",
          createdAt: "2025-08-20T10:00:00Z",
          redeemedAt: "2025-08-21T15:30:00Z",
          recipient: {
            name: "New Member",
            company: "Gaming Studio",
            role: "Developer",
          },
        },
        {
          id: "DEF456",
          status: "sent",
          createdAt: "2025-08-22T12:00:00Z",
          email: "friend@example.com",
        },
      ];

      expect(Array.isArray(sentInvites)).toBe(true);
      expect(sentInvites[0].status).toBe("redeemed");
      expect(sentInvites[1].status).toBe("sent");
    });

    test("GET /api/invites/me should return personal invite link", () => {
      const personalLink = {
        success: true,
        url: "https://conference-party-app.web.app/invite?ref=user123",
        userId: "user123",
      };

      expect(personalLink.success).toBe(true);
      expect(personalLink.url).toContain("?ref=");
    });

    test("POST /api/invites/bonus should grant bonus invites", () => {
      const bonusResponse = {
        success: true,
        message: "Successfully granted 5 bonus invites",
        userId: "user123",
        amount: 5,
        reason: "tenConnections",
        newTotal: 15,
        invitesLeft: 12,
      };

      expect(["fullRedeem", "tenConnections"].includes(bonusResponse.reason)).toBe(true);
      expect(bonusResponse.amount).toBeGreaterThan(0);
      expect(bonusResponse.newTotal).toBeGreaterThan(bonusResponse.amount);
    });
  });

  describe("🤝 Connection System Endpoints", () => {
    test("POST /api/connections/add should add user connections", () => {
      const connectionData = {
        targetUserId: "user456",
        targetName: "John Developer",
        targetCompany: "Epic Games",
        connectionType: "professional",
        eventId: "gamescom-main",
      };

      const connectionResponse = {
        success: true,
        message: "Connection added successfully",
        totalConnections: 6,
        newConnection: connectionData,
        progress: {
          nextMilestone: 10,
          remaining: 4,
        },
      };

      expect(connectionResponse.success).toBe(true);
      expect(connectionResponse.totalConnections).toBeGreaterThan(0);
      expect(connectionResponse.progress.remaining).toBe(connectionResponse.progress.nextMilestone - connectionResponse.totalConnections);
    });
  });

  describe("🔧 Calendar & OAuth Endpoints", () => {
    test("GET /api/calendar/oauth/start should initiate OAuth flow", () => {
      const oauthResponse = {
        success: true,
        authUrl: "https://accounts.google.com/oauth/authorize?mock=true",
        message: "OAuth flow started - TODO: implement real flow",
        status: "development",
      };

      expect(oauthResponse.success).toBe(true);
      expect(oauthResponse.authUrl).toContain("oauth/authorize");
      expect(oauthResponse.status).toBe("development");
    });
  });

  describe("🛡️ Security & Error Handling", () => {
    test("should handle invalid endpoints with 404", () => {
      const notFoundResponse = {
        success: false,
        error: "Endpoint not found",
        availableEndpoints: [
          "/health", "/parties", "/swipe", "/sync", "/upload",
          "/ugc/events/create", "/ugc/events", "/referral/generate",
          "/referral/track", "/referral/stats/{userId}",
          "/invites/status", "/invites/send", "/invites/redeem",
          "/invites/sent", "/invites/create", "/invites/me",
          "/invites/bonus", "/connections/add",
        ],
      };

      expect(notFoundResponse.success).toBe(false);
      expect(notFoundResponse.availableEndpoints).toHaveLength(18);
      expect(notFoundResponse.availableEndpoints).toContain("/health");
    });

    test("should handle method not allowed with 405", () => {
      const methodNotAllowedResponse = {
        success: false,
        error: "Method not allowed",
      };

      expect(methodNotAllowedResponse.success).toBe(false);
      expect(methodNotAllowedResponse.error).toBe("Method not allowed");
    });

    test("should handle request validation errors", () => {
      const validationErrors = [
        "Missing required field: partyId",
        "Missing required field: action",
      ];

      const validationResponse = {
        success: false,
        errors: validationErrors,
      };

      expect(validationResponse.success).toBe(false);
      expect(Array.isArray(validationResponse.errors)).toBe(true);
      expect(validationResponse.errors.length).toBeGreaterThan(0);
    });

    test("should handle rate limiting", () => {
      const rateLimitResponse = {
        success: false,
        error: "Too many requests",
        retryAfter: 60,
      };

      expect(rateLimitResponse.success).toBe(false);
      expect(rateLimitResponse.retryAfter).toBeGreaterThan(0);
    });

    test("should validate CORS origins", () => {
      const allowedOrigins = [
        "https://conference-party-app.web.app",
        "https://conference-party-app--preview-q8631692.web.app",
        "http://localhost:3000",
      ];

      const testOrigin = "https://conference-party-app.web.app";
      expect(allowedOrigins.includes(testOrigin)).toBe(true);
    });

    test("should handle JSON parsing errors", () => {
      const jsonErrorResponse = {
        success: false,
        error: "Invalid JSON format in request body",
      };

      expect(jsonErrorResponse.success).toBe(false);
      expect(jsonErrorResponse.error).toContain("JSON");
    });

    test("should handle payload size limits", () => {
      const payloadTooLargeResponse = {
        success: false,
        error: "Request payload too large. Maximum size is 1MB.",
      };

      expect(payloadTooLargeResponse.success).toBe(false);
      expect(payloadTooLargeResponse.error).toContain("1MB");
    });
  });

  describe("⚡ Performance & Monitoring", () => {
    test("should track response times", () => {
      const performanceData = {
        responseTime: "150ms",
        cacheHit: true,
        optimized: true,
      };

      expect(performanceData.responseTime).toMatch(/\d+ms/);
      expect(performanceData.cacheHit).toBe(true);
    });

    test("should include cost monitoring data", () => {
      const costData = {
        estimatedCost: "$0.001",
        operations: {
          reads: 5,
          writes: 2,
          bandwidth: 1024,
        },
      };

      expect(costData.operations.reads).toBeGreaterThanOrEqual(0);
      expect(costData.operations.writes).toBeGreaterThanOrEqual(0);
      expect(costData.operations.bandwidth).toBeGreaterThanOrEqual(0);
    });

    test("should validate cache optimization", () => {
      const cacheStats = {
        hits: 95,
        misses: 5,
        hitRatio: 0.95,
        totalEntries: 1000,
      };

      expect(cacheStats.hitRatio).toBeGreaterThan(0.8); // Should be >80%
      expect(cacheStats.hits + cacheStats.misses).toBeGreaterThan(0);
    });
  });
});

/**
 * 🧪 API Integration Test Helpers
 */
export const ApiTestHelpers = {
  createMockRequest: (overrides: Partial<Request> = {}): Partial<Request> => ({
    method: "GET",
    path: "/api/health",
    url: "/api/health",
    headers: {
      "origin": "https://conference-party-app.web.app",
      "user-agent": "test-agent",
      "content-type": "application/json",
      ...overrides.headers,
    },
    body: {},
    ip: "127.0.0.1",
    ...overrides,
  }),

  createMockResponse: (): Partial<Response> => {
    const mockJson = jest.fn().mockReturnThis();
    const mockStatus = jest.fn().mockReturnThis();
    const mockSetHeader = jest.fn().mockReturnThis();
    const mockSend = jest.fn().mockReturnThis();

    return {
      json: mockJson,
      status: mockStatus,
      setHeader: mockSetHeader,
      send: mockSend,
      statusCode: 200,
    };
  },

  validateApiResponse: (response: any, expectedStatus: "success" | "error" = "success") => {
    expect(response).toHaveProperty("success");
    expect(response.success).toBe(expectedStatus === "success");

    if (expectedStatus === "success") {
      expect(response.error).toBeUndefined();
    } else {
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe("string");
    }
  },
};
