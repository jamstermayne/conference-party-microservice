#!/usr/bin/env node

/**
 * Impact Analysis Tool
 * Analyzes the potential impact of code changes before implementation
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ImpactAnalyzer {
  constructor() {
    this.dependencies = new Map();
    this.reverseDepencies = new Map();
    this.fileMetadata = new Map();
    this.testCoverage = new Map();
  }

  /**
   * Analyze the impact of changing a specific file
   */
  async analyzeFileImpact(filePath) {
    console.log(`\n🔍 Analyzing impact of changes to: ${filePath}\n`);

    const report = {
      file: filePath,
      timestamp: new Date().toISOString(),
      directDependents: [],
      indirectDependents: [],
      affectedTests: [],
      affectedComponents: [],
      riskLevel: 'LOW',
      recommendations: []
    };

    try {
      // 1. Find direct dependents
      report.directDependents = await this.findDirectDependents(filePath);

      // 2. Find indirect dependents (up to 2 levels)
      report.indirectDependents = await this.findIndirectDependents(filePath, 2);

      // 3. Find affected tests
      report.affectedTests = await this.findAffectedTests(filePath);

      // 4. Find affected UI components
      report.affectedComponents = await this.findAffectedComponents(filePath);

      // 5. Calculate risk level
      report.riskLevel = this.calculateRiskLevel(report);

      // 6. Generate recommendations
      report.recommendations = this.generateRecommendations(report);

      // 7. Check for breaking changes
      report.breakingChanges = await this.detectBreakingChanges(filePath);

      return report;
    } catch (error) {
      console.error('Error analyzing impact:', error);
      report.error = error.message;
      return report;
    }
  }

  /**
   * Find files that directly import the target file
   */
  async findDirectDependents(filePath) {
    const dependents = [];
    const fileName = path.basename(filePath);
    const searchPatterns = [
      `import.*from.*['"\`].*${fileName}['"\`]`,
      `require\\s*\\(.*['"\`].*${fileName}['"\`]\\)`,
      `@import.*['"\`].*${fileName}['"\`]`
    ];

    for (const pattern of searchPatterns) {
      try {
        const result = execSync(
          `grep -r "${pattern}" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.css" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || true`,
          { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }
        );

        if (result) {
          const files = result.split('\n')
            .filter(line => line)
            .map(line => line.split(':')[0])
            .filter(file => file !== filePath);

          dependents.push(...files);
        }
      } catch (error) {
        // Grep returns non-zero if no matches found, which is fine
      }
    }

    return [...new Set(dependents)];
  }

  /**
   * Find files that indirectly depend on the target file
   */
  async findIndirectDependents(filePath, maxDepth = 2) {
    const visited = new Set([filePath]);
    const indirectDeps = new Set();
    let currentLevel = await this.findDirectDependents(filePath);
    let depth = 0;

    while (currentLevel.length > 0 && depth < maxDepth) {
      const nextLevel = [];

      for (const dep of currentLevel) {
        if (!visited.has(dep)) {
          visited.add(dep);
          if (depth > 0) {
            indirectDeps.add(dep);
          }
          const deps = await this.findDirectDependents(dep);
          nextLevel.push(...deps);
        }
      }

      currentLevel = nextLevel;
      depth++;
    }

    return Array.from(indirectDeps);
  }

  /**
   * Find test files that might be affected
   */
  async findAffectedTests(filePath) {
    const tests = [];
    const baseName = path.basename(filePath, path.extname(filePath));

    // Look for test files with similar names
    const testPatterns = [
      `${baseName}.test`,
      `${baseName}.spec`,
      `test.*${baseName}`,
      `${baseName}.*test`,
      `${baseName}.*spec`
    ];

    for (const pattern of testPatterns) {
      try {
        const result = execSync(
          `find . -name "*${pattern}*" -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \\) 2>/dev/null || true`,
          { encoding: 'utf-8' }
        );

        if (result) {
          tests.push(...result.split('\n').filter(f => f));
        }
      } catch (error) {
        // Continue if no tests found
      }
    }

    // Also check for imports in test files
    const dependentTests = await this.findDirectDependents(filePath);
    tests.push(...dependentTests.filter(f => f.includes('test') || f.includes('spec')));

    return [...new Set(tests)];
  }

  /**
   * Find UI components that might be affected
   */
  async findAffectedComponents(filePath) {
    const components = [];

    // If it's a CSS file, find components using it
    if (filePath.endsWith('.css')) {
      const cssFileName = path.basename(filePath);
      try {
        const result = execSync(
          `grep -r "import.*${cssFileName}" . --include="*.jsx" --include="*.tsx" --include="*.html" --exclude-dir=node_modules 2>/dev/null || true`,
          { encoding: 'utf-8' }
        );

        if (result) {
          components.push(...result.split('\n').filter(l => l).map(l => l.split(':')[0]));
        }
      } catch (error) {
        // Continue
      }
    }

    // If it's a component file
    if (filePath.match(/\.(jsx?|tsx?)$/)) {
      const dependents = await this.findDirectDependents(filePath);
      components.push(...dependents.filter(f => f.match(/\.(jsx?|tsx?|html)$/)));
    }

    return [...new Set(components)];
  }

  /**
   * Calculate risk level based on impact analysis
   */
  calculateRiskLevel(report) {
    const score =
      report.directDependents.length * 3 +
      report.indirectDependents.length * 1 +
      report.affectedTests.length * 2 +
      report.affectedComponents.length * 2;

    if (score >= 20) return 'CRITICAL';
    if (score >= 10) return 'HIGH';
    if (score >= 5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommendations based on impact analysis
   */
  generateRecommendations(report) {
    const recommendations = [];

    if (report.riskLevel === 'CRITICAL' || report.riskLevel === 'HIGH') {
      recommendations.push('⚠️  High impact change - consider breaking into smaller changes');
      recommendations.push('📝 Create a detailed test plan before proceeding');
      recommendations.push('🔄 Implement changes behind a feature flag');
    }

    if (report.affectedTests.length === 0) {
      recommendations.push('⚠️  No tests found - consider adding tests before making changes');
    } else {
      recommendations.push(`✅ Run ${report.affectedTests.length} affected tests after changes`);
    }

    if (report.directDependents.length > 5) {
      recommendations.push('📦 Consider creating an abstraction layer to reduce coupling');
    }

    if (report.affectedComponents.length > 0) {
      recommendations.push(`🎨 Visual regression testing recommended for ${report.affectedComponents.length} components`);
    }

    return recommendations;
  }

  /**
   * Detect potential breaking changes
   */
  async detectBreakingChanges(filePath) {
    const breakingChanges = [];

    try {
      // Check if file exports functions/classes
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for exported functions
      const exportedFunctions = content.match(/export\s+(async\s+)?function\s+(\w+)/g) || [];
      const exportedClasses = content.match(/export\s+class\s+(\w+)/g) || [];
      const exportedConsts = content.match(/export\s+const\s+(\w+)/g) || [];

      if (exportedFunctions.length > 0) {
        breakingChanges.push({
          type: 'FUNCTION_SIGNATURE',
          message: `File exports ${exportedFunctions.length} functions - changing signatures will break dependents`
        });
      }

      if (exportedClasses.length > 0) {
        breakingChanges.push({
          type: 'CLASS_INTERFACE',
          message: `File exports ${exportedClasses.length} classes - changing interfaces will break dependents`
        });
      }

      // Check for CSS classes if it's a CSS file
      if (filePath.endsWith('.css')) {
        const cssClasses = content.match(/\.[a-zA-Z][\w-]*/g) || [];
        if (cssClasses.length > 0) {
          breakingChanges.push({
            type: 'CSS_CLASSES',
            message: `File contains ${cssClasses.length} CSS classes - renaming will break HTML/JSX`
          });
        }
      }
    } catch (error) {
      // File might not exist yet
    }

    return breakingChanges;
  }

  /**
   * Generate a visual impact report
   */
  generateReport(analysis) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPACT ANALYSIS REPORT');
    console.log('='.repeat(60));

    console.log(`\n📁 File: ${analysis.file}`);
    console.log(`⏰ Timestamp: ${analysis.timestamp}`);
    console.log(`🎯 Risk Level: ${this.getRiskEmoji(analysis.riskLevel)} ${analysis.riskLevel}`);

    console.log('\n📈 Impact Summary:');
    console.log(`  • Direct Dependents: ${analysis.directDependents.length}`);
    console.log(`  • Indirect Dependents: ${analysis.indirectDependents.length}`);
    console.log(`  • Affected Tests: ${analysis.affectedTests.length}`);
    console.log(`  • Affected Components: ${analysis.affectedComponents.length}`);

    if (analysis.directDependents.length > 0) {
      console.log('\n🔗 Direct Dependents:');
      analysis.directDependents.slice(0, 5).forEach(dep => {
        console.log(`  • ${dep}`);
      });
      if (analysis.directDependents.length > 5) {
        console.log(`  ... and ${analysis.directDependents.length - 5} more`);
      }
    }

    if (analysis.breakingChanges && analysis.breakingChanges.length > 0) {
      console.log('\n⚠️  Potential Breaking Changes:');
      analysis.breakingChanges.forEach(change => {
        console.log(`  • [${change.type}] ${change.message}`);
      });
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach(rec => {
        console.log(`  ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  getRiskEmoji(level) {
    const emojis = {
      'LOW': '🟢',
      'MEDIUM': '🟡',
      'HIGH': '🟠',
      'CRITICAL': '🔴'
    };
    return emojis[level] || '⚪';
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔬 Impact Analysis Tool

Usage:
  node impact-analyzer.js <file-path> [options]

Options:
  --json         Output as JSON
  --depth <n>    Set dependency depth (default: 2)
  --save <file>  Save report to file

Examples:
  node impact-analyzer.js src/components/Card.jsx
  node impact-analyzer.js styles/main.css --json
  node impact-analyzer.js src/api/auth.js --save report.json
    `);
    process.exit(0);
  }

  const filePath = args[0];
  const options = {
    json: args.includes('--json'),
    save: args.includes('--save') ? args[args.indexOf('--save') + 1] : null,
    depth: args.includes('--depth') ? parseInt(args[args.indexOf('--depth') + 1]) : 2
  };

  const analyzer = new ImpactAnalyzer();
  const analysis = await analyzer.analyzeFileImpact(filePath);

  if (options.json) {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    analyzer.generateReport(analysis);
  }

  if (options.save) {
    await fs.writeFile(options.save, JSON.stringify(analysis, null, 2));
    console.log(`\n✅ Report saved to: ${options.save}`);
  }

  // Return exit code based on risk level
  const exitCodes = { 'LOW': 0, 'MEDIUM': 0, 'HIGH': 1, 'CRITICAL': 2 };
  process.exit(exitCodes[analysis.riskLevel] || 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ImpactAnalyzer;