#!/usr/bin/env node

/**
 * GPT-5 FOUNDATION TEST RUNNER
 * Advanced test execution with reporting and optimization
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: {},
      performance: {},
    };
  }

  async run(options = {}) {
    console.log("🚀 GPT-5 Foundation Test Suite Runner");
    console.log("=====================================");

    try {
      // Pre-test setup
      await this.preTestSetup();

      // Run tests based on options
      if (options.unit) await this.runUnitTests();
      if (options.integration) await this.runIntegrationTests();
      if (options.coverage) await this.runCoverageTests();
      if (options.performance) await this.runPerformanceTests();
      if (options.all || (!options.unit && !options.integration && !options.coverage && !options.performance)) {
        await this.runAllTests();
      }

      // Post-test reporting
      await this.generateReports();
      this.displaySummary();

    } catch (error) {
      console.error("❌ Test runner failed:", error.message);
      process.exit(1);
    }
  }

  async preTestSetup() {
    console.log("🔧 Setting up test environment...");
    
    // Ensure test directories exist
    const testDirs = ["./test-results", "./coverage"];
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Clear previous results
    try {
      execSync("rm -rf ./test-results/* ./coverage/*", { stdio: "pipe" });
    } catch (error) {
      // Ignore errors if directories don't exist
    }

    console.log("✅ Test environment ready");
  }

  async runUnitTests() {
    console.log("\n🧪 Running Unit Tests...");
    
    const unitTestPattern = "tests/unit/*.test.ts";
    return this.executeJest(unitTestPattern, "unit-tests");
  }

  async runIntegrationTests() {
    console.log("\n🔗 Running Integration Tests...");
    
    const integrationTestPattern = "tests/integration/*.test.ts";
    return this.executeJest(integrationTestPattern, "integration-tests");
  }

  async runCoverageTests() {
    console.log("\n📊 Running Coverage Analysis...");
    
    return this.executeJest("tests/**/*.test.ts", "coverage", {
      coverage: true,
      coverageReporters: ["text", "lcov", "html", "json-summary"],
    });
  }

  async runPerformanceTests() {
    console.log("\n⚡ Running Performance Tests...");
    
    const perfTestPattern = "tests/performance/*.test.ts";
    return this.executeJest(perfTestPattern, "performance");
  }

  async runAllTests() {
    console.log("\n🎯 Running Complete Test Suite...");
    
    return this.executeJest("tests/**/*.test.ts", "all-tests", {
      coverage: true,
      verbose: true,
    });
  }

  async executeJest(testPattern, reportName, options = {}) {
    return new Promise((resolve, reject) => {
      const args = ["--testPathPattern", testPattern];
      
      if (options.coverage) {
        args.push("--coverage");
        if (options.coverageReporters) {
          args.push("--coverageReporters", ...options.coverageReporters);
        }
      }

      if (options.verbose) args.push("--verbose");
      
      args.push("--outputFile", `./test-results/${reportName}.json`);
      args.push("--json");

      const jest = spawn("npx", ["jest", ...args], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: process.cwd(),
      });

      let stdout = "";
      let stderr = "";

      jest.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      jest.stderr.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      jest.on("close", (code) => {
        try {
          // Parse Jest output for results
          this.parseJestOutput(stdout, reportName);
          resolve({ code, stdout, stderr });
        } catch (error) {
          reject(error);
        }
      });

      jest.on("error", (error) => {
        reject(error);
      });
    });
  }

  parseJestOutput(output, reportName) {
    try {
      // Look for JSON output in the last line
      const lines = output.split("\n");
      const jsonLine = lines.find(line => line.trim().startsWith("{") && line.includes("testResults"));
      
      if (jsonLine) {
        const results = JSON.parse(jsonLine);
        this.results.total += results.numTotalTests || 0;
        this.results.passed += results.numPassedTests || 0;
        this.results.failed += results.numFailedTests || 0;
        this.results.skipped += results.numPendingTests || 0;

        // Save detailed results
        fs.writeFileSync(
          `./test-results/${reportName}-detailed.json`,
          JSON.stringify(results, null, 2)
        );
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse Jest output for ${reportName}:`, error.message);
    }
  }

  async generateReports() {
    console.log("\n📊 Generating test reports...");

    // Generate HTML report
    await this.generateHtmlReport();

    // Generate performance report
    await this.generatePerformanceReport();

    // Generate coverage summary
    await this.generateCoverageSummary();

    console.log("✅ Reports generated in ./test-results/");
  }

  async generateHtmlReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GPT-5 Foundation Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2d3748; margin: 0 0 20px 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: #f7fafc; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #2d3748; }
        .stat-label { color: #718096; font-size: 0.9rem; }
        .passed { border-left: 4px solid #38a169; }
        .failed { border-left: 4px solid #e53e3e; }
        .skipped { border-left: 4px solid #d69e2e; }
        .total { border-left: 4px solid #3182ce; }
        .success-rate { border-left: 4px solid #38a169; }
        .timestamp { color: #718096; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 GPT-5 Foundation Test Report</h1>
        <p class="timestamp">Generated: ${new Date().toISOString()}</p>
        
        <div class="stats">
            <div class="stat total">
                <div class="stat-value">${this.results.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat passed">
                <div class="stat-value">${this.results.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat failed">
                <div class="stat-value">${this.results.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat skipped">
                <div class="stat-value">${this.results.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat success-rate">
                <div class="stat-value">${this.calculateSuccessRate()}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>

        <h2>Test Execution Time</h2>
        <p>Total execution time: ${Date.now() - this.startTime}ms</p>
        
        <h2>Coverage</h2>
        <p>Coverage reports available in ./coverage/ directory</p>
        
        <h2>Detailed Results</h2>
        <p>Detailed JSON results available in ./test-results/ directory</p>
    </div>
</body>
</html>`;

    fs.writeFileSync("./test-results/report.html", htmlTemplate);
  }

  async generatePerformanceReport() {
    const perfData = {
      executionTime: Date.now() - this.startTime,
      testResults: this.results,
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    fs.writeFileSync(
      "./test-results/performance.json",
      JSON.stringify(perfData, null, 2)
    );
  }

  async generateCoverageSummary() {
    try {
      if (fs.existsSync("./coverage/coverage-summary.json")) {
        const coverageData = JSON.parse(
          fs.readFileSync("./coverage/coverage-summary.json", "utf8")
        );
        
        this.results.coverage = coverageData;
        
        // Create simplified coverage report
        const summary = {
          statements: coverageData.total?.statements?.pct || 0,
          branches: coverageData.total?.branches?.pct || 0,
          functions: coverageData.total?.functions?.pct || 0,
          lines: coverageData.total?.lines?.pct || 0,
        };

        fs.writeFileSync(
          "./test-results/coverage-summary.json",
          JSON.stringify(summary, null, 2)
        );
      }
    } catch (error) {
      console.warn("⚠️ Could not generate coverage summary:", error.message);
    }
  }

  calculateSuccessRate() {
    if (this.results.total === 0) return 0;
    return Math.round((this.results.passed / this.results.total) * 100);
  }

  displaySummary() {
    const duration = Date.now() - this.startTime;
    
    console.log("\n" + "=".repeat(50));
    console.log("📋 TEST EXECUTION SUMMARY");
    console.log("=".repeat(50));
    console.log(`⏱️  Total Time: ${duration}ms`);
    console.log(`📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`🎯 Success Rate: ${this.calculateSuccessRate()}%`);
    
    if (this.results.coverage.total) {
      const cov = this.results.coverage.total;
      console.log(`📈 Coverage: ${cov.statements?.pct || 0}% statements, ${cov.branches?.pct || 0}% branches`);
    }
    
    console.log("\n📁 Reports generated:");
    console.log("   ./test-results/report.html");
    console.log("   ./coverage/lcov-report/index.html");
    console.log("=".repeat(50));

    // Exit with appropriate code
    if (this.results.failed > 0) {
      console.log("❌ Tests failed");
      process.exit(1);
    } else {
      console.log("✅ All tests passed");
      process.exit(0);
    }
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    unit: args.includes("--unit"),
    integration: args.includes("--integration"),
    coverage: args.includes("--coverage"),
    performance: args.includes("--performance"),
    all: args.includes("--all") || args.length === 0,
  };

  const runner = new TestRunner();
  runner.run(options);
}

module.exports = TestRunner;