const { execSync } = require('child_process');

async function startSession(options = {}) {
    const { runTests = true, checkCompliance = true, startServer = false } = options;
    const sessionId = `session_${Date.now()}`;
    const startTime = Date.now();
    const checks = [];

    try {
        if (runTests) {
            try {
                execSync('npm run api-status', { stdio: 'pipe', timeout: 5000 });
                checks.push({ name: 'API Status', status: 'PASS', message: 'All routes operational' });
            } catch (error) {
                checks.push({ name: 'API Status', status: 'FAIL', message: 'Route check failed' });
            }
        }

        if (runTests) {
            try {
                execSync('npm run api-test', { stdio: 'pipe', timeout: 10000 });
                checks.push({ name: 'API Tests', status: 'PASS', message: 'All endpoints responding' });
            } catch (error) {
                checks.push({ name: 'API Tests', status: 'FAIL', message: 'Some tests failed' });
            }
        }

        if (checkCompliance) {
            try {
                execSync('npm run genesis-check', { stdio: 'pipe', timeout: 5000 });
                checks.push({ name: 'Genesis Compliance', status: 'PASS', message: 'All files ≤95 lines' });
            } catch (error) {
                checks.push({ name: 'Genesis Compliance', status: 'WARN', message: 'Some violations detected' });
            }
        }

        checks.push({ name: 'Dev Server', status: 'INFO', message: 'Use "npm run dev" to start manually' });

        const duration = Date.now() - startTime;
        const passedChecks = checks.filter(c => c.status === 'PASS').length;
        const totalChecks = checks.filter(c => c.status !== 'INFO').length;

        return {
            sessionId,
            success: passedChecks === totalChecks,
            duration: `${duration}ms`,
            checks,
            status: passedChecks === totalChecks ? 'READY' : 'PARTIAL',
            message: passedChecks === totalChecks ? '🚀 Session ready for development' : '⚠️ Session started with warnings'
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