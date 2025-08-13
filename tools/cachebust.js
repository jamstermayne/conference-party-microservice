#!/usr/bin/env node
/**
 * Safe cache-busting: adds version to JS and icons only (excludes CSS).
 * Avoids double-append by checking if query already exists.
 */
const fs = require('fs');
const path = require('path');

// Generate version based on timestamp
const VERSION = 'b' + Date.now().toString(36).slice(-4);

// Files to update
const HTML_FILES = [
  path.join(__dirname, '../frontend/src/index.html'),
  path.join(__dirname, '../public/index.html')
];

// Process each HTML file
HTML_FILES.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;

  // Add cache-bust to JS files only (NOT CSS)
  content = content.replace(
    /<script([^>]*src=["']([^"'?]+\.js))(?:\?v=[^"']*)?["']/g,
    (match, before, src) => {
      // Skip if it's an external URL
      if (src.includes('://')) return match;
      
      changeCount++;
      return `<script${before}?v=${VERSION}"`;
    }
  );

  // Add cache-bust to icon/image references (but NOT CSS)
  content = content.replace(
    /<link([^>]*rel=["']icon["'][^>]*href=["']([^"'?]+))(?:\?v=[^"']*)?["']/g,
    (match, before, href) => {
      // Skip if it's an external URL
      if (href.includes('://')) return match;
      
      changeCount++;
      return `<link${before}?v=${VERSION}"`;
    }
  );

  if (changeCount > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${path.basename(filePath)}: ${changeCount} cache-bust params added (v=${VERSION})`);
  } else {
    console.log(`⏭️  ${path.basename(filePath)}: No changes needed`);
  }
});

console.log(`\n🎯 Cache-bust complete: ${VERSION}`);
console.log('📝 CSS files deliberately excluded to prevent SW cache issues');