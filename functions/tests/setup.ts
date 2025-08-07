/**
 * Basic Jest setup file
 */

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';

// Set timeout for all tests
jest.setTimeout(10000);

export {};