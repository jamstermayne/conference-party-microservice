/**
 * 🎮 GAMESCOM 2025 - PERFORMANCE AUDIT TOOL
 * 
 * Comprehensive analysis of dead code and performance bottlenecks
 * Automated cleanup recommendations and bundle optimization
 */

const fs = require('fs');
const path = require('path');

class PerformanceAuditor {
  constructor() {
    this.conflicts = [];
    this.deadCode = [];
    this.duplicates = [];
    this.recommendations = [];
    this.currentlyLoaded = new Set();
    this.unusedFiles = new Set();
  }

  async auditProject() {
    console.log('🔍 Starting comprehensive performance audit...\n');
    
    // 1. Audit currently loaded files
    await this.auditLoadedFiles();
    
    // 2. Find conflicts and duplicates
    await this.findConflicts();
    
    // 3. Identify dead code
    await this.identifyDeadCode();
    
    // 4. Calculate bundle impact
    await this.calculateBundleImpact();
    
    // 5. Generate recommendations
    await this.generateRecommendations();
    
    // 6. Create cleanup plan
    await this.createCleanupPlan();
    
    return this.generateReport();
  }

  async auditLoadedFiles() {
    console.log('📄 Auditing currently loaded files...');
    
    // Check what's actually loaded in index.html
    const indexPath = 'frontend/src/index.html';
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Extract loaded scripts and stylesheets
      const scriptMatches = indexContent.match(/src="([^"]+)"/g) || [];
      const styleMatches = indexContent.match(/href="([^"]+\.css)"/g) || [];
      
      scriptMatches.forEach(match => {
        const src = match.match(/src="([^"]+)"/)[1];
        if (!src.startsWith('http')) {
          this.currentlyLoaded.add(src);
        }
      });
      
      styleMatches.forEach(match => {
        const href = match.match(/href="([^"]+)"/)[1];
        if (!href.startsWith('http')) {
          this.currentlyLoaded.add(href);
        }
      });
    }
    
    console.log(`✅ Found ${this.currentlyLoaded.size} actively loaded files`);
  }

  async findConflicts() {
    console.log('⚔️  Analyzing conflicts and duplicates...');
    
    // Find JavaScript conflicts
    await this.findJSConflicts();
    
    // Find CSS conflicts  
    await this.findCSSConflicts();
    
    // Find naming conflicts
    await this.findNamingConflicts();
  }

  async findJSConflicts() {
    const jsFiles = this.getAllFiles('frontend/src', '.js');
    const classNames = new Map();
    const functionNames = new Map();
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Find class declarations
        const classMatches = content.match(/class\s+(\w+)/g) || [];
        classMatches.forEach(match => {
          const className = match.match(/class\s+(\w+)/)[1];
          if (!classNames.has(className)) {
            classNames.set(className, []);
          }
          classNames.get(className).push(file);
        });
        
        // Find function declarations
        const functionMatches = content.match(/function\s+(\w+)|(\w+)\s*=\s*function|const\s+(\w+)\s*=\s*\(/g) || [];
        functionMatches.forEach(match => {
          const funcName = this.extractFunctionName(match);
          if (funcName && !functionNames.has(funcName)) {
            functionNames.set(funcName, []);
          }
          if (funcName) functionNames.get(funcName).push(file);
        });
        
      } catch (error) {
        console.warn(`Warning: Could not read ${file}`);
      }
    }
    
    // Report conflicts
    for (const [className, files] of classNames) {
      if (files.length > 1) {
        this.conflicts.push({
          type: 'class',
          name: className,
          files,
          severity: this.getConflictSeverity(className, files)
        });
      }
    }
    
    for (const [funcName, files] of functionNames) {
      if (files.length > 1) {
        this.conflicts.push({
          type: 'function',
          name: funcName,
          files,
          severity: this.getConflictSeverity(funcName, files)
        });
      }
    }
  }

  async findCSSConflicts() {
    const cssFiles = this.getAllFiles('frontend/src', '.css');
    const selectors = new Map();
    const cssVars = new Map();
    
    for (const file of cssFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Find CSS selectors
        const selectorMatches = content.match(/([.#][\w-]+)\s*{/g) || [];
        selectorMatches.forEach(match => {
          const selector = match.replace(/\s*{.*/, '').trim();
          if (!selectors.has(selector)) {
            selectors.set(selector, []);
          }
          selectors.get(selector).push(file);
        });
        
        // Find CSS variables
        const varMatches = content.match(/--[\w-]+/g) || [];
        varMatches.forEach(varName => {
          if (!cssVars.has(varName)) {
            cssVars.set(varName, []);
          }
          cssVars.get(varName).push(file);
        });
        
      } catch (error) {
        console.warn(`Warning: Could not read ${file}`);
      }
    }
    
    // Report CSS conflicts
    for (const [selector, files] of selectors) {
      if (files.length > 1) {
        this.conflicts.push({
          type: 'css-selector',
          name: selector,
          files,
          severity: this.getCSSConflictSeverity(selector, files)
        });
      }
    }
    
    for (const [varName, files] of cssVars) {
      if (files.length > 1) {
        this.conflicts.push({
          type: 'css-variable',
          name: varName,
          files,
          severity: 'medium'
        });
      }
    }
  }

  async findNamingConflicts() {
    // Find files with similar names that might conflict
    const allFiles = [
      ...this.getAllFiles('frontend/src', '.js'),
      ...this.getAllFiles('frontend/src', '.css')
    ];
    
    const nameGroups = new Map();
    
    allFiles.forEach(file => {
      const basename = path.basename(file, path.extname(file));
      const normalizedName = basename.toLowerCase().replace(/[-_]/g, '');
      
      if (!nameGroups.has(normalizedName)) {
        nameGroups.set(normalizedName, []);
      }
      nameGroups.get(normalizedName).push(file);
    });
    
    for (const [name, files] of nameGroups) {
      if (files.length > 1) {
        this.duplicates.push({
          type: 'similar-names',
          baseName: name,
          files,
          severity: this.getDuplicateSeverity(files)
        });
      }
    }
  }

  async identifyDeadCode() {
    console.log('💀 Identifying dead code...');
    
    const allFiles = [
      ...this.getAllFiles('frontend/src', '.js'),
      ...this.getAllFiles('frontend/src', '.css')
    ];
    
    // Check which files are never imported or referenced
    for (const file of allFiles) {
      const relativePath = file.replace('frontend/src/', '');
      const isLoaded = this.isFileLoaded(relativePath);
      const isImported = await this.isFileImported(file, allFiles);
      
      if (!isLoaded && !isImported) {
        this.deadCode.push({
          file,
          reason: 'never-imported',
          size: this.getFileSize(file)
        });
      }
    }
    
    // Find unused exports
    await this.findUnusedExports();
    
    console.log(`💀 Found ${this.deadCode.length} dead code issues`);
  }

  async findUnusedExports() {
    const jsFiles = this.getAllFiles('frontend/src', '.js');
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const exports = this.extractExports(content);
        
        for (const exportName of exports) {
          const isUsed = await this.isExportUsed(exportName, jsFiles, file);
          if (!isUsed) {
            this.deadCode.push({
              file,
              type: 'unused-export',
              name: exportName,
              reason: 'never-imported'
            });
          }
        }
      } catch (error) {
        // Skip problematic files
      }
    }
  }

  async calculateBundleImpact() {
    console.log('📊 Calculating bundle impact...');
    
    let totalSize = 0;
    let deadCodeSize = 0;
    let conflictSize = 0;
    
    // Calculate total project size
    const allFiles = [
      ...this.getAllFiles('frontend/src', '.js'),
      ...this.getAllFiles('frontend/src', '.css')
    ];
    
    for (const file of allFiles) {
      const size = this.getFileSize(file);
      totalSize += size;
    }
    
    // Calculate dead code size
    for (const deadItem of this.deadCode) {
      if (deadItem.size) {
        deadCodeSize += deadItem.size;
      }
    }
    
    // Calculate conflict size (duplicated code)
    for (const conflict of this.conflicts) {
      if (conflict.files.length > 1) {
        const sizes = conflict.files.map(f => this.getFileSize(f));
        conflictSize += sizes.slice(1).reduce((a, b) => a + b, 0); // All but the first file
      }
    }
    
    this.bundleImpact = {
      totalSize,
      deadCodeSize,
      conflictSize,
      potentialSavings: deadCodeSize + conflictSize,
      savingsPercentage: ((deadCodeSize + conflictSize) / totalSize * 100).toFixed(1)
    };
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    // High-priority conflicts
    const criticalConflicts = this.conflicts.filter(c => c.severity === 'high');
    if (criticalConflicts.length > 0) {
      this.recommendations.push({
        priority: 'high',
        type: 'resolve-conflicts',
        description: `Resolve ${criticalConflicts.length} critical conflicts that are breaking functionality`,
        impact: 'Fixes broken features, improves stability',
        files: criticalConflicts.flatMap(c => c.files)
      });
    }
    
    // Dead code removal
    const largeDeadFiles = this.deadCode.filter(d => d.size > 1000);
    if (largeDeadFiles.length > 0) {
      this.recommendations.push({
        priority: 'high',
        type: 'remove-dead-code',
        description: `Remove ${largeDeadFiles.length} unused files (${(largeDeadFiles.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)}KB)`,
        impact: 'Reduces bundle size, improves load time',
        files: largeDeadFiles.map(d => d.file)
      });
    }
    
    // CSS consolidation
    const cssFiles = this.getAllFiles('frontend/src', '.css');
    if (cssFiles.length > 20) {
      this.recommendations.push({
        priority: 'medium',
        type: 'consolidate-css',
        description: `Consolidate ${cssFiles.length} CSS files into unified system`,
        impact: 'Reduces HTTP requests, eliminates style conflicts',
        count: cssFiles.length
      });
    }
    
    // JavaScript module consolidation
    const partyFiles = this.getAllFiles('frontend/src', '.js').filter(f => 
      f.includes('party') && !f.includes('party-list-premium')
    );
    if (partyFiles.length > 5) {
      this.recommendations.push({
        priority: 'high',
        type: 'consolidate-party-system',
        description: `Replace ${partyFiles.length} legacy party files with premium system`,
        impact: 'Fixes party list loading, improves performance',
        files: partyFiles
      });
    }
  }

  async createCleanupPlan() {
    this.cleanupPlan = {
      phase1: {
        name: 'Critical Conflicts Resolution',
        priority: 'immediate',
        actions: []
      },
      phase2: {
        name: 'Dead Code Removal',
        priority: 'high',
        actions: []
      },
      phase3: {
        name: 'Asset Consolidation',
        priority: 'medium',
        actions: []
      }
    };
    
    // Phase 1: Critical conflicts
    const criticalConflicts = this.conflicts.filter(c => c.severity === 'high');
    criticalConflicts.forEach(conflict => {
      this.cleanupPlan.phase1.actions.push({
        action: 'resolve-conflict',
        description: `Resolve ${conflict.type} conflict: ${conflict.name}`,
        files: conflict.files,
        recommendation: this.getConflictResolution(conflict)
      });
    });
    
    // Phase 2: Dead code
    this.deadCode.forEach(dead => {
      this.cleanupPlan.phase2.actions.push({
        action: 'remove-file',
        file: dead.file,
        reason: dead.reason,
        size: dead.size
      });
    });
    
    // Phase 3: Consolidation
    this.cleanupPlan.phase3.actions.push({
      action: 'consolidate-css',
      description: 'Merge duplicate CSS files and remove unused styles'
    });
  }

  // Helper methods
  getAllFiles(dir, ext) {
    const files = [];
    const traverse = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return files;
  }

  getFileSize(file) {
    try {
      return fs.statSync(file).size;
    } catch {
      return 0;
    }
  }

  isFileLoaded(relativePath) {
    return Array.from(this.currentlyLoaded).some(loaded => 
      loaded.includes(relativePath) || relativePath.includes(loaded.replace(/^\//, ''))
    );
  }

  async isFileImported(file, allFiles) {
    const filename = path.basename(file);
    const relativeFromSrc = file.replace('frontend/src/', '');
    
    for (const otherFile of allFiles) {
      if (otherFile === file) continue;
      
      try {
        const content = fs.readFileSync(otherFile, 'utf8');
        
        // Check for various import patterns
        if (content.includes(filename) || 
            content.includes(relativeFromSrc) ||
            content.includes(file)) {
          return true;
        }
      } catch {
        // Skip problematic files
      }
    }
    
    return false;
  }

  extractExports(content) {
    const exports = [];
    
    // Match various export patterns
    const patterns = [
      /export\s+class\s+(\w+)/g,
      /export\s+function\s+(\w+)/g,
      /export\s+const\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          // Handle export { a, b, c }
          match[1].split(',').forEach(name => {
            exports.push(name.trim());
          });
        } else {
          exports.push(match[1]);
        }
      }
    });
    
    return exports;
  }

  async isExportUsed(exportName, allFiles, sourceFile) {
    for (const file of allFiles) {
      if (file === sourceFile) continue;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes(exportName)) {
          return true;
        }
      } catch {
        // Skip problematic files
      }
    }
    return false;
  }

  extractFunctionName(match) {
    if (match.includes('function ')) {
      const funcMatch = match.match(/function\s+(\w+)/);
      return funcMatch ? funcMatch[1] : null;
    } else if (match.includes(' = function')) {
      const varMatch = match.match(/(\w+)\s*=\s*function/);
      return varMatch ? varMatch[1] : null;
    } else if (match.includes('const ')) {
      const constMatch = match.match(/const\s+(\w+)/);
      return constMatch ? constMatch[1] : null;
    }
    return null;
  }

  getConflictSeverity(name, files) {
    // Critical conflicts that break functionality
    const criticalNames = ['App', 'Manager', 'Controller', 'party', 'Party'];
    if (criticalNames.some(critical => name.includes(critical))) {
      return 'high';
    }
    
    // Check if files are actually loaded
    const loadedFiles = files.filter(f => this.isFileLoaded(f.replace('frontend/src/', '')));
    if (loadedFiles.length > 1) {
      return 'high';
    }
    
    return 'medium';
  }

  getCSSConflictSeverity(selector, files) {
    // Critical selectors
    if (selector.includes('.party') || selector.includes('#app') || selector.includes('.nav')) {
      return 'high';
    }
    return 'medium';
  }

  getDuplicateSeverity(files) {
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    
    if (jsFiles.length > 1 || cssFiles.length > 2) {
      return 'high';
    }
    return 'medium';
  }

  getConflictResolution(conflict) {
    switch (conflict.type) {
      case 'class':
        if (conflict.name.includes('App')) {
          return `Keep the newest/premium version, remove legacy versions`;
        }
        return `Rename or merge conflicting classes`;
      case 'css-selector':
        return `Consolidate duplicate styles into single file`;
      default:
        return `Review and resolve naming conflict`;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.getAllFiles('frontend/src', '.js').length + this.getAllFiles('frontend/src', '.css').length,
        conflicts: this.conflicts.length,
        deadCodeItems: this.deadCode.length,
        duplicates: this.duplicates.length,
        bundleImpact: this.bundleImpact,
        recommendations: this.recommendations.length
      },
      details: {
        conflicts: this.conflicts,
        deadCode: this.deadCode,
        duplicates: this.duplicates,
        recommendations: this.recommendations,
        cleanupPlan: this.cleanupPlan
      }
    };
    
    // Save report
    const reportPath = 'tools/data-backups/performance-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    this.displaySummary(report);
    
    return report;
  }

  displaySummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PERFORMANCE AUDIT RESULTS');
    console.log('='.repeat(60));
    
    console.log(`📁 Total Files: ${report.summary.totalFiles}`);
    console.log(`⚔️  Conflicts: ${report.summary.conflicts}`);
    console.log(`💀 Dead Code Items: ${report.summary.deadCodeItems}`);
    console.log(`🔄 Duplicates: ${report.summary.duplicates}`);
    
    if (report.summary.bundleImpact) {
      console.log(`\n💾 Bundle Impact:`);
      console.log(`   Total Size: ${(report.summary.bundleImpact.totalSize / 1024).toFixed(1)}KB`);
      console.log(`   Dead Code: ${(report.summary.bundleImpact.deadCodeSize / 1024).toFixed(1)}KB`);
      console.log(`   Conflicts: ${(report.summary.bundleImpact.conflictSize / 1024).toFixed(1)}KB`);
      console.log(`   Potential Savings: ${(report.summary.bundleImpact.potentialSavings / 1024).toFixed(1)}KB (${report.summary.bundleImpact.savingsPercentage}%)`);
    }
    
    console.log(`\n💡 Recommendations: ${report.summary.recommendations}`);
    
    if (report.details.recommendations.length > 0) {
      console.log('\n🚀 Top Recommendations:');
      report.details.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
        console.log(`      Impact: ${rec.impact}`);
      });
    }
    
    console.log(`\n📊 Full report saved: tools/data-backups/performance-audit-report.json`);
    console.log('='.repeat(60));
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  auditor.auditProject().catch(console.error);
}

module.exports = PerformanceAuditor;