#!/usr/bin/env node

/**
 * Color Sweeper Tool
 * Automatically replaces hex colors with design tokens using map.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ColorSweeper {
    constructor() {
        this.rootDir = this.findProjectRoot();
        this.sourceDir = path.join(this.rootDir, 'frontend', 'src');
        this.mapFile = path.join(this.rootDir, 'tools', 'colors', 'map.json');
        this.colorMap = {};
        this.stats = {
            filesProcessed: 0,
            replacements: 0,
            errors: 0
        };
    }

    findProjectRoot() {
        let dir = __dirname;
        while (dir !== path.dirname(dir)) {
            if (fs.existsSync(path.join(dir, 'package.json'))) {
                return dir;
            }
            dir = path.dirname(dir);
        }
        throw new Error('Could not find project root');
    }

    loadColorMap() {
        try {
            const mapContent = fs.readFileSync(this.mapFile, 'utf8');
            this.colorMap = JSON.parse(mapContent);
            console.log(`📋 Loaded ${Object.keys(this.colorMap).length} color mappings`);
        } catch (error) {
            console.error('❌ Failed to load color map:', error.message);
            process.exit(1);
        }
    }

    scanForHexColors() {
        console.log('🔍 Scanning for hex colors...');
        
        try {
            const output = execSync(
                `grep -r "#[0-9a-fA-F]\\{3,6\\}" "${this.sourceDir}" --include="*.css" --include="*.html" --include="*.js" | grep -v "color-tokens.css" | grep -v "color-compat.css"`,
                { encoding: 'utf8' }
            );
            
            const lines = output.trim().split('\n').filter(line => line);
            console.log(`📊 Found ${lines.length} hex color instances`);
            
            // Extract unique hex colors
            const hexColors = new Set();
            lines.forEach(line => {
                const matches = line.match(/#[0-9a-fA-F]{3,6}/g);
                if (matches) {
                    matches.forEach(hex => hexColors.add(hex.toLowerCase()));
                }
            });
            
            console.log(`🎨 Unique hex colors: ${hexColors.size}`);
            return Array.from(hexColors);
            
        } catch (error) {
            console.log('📭 No hex colors found or grep error');
            return [];
        }
    }

    analyzeUnmappedColors(hexColors) {
        const unmapped = hexColors.filter(hex => 
            !this.colorMap[hex] && !this.colorMap[hex.toUpperCase()]
        );
        
        if (unmapped.length > 0) {
            console.log('\n🔍 Unmapped colors found:');
            unmapped.slice(0, 20).forEach(hex => {
                console.log(`  ${hex} - needs mapping`);
            });
            
            if (unmapped.length > 20) {
                console.log(`  ... and ${unmapped.length - 20} more`);
            }
        }
        
        return unmapped;
    }

    expandColorMap(hexColors) {
        console.log('\n🧠 Auto-expanding color map...');
        
        const newMappings = {};
        
        hexColors.forEach(hex => {
            // Skip if already mapped
            if (this.colorMap[hex] || this.colorMap[hex.toUpperCase()]) {
                return;
            }
            
            const lower = hex.toLowerCase();
            
            // Common color patterns
            if (lower.match(/^#0{3,6}$/)) {
                newMappings[hex] = 'var(--text-on-accent)';
            } else if (lower.match(/^#f{3,6}$/)) {
                newMappings[hex] = 'var(--text-inverse)';
            } else if (lower.match(/^#333/)) {
                newMappings[hex] = 'var(--neutral-300)';
            } else if (lower.match(/^#666/)) {
                newMappings[hex] = 'var(--neutral-500)';
            } else if (lower.match(/^#999/)) {
                newMappings[hex] = 'var(--neutral-600)';
            } else if (lower.match(/^#ccc/)) {
                newMappings[hex] = 'var(--neutral-700)';
            } else if (lower.match(/^#1[a-f0-9]/)) {
                newMappings[hex] = 'var(--neutral-100)';
            } else if (lower.match(/^#2[a-f0-9]/)) {
                newMappings[hex] = 'var(--neutral-200)';
            } else if (lower.includes('ff88') || lower.includes('c55e')) {
                newMappings[hex] = 'var(--success)';
            } else if (lower.includes('f444') || lower.includes('dc35')) {
                newMappings[hex] = 'var(--error)';
            } else if (lower.includes('f59e') || lower.includes('ffc1')) {
                newMappings[hex] = 'var(--warning)';
            } else if (lower.includes('3b82') || lower.includes('38bd')) {
                newMappings[hex] = 'var(--info)';
            }
        });
        
        if (Object.keys(newMappings).length > 0) {
            console.log(`➕ Auto-mapped ${Object.keys(newMappings).length} colors`);
            Object.assign(this.colorMap, newMappings);
            
            // Save expanded map
            this.saveColorMap();
        }
        
        return newMappings;
    }

    saveColorMap() {
        try {
            const sortedMap = {};
            Object.keys(this.colorMap)
                .sort()
                .forEach(key => {
                    sortedMap[key] = this.colorMap[key];
                });
            
            fs.writeFileSync(
                this.mapFile, 
                JSON.stringify(sortedMap, null, 2) + '\n'
            );
            console.log('💾 Updated color map saved');
        } catch (error) {
            console.error('❌ Failed to save color map:', error.message);
        }
    }

    processFile(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            let fileReplacements = 0;
            
            // Apply each mapping
            Object.entries(this.colorMap).forEach(([hex, token]) => {
                const regex = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const matches = content.match(regex);
                
                if (matches) {
                    content = content.replace(regex, token);
                    fileReplacements += matches.length;
                    modified = true;
                }
            });
            
            if (modified) {
                fs.writeFileSync(filePath, content);
                this.stats.replacements += fileReplacements;
                console.log(`  ✅ ${path.relative(this.sourceDir, filePath)} (${fileReplacements} replacements)`);
            }
            
            this.stats.filesProcessed++;
            
        } catch (error) {
            console.error(`  ❌ Error processing ${filePath}:`, error.message);
            this.stats.errors++;
        }
    }

    findTargetFiles() {
        const files = [];
        
        const walkDir = (dir) => {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Skip excluded directories
                    if (!['node_modules', '.git', 'tokens'].includes(item)) {
                        walkDir(fullPath);
                    }
                } else if (stat.isFile()) {
                    // Include target file types
                    if (/\.(css|html|js)$/.test(item)) {
                        // Skip token files
                        if (!item.includes('color-tokens') && !item.includes('color-compat')) {
                            files.push(fullPath);
                        }
                    }
                }
            });
        };
        
        walkDir(this.sourceDir);
        return files;
    }

    run() {
        console.log('🎨 Color Sweeper Tool');
        console.log('====================\n');
        
        // Load color mappings
        this.loadColorMap();
        
        // Scan for current hex colors
        const hexColors = this.scanForHexColors();
        
        if (hexColors.length === 0) {
            console.log('✅ No hex colors found - migration complete!');
            return;
        }
        
        // Analyze unmapped colors
        const unmapped = this.analyzeUnmappedColors(hexColors);
        
        // Auto-expand color map
        if (unmapped.length > 0) {
            this.expandColorMap(hexColors);
        }
        
        // Find target files
        const files = this.findTargetFiles();
        console.log(`\n📁 Processing ${files.length} files...`);
        
        // Process each file
        files.forEach(file => this.processFile(file));
        
        // Final statistics
        console.log('\n📊 Sweep Complete');
        console.log('================');
        console.log(`Files processed: ${this.stats.filesProcessed}`);
        console.log(`Total replacements: ${this.stats.replacements}`);
        console.log(`Errors: ${this.stats.errors}`);
        
        // Re-scan to show final count
        const finalHexColors = this.scanForHexColors();
        console.log(`\nRemaining hex instances: ${finalHexColors.length}`);
        
        if (finalHexColors.length > 0) {
            console.log('\n🔍 Top remaining colors:');
            const colorCounts = {};
            finalHexColors.forEach(hex => {
                colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            });
            
            Object.entries(colorCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .forEach(([hex, count]) => {
                    console.log(`  ${hex} (${count} instances)`);
                });
        } else {
            console.log('\n🎉 All hex colors have been replaced with tokens!');
        }
    }
}

// Run the sweeper
if (require.main === module) {
    const sweeper = new ColorSweeper();
    sweeper.run();
}

module.exports = ColorSweeper;