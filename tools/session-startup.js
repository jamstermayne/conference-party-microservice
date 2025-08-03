#!/usr/bin/env node
const { execSync, exec } = require('child_process');

console.log('🚀 SESSION STARTUP - CONFERENCE PARTY MICROSERVICE');
console.log('=' .repeat(60));

// Enhanced startup with better error handling and Session 3 goals
async function runCommand(command, description, options = {}) {
    console.log(`\n🔄 ${description}...`);
    try {
        if (options.background) {
            exec(command);
            console.log(`✅ ${description} started in background`);
        } else {
            execSync(command, { stdio: 'inherit' });
            console.log(`✅ ${description} completed`);
        }
    } catch (error) {
        console.log(`❌ ${description} failed: ${error.message}`);
    }
}

async function startSession() {
    try {
        // Project status check
        await runCommand('npm run api-status', 'PROJECT STATUS CHECK');
        
        // API tests verification  
        await runCommand('npm run api-test', 'API TESTS VERIFICATION');
        
        // Git status check
        await runCommand('git status --porcelain', 'GIT STATUS CHECK');
        
        // Start development server
        await runCommand('npm run dev', 'DEVELOPMENT SERVER', { background: true });
        
        // Display Session 3 goals
        console.log('\n🎯 SESSION 3 PRIORITIES:');
        console.log('🥇 Enhanced Session Startup (COMPLETE)');
        console.log('🥈 Genesis Auto-Optimizer (≤95 lines compliance)');
        console.log('🥉 File Processing Preview (instant file analysis)');
        console.log('\n📋 Building velocity tools for 2x development speed');
        
        // Display available tools
        console.log('\n⚡ AVAILABLE VELOCITY TOOLS:');
        console.log('npm run genesis-fix       # Auto-fix line violations');
        console.log('npm run preview-file      # Instant file analysis');
        console.log('npm run api-status        # Route inspection');
        console.log('npm run api-test          # Endpoint testing');
        
        // Health check after server startup
        console.log('\n🧪 HEALTH CHECK (in 3 seconds)...');
        setTimeout(() => {
            try {
                execSync('curl -s http://localhost:3000/api/health || echo "⏳ Server starting up..."', { stdio: 'inherit' });
            } catch (error) {
                console.log('⏳ Server still starting up...');
            }
        }, 3000);
        
        console.log('\n✅ SESSION 3 READY - VELOCITY TOOLS DEVELOPMENT!');
        console.log('🚀 Maximum development speed with automated tools enabled');
        
    } catch (error) {
        console.error('❌ Session startup failed:', error.message);
        console.log('💡 Try running individual commands manually');
    }
}

// Start the enhanced session
startSession();