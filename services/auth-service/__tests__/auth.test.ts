import request from 'supertest';
import express from 'express';
import { securityMiddleware } from '../../shared/security-middleware';

describe('Auth Service', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add security middleware
    app.use(securityMiddleware.validateInput);

    // Mock endpoints for testing
    app.get('/health', (req, res) => {
      res.status(200).json({
        service: 'auth-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    app.post('/login', (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      // Mock successful login
      res.status(200).json({
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email
        }
      });
    });

    app.post('/register', (req, res) => {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Email, password, and name are required'
        });
      }

      // Mock successful registration
      res.status(201).json({
        success: true,
        user: {
          id: 'user-456',
          email,
          name
        }
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /register', () => {
    it('should register successfully with valid data', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).toHaveProperty('name', 'New User');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'newuser@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security Middleware', () => {
    it('should sanitize XSS attempts in input', async () => {
      const maliciousInput = {
        email: 'test@example.com<script>alert("XSS")</script>',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/register')
        .send(maliciousInput)
        .expect(201);

      // The script tag should be removed by sanitization
      expect(response.body.user.email).not.toContain('<script>');
      expect(response.body.user.email).not.toContain('</script>');
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionAttempt = {
        email: "admin' OR '1'='1",
        password: "password' OR '1'='1",
        name: 'Hacker'
      };

      const response = await request(app)
        .post('/register')
        .send(sqlInjectionAttempt)
        .expect(201);

      // The input should be treated as a string, not executed
      expect(response.body.user.email).toBe("admin' OR '1'='1");
    });
  });
});

describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const app = express();

    // Apply rate limiter (5 requests per minute for testing)
    const testRateLimiter = require('express-rate-limit')({
      windowMs: 60 * 1000,
      max: 5,
      message: 'Too many requests'
    });

    app.use(testRateLimiter);

    app.get('/test', (req, res) => {
      res.json({ success: true });
    });

    // Make 5 requests (should succeed)
    for (let i = 0; i < 5; i++) {
      await request(app).get('/test').expect(200);
    }

    // 6th request should be rate limited
    const response = await request(app).get('/test');
    expect(response.status).toBe(429);
  });
});