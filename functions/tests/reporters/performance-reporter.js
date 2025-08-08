/**
 * Custom Jest Performance Reporter
 * Tracks and reports performance metrics for enterprise testing
 */

class PerformanceReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = {
      outputPath: "./test-results/performance-report.json",
      thresholds: {
        slow: 1000, // Tests slower than 1s
        verySlow: 5000, // Tests slower than 5s
      },
      ...options,
    };

    this.testResults = [];
    this.suiteMetrics = new Map();
    this.performanceData = {
      startTime: Date.now(),
      endTime: null,
      totalTime: 0,
      slowTests: [],
      fastTests: [],
      memoryUsage: [],
      testFiles: [],
    };
  }

  onRunStart() {
    this.performanceData.startTime = Date.now();
    this.recordMemoryUsage("start");
    console.log("🎯 Performance monitoring started...");
  }

  onTestFileStart(test) {
    const filePath = test.path;
    this.suiteMetrics.set(filePath, {
      startTime: Date.now(),
      testCount: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      slowTests: [],
    });
  }

  onTestFileResult(test, testResults) {
    const filePath = test.path;
    const suiteMetric = this.suiteMetrics.get(filePath);

    if (!suiteMetric) return;

    const endTime = Date.now();
    const duration = endTime - suiteMetric.startTime;

    // Update suite metrics
    suiteMetric.endTime = endTime;
    suiteMetric.duration = duration;
    suiteMetric.testCount = testResults.testResults.length;

    // Process individual test results
    testResults.testResults.forEach((testResult) => {
      const testDuration = testResult.duration || 0;

      // Categorize test performance
      if (testDuration > this.options.thresholds.verySlow) {
        this.performanceData.slowTests.push({
          name: testResult.fullName,
          file: filePath,
          duration: testDuration,
          category: "very-slow",
        });
      } else if (testDuration > this.options.thresholds.slow) {
        this.performanceData.slowTests.push({
          name: testResult.fullName,
          file: filePath,
          duration: testDuration,
          category: "slow",
        });
      } else {
        this.performanceData.fastTests.push({
          name: testResult.fullName,
          file: filePath,
          duration: testDuration,
          category: "fast",
        });
      }

      // Update suite-level counters
      switch (testResult.status) {
      case "passed":
        suiteMetric.passedTests++;
        break;
      case "failed":
        suiteMetric.failedTests++;
        break;
      case "skipped":
      case "pending":
        suiteMetric.skippedTests++;
        break;
      }

      // Track slow tests at suite level
      if (testDuration > this.options.thresholds.slow) {
        suiteMetric.slowTests.push({
          name: testResult.fullName,
          duration: testDuration,
        });
      }
    });

    // Add suite to performance data
    this.performanceData.testFiles.push({
      file: filePath.replace(process.cwd(), "."),
      duration: duration,
      testCount: suiteMetric.testCount,
      passedTests: suiteMetric.passedTests,
      failedTests: suiteMetric.failedTests,
      skippedTests: suiteMetric.skippedTests,
      slowTestCount: suiteMetric.slowTests.length,
      averageTestDuration: suiteMetric.testCount > 0 ? duration / suiteMetric.testCount : 0,
    });

    this.recordMemoryUsage("suite-complete", filePath);
  }

  onRunComplete(contexts, results) {
    this.performanceData.endTime = Date.now();
    this.performanceData.totalTime = this.performanceData.endTime - this.performanceData.startTime;

    this.recordMemoryUsage("end");
    this.generatePerformanceReport(results);
    this.displayPerformanceSummary();
  }

  recordMemoryUsage(phase, context = "") {
    const memUsage = process.memoryUsage();
    this.performanceData.memoryUsage.push({
      phase,
      context,
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    });
  }

  generatePerformanceReport(results) {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuCount: require("os").cpus().length,
        totalMemory: require("os").totalmem(),
        freeMemory: require("os").freemem(),
      },
      execution: {
        totalTime: this.performanceData.totalTime,
        startTime: new Date(this.performanceData.startTime).toISOString(),
        endTime: new Date(this.performanceData.endTime).toISOString(),
        testSuites: results.numTotalTestSuites,
        totalTests: results.numTotalTests,
        passedTests: results.numPassedTests,
        failedTests: results.numFailedTests,
        skippedTests: results.numPendingTests,
      },
      performance: {
        slowTests: this.performanceData.slowTests.sort((a, b) => b.duration - a.duration),
        fastTests: this.performanceData.fastTests.slice(0, 10), // Top 10 fastest
        testFiles: this.performanceData.testFiles.sort((a, b) => b.duration - a.duration),
        memoryUsage: this.performanceData.memoryUsage,
        thresholds: this.options.thresholds,
      },
      statistics: this.calculateStatistics(),
      recommendations: this.generateRecommendations(),
    };

    // Write performance report to file
    try {
      const fs = require("fs");
      const path = require("path");

      const outputDir = path.dirname(this.options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
      }

      fs.writeFileSync(this.options.outputPath, JSON.stringify(report, null, 2));
      console.log(`📊 Performance report saved to: ${this.options.outputPath}`);
    } catch (error) {
      console.error("❌ Failed to save performance report:", error.message);
    }
  }

  calculateStatistics() {
    const allTests = [...this.performanceData.slowTests, ...this.performanceData.fastTests];
    const durations = allTests.map((test) => test.duration).filter((d) => d > 0);

    if (durations.length === 0) {
      return {error: "No test duration data available"};
    }

    durations.sort((a, b) => a - b);

    const sum = durations.reduce((a, b) => a + b, 0);
    const mean = sum / durations.length;
    const median = durations[Math.floor(durations.length / 2)];
    const min = durations[0];
    const max = durations[durations.length - 1];

    // Calculate percentiles
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    // Memory statistics
    const memorySnapshots = this.performanceData.memoryUsage.map((m) => m.heapUsed);
    const memoryMin = Math.min(...memorySnapshots);
    const memoryMax = Math.max(...memorySnapshots);
    const memoryIncrease = memoryMax - memoryMin;

    return {
      testDuration: {
        count: durations.length,
        mean: Math.round(mean),
        median: Math.round(median),
        min: Math.round(min),
        max: Math.round(max),
        p95: Math.round(p95),
        p99: Math.round(p99),
        standardDeviation: Math.round(this.calculateStandardDeviation(durations, mean)),
      },
      memory: {
        minHeapUsed: memoryMin,
        maxHeapUsed: memoryMax,
        heapIncrease: memoryIncrease,
        averageHeapUsed: Math.round(memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length),
      },
      performance: {
        slowTestsCount: this.performanceData.slowTests.length,
        verySlowTestsCount: this.performanceData.slowTests.filter((t) => t.category === "very-slow").length,
        fastTestsCount: this.performanceData.fastTests.length,
        testsPerSecond: Math.round((durations.length * 1000) / this.performanceData.totalTime),
      },
    };
  }

  calculateStandardDeviation(values, mean) {
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  generateRecommendations() {
    const recommendations = [];
    const stats = this.calculateStatistics();

    // Performance recommendations
    if (this.performanceData.slowTests.length > 0) {
      recommendations.push({
        type: "performance",
        severity: "warning",
        message: `${this.performanceData.slowTests.length} tests are running slowly (>${this.options.thresholds.slow}ms)`,
        suggestion: "Consider optimizing these tests or breaking them into smaller units",
      });
    }

    if (stats.performance && stats.performance.verySlowTestsCount > 0) {
      recommendations.push({
        type: "performance",
        severity: "critical",
        message: `${stats.performance.verySlowTestsCount} tests are very slow (>${this.options.thresholds.verySlow}ms)`,
        suggestion: "These tests should be prioritized for optimization or moved to integration test suite",
      });
    }

    // Memory recommendations
    if (stats.memory && stats.memory.heapIncrease > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        type: "memory",
        severity: "warning",
        message: `High memory increase detected: ${Math.round(stats.memory.heapIncrease / 1024 / 1024)}MB`,
        suggestion: "Check for memory leaks in tests or test setup",
      });
    }

    // Concurrency recommendations
    const avgSuiteDuration = this.performanceData.testFiles.reduce((sum, file) => sum + file.duration, 0) / this.performanceData.testFiles.length;
    if (avgSuiteDuration < 1000) { // Less than 1 second
      recommendations.push({
        type: "concurrency",
        severity: "info",
        message: "Test suites are running quickly - consider increasing parallelism",
        suggestion: "Increase maxWorkers in Jest configuration for faster execution",
      });
    }

    return recommendations;
  }

  displayPerformanceSummary() {
    console.log("\n📊 Performance Test Summary");
    console.log("================================");

    const stats = this.calculateStatistics();
    if (stats.error) {
      console.log("❌ No performance data available");
      return;
    }

    console.log(`⏱️  Total execution time: ${this.performanceData.totalTime}ms`);
    console.log(`🧪 Tests per second: ${stats.performance.testsPerSecond}`);
    console.log(`📈 Test duration (avg): ${stats.testDuration.mean}ms`);
    console.log(`📊 Test duration (p95): ${stats.testDuration.p95}ms`);
    console.log(`💾 Memory usage: ${Math.round(stats.memory.averageHeapUsed / 1024 / 1024)}MB avg`);

    // Show slowest tests
    if (this.performanceData.slowTests.length > 0) {
      console.log(`\n🐌 Slowest tests (>${this.options.thresholds.slow}ms):`);
      this.performanceData.slowTests
        .slice(0, 5)
        .forEach((test, i) => {
          console.log(`  ${i + 1}. ${test.name} (${test.duration}ms)`);
        });
    }

    console.log("================================\n");
  }
}

module.exports = PerformanceReporter;
