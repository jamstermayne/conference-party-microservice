/**
 * Global Test Teardown
 * Runs once after all tests to clean up the test environment
 */

const fs = require('fs');
const path = require('path');

async function globalTeardown(config) {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up test artifacts
  await cleanupTestArtifacts();
  
  // Generate test report summary
  await generateTestReport();
  
  console.log('✅ Global test teardown complete');
}

async function cleanupTestArtifacts() {
  console.log('  🗑️  Cleaning up test artifacts...');
  
  // Clean up temporary test files
  const tempDir = path.join(process.cwd(), 'tests', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Clean up screenshots from failed tests older than 7 days
  const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
  if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir);
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(screenshotsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < oneWeekAgo) {
        fs.unlinkSync(filePath);
      }
    });
  }
  
  console.log('  ✅ Test artifacts cleaned');
}

async function generateTestReport() {
  console.log('  📊 Generating test report summary...');
  
  // Read test results if available
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
  
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      // Calculate summary statistics
      const summary = {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        testSuites: {}
      };
      
      if (results.suites) {
        results.suites.forEach(suite => {
          summary.testSuites[suite.title] = {
            total: suite.specs.length,
            passed: suite.specs.filter(s => s.ok).length,
            failed: suite.specs.filter(s => !s.ok && !s.skipped).length,
            skipped: suite.specs.filter(s => s.skipped).length
          };
          
          summary.totalTests += suite.specs.length;
          summary.passed += summary.testSuites[suite.title].passed;
          summary.failed += summary.testSuites[suite.title].failed;
          summary.skipped += summary.testSuites[suite.title].skipped;
        });
      }
      
      // Calculate pass rate
      const passRate = summary.totalTests > 0 
        ? ((summary.passed / summary.totalTests) * 100).toFixed(2)
        : 0;
      
      // Generate summary report
      const report = `
╔════════════════════════════════════════════╗
║           TEST EXECUTION SUMMARY           ║
╚════════════════════════════════════════════╝

📊 Overall Statistics:
  • Total Tests: ${summary.totalTests}
  • Passed: ${summary.passed} ✅
  • Failed: ${summary.failed} ❌
  • Skipped: ${summary.skipped} ⏭️
  • Pass Rate: ${passRate}%

📁 Test Suites:
${Object.entries(summary.testSuites).map(([name, stats]) => `
  ${name}:
    • Total: ${stats.total}
    • Passed: ${stats.passed}
    • Failed: ${stats.failed}
    • Skipped: ${stats.skipped}
`).join('')}

${summary.failed > 0 ? `
⚠️  Failed Tests Detected!
Please review the test results at:
  • HTML Report: test-results/html/index.html
  • JSON Report: test-results/results.json
` : '✅ All tests passed successfully!'}

Generated at: ${new Date().toISOString()}
`;
      
      // Write summary to file
      const summaryPath = path.join(process.cwd(), 'test-results', 'summary.txt');
      fs.writeFileSync(summaryPath, report);
      
      // Output to console
      console.log(report);
      
      // Create a simple HTML dashboard
      const htmlDashboard = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Results Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
    }
    .passed { color: #10b981; }
    .failed { color: #ef4444; }
    .skipped { color: #f59e0b; }
    .suite-results {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Test Results Dashboard</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${summary.totalTests}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card">
        <div class="stat-value passed">${summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value failed">${summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value skipped">${summary.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${passRate}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
    </div>
    
    <div class="suite-results">
      <h2>Test Suites</h2>
      <table>
        <thead>
          <tr>
            <th>Suite Name</th>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(summary.testSuites).map(([name, stats]) => `
          <tr>
            <td>${name}</td>
            <td>${stats.total}</td>
            <td class="passed">${stats.passed}</td>
            <td class="failed">${stats.failed}</td>
            <td class="skipped">${stats.skipped}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
`;
      
      const dashboardPath = path.join(process.cwd(), 'test-results', 'dashboard.html');
      fs.writeFileSync(dashboardPath, htmlDashboard);
      
    } catch (error) {
      console.error('  ❌ Failed to generate test report:', error);
    }
  } else {
    console.log('  ℹ️  No test results found to generate report');
  }
  
  console.log('  ✅ Test report generated');
}

module.exports = globalTeardown;