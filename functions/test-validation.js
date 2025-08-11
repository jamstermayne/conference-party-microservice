#!/usr/bin/env node
/**
 * TEST VALIDATION LOGIC
 * Local test to verify our header validation fixes work correctly
 */

const { validateHeaders } = require('./lib/security.js');

console.log('🧪 Testing Header Validation Logic\n');

// Test cases
const testCases = [
  {
    name: 'Normal GET request with standard headers',
    headers: {
      ':method': 'GET',
      ':scheme': 'https', 
      ':authority': 'domain.com',
      ':path': '/api/health',
      'user-agent': 'curl/8.5.0',
      'accept': '*/*',
      'host': 'domain.com'
    },
    expectedResult: true
  },
  {
    name: 'POST request with content headers',
    headers: {
      'user-agent': 'Mozilla/5.0',
      'accept': 'application/json',
      'content-type': 'application/json',
      'content-length': '123',
      'authorization': 'Bearer token123'
    },
    expectedResult: true
  },
  {
    name: 'Request with SQL injection in custom header',
    headers: {
      'user-agent': 'curl/8.5.0',
      'x-custom-header': 'SELECT * FROM users WHERE id=1'
    },
    expectedResult: false
  },
  {
    name: 'Request with XSS attempt in header',
    headers: {
      'user-agent': 'curl/8.5.0',
      'x-malicious': '<script>alert("xss")</script>'
    },
    expectedResult: true // Our validation focuses on SQL patterns, not XSS in headers
  },
  {
    name: 'Request with short custom header values',
    headers: {
      'user-agent': 'curl/8.5.0',
      'x-short': 'ab',
      'x-empty': ''
    },
    expectedResult: true
  },
  {
    name: 'Request with oversized headers',
    headers: {
      'user-agent': 'curl/8.5.0',
      'x-huge': 'x'.repeat(10000)
    },
    expectedResult: false
  }
];

// Create mock request objects
function createMockRequest(headers) {
  return { headers };
}

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  const mockReq = createMockRequest(testCase.headers);
  const result = validateHeaders(mockReq);
  const success = result === testCase.expectedResult;
  
  console.log(`${success ? '✅' : '❌'} ${testCase.name}`);
  console.log(`   Expected: ${testCase.expectedResult}, Got: ${result}`);
  
  if (!success) {
    console.log('   Headers:', Object.keys(testCase.headers));
    failed++;
  } else {
    passed++;
  }
  
  console.log('');
});

console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All validation tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}