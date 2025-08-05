// INTEGRATION TESTER - MICROSERVICE COMMUNICATION VALIDATOR
const fs = require('fs');
const path = require('path');

async function testServiceIntegration(serviceName) {
  const results = { service: serviceName, tests: [], passed: 0, failed: 0 };
  
  // Test service directory
  const serviceDir = path.join('src/services', serviceName);
  addTest(results, 'Service Directory', fs.existsSync(serviceDir), serviceDir);
  
  // Test service functions
  if (fs.existsSync(serviceDir)) {
    await testFunctions(serviceDir, results);
  }
  
  // Test route integration
  const routeName = serviceName.replace('-service', '');
  const routePath = path.join('src/routes', `${routeName}.js`);
  addTest(results, 'Route Integration', fs.existsSync(routePath), routePath);
  
  return results;
}

function addTest(results, name, passed, path) {
  results.tests.push({ name, passed, path });
  if (passed) results.passed++;
  else results.failed++;
}

async function testFunctions(serviceDir, results) {
  const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    const functionName = path.basename(file, '.js');
    const filePath = path.join(serviceDir, file);
    
    try {
      const serviceModule = require(path.resolve(filePath));
      const hasFunction = typeof serviceModule[functionName] === 'function';
      addTest(results, `Function: ${functionName}`, hasFunction, filePath);
      
      if (hasFunction) {
        const callResult = await testCall(serviceModule[functionName]);
        addTest(results, `Call: ${functionName}`, callResult, filePath);
      }
      
    } catch (error) {
      addTest(results, `Function: ${functionName}`, false, filePath);
    }
  }
}

async function testCall(func) {
  try {
    const result = await func({ test: true });
    return result && typeof result === 'object' && typeof result.success === 'boolean';
  } catch (error) {
    return false;
  }
}

if (require.main === module) {
  const [,, serviceName] = process.argv;
  
  if (!serviceName) {
    console.log('🧪 INTEGRATION TESTER');
    console.log('Usage: npm run test-integration "service-name"');
    console.log('Example: npm run test-integration "calendar-service"');
    process.exit(1);
  }
  
  testServiceIntegration(serviceName).then(results => {
    console.log('🧪 INTEGRATION TEST RESULTS');
    console.log('═══════════════════════════');
    console.log(`📊 Service: ${results.service}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('');
    
    results.tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
    });
    
    console.log('');
    console.log(results.failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed');
  });
}

module.exports = { testServiceIntegration };