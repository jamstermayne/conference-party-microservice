/**
 * Global Test Setup
 * Runs once before all tests to prepare the test environment
 */

const {spawn} = require("child_process");
const path = require("path");

module.exports = async () => {
  console.log("🚀 Setting up enterprise test environment...");

  // Set global test environment variables
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "error";
  process.env.ENABLE_METRICS = "false";
  process.env.ENABLE_TRACING = "false";
  process.env.CACHE_TTL = "1000";
  process.env.MAX_REQUEST_SIZE = "10mb";
  process.env.REQUEST_TIMEOUT = "30000";

  // Firebase emulator configuration
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FUNCTIONS_EMULATOR_HOST = "localhost:5001";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

  // Test-specific configurations
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || "1";
  process.env.FORCE_COLOR = "1"; // Enable colors in test output

  // Create test results directory if it doesn't exist
  const fs = require("fs");
  const testResultsDir = path.join(__dirname, "../../test-results");
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, {recursive: true});
    console.log("📁 Created test-results directory");
  }

  // Initialize test baseline data
  try {
    // You could initialize baseline performance data here
    console.log("📊 Initialized test baseline data");
  } catch (error) {
    console.warn("⚠️ Failed to initialize baseline data:", error.message);
  }

  // Health check for test dependencies
  const healthChecks = [
    {name: "Node.js version", check: () => process.version},
    {name: "Memory", check: () => `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`},
    {name: "Test environment", check: () => process.env.NODE_ENV},
  ];

  console.log("🔍 Health checks:");
  healthChecks.forEach(({name, check}) => {
    try {
      console.log(`  ✅ ${name}: ${check()}`);
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  });

  // Set up test performance monitoring
  global.__TEST_START_TIME__ = Date.now();
  global.__TEST_METRICS__ = {
    suites: 0,
    tests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalTime: 0,
  };

  console.log("✅ Enterprise test environment ready!\n");
};
