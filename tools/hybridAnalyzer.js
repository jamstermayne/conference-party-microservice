// tools/hybridAnalyzer.js
const fs = require('fs');
const path = require('path');

console.log('🔍 HYBRID ARCHITECTURE ANALYZER');
console.log('════════════════════════════════════════════════════════════');

// Check Express routes
function analyzeExpressRoutes() {
  const routesDir = 'src/routes';
  if (!fs.existsSync(routesDir)) return [];
  
  const routes = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
      const endpoints = extractEndpoints(content, file.replace('.js', ''));
      return {
        file: file.replace('.js', ''),
        endpoints: endpoints,
        status: 'EXPRESS_ACTIVE'
      };
    });
    
  return routes;
}

// Check Firebase Functions
function analyzeFirebaseFunctions() {
  const functionsIndex = 'functions/src/index.ts';
  if (!fs.existsSync(functionsIndex)) return [];
  
  const content = fs.readFileSync(functionsIndex, 'utf8');
  const endpoints = extractFirebaseEndpoints(content);
  
  return [{
    file: 'firebase-functions',
    endpoints: endpoints,
    status: 'FIREBASE_ACTIVE'
  }];
}

// Extract Express endpoints with better parsing
function extractEndpoints(content, routeName) {
  const endpoints = [];
  
  // Look for router.get, router.post, etc.
  const routerMatches = content.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
  
  if (routerMatches) {
    routerMatches.forEach(match => {
      const [, method, routePath] = match.match(/router\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/);
      
      // Clean up the path and add /api prefix if missing
      let fullPath = routePath;
      if (!fullPath.startsWith('/api/')) {
        fullPath = `/api/${routeName}${routePath.startsWith('/') ? '' : '/'}${routePath}`;
      }
      
      endpoints.push({ 
        method: method.toUpperCase(), 
        path: fullPath 
      });
    });
  }
  
  // Look for app.use patterns that might define base routes
  const appUseMatches = content.match(/app\.use\s*\(\s*['"`]([^'"`]+)['"`]/g);
  if (appUseMatches && endpoints.length === 0) {
    appUseMatches.forEach(match => {
      const [, basePath] = match.match(/app\.use\s*\(\s*['"`]([^'"`]+)['"`]/);
      endpoints.push({ 
        method: 'ALL', 
        path: basePath 
      });
    });
  }
  
  return endpoints;
}

// Extract Firebase endpoints
function extractFirebaseEndpoints(content) {
  const endpoints = [];
  const pathMatches = content.match(/req\.path\s*===\s*['"](.*?)['"]/g);
  
  if (pathMatches) {
    pathMatches.forEach(match => {
      const path = match.match(/req\.path\s*===\s*['"](.*?)['"]/)[1];
      endpoints.push({ method: 'HTTP', path });
    });
  }
  
  return endpoints;
}

// Check deployment status
function checkDeploymentStatus() {
  const hasFirebaseJson = fs.existsSync('firebase.json');
  const hasPackageJson = fs.existsSync('package.json');
  const hasFunctionsPackage = fs.existsSync('functions/package.json');
  const hasExpressServer = fs.existsSync('src/server.js');
  
  return {
    express: {
      configured: hasPackageJson && hasExpressServer,
      running: false
    },
    firebase: {
      configured: hasFirebaseJson && hasFunctionsPackage,
      deployed: false
    }
  };
}

// Count total endpoints
function countTotalEndpoints(expressRoutes, firebaseRoutes) {
  const expressCount = expressRoutes.reduce((total, route) => total + route.endpoints.length, 0);
  const firebaseCount = firebaseRoutes.reduce((total, route) => total + route.endpoints.length, 0);
  return { express: expressCount, firebase: firebaseCount };
}

// Main analysis
function runAnalysis() {
  console.log('📊 ANALYZING HYBRID ARCHITECTURE...\n');
  
  const expressRoutes = analyzeExpressRoutes();
  const firebaseRoutes = analyzeFirebaseFunctions();
  const deploymentStatus = checkDeploymentStatus();
  const endpointCounts = countTotalEndpoints(expressRoutes, firebaseRoutes);
  
  console.log('🚀 EXPRESS MICROSERVICE ROUTES:');
  if (expressRoutes.length === 0) {
    console.log('   📭 No Express routes found');
  } else {
    expressRoutes.forEach(route => {
      console.log(`   📁 ${route.file}.js (${route.endpoints.length} endpoints)`);
      route.endpoints.forEach(endpoint => {
        console.log(`      ${endpoint.method.padEnd(6)} ${endpoint.path}`);
      });
    });
  }
  
  console.log('\n🔥 FIREBASE FUNCTIONS:');
  if (firebaseRoutes.length === 0) {
    console.log('   📭 No Firebase functions found');
  } else {
    firebaseRoutes.forEach(route => {
      console.log(`   📁 ${route.file} (${route.endpoints.length} endpoints)`);
      route.endpoints.forEach(endpoint => {
        console.log(`      ${endpoint.method.padEnd(6)} ${endpoint.path}`);
      });
    });
  }
  
  console.log('\n📋 DEPLOYMENT STATUS:');
  console.log(`   Express: ${deploymentStatus.express.configured ? '✅' : '❌'} Configured ${deploymentStatus.express.configured ? `(${endpointCounts.express} endpoints)` : ''}`);
  console.log(`   Firebase: ${deploymentStatus.firebase.configured ? '✅' : '❌'} Configured ${deploymentStatus.firebase.configured ? `(${endpointCounts.firebase} endpoints)` : ''}`);
  
  console.log('\n🎯 HANDOVER SUMMARY:');
  console.log(`   Total Express Routes: ${expressRoutes.length} files, ${endpointCounts.express} endpoints`);
  console.log(`   Total Firebase Functions: ${firebaseRoutes.length} files, ${endpointCounts.firebase} endpoints`);
  
  const architectureType = expressRoutes.length > 0 && firebaseRoutes.length > 0 ? 'HYBRID' : 
                          expressRoutes.length > 0 ? 'EXPRESS_ONLY' : 
                          firebaseRoutes.length > 0 ? 'FIREBASE_ONLY' : 'NO_ROUTES';
  console.log(`   Architecture: ${architectureType}`);
  
  console.log('\n💡 MIGRATION STATUS:');
  if (architectureType === 'HYBRID') {
    console.log('   ⚠️  HYBRID ARCHITECTURE DETECTED');
    console.log('   📝 Both Express and Firebase are active');
    console.log('   🎯 Consider completing migration to Firebase');
    
    // Check for duplicated endpoints
    const duplicates = findDuplicateEndpoints(expressRoutes, firebaseRoutes);
    if (duplicates.length > 0) {
      console.log('   🔄 Duplicate endpoints found:');
      duplicates.forEach(dup => {
        console.log(`      ${dup.path} (both Express & Firebase)`);
      });
    }
  } else if (architectureType === 'EXPRESS_ONLY') {
    console.log('   📊 Pure Express microservice architecture');
    console.log('   🎯 Ready for Firebase migration if desired');
  } else if (architectureType === 'FIREBASE_ONLY') {
    console.log('   🔥 Pure Firebase Functions architecture');
    console.log('   ✅ Modern serverless deployment ready');
  }
  
  console.log('\n🔧 NEXT CLAUDE COMMANDS:');
  if (architectureType === 'HYBRID' || architectureType === 'EXPRESS_ONLY') {
    console.log('   npm run dev                     # Start Express server');
    console.log('   npm run api-status             # Test Express endpoints');
  }
  if (architectureType === 'HYBRID' || architectureType === 'FIREBASE_ONLY') {
    console.log('   firebase serve --only functions # Start Firebase emulator');
    console.log('   firebase deploy                 # Deploy Firebase functions');
  }
  console.log('   npm run analyzeHybrid           # Re-run this analysis');
  console.log('   npm run genesis-check           # Check code compliance');
}

// Find duplicate endpoints between Express and Firebase
function findDuplicateEndpoints(expressRoutes, firebaseRoutes) {
  const duplicates = [];
  const expressPaths = [];
  
  expressRoutes.forEach(route => {
    route.endpoints.forEach(endpoint => {
      expressPaths.push(endpoint.path);
    });
  });
  
  firebaseRoutes.forEach(route => {
    route.endpoints.forEach(endpoint => {
      if (expressPaths.some(path => path.includes(endpoint.path) || endpoint.path.includes(path))) {
        duplicates.push({ path: endpoint.path });
      }
    });
  });
  
  return duplicates;
}

runAnalysis();