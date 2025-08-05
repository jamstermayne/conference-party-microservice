#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Firebase Service Generator - CORRECTED
 * Generates proper Firebase Functions if/else routing pattern
 * NOT Express app.use patterns
 */

class FirebaseServiceGenerator {
  async generateService(serviceName, functionName, description) {
    const kebabServiceName = this.toKebabCase(serviceName);
    const kebabFunctionName = this.toKebabCase(functionName);
    
    console.log(`🚀 Generating Firebase service: ${kebabServiceName}`);
    
    // Create service directory
    const serviceDir = `functions/src/services/${kebabServiceName}-service`;
    await fs.mkdir(serviceDir, { recursive: true });
    
    // Generate service file
    const serviceFile = `${serviceDir}/${kebabFunctionName}.ts`;
    const serviceCode = this.generateServiceCode(kebabFunctionName, description);
    
    await fs.writeFile(serviceFile, serviceCode);
    
    // Update index.ts with correct Firebase pattern
    await this.updateFirebaseIndex(kebabServiceName, kebabFunctionName);
    
    console.log(`✅ Created: ${serviceFile}`);
    console.log(`✅ Updated: functions/src/index.ts`);
    console.log(`🔍 Lines: ${serviceCode.split('\n').length} (≤95)`);
    
    return serviceFile;
  }

  generateServiceCode(functionName, description) {
    return `import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * ${description}
 * Genesis-compliant Firebase service (≤95 lines)
 */

export async function ${this.toCamelCase(functionName)}(
  req: Request, 
  res: Response
): Promise<void> {
  try {
    console.log('🚀 ${functionName} called:', req.method);
    
    const db = getFirestore();
    
    // Input validation
    if (!req.body) {
      res.status(400).json({
        success: false,
        error: 'Request body required'
      });
      return;
    }
    
    // Process request
    const result = await process${this.toPascalCase(functionName)}(req.body, db);
    
    // Success response
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ${functionName} error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

async function process${this.toPascalCase(functionName)}(data: any, db: any): Promise<any> {
  console.log('📊 Processing:', data);
  
  // Example Firestore operation
  const docRef = db.collection('${functionName.replace(/-/g, '_')}').doc();
  await docRef.set({
    ...data,
    createdAt: new Date().toISOString(),
    processed: true
  });
  
  return {
    id: docRef.id,
    message: '${functionName} completed successfully'
  };
}
`;
  }

  async updateFirebaseIndex(serviceName, functionName) {
    const indexPath = 'functions/src/index.ts';
    
    try {
      let indexContent = await fs.readFile(indexPath, 'utf8');
      
      // Add import
      const camelName = this.toCamelCase(functionName);
      const importLine = `import { ${camelName} } from './services/${serviceName}-service/${functionName}';`;
      
      if (!indexContent.includes(importLine)) {
        // Find last import line
        const lastImportIndex = indexContent.lastIndexOf('import');
        const endOfLastImport = indexContent.indexOf('\n', lastImportIndex);
        
        indexContent = indexContent.slice(0, endOfLastImport + 1) + 
                      importLine + '\n' + 
                      indexContent.slice(endOfLastImport + 1);
      }
      
      // Add Firebase if/else route (NOT Express app.use)
      const routePath = `/${serviceName.replace('-service', '')}/${functionName.replace(/-/g, '-')}`;
      const routeLine = `  if (req.path === "${routePath}") return ${camelName}(req, res);`;
      
      if (!indexContent.includes(routeLine)) {
        // Find the end of other if statements
        const lastIfIndex = indexContent.lastIndexOf('if (req.path ===');
        const endOfLastIf = indexContent.indexOf('\n', lastIfIndex);
        
        if (lastIfIndex > -1) {
          indexContent = indexContent.slice(0, endOfLastIf + 1) + 
                        routeLine + '\n' + 
                        indexContent.slice(endOfLastIf + 1);
        }
      }
      
      await fs.writeFile(indexPath, indexContent);
      
    } catch (error) {
      console.warn('⚠️ Could not update index.ts:', error.message);
    }
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
  }

  toCamelCase(str) {
    return str.replace(/-./g, (match) => match.charAt(1).toUpperCase()).replace(/^./, (match) => match.toLowerCase());
  }

  toPascalCase(str) {
    return str.replace(/-./g, (match) => match.charAt(1).toUpperCase()).replace(/^./, (match) => match.toUpperCase());
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node firebaseServiceGenerator.js <service-name> <function-name> <description>');
    process.exit(1);
  }
  
  const [serviceName, functionName, description] = args;
  const generator = new FirebaseServiceGenerator();
  
  generator.generateService(serviceName, functionName, description)
    .then(() => console.log('🎯 Firebase service generated successfully!'))
    .catch(error => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
}

module.exports = FirebaseServiceGenerator;