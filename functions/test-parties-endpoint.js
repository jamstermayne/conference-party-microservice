#!/usr/bin/env node
/**
 * Test that /api/parties endpoint still works after deduplication
 */

const http = require('http');
const express = require('express');

// Import the compiled app
const { api } = require('./lib/src/index.js');

const PORT = 3333;

// Create test server
const server = api.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Make test request with proper host header to avoid redirect
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/api/parties?conference=gamescom2025',
    method: 'GET',
    headers: {
      'Host': 'conference-party-app.web.app'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ /api/parties endpoint working!');
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response has data: ${parsed.data ? 'yes' : 'no'}`);
        console.log(`Event count: ${parsed.data?.length || parsed.count || 0}`);
        console.log(`Source: ${parsed.source || 'unknown'}`);
        
        // Test passed
        server.close();
        process.exit(0);
      } catch (e) {
        console.error('❌ Failed to parse response:', e.message);
        console.error('Response:', data);
        server.close();
        process.exit(1);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
    server.close();
    process.exit(1);
  });
  
  req.end();
});

// Handle server errors
server.on('error', (e) => {
  console.error('❌ Server error:', e.message);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('❌ Test timed out');
  server.close();
  process.exit(1);
}, 5000);