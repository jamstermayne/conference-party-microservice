#!/usr/bin/env node

/**
 * JavaScript syntax validator for browser modules
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 JavaScript Syntax Validation...\n');

const validateFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for common syntax issues
        const issues = [];
        
        // Check for mismatched brackets/braces
        const brackets = content.match(/[\[\]]/g) || [];
        const openBrackets = brackets.filter(b => b === '[').length;
        const closeBrackets = brackets.filter(b => b === ']').length;
        if (openBrackets !== closeBrackets) {
            issues.push(`Mismatched square brackets: ${openBrackets} open, ${closeBrackets} close`);
        }
        
        const braces = content.match(/[{}]/g) || [];
        const openBraces = braces.filter(b => b === '{').length;
        const closeBraces = braces.filter(b => b === '}').length;
        if (openBraces !== closeBraces) {
            issues.push(`Mismatched curly braces: ${openBraces} open, ${closeBraces} close`);
        }
        
        const parens = content.match(/[()]/g) || [];
        const openParens = parens.filter(p => p === '(').length;
        const closeParens = parens.filter(p => p === ')').length;
        if (openParens !== closeParens) {
            issues.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
        }
        
        // Check for unterminated strings
        const stringMatches = content.match(/(?:^|[^\\])(["'])((?:\\.|(?!\1)[^\\])*?)\1/g) || [];
        const quotes = content.match(/['"]/g) || [];
        if (quotes.length % 2 !== 0) {
            issues.push('Possible unterminated string');
        }
        
        // Check for invalid regex flags
        const regexMatches = content.match(/\/[^\/\n]*\/[gimsuxy]*/g) || [];
        regexMatches.forEach((regex, index) => {
            const flagsMatch = regex.match(/\/[^\/]*\/([gimsuxy]*)/);
            if (flagsMatch) {
                const flags = flagsMatch[1];
                const validFlags = ['g', 'i', 'm', 's', 'u', 'x', 'y'];
                for (const flag of flags) {
                    if (!validFlags.includes(flag)) {
                        issues.push(`Invalid regex flag '${flag}' in: ${regex}`);
                    }
                }
                // Check for duplicate flags
                const uniqueFlags = [...new Set(flags.split(''))];
                if (uniqueFlags.length !== flags.length) {
                    issues.push(`Duplicate regex flags in: ${regex}`);
                }
            }
        });
        
        // Check for common ES6 module errors
        const exportMatches = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var|\{)/g) || [];
        const importMatches = content.match(/import\s+.*?\s+from\s+['"][^'"]+['"]/g) || [];
        
        // Try to parse as ES module (basic check)
        try {
            const vm = require('vm');
            const context = vm.createContext({
                document: {},
                window: {},
                console: console,
                fetch: () => Promise.resolve({}),
                localStorage: {},
                navigator: { onLine: true }
            });
            
            // Remove import/export statements for basic syntax check
            const testCode = content
                .replace(/import\s+.*?\s+from\s+['"][^'"]+['"];?/g, '')
                .replace(/export\s+(?:default\s+)?/g, '');
            
            vm.runInContext(testCode, context, { timeout: 1000 });
        } catch (vmError) {
            if (vmError.name === 'SyntaxError') {
                issues.push(`Syntax error: ${vmError.message}`);
            }
        }
        
        return { valid: issues.length === 0, issues };
    } catch (error) {
        return { valid: false, issues: [`File read error: ${error.message}`] };
    }
};

const scanDirectory = (dir) => {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files.push(...scanDirectory(fullPath));
        } else if (item.isFile() && item.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
};

// Scan all JavaScript files
const jsDir = '/workspaces/conference-party-microservice/public/js';
const jsFiles = scanDirectory(jsDir);

console.log(`Found ${jsFiles.length} JavaScript files to validate\n`);

let validFiles = 0;
let invalidFiles = 0;
const errors = [];

jsFiles.forEach(file => {
    const relativePath = path.relative('/workspaces/conference-party-microservice', file);
    const result = validateFile(file);
    
    if (result.valid) {
        console.log(`✅ ${relativePath}`);
        validFiles++;
    } else {
        console.log(`❌ ${relativePath}`);
        result.issues.forEach(issue => {
            console.log(`   └─ ${issue}`);
        });
        invalidFiles++;
        errors.push({ file: relativePath, issues: result.issues });
    }
});

console.log(`\n📊 Validation Results:`);
console.log(`✅ Valid files: ${validFiles}`);
console.log(`❌ Invalid files: ${invalidFiles}`);

if (invalidFiles > 0) {
    console.log('\n🔧 Files needing attention:');
    errors.forEach(error => {
        console.log(`   ${error.file}:`);
        error.issues.forEach(issue => console.log(`      • ${issue}`));
    });
} else {
    console.log('\n🎉 All JavaScript files passed syntax validation!');
}