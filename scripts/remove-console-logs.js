#!/usr/bin/env node

/**
 * Production Build Script - Remove Console Logs
 * Removes all console.* statements from production builds
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const config = {
  patterns: [
    'public/**/*.js',
    'functions/lib/**/*.js'
  ],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.min.js',
    '**/vendor/**'
  ],
  backup: true,
  dryRun: process.argv.includes('--dry-run')
};

// Console statement patterns
const consolePatterns = [
  /console\.\w+\([^)]*\);?/g,
  /console\.\w+\([^)]*\)\s*{[^}]*}/g,
  /console\.\w+\([^)]*\)\s*=>/g,
  /console\.\w+`[^`]*`;?/g
];

/**
 * Remove console statements from file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let removedCount = 0;
    
    // Remove console statements
    consolePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      removedCount += matches.length;
      content = content.replace(pattern, '');
    });
    
    // Clean up empty lines left behind
    content = content.replace(/^\s*\n/gm, '');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (removedCount > 0) {
      if (config.dryRun) {
        console.log(`[DRY RUN] Would remove ${removedCount} console statements from ${filePath}`);
      } else {
        // Create backup
        if (config.backup) {
          fs.writeFileSync(`${filePath}.backup`, originalContent);
        }
        
        // Write cleaned file
        fs.writeFileSync(filePath, content);
        console.log(`✓ Removed ${removedCount} console statements from ${filePath}`);
      }
      return removedCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Process all files matching patterns
 */
function processAllFiles() {
  let totalFiles = 0;
  let totalRemoved = 0;
  
  config.patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: config.exclude,
      nodir: true
    });
    
    files.forEach(file => {
      const removed = processFile(file);
      if (removed > 0) {
        totalFiles++;
        totalRemoved += removed;
      }
    });
  });
  
  console.log('\n' + '='.repeat(50));
  if (config.dryRun) {
    console.log(`[DRY RUN] Would process ${totalFiles} files`);
    console.log(`[DRY RUN] Would remove ${totalRemoved} console statements total`);
  } else {
    console.log(`✅ Processed ${totalFiles} files`);
    console.log(`✅ Removed ${totalRemoved} console statements total`);
    if (config.backup) {
      console.log(`💾 Backups created with .backup extension`);
    }
  }
}

// Run the script
console.log('🔧 Production Build: Removing Console Logs');
console.log('='.repeat(50));

if (config.dryRun) {
  console.log('Running in DRY RUN mode - no files will be modified\n');
}

processAllFiles();