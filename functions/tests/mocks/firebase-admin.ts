/**
 * 🔥 Firebase Admin Mock for Testing
 */

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        exists: true,
        data: () => ({
          name: "Test Event",
          venue: "Test Venue",
          datetime: "2025-08-25T20:00:00.000Z",
        }),
      })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    })),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve({
      docs: [
        {
          id: "test-event-1",
          data: () => ({
            name: "Test Event 1",
            venue: "Test Venue 1",
          }),
        },
        {
          id: "test-event-2",
          data: () => ({
            name: "Test Event 2",
            venue: "Test Venue 2",
          }),
        },
      ],
    })),
    add: jest.fn(() => Promise.resolve({id: "new-doc-id"})),
  })),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
};

const mockAuth = {
  verifyIdToken: jest.fn(() => Promise.resolve({
    uid: "test-user-123",
    email: "test@example.com",
  })),
  createUser: jest.fn(() => Promise.resolve({
    uid: "new-user-123",
  })),
  getUserByEmail: jest.fn(() => Promise.resolve({
    uid: "existing-user-123",
    email: "existing@example.com",
  })),
};

const mockApp = {
  firestore: jest.fn(() => mockFirestore),
  auth: jest.fn(() => mockAuth),
};

export const admin = {
  initializeApp: jest.fn(() => mockApp),
  credential: {
    applicationDefault: jest.fn(),
    cert: jest.fn(),
  },
  firestore: jest.fn(() => mockFirestore),
  auth: jest.fn(() => mockAuth),
  app: jest.fn(() => mockApp),
};

export default admin;
