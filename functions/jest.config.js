module.exports = {
  // Core Jest Configuration
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  
  // TypeScript Configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: false,
        isolatedModules: true,
        tsconfig: {
          compilerOptions: {
            target: 'es2020',
            module: 'commonjs',
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            skipLibCheck: true
          }
        }
      }
    ]
  },

  // Test Discovery
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  
  // Test Organization
  projects: [
    {
      displayName: '🧪 Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      testTimeout: 10000
    },
    {
      displayName: '🔗 Integration Tests', 
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testTimeout: 30000
    },
    {
      displayName: '🔒 Security Tests',
      testMatch: ['<rootDir>/tests/security/**/*.test.ts'],
      testTimeout: 30000
    },
    {
      displayName: '⚡ Load Tests',
      testMatch: ['<rootDir>/tests/load/**/*.test.ts'],
      testTimeout: 120000,
      maxWorkers: 2
    }
  ],

  // Coverage Configuration
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/test-utils/**',
    '!src/types/**',
    '!src/**/*.mock.{js,ts}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Specific thresholds for different modules
    'src/utils/': {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95
    },
    'src/security/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },

  // Test Environment Setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/tests/utils/custom-matchers.ts'
  ],
  globalSetup: '<rootDir>/tests/config/global-setup.js',
  globalTeardown: '<rootDir>/tests/config/global-teardown.js',

  // Performance & Execution
  testTimeout: 30000, // Default timeout
  verbose: true,
  bail: false,
  maxWorkers: '50%',
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,

  // Reporting
  reporters: [
    'default',
    [
      './tests/reporters/performance-reporter.js',
      {
        outputPath: './test-results/performance-report.json'
      }
    ]
  ],

  // Error Handling
  errorOnDeprecated: true,
  notify: false,
  notifyMode: 'failure-change',

  // Custom Test Environment Variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error'
  },

  // Module Resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/tests/$1'
  },

  // File Watching
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/test-results/',
    '/lib/',
    '/dist/'
  ],

  // Test Filtering
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/test-results/',
    '/lib/',
    '/dist/',
    '.backup',
    '.disabled'
  ],

  // Snapshot Testing
  // snapshotSerializers can be added here if needed

};