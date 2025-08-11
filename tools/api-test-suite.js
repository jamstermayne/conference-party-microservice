#!/usr/bin/env node
/**
 * TOOL #4: API TEST SUITE
 * Automated endpoint testing for Firebase Functions API
 * - Comprehensive endpoint coverage
 * - Response validation
 * - Performance monitoring
 * - Error handling verification
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    API_BASE: 'https://conference-party-app.web.app',
    BACKUP_DIR: path.join(__dirname, 'data-backups'),
    TIMEOUT: 30000, // 30 seconds
    COLORS: {
        SUCCESS: '\x1b[32m',
        ERROR: '\x1b[31m',
        WARNING: '\x1b[33m',
        INFO: '\x1b[36m',
        BOLD: '\x1b[1m',
        RESET: '\x1b[0m'
    }
};

// Ensure backup directory exists
if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
}

// Test results tracking
let testResults = {
    startTime: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: [],
    summary: {},
    performance: {}
};

// Logging utilities
function log(message, color = CONFIG.COLORS.RESET) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${color}[${timestamp}] ${message}${CONFIG.COLORS.RESET}`);
}

function logTest(testName, status, details = '', duration = null) {
    const symbols = {
        PASS: '✅',
        FAIL: '❌', 
        WARN: '⚠️',
        INFO: 'ℹ️'
    };
    
    const colors = {
        PASS: CONFIG.COLORS.SUCCESS,
        FAIL: CONFIG.COLORS.ERROR,
        WARN: CONFIG.COLORS.WARNING,
        INFO: CONFIG.COLORS.INFO
    };
    
    const symbol = symbols[status] || 'ℹ️';
    const color = colors[status] || CONFIG.COLORS.RESET;
    const durationText = duration ? ` (${duration}ms)` : '';
    
    log(`${symbol} ${testName}${durationText}${details ? ': ' + details : ''}`, color);
    
    // Track results
    testResults.totalTests++;
    if (status === 'PASS') testResults.passed++;
    else if (status === 'FAIL') testResults.failed++;
    else if (status === 'WARN') testResults.warnings++;
    
    testResults.tests.push({
        name: testName,
        status,
        details,
        duration,
        timestamp: new Date().toISOString()
    });
}

// HTTP request utility with timeout and error handling
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const method = options.method || 'GET';
        const timeout = options.timeout || CONFIG.TIMEOUT;
        
        const req = https.request(url, { method, ...options }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const duration = Date.now() - startTime;
                
                try {
                    const parsedData = data ? JSON.parse(data) : null;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsedData,
                        rawData: data,
                        duration
                    });
                } catch (parseError) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: null,
                        rawData: data,
                        duration,
                        parseError: parseError.message
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject({
                error: error.message,
                duration: Date.now() - startTime
            });
        });
        
        req.setTimeout(timeout, () => {
            req.destroy();
            reject({
                error: 'Request timeout',
                duration: Date.now() - startTime
            });
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Individual endpoint tests
async function testHealthEndpoint() {
    log('🏥 Testing Health Endpoint', CONFIG.COLORS.BOLD);
    
    try {
        const response = await makeRequest(`${CONFIG.API_BASE}/api/health`);
        
        // Test 1: Status Code
        if (response.statusCode === 200) {
            logTest('Health endpoint status', 'PASS', '200 OK', response.duration);
        } else {
            logTest('Health endpoint status', 'FAIL', `Expected 200, got ${response.statusCode}`, response.duration);
        }
        
        // Test 2: Response Structure
        if (response.data && response.data.status === 'healthy') {
            logTest('Health response format', 'PASS', 'Valid health response structure');
        } else {
            logTest('Health response format', 'FAIL', 'Missing or invalid health status');
        }
        
        // Test 3: Response Time
        if (response.duration < 5000) {
            logTest('Health response time', 'PASS', `${response.duration}ms`);
        } else {
            logTest('Health response time', 'WARN', `Slow response: ${response.duration}ms`);
        }
        
        // Test 4: Required Fields
        const requiredFields = ['status', 'timestamp'];
        const missingFields = requiredFields.filter(field => !response.data || !response.data[field]);
        
        if (missingFields.length === 0) {
            logTest('Health required fields', 'PASS', 'All required fields present');
        } else {
            logTest('Health required fields', 'FAIL', `Missing: ${missingFields.join(', ')}`);
        }
        
        testResults.performance.health = response.duration;
        return response;
        
    } catch (error) {
        logTest('Health endpoint', 'FAIL', error.error || error.message);
        return null;
    }
}

async function testPartiesEndpoint() {
    log('🎉 Testing Parties Endpoint', CONFIG.COLORS.BOLD);
    
    try {
        // Test 1: Basic parties request
        const response = await makeRequest(`${CONFIG.API_BASE}/api/parties`);
        
        if (response.statusCode === 200) {
            logTest('Parties endpoint status', 'PASS', '200 OK', response.duration);
        } else {
            logTest('Parties endpoint status', 'FAIL', `Expected 200, got ${response.statusCode}`, response.duration);
        }
        
        // Test 2: Data structure validation
        if (response.data && Array.isArray(response.data.data)) {
            logTest('Parties data structure', 'PASS', `${response.data.data.length} events returned`);
            
            // Test 3: Event count validation (should be around 65 after cleanup)
            const eventCount = response.data.data.length;
            if (eventCount >= 40 && eventCount <= 100) {
                logTest('Parties event count', 'PASS', `${eventCount} events (reasonable range)`);
            } else if (eventCount > 0) {
                logTest('Parties event count', 'WARN', `${eventCount} events (unexpected count)`);
            } else {
                logTest('Parties event count', 'FAIL', 'No events returned');
            }
        } else {
            logTest('Parties data structure', 'FAIL', 'Invalid or missing data array');
        }
        
        // Test 4: Pagination test
        if (response.data && response.data.data.length >= 50) {
            try {
                const page2Response = await makeRequest(`${CONFIG.API_BASE}/api/parties?page=2`);
                
                if (page2Response.statusCode === 200 && page2Response.data.data.length > 0) {
                    logTest('Parties pagination', 'PASS', `Page 2 has ${page2Response.data.data.length} events`);
                } else if (page2Response.statusCode === 200 && page2Response.data.data.length === 0) {
                    logTest('Parties pagination', 'PASS', 'Page 2 empty (expected for current dataset)');
                } else {
                    logTest('Parties pagination', 'FAIL', `Page 2 returned ${page2Response.statusCode}`);
                }
            } catch (paginationError) {
                logTest('Parties pagination', 'WARN', 'Could not test pagination');
            }
        } else {
            logTest('Parties pagination', 'INFO', 'Pagination test skipped (insufficient data)');
        }
        
        // Test 5: Event schema validation
        if (response.data && response.data.data && response.data.data.length > 0) {
            const sampleEvent = response.data.data[0];
            const hasRequiredFields = sampleEvent['Event Name'] || sampleEvent.Address || sampleEvent.id;
            
            if (hasRequiredFields) {
                logTest('Parties event schema', 'PASS', 'Events have expected fields');
            } else {
                logTest('Parties event schema', 'FAIL', 'Events missing required fields');
            }
        }
        
        testResults.performance.parties = response.duration;
        return response;
        
    } catch (error) {
        logTest('Parties endpoint', 'FAIL', error.error || error.message);
        return null;
    }
}

async function testSyncEndpoint() {
    log('🔄 Testing Sync Endpoint', CONFIG.COLORS.BOLD);
    
    try {
        // Test 1: GET sync (should work)
        const getResponse = await makeRequest(`${CONFIG.API_BASE}/api/sync`);
        
        if (getResponse.statusCode === 200) {
            logTest('Sync GET request', 'PASS', '200 OK', getResponse.duration);
            
            if (getResponse.data && typeof getResponse.data.count === 'number') {
                logTest('Sync response format', 'PASS', `${getResponse.data.count} events in database`);
            } else {
                logTest('Sync response format', 'WARN', 'Unexpected sync response format');
            }
        } else {
            logTest('Sync GET request', 'FAIL', `Expected 200, got ${getResponse.statusCode}`);
        }
        
        // Test 2: POST sync (manual sync trigger) - cautious approach
        log('⚠️  Testing POST sync (this will trigger actual sync)', CONFIG.COLORS.WARNING);
        
        try {
            const postResponse = await makeRequest(`${CONFIG.API_BASE}/api/sync`, { method: 'POST' });
            
            if (postResponse.statusCode === 200) {
                logTest('Sync POST request', 'PASS', 'Manual sync triggered', postResponse.duration);
                
                if (postResponse.data && postResponse.data.success) {
                    logTest('Sync operation', 'PASS', postResponse.data.message || 'Sync completed');
                } else {
                    logTest('Sync operation', 'WARN', 'Sync response unclear');
                }
            } else {
                logTest('Sync POST request', 'FAIL', `Expected 200, got ${postResponse.statusCode}`);
            }
        } catch (postError) {
            logTest('Sync POST request', 'WARN', 'POST sync test failed (this may be expected)');
        }
        
        testResults.performance.sync = getResponse.duration;
        return getResponse;
        
    } catch (error) {
        logTest('Sync endpoint', 'FAIL', error.error || error.message);
        return null;
    }
}

async function testWebhookEndpoint() {
    log('🔗 Testing Webhook Endpoint', CONFIG.COLORS.BOLD);
    
    try {
        // Test 1: GET webhook (should return basic info or 405)
        const getResponse = await makeRequest(`${CONFIG.API_BASE}/webhook`);
        
        if (getResponse.statusCode === 200 || getResponse.statusCode === 405) {
            logTest('Webhook endpoint accessible', 'PASS', `Status ${getResponse.statusCode}`, getResponse.duration);
        } else {
            logTest('Webhook endpoint accessible', 'WARN', `Unexpected status ${getResponse.statusCode}`);
        }
        
        // Test 2: POST webhook (simulate Google Sheets notification)
        // This is risky as it might trigger actual processing, so we'll be careful
        try {
            const webhookHeaders = {
                'x-goog-resource-state': 'sync', // Not 'update' to avoid triggering
                'Content-Type': 'application/json'
            };
            
            const testResponse = await makeRequest(`${CONFIG.API_BASE}/webhook`, {
                method: 'POST',
                headers: webhookHeaders,
                body: JSON.stringify({ test: true })
            });
            
            if (testResponse.statusCode === 200) {
                logTest('Webhook POST handling', 'PASS', 'Webhook accepts POST requests', testResponse.duration);
            } else {
                logTest('Webhook POST handling', 'WARN', `POST returned ${testResponse.statusCode}`);
            }
        } catch (postError) {
            logTest('Webhook POST handling', 'WARN', 'Could not test webhook POST');
        }
        
        testResults.performance.webhook = getResponse.duration;
        return getResponse;
        
    } catch (error) {
        logTest('Webhook endpoint', 'FAIL', error.error || error.message);
        return null;
    }
}

async function testSetupWebhookEndpoint() {
    log('⚙️ Testing Setup Webhook Endpoint', CONFIG.COLORS.BOLD);
    
    try {
        // Test 1: GET setup webhook
        const response = await makeRequest(`${CONFIG.API_BASE}/setupWebhook`);
        
        if (response.statusCode === 200) {
            logTest('Setup webhook status', 'PASS', '200 OK', response.duration);
            
            if (response.data && (response.data.success !== undefined)) {
                logTest('Setup webhook response', 'PASS', 'Valid response structure');
            } else {
                logTest('Setup webhook response', 'WARN', 'Unexpected response format');
            }
        } else if (response.statusCode === 405) {
            logTest('Setup webhook status', 'INFO', 'Method not allowed (expected for GET)');
        } else {
            logTest('Setup webhook status', 'WARN', `Unexpected status ${response.statusCode}`);
        }
        
        testResults.performance.setupWebhook = response.duration;
        return response;
        
    } catch (error) {
        logTest('Setup webhook endpoint', 'FAIL', error.error || error.message);
        return null;
    }
}

// Performance analysis
function analyzePerformance() {
    log('📊 Performance Analysis', CONFIG.COLORS.BOLD);
    
    const performance = testResults.performance;
    const endpoints = Object.keys(performance);
    
    if (endpoints.length === 0) {
        log('No performance data collected', CONFIG.COLORS.WARNING);
        return;
    }
    
    const totalTime = endpoints.reduce((sum, endpoint) => sum + (performance[endpoint] || 0), 0);
    const avgTime = Math.round(totalTime / endpoints.length);
    
    log(`Average response time: ${avgTime}ms`, CONFIG.COLORS.INFO);
    
    endpoints.forEach(endpoint => {
        const time = performance[endpoint];
        const status = time < 1000 ? 'Fast' : time < 3000 ? 'Good' : time < 5000 ? 'Slow' : 'Very Slow';
        const color = time < 1000 ? CONFIG.COLORS.SUCCESS : time < 3000 ? CONFIG.COLORS.INFO : CONFIG.COLORS.WARNING;
        
        log(`${endpoint}: ${time}ms (${status})`, color);
    });
    
    testResults.summary.averageResponseTime = avgTime;
    testResults.summary.totalTestTime = totalTime;
}

// Generate test report
function generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(CONFIG.BACKUP_DIR, `api-test-report-${timestamp}.json`);
    
    testResults.endTime = new Date().toISOString();
    testResults.summary = {
        ...testResults.summary,
        totalTests: testResults.totalTests,
        passed: testResults.passed,
        failed: testResults.failed,
        warnings: testResults.warnings,
        successRate: testResults.totalTests > 0 ? Math.round((testResults.passed / testResults.totalTests) * 100) : 0
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    log(`📋 Test report saved: ${reportPath}`, CONFIG.COLORS.INFO);
    return reportPath;
}

// Test summary
function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 API TEST SUITE RESULTS');
    console.log('='.repeat(60));
    
    log(`Total Tests: ${testResults.totalTests}`, CONFIG.COLORS.BOLD);
    log(`✅ Passed: ${testResults.passed}`, CONFIG.COLORS.SUCCESS);
    log(`❌ Failed: ${testResults.failed}`, CONFIG.COLORS.ERROR);
    log(`⚠️  Warnings: ${testResults.warnings}`, CONFIG.COLORS.WARNING);
    
    const successRate = testResults.totalTests > 0 ? Math.round((testResults.passed / testResults.totalTests) * 100) : 0;
    const overallStatus = testResults.failed === 0 ? 'HEALTHY' : testResults.failed < testResults.passed ? 'DEGRADED' : 'CRITICAL';
    const statusColor = overallStatus === 'HEALTHY' ? CONFIG.COLORS.SUCCESS : 
                       overallStatus === 'DEGRADED' ? CONFIG.COLORS.WARNING : CONFIG.COLORS.ERROR;
    
    log(`Success Rate: ${successRate}%`, CONFIG.COLORS.INFO);
    log(`Overall Status: ${overallStatus}`, statusColor);
    
    console.log('='.repeat(60) + '\n');
}

// Main test runner
async function runAllTests() {
    console.log('\n🚀 TOOL #4: API TEST SUITE STARTING...\n');
    
    const startTime = Date.now();
    
    // Run all endpoint tests
    await testHealthEndpoint();
    console.log();
    
    await testPartiesEndpoint();
    console.log();
    
    await testSyncEndpoint();
    console.log();
    
    await testWebhookEndpoint();
    console.log();
    
    await testSetupWebhookEndpoint();
    console.log();
    
    // Analysis and reporting
    analyzePerformance();
    console.log();
    
    const reportPath = generateReport();
    printSummary();
    
    const totalDuration = Date.now() - startTime;
    log(`🏁 Test suite completed in ${totalDuration}ms`, CONFIG.COLORS.BOLD);
    
    return testResults;
}

// CLI interface
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'health':
            await testHealthEndpoint();
            printSummary();
            break;
            
        case 'parties':
            await testPartiesEndpoint();
            printSummary();
            break;
            
        case 'sync':
            await testSyncEndpoint();
            printSummary();
            break;
            
        case 'webhook':
            await testWebhookEndpoint();
            printSummary();
            break;
            
        case 'setup':
            await testSetupWebhookEndpoint();
            printSummary();
            break;
            
        case 'quick':
            // Quick test - just health and parties
            await testHealthEndpoint();
            await testPartiesEndpoint();
            analyzePerformance();
            generateReport();
            printSummary();
            break;
            
        case 'full':
        default:
            await runAllTests();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('🚨 Test suite error:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests, testHealthEndpoint, testPartiesEndpoint };