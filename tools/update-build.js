#!/usr/bin/env node
/**
 * Update BUILD version in index.html
 * Generates a new build ID and updates all references
 */

const fs = require('fs');
const path = require('path');

// Generate build ID (b + timestamp suffix)
const buildId = 'b' + Date.now().toString().slice(-3);

// Path to index.html
const indexPath = path.join(__dirname, '../frontend/src/index.html');

// Read current index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Update window.BUILD
html = html.replace(/window\.BUILD="b\d+"/g, `window.BUILD="${buildId}"`);

// Update all CSS ?v= parameters
html = html.replace(/\.css\?v=b\d+/g, `.css?v=${buildId}`);

// Update all JS ?v= parameters  
html = html.replace(/\.js\?v=b\d+/g, `.js?v=${buildId}`);

// Write back
fs.writeFileSync(indexPath, html, 'utf8');

console.log(`✅ Updated BUILD to ${buildId}`);
console.log(`   - window.BUILD="${buildId}"`);
console.log(`   - CSS/JS cache busters updated`);

// Export for use in other scripts
module.exports = { buildId };