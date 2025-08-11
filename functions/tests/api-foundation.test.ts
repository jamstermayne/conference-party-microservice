/**
 * GPT-5 FOUNDATION API TEST SUITE
 * Focused tests for the simplified GPT-5 foundation API
 */

import {Request, Response} from "express";
import {api} from "../src/index";

// Mock Firebase Admin
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
}));

describe("GPT-5 Foundation API", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({json: jsonMock}));
    setHeaderMock = jest.fn();

    req = {
      method: "GET",
      path: "/api/health",
      headers: {
        origin: "https://conference-party-app.web.app",
      },
      query: {},
      body: {},
    };

    res = {
      json: jsonMock,
      status: statusMock,
      setHeader: setHeaderMock,
      send: jest.fn(),
    };

    // Fix chaining for status().send()
    statusMock.mockReturnValue({
      json: jsonMock,
      send: jest.fn(),
    });
  });

  describe("Health Endpoint", () => {
    it("should return basic health status", async () => {
      req.path = "/api/health";

      await api(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          version: "3.1.0",
          environment: expect.any(String),
          responseTime: expect.stringMatching(/\d+ms/),
          timestamp: expect.any(String),
        })
      );
    });

    it("should include CORS information", async () => {
      req.path = "/api/health";

      await api(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cors: expect.objectContaining({
            origin: "https://conference-party-app.web.app",
            allowed: expect.any(Array),
          }),
        })
      );
    });

    it("should set CORS headers", async () => {
      req.path = "/api/health";

      await api(req as Request, res as Response);

      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Origin", expect.any(String));
      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Headers", expect.stringContaining("Content-Type"));
    });
  });

  describe("Invite Validation Endpoint", () => {
    it("should validate demo invite codes", async () => {
      req.method = "GET"; // Current API only supports GET
      req.path = "/api/invite/validate";
      req.query = {code: "DEMO123"};

      await api(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          valid: true,
          inviterId: "demo-user-1",
          inviterName: "Alex Chen",
        })
      );
    });

    it("should reject codes with valid format but not in database", async () => {
      req.method = "GET";
      req.path = "/api/invite/validate";
      req.query = {code: "NOTFOUND"}; // Valid format (8 chars) but not in database

      await api(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          valid: false,
          reason: "not_found",
        })
      );
    });

    it("should handle missing invite code", async () => {
      req.method = "GET";
      req.path = "/api/invite/validate";
      req.query = {};

      await api(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          valid: false,
          error: "Invite code is required",
        })
      );
    });
  });

  describe("CORS Handling", () => {
    it("should handle OPTIONS preflight requests", async () => {
      req.method = "OPTIONS";
      req.path = "/api/health";

      await api(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Origin", expect.any(String));
    });

    it("should set CORS headers for all requests", async () => {
      req.path = "/api/health";

      await api(req as Request, res as Response);

      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Origin", expect.any(String));
      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Methods", expect.any(String));
      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Headers", expect.any(String));
    });

    it("should handle requests from allowed origins", async () => {
      req.headers!.origin = "https://conference-party-app.firebaseapp.com";
      req.path = "/api/health";

      await api(req as Request, res as Response);

      expect(setHeaderMock).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://conference-party-app.firebaseapp.com");
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for unknown endpoints", async () => {
      req.path = "/api/unknown";

      await api(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Endpoint not found",
          availableEndpoints: ["/health", "/invite/validate"],
        })
      );
    });

    it("should handle internal errors gracefully", async () => {
      // Force an error by providing invalid response object
      const invalidRes = {
        ...res,
        json: jest.fn(() => {throw new Error("Mock error");}),
      };

      req.path = "/api/health";

      await api(req as Request, invalidRes as Response);

      // Should not throw and should handle error gracefully
      expect(true).toBe(true); // Test passes if no exception thrown
    });
  });

  describe("Performance", () => {
    it("should respond quickly", async () => {
      const startTime = Date.now();
      req.path = "/api/health";

      await api(req as Request, res as Response);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100); // Should respond in < 100ms
    });

    it("should include response time in health check", async () => {
      req.path = "/api/health";

      await api(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          responseTime: expect.stringMatching(/^\d+ms$/),
        })
      );
    });
  });
});
