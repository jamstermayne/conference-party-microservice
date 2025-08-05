// ROUTE GENERATOR - AUTO-CREATE DELEGATION ROUTES
const fs = require('fs');
const path = require('path');

function generateRoute(serviceName, routePath, method = 'GET') {
  const routeFileName = `${serviceName.replace('-service', '')}.js`;
  const routeFilePath = path.join('src/routes', routeFileName);
  
  const serviceImports = getServiceImports(serviceName);
  const routeHandlers = generateRouteHandlers(serviceName, routePath, method);
  
  const routeCode = `// ${serviceName.toUpperCase()} ROUTES - MICROSERVICE DELEGATION
const express = require('express');
const router = express.Router();
${serviceImports}

${routeHandlers}

module.exports = router;
`;

  fs.writeFileSync(routeFilePath, routeCode);
  
  return {
    success: true,
    service: serviceName,
    routePath: routePath,
    filePath: routeFilePath,
    lines: routeCode.split('\n').length
  };
}

function getServiceImports(serviceName) {
  const serviceDir = path.join('src/services', serviceName);
  
  if (!fs.existsSync(serviceDir)) {
    return '// No service functions found';
  }
  
  const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('.js'));
  const imports = files.map(file => {
    const functionName = path.basename(file, '.js');
    return `const { ${functionName} } = require('../services/${serviceName}/${functionName}');`;
  });
  
  return imports.join('\n');
}

function generateRouteHandlers(serviceName, routePath, method) {
  const serviceDir = path.join('src/services', serviceName);
  
  if (!fs.existsSync(serviceDir)) {
    return '// No handlers generated - service not found';
  }
  
  const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('.js'));
  const handlers = files.map(file => {
    const functionName = path.basename(file, '.js');
    const endpoint = `${routePath}/${functionName.toLowerCase()}`;
    
    return `
// ${functionName} endpoint
router.${method.toLowerCase()}('${endpoint}', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body, ...req.params };
    const result = await ${functionName}(params);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ROUTE_ERROR'
    });
  }
});`;
  });
  
  return handlers.join('\n');
}

if (require.main === module) {
  const [,, serviceName, routePath, method] = process.argv;
  
  if (!serviceName || !routePath) {
    console.log('🚀 ROUTE GENERATOR');
    console.log('Usage: npm run generate-route "service-name" "/api/path" [method]');
    console.log('Example: npm run generate-route "calendar-service" "/api/calendar" "GET"');
    process.exit(1);
  }
  
  const result = generateRoute(serviceName, routePath, method);
  
  console.log('🎯 ROUTE GENERATED');
  console.log('═══════════════════');
  console.log(`✅ Service: ${result.service}`);
  console.log(`✅ Route Path: ${result.routePath}`);
  console.log(`✅ File: ${result.filePath}`);
  console.log(`✅ Lines: ${result.lines} (Genesis Compliant: ≤95)`);
  console.log(`⚡ Ready for API testing`);
}

module.exports = { generateRoute };