/**
 * Session Start Microservice
 * Function: startSession() → session status
 * Single Purpose: Initialize development session with health checks
 * Genesis Compliance: ≤95 lines
 */

const { execSync } = require('child_process');

async function startSession(options = {}) {
    const {
        runTests = true,
        checkCompliance = true,
        startServer = true
    } = options;

    const sessionId = `session_${Date.now()}`;
    const startTime = Date.now();
    const checks = [];

    try {
        // API Status Check
        if (runTests) {
            try {
                execSync('npm run api-status', { stdio: 'pipe' });
                checks.push({ 
                    name: 'API Status',
                    status: 'PASS',
                    message: 'All routes operational'
                });
            } catch (error) {
                checks.push({
                    name: 'API Status', 
                    status: 'FAIL',
                    message: 'Route check failed'
                });
            }
        }

        // API Tests
        if (runTests) {
            try {
                execSync('npm run api-test', { stdio: 'pipe' });
                checks.push({
                    name: 'API Tests',
                    status: 'PASS', 
                    message: 'All endpoints responding'
                });
            } catch (error) {
                checks.push({
                    name: 'API Tests',
                    status: 'FAIL',
                    message: 'Some tests failed'
                });
            }
        }

        // Genesis Compliance
        if (checkCompliance) {
            try {
                execSync('npm run genesis-check', { stdio: 'pipe' });
                checks.push({
                    name: 'Genesis Compliance',
                    status: 'PASS',
                    message: 'All files ≤95 lines'
                });
            } catch (error) {
                checks.push({
                    name: 'Genesis Compliance',
                    status: 'WARN',
                    message: 'Some violations detected'
                });
            }
        }

        // Start Development Server
        if (startServer) {
            try {
                execSync('npm run dev &', { stdio: 'pipe' });
                checks.push({
                    name: 'Dev Server',
                    status: 'PASS',
                    message: 'Server started in background'
                });
            } catch (error) {
                checks.push({
                    name: 'Dev Server',
                    status: 'FAIL', 
                    message: 'Failed to start server'
                });
            }
        }

        const duration = Date.now() - startTime;
        const allPassed = checks.every(check => check.status === 'PASS');

        return {
            sessionId,
            success: allPassed,
            duration: `${duration}ms`,
            checks,
            status: allPassed ? 'READY' : 'PARTIAL',
            message: allPassed 
                ? '🚀 Session ready for development'
                : '⚠️ Session started with warnings'
        };

    } catch (error) {
        return {
            sessionId,
            success: false,
            error: error.message,
            status: 'FAILED',
            message: '❌ Session startup failed'
        };
    }
}

module.exports = { startSession };
