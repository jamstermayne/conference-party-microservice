/**
 * Genesis Compliance Microservice
 * Function: checkCompliance() → compliance status
 * Single Purpose: Check if file meets Genesis standard (≤95 lines)
 * Genesis Compliance: ≤95 lines
 */

const fs = require('fs');

async function checkCompliance(filePath) {
    try {
        // Read file content
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        // Count non-empty lines
        const lines = content.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        const lineCount = nonEmptyLines.length;
        
        // Genesis standard: ≤95 lines
        const maxLines = 95;
        const isCompliant = lineCount <= maxLines;
        const excessLines = Math.max(0, lineCount - maxLines);
        
        // Single result object
        const result = {
            file: filePath,
            compliant: isCompliant,
            lines: lineCount,
            maxLines,
            excessLines,
            status: isCompliant ? 'PASS' : 'FAIL',
            message: isCompliant 
                ? `✅ Genesis compliant (${lineCount}/${maxLines} lines)`
                : `❌ Genesis violation (+${excessLines} lines over limit)`
        };

        return result;

    } catch (error) {
        return {
            file: filePath,
            compliant: false,
            error: error.message,
            status: 'ERROR',
            message: `❌ Unable to check file: ${error.message}`
        };
    }
}

module.exports = { checkCompliance };
