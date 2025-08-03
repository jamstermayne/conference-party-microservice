#!/usr/bin/env node

/**
 * Session Starter Tool
 * Purpose: CLI tool that calls session-service microservice
 * Pattern: Tool → Microservice (1 function = 1 result)
 * Genesis Compliance: ≤95 lines
 */

const { startSession } = require('../src/services/session-service/start-session');

async function runSessionStarter() {
    console.log('🚀 SESSION STARTUP - MICROSERVICES ARCHITECTURE');
    console.log('═'.repeat(60));
    console.log('📊 Starting development session with microservice health checks');
    
    const options = {
        runTests: true,
        checkCompliance: true,
        startServer: true
    };

    try {
        // Call microservice - single function, single result
        const result = await startSession(options);
        
        console.log(`\n📋 Session ID: ${result.sessionId}`);
        console.log(`⏱️  Duration: ${result.duration}`);
        console.log(`🎯 Status: ${result.status}`);
        
        console.log('\n🔍 Health Checks:');
        result.checks.forEach(check => {
            const icon = check.status === 'PASS' ? '✅' : 
                        check.status === 'WARN' ? '⚠️' : '❌';
            console.log(`   ${icon} ${check.name}: ${check.message}`);
        });

        console.log(`\n${result.message}`);
        
        if (result.success) {
            console.log('\n⚡ Available Commands:');
            console.log('npm run genesis-check    # Check compliance');
            console.log('npm run preview-file     # Preview uploaded files');
            console.log('npm run api-status       # Check API health');
            console.log('npm run api-test         # Test all endpoints');
            
            console.log('\n🎯 Microservices Ready:');
            console.log('• Party Service (feed, swipe, interests)');
            console.log('• Upload Service (file, url)');
            console.log('• Compliance Service (genesis checking)');
            console.log('• Preview Service (CSV, JSON analysis)');
        }

        process.exit(result.success ? 0 : 1);

    } catch (error) {
        console.error('❌ Session startup failed:', error.message);
        process.exit(1);
    }
}

// CLI execution
if (require.main === module) {
    runSessionStarter();
}

module.exports = { runSessionStarter };
