#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');

class ApiTester {
  
  async startServerAndTest() {
    console.log('🚀 STARTING SERVER + API TESTING');
    
    // Start server
    const server = spawn('node', ['src/server.js'], { detached: false });
    
    // Wait for startup
    await this.waitForServer();
    
    // Test endpoints
    await this.testEndpoints();
    
    // Kill server
    server.kill();
  }
  
  async waitForServer(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.makeRequest('GET', '/api/health');
        console.log('✅ Server ready');
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('❌ Server failed to start');
  }
  
  async testEndpoints() {
    const tests = [
      { method: 'GET', path: '/api/health', name: 'Health Check' },
      { method: 'GET', path: '/api/parties/feed', name: 'Parties Feed' },
      { method: 'POST', path: '/api/parties/swipe', name: 'Swipe Action', 
        body: { userId: 'test', partyId: 'party-1', action: 'interested' } }
    ];
    
    for (const test of tests) {
      try {
        const response = await this.makeRequest(test.method, test.path, test.body);
        console.log(`✅ ${test.name}: ${response.status}`);
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }
  
  makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

if (require.main === module) {
  new ApiTester().startServerAndTest().catch(console.error);
}

module.exports = ApiTester;