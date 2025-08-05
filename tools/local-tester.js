#!/usr/bin/env node

const { spawn } = require('child_process');

/**
 * Local Testing Tool - Avoid Slow Deployments
 * Test Firebase Functions locally with emulator
 * Immediate feedback without 2-minute deploy cycles
 */

class LocalTester {
  constructor() {
    this.emulatorPort = 5001;
    this.emulatorUrl = `http://localhost:${this.emulatorPort}/conference-party-app/us-central1/api`;
  }

  async startAndTest() {
    console.log('🚀 LOCAL TESTER - AVOID SLOW DEPLOYMENTS');
    console.log('═'.repeat(60));
    
    console.log('🔥 Starting Firebase emulator...');
    const emulator = this.startEmulator();
    
    // Wait for emulator to start
    await this.waitForEmulator();
    
    console.log('✅ Emulator started - testing all endpoints...');
    await this.testAllEndpoints();
    
    console.log('🎯 Local testing complete! Press Ctrl+C to stop emulator.');
    
    // Keep emulator running
    return new Promise(() => {});
  }

  startEmulator() {
    const emulator = spawn('firebase', ['emulators:start', '--only', 'functions'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    emulator.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('functions: http://localhost:5001')) {
        console.log('✅ Functions emulator ready');
      }
    });
    
    emulator.stderr.on('data', (data) => {
      // Ignore emulator warnings
    });
    
    return emulator;
  }

  async waitForEmulator() {
    console.log('⏳ Waiting for emulator startup...');
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await this.makeRequest('/health');
        if (response) {
          return;
        }
      } catch (e) {
        // Still starting
      }
      
      await this.sleep(1000);
    }
    
    throw new Error('Emulator failed to start after 30 seconds');
  }

  async testAllEndpoints() {
    const endpoints = [
      { path: '/health', method: 'GET', expected: 'healthy' },
      { path: '/parties/feed', method: 'GET', expected: 'success' },
      { path: '/party-action/handle-swipe', method: 'POST', 
        body: { partyId: 'test-123', action: 'interested' }, expected: 'success' },
      { path: '/calendar/oauth/start', method: 'GET', expected: 'authUrl' },
      { path: '/upload/file', method: 'POST', body: {}, expected: 'error' } // Should fail without file
    ];
    
    console.log('\n🧪 TESTING ALL ENDPOINTS LOCALLY:');
    console.log('─'.repeat(50));
    
    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testEndpoint(endpoint) {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest(endpoint.path, endpoint.method, endpoint.body);
      const duration = Date.now() - startTime;
      
      const success = response && (
        response.toString().includes(endpoint.expected) ||
        (typeof response === 'object' && JSON.stringify(response).includes(endpoint.expected))
      );
      
      const status = success ? '✅' : '❌';
      console.log(`${status} ${endpoint.method} ${endpoint.path} (${duration}ms)`);
      
      if (!success) {
        console.log(`   Expected: ${endpoint.expected}`);
        console.log(`   Got: ${JSON.stringify(response).substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ERROR: ${error.message}`);
    }
  }

  async makeRequest(path, method = 'GET', body = null) {
    const url = `${this.emulatorUrl}${path}`;
    
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, options);
    
    return await response.json();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

if (require.main === module) {
  const tester = new LocalTester();
  tester.startAndTest().catch(console.error);
}

module.exports = LocalTester;