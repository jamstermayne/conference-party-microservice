/**
 * 🔥 Firebase Functions Mock for Testing
 */

export const https = {
  onRequest: jest.fn((handler) => handler),
  onCall: jest.fn((handler) => handler),
};

export const firestore = {
  document: jest.fn(() => ({
    onCreate: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
  })),
};

export const auth = {
  user: jest.fn(() => ({
    onCreate: jest.fn(),
    onDelete: jest.fn(),
  })),
};

export const config = jest.fn(() => ({
  firebase: {
    projectId: "test-project",
    databaseURL: "https://test-project.firebaseio.com",
  },
  api: {
    key: "test-api-key",
  },
}));

export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const functions = {
  https,
  firestore,
  auth,
  config,
  logger,
  region: jest.fn().mockReturnThis(),
  runWith: jest.fn().mockReturnThis(),
};

export default functions;
