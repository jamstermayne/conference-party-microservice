#!/usr/bin/env node

/**
 * File Previewer Tool
 * Purpose: CLI tool that calls preview-service microservice
 * Pattern: Tool → Microservice (1 function = 1 result)
 * Genesis Compliance: ≤95 lines
 */

const fs = require('fs');
const path = require('path');
const { previewCSV } = require('../src/services/preview-service/preview-csv');

async function runFilePreviewer() {
    const filePath = process.argv[2];
    
    if (!filePath) {
        console.log('❌ Usage: npm run preview-file "filename.csv"');
        console.log('📋 Supported formats: CSV, JSON, TXT');
        process.exit(1);
    }

    console.log('📄 FILE PREVIEW - MICROSERVICES ARCHITECTURE');
    console.log('═'.repeat(50));

    try {
        // Check if file exists
        if (!await fileExists(filePath)) {
            console.log(`❌ File not found: ${filePath}`);
            process.exit(1);
        }

        // Get file info
        const stats = await fs.promises.stat(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath);
        const fileSize = formatFileSize(stats.size);

        console.log(`📁 File: ${fileName}`);
        console.log(`📊 Size: ${fileSize}`);
        console.log(`🔍 Type: ${ext}`);

        // Call appropriate microservice based on file type
        let result;
        switch (ext) {
            case '.csv':
                // Call CSV microservice - single function, single result
                result = await previewCSV(filePath);
                displayCSVResult(result);
                break;
                
            case '.json':
                // TODO: Call JSON microservice when built
                console.log('\n🔗 JSON preview microservice coming soon');
                break;
                
            case '.txt':
                // TODO: Call TXT microservice when built  
                console.log('\n📝 TXT preview microservice coming soon');
                break;
                
            default:
                console.log(`\n⚠️  Unsupported file type: ${ext}`);
                console.log('📋 Supported: .csv, .json, .txt');
                process.exit(1);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Preview failed:', error.message);
        process.exit(1);
    }
}

function displayCSVResult(result) {
    if (!result.success) {
        console.log(`❌ ${result.error}`);
        return;
    }

    const { structure, meta } = result;
    
    console.log(`\n📋 CSV Structure:`);
    console.log(`   Total Rows: ${structure.totalRows}`);
    console.log(`   Data Rows: ${structure.dataRows}`);
    console.log(`   Columns: ${structure.columns}`);
    
    console.log(`\n🏷️  Headers: ${structure.headers.join(', ')}`);
    
    if (structure.sampleData.length > 0) {
        console.log('\n📊 Sample Data:');
        structure.sampleData.forEach((row, index) => {
            console.log(`   Row ${index + 1}: ${row.slice(0, 3).join(' | ')}`);
        });
    }
    
    console.log('\n✅ Ready for API processing');
}

async function fileExists(filePath) {
    try {
        await fs.promises.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// CLI execution
if (require.main === module) {
    runFilePreviewer();
}

module.exports = { runFilePreviewer };
