module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: [
    '<rootDir>/services',
    '<rootDir>/functions',
    '<rootDir>/tests'
  ],

  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        resolveJsonModule: true
      }
    }]
  },

  collectCoverageFrom: [
    'services/**/*.{js,ts}',
    'functions/src/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/__tests__/**',
    '!**/dist/**',
    '!**/lib/**'
  ],

  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@shared/(.*)$': '<rootDir>/services/shared/$1'
  },

  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],

  testTimeout: 10000,

  verbose: true,

  clearMocks: true,
  restoreMocks: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/lib/',
    '/.firebase/'
  ],

  // Module file extensions
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
    'json',
    'node'
  ]
};