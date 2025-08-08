/**
 * Global Test Teardown
 * Runs once after all tests to clean up the test environment
 */

const fs = require("fs");
const path = require("path");

module.exports = async () => {
  console.log("\n🧹 Cleaning up enterprise test environment...");

  // Calculate total test execution time
  const totalTime = Date.now() - (global.__TEST_START_TIME__ || Date.now());
  console.log(`⏱️ Total test execution time: ${totalTime}ms`);

  // Display test metrics if available
  if (global.__TEST_METRICS__) {
    const metrics = global.__TEST_METRICS__;
    console.log("📊 Test execution summary:");
    console.log(`  📝 Test suites: ${metrics.suites}`);
    console.log(`  🧪 Total tests: ${metrics.tests}`);
    console.log(`  ✅ Passed: ${metrics.passed}`);
    console.log(`  ❌ Failed: ${metrics.failed}`);
    console.log(`  ⏭️ Skipped: ${metrics.skipped}`);

    if (metrics.tests > 0) {
      const passRate = (metrics.passed / metrics.tests * 100).toFixed(1);
      console.log(`  📈 Pass rate: ${passRate}%`);
    }
  }

  // Generate test summary report
  try {
    const testResultsDir = path.join(__dirname, "../../test-results");
    const summaryPath = path.join(testResultsDir, "test-summary.json");

    const summary = {
      timestamp: new Date().toISOString(),
      execution: {
        totalTime,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        jestWorkerId: process.env.JEST_WORKER_ID,
      },
      metrics: global.__TEST_METRICS__ || {},
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage ? process.cpuUsage() : null,
      },
    };

    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, {recursive: true});
    }

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Test summary saved to: ${summaryPath}`);
  } catch (error) {
    console.warn("⚠️ Failed to write test summary:", error.message);
  }

  // Clean up temporary files and resources
  try {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log("🗑️ Forced garbage collection");
    }

    // Clear any global variables
    delete global.__TEST_START_TIME__;
    delete global.__TEST_METRICS__;

    console.log("🧽 Cleaned up global test state");
  } catch (error) {
    console.warn("⚠️ Error during cleanup:", error.message);
  }

  // Performance analysis
  const memUsage = process.memoryUsage();
  console.log("💾 Final memory usage:");
  console.log(`  Heap used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  console.log(`  Heap total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
  console.log(`  External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);

  // Check for potential memory leaks
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 512) { // 512MB threshold
    console.warn(`⚠️ High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);
    console.warn("   This may indicate a memory leak in tests");
  }

  console.log("✅ Test environment cleanup complete!\n");
};
