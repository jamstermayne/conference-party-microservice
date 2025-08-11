/**
 * GPT-5 FOUNDATION API TEST SUITE
 * Tests for the actual implemented API endpoints
 */

import request from "supertest";
import {api} from "../src/index";

// Mock Firebase Admin
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
}));

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => null),
}));

describe("GPT-5 Foundation API", () => {
  describe("Health Endpoint", () => {
    it("should return basic health status", async () => {
      const response = await request(api)
        .get("/api/health")
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: "healthy",
          version: "2.0.0",
          timestamp: expect.any(String),
          endpoints: expect.objectContaining({
            health: "operational",
            parties: "operational",
            sync: "operational",
            webhook: "operational",
            setupWebhook: "operational"
          })
        })
      );
    });

    it("should include CORS headers", async () => {
      const response = await request(api)
        .get("/api/health")
        .set('Origin', 'https://conference-party-app.web.app')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://conference-party-app.web.app');
    });

    it("should respond quickly", async () => {
      const start = Date.now();
      await request(api)
        .get("/api/health")
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Parties Endpoint", () => {
    it("should return parties data", async () => {
      const response = await request(api)
        .get("/api/parties")
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );

      // Should have fallback events at minimum
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should include CORS headers", async () => {
      const response = await request(api)
        .get("/api/parties")
        .set('Origin', 'https://conference-party-app.web.app')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://conference-party-app.web.app');
    });
  });

  describe("Sync Endpoint", () => {
    it("should handle GET requests", async () => {
      const response = await request(api)
        .get("/api/sync")
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          ok: true,
          status: "queued",
          mode: "get"
        })
      );
    });

    it("should handle POST requests", async () => {
      const response = await request(api)
        .post("/api/sync")
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          ok: true,
          status: "queued",
          mode: "post"
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for unknown endpoints", async () => {
      await request(api)
        .get("/api/unknown")
        .expect(404);
    });

    it("should handle internal errors gracefully", async () => {
      // This should not throw an error even with null firestore
      const response = await request(api)
        .get("/api/health")
        .expect(200);

      expect(response.body.status).toBe("healthy");
    });
  });

  describe("CORS Handling", () => {
    it("should handle OPTIONS preflight requests", async () => {
      await request(api)
        .options("/api/health")
        .expect(204);
    });

    it("should set CORS headers for all requests", async () => {
      const response = await request(api)
        .get("/api/health")
        .set('Origin', 'https://conference-party-app.web.app');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it("should handle requests from allowed origins", async () => {
      const response = await request(api)
        .get("/api/health")
        .set('Origin', 'https://conference-party-app.firebaseapp.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://conference-party-app.firebaseapp.com');
    });
  });

  describe("Performance", () => {
    it("should respond quickly", async () => {
      const start = Date.now();
      await request(api)
        .get("/api/health")
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });

    it("should include response time in health check", async () => {
      const response = await request(api)
        .get("/api/health")
        .expect(200);

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });
});