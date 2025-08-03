#!/usr/bin/env node

/**
 * Genesis Checker Tool  
 * Purpose: CLI tool that calls compliance-service microservice
 * Pattern: Tool → Microservice (1 function = 1 result)
 * Genesis Compliance: ≤95 lines
 */

const fs = require('fs');
const path = require('path');
const { checkCompliance } = require('../src/services/compliance-service/check-genesis');

async function runGenesisChecker() {
    console.log('🔍 GENESIS COMPLIANCE CHECKER');
    console.log('═'.repeat(40));
    console.log('📊 Checking all JavaScript files for ≤95 line compliance');

    try {
        const jsFiles = await getAllJavaScriptFiles('.');
        console.log(`\n📁 Found ${jsFiles.length} JavaScript files`);
        
        const results = [];
        let violations = 0;

        for (const file of jsFiles) {
            // Call microservice - single function, single result
            const result = await checkCompliance(file);
            results.push(result);
            
            if (!result.compliant && !result.error) {
                violations++;
            }
        }

        // Display results
        console.log('\n📊 COMPLIANCE REPORT:');
        
        results.forEach(result => {
            if (result.error) {
                console.log(`❌ ${result.file}: ${result.message}`);
            } else if (result.compliant) {
                console.log(`✅ ${result.file}: ${result.lines} lines`);
            } else {
                console.log(`❌ ${result.file}: ${result.lines} lines (+${result.excessLines} over limit)`);
            }
        });

        if (violations === 0) {
            console.log('\n🎉 ALL FILES GENESIS COMPLIANT!');
            console.log('✅ Every file ≤95 lines - microservices architecture success');
        } else {
            console.log(`\n⚠️  Found ${violations} Genesis violations`);
            console.log('💡 Split large functions into separate microservices');
        }

        process.exit(violations === 0 ? 0 : 1);

    } catch (error) {
        console.error('❌ Genesis check failed:', error.message);
        process.exit(1);
    }
}

async function getAllJavaScriptFiles(dir) {
    const jsFiles = [];
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
        if (item.name.startsWith('.')) continue;
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !['node_modules', '.git'].includes(item.name)) {
            const subFiles = await getAllJavaScriptFiles(fullPath);
            jsFiles.push(...subFiles);
        } else if (item.isFile() && item.name.endsWith('.js')) {
            jsFiles.push(fullPath);
        }
    }
    return jsFiles;
}

// CLI execution
if (require.main === module) {
    runGenesisChecker();
}

module.exports = { runGenesisChecker };
