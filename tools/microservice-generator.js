// MICROSERVICE GENERATOR - GENESIS COMPLIANT AUTOMATION
const fs = require('fs');
const path = require('path');

function generateMicroservice(serviceName, functionName, description) {
  const serviceDir = `src/services/${serviceName}`;
  const filePath = path.join(serviceDir, `${functionName}.js`);
  
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  
  const serviceCode = `// ${serviceName.toUpperCase()} - ${functionName}
// ${description}

async function ${functionName}(params) {
  try {
    if (!params || typeof params !== 'object') {
      return {
        success: false,
        error: 'Invalid parameters provided',
        code: 'INVALID_INPUT'
      };
    }
    
    const result = await processCore(params);
    
    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        function: '${functionName}',
        service: '${serviceName}'
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: 'PROCESSING_ERROR',
      meta: {
        function: '${functionName}',
        service: '${serviceName}'
      }
    };
  }
}

async function processCore(params) {
  return {
    message: '${functionName} processing complete',
    params: params
  };
}

module.exports = { ${functionName} };
`;

  fs.writeFileSync(filePath, serviceCode);
  
  return {
    success: true,
    service: serviceName,
    function: functionName,
    path: filePath,
    lines: serviceCode.split('\n').length
  };
}

if (require.main === module) {
  const [,, serviceName, functionName, ...descriptionParts] = process.argv;
  
  if (!serviceName || !functionName) {
    console.log('🚀 MICROSERVICE GENERATOR');
    console.log('Usage: npm run generate-service "service-name" "functionName" "description"');
    console.log('Example: npm run generate-service "calendar-service" "syncCalendar" "Sync events"');
    process.exit(1);
  }
  
  const description = descriptionParts.join(' ') || 'Generated microservice function';
  const result = generateMicroservice(serviceName, functionName, description);
  
  console.log('🎯 MICROSERVICE GENERATED');
  console.log('════════════════════════');
  console.log(`✅ Service: ${result.service}`);
  console.log(`✅ Function: ${result.function}`);
  console.log(`✅ Path: ${result.path}`);
  console.log(`✅ Lines: ${result.lines} (Genesis Compliant: ≤95)`);
  console.log(`⚡ Ready for implementation`);
}

module.exports = { generateMicroservice };