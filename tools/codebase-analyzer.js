#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Architecture Auto-Fixer
 * Automatically breaks down monoliths into Genesis-compliant services
 * Creates proper modular architecture when files are too large
 */

class ArchitectureFixer {
  async fix() {
    console.log('🔧 ARCHITECTURE AUTO-FIXER');
    console.log('═'.repeat(50));
    
    const violations = await this.findViolations();
    
    for (const violation of violations) {
      console.log(`🚨 Fixing: ${violation.path} (${violation.lines} lines)`);
      await this.fixMonolith(violation);
    }
    
    console.log('✅ Architecture fixed - all files Genesis compliant!');
  }

  async findViolations() {
    const violations = [];
    const files = await this.findCodeFiles();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n').length;
      
      if (lines > 95) {
        violations.push({ path: file, lines, content });
      }
    }
    
    return violations.sort((a, b) => b.lines - a.lines);
  }

  async findCodeFiles() {
    const files = [];
    const dirs = ['functions/src', 'src', 'tools'];
    
    for (const dir of dirs) {
      try {
        await this.scanDir(dir, files);
      } catch (e) {
        // Dir doesn't exist
      }
    }
    
    return files;
  }

  async scanDir(dir, files) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.scanDir(fullPath, files);
      } else if (/\.(js|ts)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  async fixMonolith(violation) {
    if (violation.path.includes('functions/src/index.ts')) {
      await this.fixFirebaseMonolith(violation);
    } else if (violation.path.includes('tools/')) {
      await this.fixTool(violation);
    } else {
      await this.genericSplit(violation);
    }
  }

  async fixFirebaseMonolith(violation) {
    const routes = this.extractFirebaseRoutes(violation.content);
    console.log(`📍 Found ${routes.length} routes to extract`);
    
    // Create service files
    for (const route of routes) {
      await this.createFirebaseService(route);
    }
    
    // Create new minimal index.ts
    await this.createMinimalIndex(routes);
  }

  extractFirebaseRoutes(content) {
    const routes = [];
    const lines = content.split('\n');
    let currentRoute = null;
    let routeLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('if (req.path === "')) {
        if (currentRoute) {
          routes.push({ ...currentRoute, code: routeLines.join('\n') });
        }
        
        const pathMatch = line.match(/req\.path === "([^"]+)"/);
        currentRoute = {
          path: pathMatch[1],
          method: line.includes('req.method === "POST"') ? 'POST' : 'GET'
        };
        routeLines = [];
      }
      
      if (currentRoute) {
        routeLines.push(line);
      }
    }
    
    if (currentRoute) {
      routes.push({ ...currentRoute, code: routeLines.join('\n') });
    }
    
    return routes;
  }

  async createFirebaseService(route) {
    const serviceName = route.path.split('/')[1];
    const functionName = route.path.split('/').slice(2).join('-');
    
    const serviceDir = `functions/src/services/${serviceName}-service`;
    await fs.mkdir(serviceDir, { recursive: true });
    
    const serviceCode = this.generateFirebaseServiceCode(route, functionName);
    const servicePath = `${serviceDir}/${functionName}.ts`;
    
    await fs.writeFile(servicePath, serviceCode);
    console.log(`✅ Created: ${servicePath}`);
  }

  generateFirebaseServiceCode(route, functionName) {
    return `import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function ${this.toCamelCase(functionName)}(req: Request, res: Response) {
${route.code.replace(/^\s{2}/gm, '')}
}
`;
  }

  async createMinimalIndex(routes) {
    const imports = routes.map(route => {
      const serviceName = route.path.split('/')[1];
      const functionName = route.path.split('/').slice(2).join('-');
      const camelName = this.toCamelCase(functionName);
      return `import { ${camelName} } from './services/${serviceName}-service/${functionName}';`;
    }).join('\n');

    const routeHandlers = routes.map(route => {
      const functionName = route.path.split('/').slice(2).join('-');
      const camelName = this.toCamelCase(functionName);
      return `  if (req.path === "${route.path}") return ${camelName}(req, res);`;
    }).join('\n');

    const indexCode = `import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
${imports}

initializeApp();

export const api = onRequest({ invoker: "public" }, async (req, res) => {
${routeHandlers}
  
  res.status(404).json({ error: "Endpoint not found" });
});
`;

    await fs.writeFile('functions/src/index.ts', indexCode);
    console.log('✅ Created minimal index.ts');
  }

  toCamelCase(str) {
    return str.replace(/-./g, match => match.charAt(1).toUpperCase());
  }
}

if (require.main === module) {
  const fixer = new ArchitectureFixer();
  fixer.fix().catch(console.error);
}

module.exports = ArchitectureFixer;