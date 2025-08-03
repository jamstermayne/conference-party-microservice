const fs = require('fs');
const path = require('path');

// Genesis-compliant API Inspector (under 95 lines)
class ApiInspector {
  
  static async inspectRoutes() {
    const routes = [];
    const routesDir = path.join(__dirname, '../src/routes');
    
    try {
      const files = await fs.promises.readdir(routesDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const routePath = path.join(routesDir, file);
          const content = await fs.promises.readFile(routePath, 'utf8');
          
          routes.push({
            file: file,
            path: routePath,
            endpoints: this.extractEndpoints(content),
            lines: content.split('\n').length
          });
        }
      }
      
      return routes;
    } catch (error) {
      return { error: error.message };
    }
  }
  
  static extractEndpoints(content) {
    const endpoints = [];
    const routeRegex = /router\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }
    
    return endpoints;
  }
  
  static async generateStatus() {
    const routes = await this.inspectRoutes();
    const packageJson = require('../package.json');
    
    return {
      project: packageJson.name,
      version: packageJson.version,
      routes: routes,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI usage
if (require.main === module) {
  ApiInspector.generateStatus().then(status => {
    console.log('🚀 MICROSERVICE STATUS:');
    console.log(JSON.stringify(status, null, 2));
  });
}

module.exports = ApiInspector;