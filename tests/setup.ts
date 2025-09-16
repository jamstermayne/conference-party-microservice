// Jest setup file for all tests
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.test' });

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
    deleteUser: jest.fn(),
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      add: jest.fn(),
      get: jest.fn(),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(),
    })),
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn(),
        delete: jest.fn(),
        download: jest.fn(),
        exists: jest.fn(),
      })),
    })),
  })),
}));

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  config: jest.fn(() => ({})),
  https: {
    onRequest: jest.fn((handler) => handler),
    onCall: jest.fn((handler) => handler),
  },
  pubsub: {
    schedule: jest.fn(() => ({
      onRun: jest.fn((handler) => handler),
    })),
    topic: jest.fn(() => ({
      onPublish: jest.fn((handler) => handler),
    })),
  },
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn((handler) => handler),
      onUpdate: jest.fn((handler) => handler),
      onDelete: jest.fn((handler) => handler),
    })),
  },
}));

// Global test utilities
global.testUtils = {
  createMockRequest: (options: any = {}) => ({
    method: options.method || 'GET',
    url: options.url || '/',
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    user: options.user || null,
    ...options,
  }),

  createMockResponse: () => {
    const res: any = {
      statusCode: 200,
      headers: {},
      body: null,
    };

    res.status = jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    });

    res.json = jest.fn((data: any) => {
      res.body = data;
      return res;
    });

    res.send = jest.fn((data: any) => {
      res.body = data;
      return res;
    });

    res.set = jest.fn((key: string, value: string) => {
      res.headers[key] = value;
      return res;
    });

    res.setHeader = jest.fn((key: string, value: string) => {
      res.headers[key] = value;
      return res;
    });

    return res;
  },

  createMockNext: () => jest.fn(),
};

// Extend global namespace
declare global {
  var testUtils: {
    createMockRequest: (options?: any) => any;
    createMockResponse: () => any;
    createMockNext: () => jest.Mock;
  };
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT = 'test-project';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'test-project',
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
});

// Suppress console output during tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Add custom matchers
expect.extend({
  toBeValidResponse(received) {
    const pass =
      received &&
      typeof received.statusCode === 'number' &&
      received.statusCode >= 100 &&
      received.statusCode < 600;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to be valid`
          : `Expected response to be valid (statusCode: ${received?.statusCode})`,
    };
  },

  toHaveStatus(received, expectedStatus) {
    const pass = received?.statusCode === expectedStatus;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to have status ${expectedStatus}`
          : `Expected response to have status ${expectedStatus}, but got ${received?.statusCode}`,
    };
  },
});

// Extend Jest matchers types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidResponse(): R;
      toHaveStatus(status: number): R;
    }
  }
}