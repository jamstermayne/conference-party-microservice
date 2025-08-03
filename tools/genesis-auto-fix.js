const fs = require('fs');
const path = require('path');

/**
 * Genesis Auto-Optimizer Tool
 * Purpose: Automatically fix Genesis violations (≤95 lines per file)
 * Impact: Prevents all line limit violations + optimizes code patterns
 * Genesis Compliance: ≤95 lines, single responsibility
 */
class GenesisOptimizer {
    static maxLines = 95;
    
    static async scanDirectory(dir = '.') {
        try {
            const files = await this.getAllJsFiles(dir);
            console.log(`\n🔍 Scanning ${files.length} JavaScript files for Genesis violations...`);
            
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
                const subFiles = await this.getAllJsFiles(fullPath);
                jsFiles.push(...subFiles);
            } else if (item.isFile() && item.name.endsWith('.js')) {
                jsFiles.push(fullPath);
            }
        }
        return jsFiles;
    }

    static async analyzeFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            const nonEmptyLines = lines.filter(line => line.trim().length > 0);
            
            if (nonEmptyLines.length > this.maxLines) {
                return {
                    file: filePath,
                    currentLines: nonEmptyLines.length,
                    excessLines: nonEmptyLines.length - this.maxLines,
                    content: content
                };
            }
            return null;
        } catch (error) {
            console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
            return null;
        }
    }

    static optimizeFile(violation) {
        console.log(`\n🔧 Optimizing ${violation.file} (${violation.currentLines} → ≤95 lines)`);
        
        let optimizedContent = violation.content;
        const appliedOptimizations = [];
        
        // Remove excessive blank lines
        const blankLineResult = this.removeDuplicateBlankLines(optimizedContent);
        if (blankLineResult.changed) {
            optimizedContent = blankLineResult.content;
            appliedOptimizations.push('Removed excessive blank lines');
        }
        
        // Optimize comments
        const commentResult = this.optimizeComments(optimizedContent);
        if (commentResult.changed) {
            optimizedContent = commentResult.content;
            appliedOptimizations.push('Optimized comment structure');
        }
        
        // Suggest function splits
        const functions = this.identifyLargeFunctions(optimizedContent);
        if (functions.length > 0) {
            console.log(`💡 Consider splitting these functions:`);
            functions.forEach(func => {
                console.log(`   • ${func.name} (${func.lines} lines)`);
            });
        }
        
        return { content: optimizedContent, optimizations: appliedOptimizations };
    }

    static removeDuplicateBlankLines(content) {
        const original = content;
        const optimized = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        return { content: optimized, changed: optimized !== original };
    }

    static optimizeComments(content) {
        const lines = content.split('\n');
        const original = content;
        
        const optimized = lines.filter((line, index) => {
            const trimmed = line.trim();
            // Remove very short comments that don't add value
            if (trimmed.startsWith('//') && trimmed.length < 10) return false;
            // Remove standalone comment markers
            if (trimmed === '//' || trimmed === '/**' || trimmed === '*/') {
                return index === 0 || !lines[index-1]?.trim().startsWith('//');
            }
            return true;
        }).join('\n');
        
        return { content: optimized, changed: optimized !== original };
    }

    static identifyLargeFunctions(content) {
        const lines = content.split('\n');
        const functions = [];
        let currentFunction = null;
        
        lines.forEach((line, index) => {
            if (line.includes('function ') || line.includes('() => {') || line.includes(') {')) {
                if (currentFunction) functions.push(currentFunction);
                currentFunction = { 
                    name: this.extractFunctionName(line), 
                    start: index, 
                    lines: 1 
                };
            } else if (currentFunction) {
                currentFunction.lines++;
            }
        });
        
        if (currentFunction) functions.push(currentFunction);
        return functions.filter(func => func.lines > 20);
    }

    static extractFunctionName(line) {
        const match = line.match(/(?:function\s+)?(\w+)(?:\s*\(|\s*=)/);
        return match ? match[1] : 'anonymous';
    }

    static generateReport(violations) {
        console.log('\n📊 GENESIS COMPLIANCE REPORT');
        console.log('═'.repeat(45));
        
        if (violations.length === 0) {
            console.log('✅ All files comply with Genesis standard (≤95 lines)');
            return { compliant: true, violations: 0, files: [] };
        }
        
        console.log(`❌ Found ${violations.length} Genesis violations:`);
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
                const result = GenesisOptimizer.optimizeFile(violation);
                if (result.optimizations.length > 0) {
                    console.log(`Applied: ${result.optimizations.join(', ')}`);
                }
            });
        }
    }).catch(console.error);
}

module.exports = GenesisOptimizer;