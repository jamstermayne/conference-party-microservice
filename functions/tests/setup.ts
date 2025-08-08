// Test setup and global mocks

jest.setTimeout(10000);

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [])
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => {
      const mockQuery: any = {
        where: jest.fn((): any => mockQuery),
        get: jest.fn(() => Promise.resolve({
          docs: [
            {
              id: 'test-party-1',
              data: () => ({
                'Event Name': 'Test Party',
                'Date': 'Wed Aug 20',
                'Start Time': '19:00',
                'Address': 'Test Location',
                active: true,
                source: 'test'
              })
            }
          ]
        }))
      };
      return {
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          ref: { id: 'test-doc-id' }
        })),
        where: jest.fn(() => mockQuery),
        get: jest.fn(() => Promise.resolve({
          docs: []
        }))
      };
    }),
    batch: jest.fn(() => ({
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn()
    }))
  }))
}));

// Mock Google Auth
jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn(() => ({
    getClient: jest.fn(() => Promise.resolve({
      request: jest.fn(() => Promise.resolve({
        data: {
          values: [
            ['Event Name', 'Date', 'Start Time', 'Address'],
            ['Test Party', 'Wed Aug 20', '19:00', 'Test Location']
          ]
        }
      }))
    }))
  }))
}));

// Mock Firebase Functions
jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn((options, handler) => {
    if (typeof options === 'function') {
      return options;
    }
    return handler;
  })
}));

// Global test data
export const mockParty = {
  id: 'test-party-1',
  'Event Name': 'Test Gamescom Party',
  'Date': 'Wed Aug 20',
  'Start Time': '19:00',
  'End Time': '23:00',
  'Address': 'Test Venue, Cologne, Germany',
  'Hosts': 'Test Company',
  'Category': 'Mixer',
  'Price': 'Free',
  'Focus': 'All',
  active: true,
  source: 'gamescom-sheets',
  uploadedAt: '2025-08-05T21:04:33.731Z'
};

export const mockParties = [mockParty];

// Global test utilities
export const createMockRequest = (options: {
  method?: string;
  path?: string;
  body?: any;
  query?: any;
  headers?: any;
} = {}): any => ({
  method: options.method || 'GET',
  path: options.path || '/',
  body: options.body || {},
  query: options.query || {},
  headers: options.headers || {},
  rawBody: Buffer.from(''),
  get: jest.fn(),
  header: jest.fn(),
  accepts: jest.fn()
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// Setup test environment
beforeAll(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  jest.clearAllMocks();
});