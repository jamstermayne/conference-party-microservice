module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/*.(test|spec).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      useESM: false,
    }],
  },
  collectCoverageFrom: [
    "src/**/*.{js,ts}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{js,ts}",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json"],
  coverageThreshold: {
    "global": {
      branches: 60,
      functions: 70,
      lines: 65,
      statements: 65,
    },
    "./src/index.ts": {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 5000,
  verbose: true,
  bail: false,
  maxWorkers: "75%",
  cache: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./test-results",
        outputName: "junit.xml",
      },
    ],
  ],
};
