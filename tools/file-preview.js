const fs = require('fs');
const path = require('path');

// File Processing Preview - Ultra Compact (≤90 lines)
class FilePreviewTool {
    static async previewFile(filePath) {
        try {
            if (!await this.fileExists(filePath)) {
                return this.error(`File not found: ${filePath}`);
            }

            const stats = await fs.promises.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const fileName = path.basename(filePath);
            const fileSize = this.formatFileSize(stats.size);

            console.log('\n📄 FILE PROCESSING PREVIEW');
            console.log('═'.repeat(40));
            console.log(`📁 ${fileName} (${fileSize})`);

            switch (ext) {
                case '.csv': return await this.previewCSV(filePath);
                case '.json': return await this.previewJSON(filePath);
                case '.txt': return await this.previewText(filePath);
                default: return this.previewUnsupported(ext);
            }
        } catch (error) {
            return this.error(`Preview failed: ${error.message}`);
        }
    }

    static async fileExists(filePath) {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    static async previewCSV(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        console.log(`\n📋 CSV: ${lines.length} rows, ${headers.length} cols`);
        console.log(`🏷️  ${headers.join(', ')}`);
        
        if (lines.length > 1) {
            console.log('📊 Sample:');
            lines.slice(1, 3).forEach((row, i) => {
                const values = row.split(',').map(v => v.trim());
                console.log(`   ${i + 1}: ${values.slice(0, 2).join(' | ')}`);
            });
        }
        
        return { type: 'CSV', rows: lines.length - 1 };
    }

    static async previewJSON(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        const type = Array.isArray(data) ? 'Array' : typeof data;
        
        console.log(`\n🔗 JSON: ${type}`);
        
        if (Array.isArray(data)) {
            console.log(`📊 ${data.length} items`);
            if (data.length > 0) {
                console.log('📋 Sample:');
                console.log(`   ${JSON.stringify(data[0]).substring(0, 40)}...`);
            }
        }
        
        return { type: 'JSON', items: Array.isArray(data) ? data.length : 1 };
    }

    static async previewText(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        
        console.log(`\n📝 TEXT: ${lines.length} lines`);
        console.log('📋 Sample:');
        console.log(`   ${lines[0]?.substring(0, 40)}...`);
        
        return { type: 'TEXT', lines: lines.length };
    }

    static previewUnsupported(ext) {
        console.log(`\n⚠️  Unsupported: ${ext}`);
        console.log('📋 Try: .csv, .json, .txt');
        return { type: 'UNKNOWN' };
    }

    static formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        const k = bytes / 1024;
        if (k < 1024) return k.toFixed(1) + ' KB';
        return (k / 1024).toFixed(1) + ' MB';
    }

    static error(message) {
        console.log(`\n❌ ${message}`);
        return { error: message };
    }
}

// CLI usage
if (require.main === module) {
    const fileId = process.argv[2];
    if (!fileId) {
        console.log('Usage: npm run preview-file "filename.csv"');
        process.exit(1);
    }
    
    FilePreviewTool.previewFile(fileId).catch(console.error);
}

module.exports = FilePreviewTool;