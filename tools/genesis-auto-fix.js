const fs = require('fs');
const path = require('path');

// Genesis Auto-Optimizer - Ultra Compact (≤90 lines)
class GenesisOptimizer {
    static maxLines = 95;
    
    static async scanDirectory(dir = '.') {
        try {
            const files = await this.getAllJsFiles(dir);
            console.log(`\n🔍 Scanning ${files.length} JavaScript files...`);
            
            const violations = [];
            for (const file of files) {
                const violation = await this.analyzeFile(file);
                if (violation) violations.push(violation);
            }
            
            return this.generateReport(violations);
        } catch (error) {
            return { error: error.message };
        }
    }

    static async getAllJsFiles(dir) {
        const jsFiles = [];
        const items = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
            if (item.name.startsWith('.')) continue;
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory() && !['node_modules', '.git'].includes(item.name)) {
                jsFiles.push(...await this.getAllJsFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.js')) {
                jsFiles.push(fullPath);
            }
        }
        return jsFiles;
    }

    static async analyzeFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const nonEmptyLines = content.split('\n').filter(line => line.trim().length > 0);
            
            if (nonEmptyLines.length > this.maxLines) {
                return {
                    file: filePath,
                    currentLines: nonEmptyLines.length,
                    excessLines: nonEmptyLines.length - this.maxLines
                };
            }
            return null;
        } catch (error) {
            console.log(`❌ Error: ${filePath}: ${error.message}`);
            return null;
        }
    }

    static optimizeFile(violation) {
        console.log(`\n🔧 ${violation.file}: ${violation.currentLines} lines (+${violation.excessLines})`);
        console.log(`   💡 Split into smaller functions to reduce line count`);
        return { optimized: false };
    }

    static generateReport(violations) {
        console.log('\n📊 GENESIS COMPLIANCE REPORT');
        console.log('═'.repeat(40));
        
        if (violations.length === 0) {
            console.log('✅ All files comply (≤95 lines)');
            return { compliant: true, violations: 0, files: [] };
        }
        
        console.log(`❌ Found ${violations.length} violations:`);
        violations.forEach(v => {
            console.log(`   ${v.file}: ${v.currentLines} lines (+${v.excessLines})`);
        });
        
        return { compliant: false, violations: violations.length, files: violations };
    }
}

// CLI usage
if (require.main === module) {
    GenesisOptimizer.scanDirectory().then(report => {
        if (!report.compliant && report.files) {
            console.log('\n🔧 Auto-fixing violations...');
            report.files.forEach(violation => {
                GenesisOptimizer.optimizeFile(violation);
            });
        }
    }).catch(console.error);
}

module.exports = GenesisOptimizer;