/**
 * CSV Preview Microservice  
 * Function: previewCSV() → CSV structure
 * Single Purpose: Parse and preview CSV file structure
 * Genesis Compliance: ≤95 lines
 */

const fs = require('fs');

async function previewCSV(filePath) {
    try {
        // Read CSV content
        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');
        
        if (lines.length === 0) {
            return {
                success: false,
                error: "Empty CSV file",
                type: "CSV"
            };
        }

        // Parse headers
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);
        
        // Get sample data
        const sampleData = [];
        const sampleRows = lines.slice(1, 4); // Max 3 sample rows
        
        for (const row of sampleRows) {
            const values = parseCSVLine(row);
            sampleData.push(values);
        }

        // Single result object
        const result = {
            success: true,
            type: "CSV",
            structure: {
                totalRows: lines.length,
                dataRows: lines.length - 1,
                columns: headers.length,
                headers: headers,
                sampleData: sampleData
            },
            meta: {
                hasHeaders: true,
                hasData: lines.length > 1,
                previewRows: sampleData.length
            }
        };

        return result;

    } catch (error) {
        return {
            success: false,
            error: error.message,
            type: "CSV"
        };
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}

module.exports = { previewCSV };
